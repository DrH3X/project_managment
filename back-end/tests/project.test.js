const request = require('supertest');
const app = require('../src/app');
const { connect, clear, disconnect } = require('./helpers/db');
const { createUser } = require('./helpers/users');
const { createProject } = require('./helpers/projects');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, motDePasse: password });
  return res.body.token;
}

async function makeChef(email = 'chef@test.com') {
  return createUser({ email, motDePasse: 'Chef123!', role: 'CHEF_PROJET' });
}
async function makeAdmin() {
  return createUser({ email: 'admin@test.com', motDePasse: 'Admin123!', role: 'ADMIN' });
}
async function makeEmploye() {
  return createUser({ email: 'emp@test.com', motDePasse: 'Employe123!', role: 'EMPLOYE' });
}

describe('Accès et rôles', () => {
  it('renvoie 401 sans authentification', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('EMPLOYE ne peut pas créer de projet (403)', async () => {
    await makeEmploye();
    const token = await loginAs('emp@test.com', 'Employe123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Projet', dateDebut: '2025-01-01', dateFin: '2025-12-31' });
    expect(res.status).toBe(403);
  });

  it('ADMIN ne peut pas créer de projet (403)', async () => {
    await makeAdmin();
    const token = await loginAs('admin@test.com', 'Admin123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Projet', dateDebut: '2025-01-01', dateFin: '2025-12-31' });
    expect(res.status).toBe(403);
  });
});

describe('POST /api/projects', () => {
  it('crée un projet (CHEF_PROJET, 201)', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Projet Alpha',
        description: 'Description test',
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31',
      });
    expect(res.status).toBe(201);
    expect(res.body.project.id).toBeDefined();
    expect(res.body.project.nom).toBe('Projet Alpha');
    expect(res.body.project.statut).toBe('NON_COMMENCE');
    expect(res.body.project.chefProjet).toBeDefined();
  });

  it('force le statut à NON_COMMENCE même si un statut est envoyé', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Projet X',
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31',
        statut: 'TERMINE',
      });
    expect(res.status).toBe(201);
    expect(res.body.project.statut).toBe('NON_COMMENCE');
  });

  it('renvoie 409 PROJECT_NAME_TAKEN si le nom existe (insensible à la casse)', async () => {
    const chef = await makeChef();
    await createProject({ nom: 'Projet Alpha', chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'PROJET ALPHA', dateDebut: '2025-01-01', dateFin: '2025-12-31' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROJECT_NAME_TAKEN');
  });

  it('renvoie 422 DATE_RANGE_INVALID si dateFin < dateDebut', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Projet Y', dateDebut: '2025-12-01', dateFin: '2025-01-01' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('DATE_RANGE_INVALID');
  });

  it('accepte dateDebut === dateFin', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Projet Même', dateDebut: '2025-06-01', dateFin: '2025-06-01' });
    expect(res.status).toBe(201);
  });

  it('renvoie 400 si le nom est manquant', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ dateDebut: '2025-01-01', dateFin: '2025-12-31' });
    expect(res.status).toBe(400);
  });

  it('renvoie 400 si une date est invalide', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Projet D', dateDebut: 'pas-une-date', dateFin: '2025-12-31' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/projects', () => {
  it('ADMIN voit tous les projets', async () => {
    const chef1 = await makeChef('chef1@test.com');
    const chef2 = await makeChef('chef2@test.com');
    await createProject({ nom: 'P1', chefProjet: chef1._id });
    await createProject({ nom: 'P2', chefProjet: chef2._id });
    await makeAdmin();
    const token = await loginAs('admin@test.com', 'Admin123!');
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('CHEF_PROJET voit seulement ses projets', async () => {
    const chef1 = await makeChef('chef1@test.com');
    await makeChef('chef2@test.com');
    await createProject({ nom: 'P1', chefProjet: chef1._id });
    await createProject({ nom: 'P2', chefProjet: chef1._id });
    await createProject({ nom: 'P3', chefProjet: (await makeChef('chef3@test.com'))._id });
    const token = await loginAs('chef1@test.com', 'Chef123!');
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((p) => p.chefProjet === chef1._id.toString())).toBe(true);
  });

  it('EMPLOYE voit une liste vide (jusqu\'au sprint 2)', async () => {
    await makeEmploye();
    const token = await loginAs('emp@test.com', 'Employe123!');
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/projects/:id', () => {
  it('le propriétaire voit son projet', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.project.id).toBe(project._id.toString());
  });

  it('ADMIN voit n\'importe quel projet', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    await makeAdmin();
    const token = await loginAs('admin@test.com', 'Admin123!');
    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('un autre chef de projet n\'y a pas accès (403)', async () => {
    const chef1 = await makeChef('chef1@test.com');
    await makeChef('chef2@test.com');
    const project = await createProject({ chefProjet: chef1._id });
    const token = await loginAs('chef2@test.com', 'Chef123!');
    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('EMPLOYE n\'y a pas accès (403)', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    await makeEmploye();
    const token = await loginAs('emp@test.com', 'Employe123!');
    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('renvoie 404 si introuvable', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .get('/api/projects/64b7f8c2a1d3e4f5a6b7c8d9')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('renvoie 400 pour un id invalide', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .get('/api/projects/invalide')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/projects/:id', () => {
  it('le propriétaire modifie son projet', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Projet Renommé', description: 'Nouvelle desc' });
    expect(res.status).toBe(200);
    expect(res.body.project.nom).toBe('Projet Renommé');
    expect(res.body.project.description).toBe('Nouvelle desc');
  });

  it('ne modifie pas le statut même si envoyé', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ statut: 'TERMINE' });
    expect(res.status).toBe(400); // aucun champ valide fourni
  });

  it('ADMIN ne peut pas modifier (403, consulte seulement)', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    await makeAdmin();
    const token = await loginAs('admin@test.com', 'Admin123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Autre' });
    expect(res.status).toBe(403);
  });

  it('un autre chef de projet ne peut pas modifier (403)', async () => {
    const chef1 = await makeChef('chef1@test.com');
    await makeChef('chef2@test.com');
    const project = await createProject({ chefProjet: chef1._id });
    const token = await loginAs('chef2@test.com', 'Chef123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Autre' });
    expect(res.status).toBe(403);
  });

  it('renvoie 409 si le nouveau nom est déjà utilisé', async () => {
    const chef = await makeChef();
    await createProject({ nom: 'Nom Pris', chefProjet: chef._id });
    const project = await createProject({ nom: 'Nom Libre', chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'NOM PRIS' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROJECT_NAME_TAKEN');
  });

  it('renvoie 422 si les dates modifiées sont incohérentes', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dateDebut: '2025-12-01', dateFin: '2025-01-01' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('DATE_RANGE_INVALID');
  });

  it('renvoie 400 si aucun champ fourni', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('le propriétaire supprime son projet (204)', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('ADMIN ne peut pas supprimer (403)', async () => {
    const chef = await makeChef();
    const project = await createProject({ chefProjet: chef._id });
    await makeAdmin();
    const token = await loginAs('admin@test.com', 'Admin123!');
    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('un autre chef de projet ne peut pas supprimer (403)', async () => {
    const chef1 = await makeChef('chef1@test.com');
    await makeChef('chef2@test.com');
    const project = await createProject({ chefProjet: chef1._id });
    const token = await loginAs('chef2@test.com', 'Chef123!');
    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('renvoie 404 si introuvable', async () => {
    await makeChef();
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app)
      .delete('/api/projects/64b7f8c2a1d3e4f5a6b7c8d9')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('Index unique insensible à la casse (niveau base)', () => {
  it('rejette un doublon de casse différente (erreur 11000)', async () => {
    const chef = await makeChef();
    const Project = require('../src/models/project.model');
    await Project.create({
      nom: 'Projet Alpha',
      description: '',
      dateDebut: new Date('2025-01-01'),
      dateFin: new Date('2025-12-31'),
      statut: 'NON_COMMENCE',
      chefProjet: chef._id,
    });
    let err;
    try {
      await Project.create({
        nom: 'PROJET ALPHA',
        description: '',
        dateDebut: new Date('2025-01-01'),
        dateFin: new Date('2025-12-31'),
        statut: 'NON_COMMENCE',
        chefProjet: chef._id,
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
