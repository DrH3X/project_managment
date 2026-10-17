const request = require('supertest');
const app = require('../src/app');
const { connect, clear, disconnect } = require('./helpers/db');
const { createUser } = require('./helpers/users');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

async function adminToken() {
  await createUser({ email: 'admin@test.com', motDePasse: 'Admin123!', role: 'ADMIN' });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', motDePasse: 'Admin123!' });
  return res.body.token;
}

describe('Accès et rôles', () => {
  it('renvoie 401 sans authentification', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('renvoie 403 pour un employé', async () => {
    await createUser({ email: 'emp@test.com', role: 'EMPLOYE' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp@test.com', motDePasse: 'Password123!' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('renvoie 403 pour un chef de projet', async () => {
    await createUser({ email: 'chef@test.com', role: 'CHEF_PROJET' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'chef@test.com', motDePasse: 'Password123!' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/users', () => {
  it('liste les utilisateurs (ADMIN)', async () => {
    const token = await adminToken();
    await createUser({ email: 'a@test.com', role: 'EMPLOYE' });
    await createUser({ email: 'b@test.com', role: 'CHEF_PROJET' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data.every((u) => u.motDePasse === undefined)).toBe(true);
  });

  it('filtre par rôle', async () => {
    const token = await adminToken();
    await createUser({ email: 'e1@test.com', role: 'EMPLOYE' });
    await createUser({ email: 'e2@test.com', role: 'EMPLOYE' });
    await createUser({ email: 'c1@test.com', role: 'CHEF_PROJET' });
    const res = await request(app)
      .get('/api/users?role=EMPLOYE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((u) => u.role === 'EMPLOYE')).toBe(true);
  });

  it('renvoie 400 pour un rôle invalide', async () => {
    const token = await adminToken();
    const res = await request(app)
      .get('/api/users?role=INVALIDE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/users', () => {
  it('crée un utilisateur (201)', async () => {
    const token = await adminToken();
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Nouveau',
        prenom: 'User',
        email: 'nouveau@test.com',
        motDePasse: 'Password123!',
        role: 'EMPLOYE',
      });
    expect(res.status).toBe(201);
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.email).toBe('nouveau@test.com');
    expect(res.body.user.motDePasse).toBeUndefined();
  });

  it('renvoie 409 si l\'email est déjà utilisé', async () => {
    const token = await adminToken();
    await createUser({ email: 'dup@test.com' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Dup',
        prenom: 'User',
        email: 'dup@test.com',
        motDePasse: 'Password123!',
        role: 'EMPLOYE',
      });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('renvoie 400 si le mot de passe est trop court', async () => {
    const token = await adminToken();
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'X',
        prenom: 'Y',
        email: 'court@test.com',
        motDePasse: '123',
        role: 'EMPLOYE',
      });
    expect(res.status).toBe(400);
  });

  it('renvoie 400 si le rôle est invalide', async () => {
    const token = await adminToken();
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'X',
        prenom: 'Y',
        email: 'role@test.com',
        motDePasse: 'Password123!',
        role: 'SUPERADMIN',
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/users/:id', () => {
  it('renvoie un utilisateur par id', async () => {
    const token = await adminToken();
    const user = await createUser({ email: 'byid@test.com' });
    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user._id.toString());
  });

  it('renvoie 404 si introuvable', async () => {
    const token = await adminToken();
    const res = await request(app)
      .get('/api/users/64b7f8c2a1d3e4f5a6b7c8d9')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('renvoie 400 pour un id invalide', async () => {
    const token = await adminToken();
    const res = await request(app)
      .get('/api/users/invalide')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/users/:id', () => {
  it('modifie un utilisateur', async () => {
    const token = await adminToken();
    const user = await createUser({ email: 'upd@test.com' });
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Modifie' });
    expect(res.status).toBe(200);
    expect(res.body.user.nom).toBe('Modifie');
  });

  it('hash le nouveau mot de passe', async () => {
    const token = await adminToken();
    await createUser({ email: 'pwd@test.com', motDePasse: 'Password123!' });
    await request(app)
      .put(`/api/users/${(await require('../src/models/user.model').findOne({ email: 'pwd@test.com' }))._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ motDePasse: 'Nouveau123!' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pwd@test.com', motDePasse: 'Nouveau123!' });
    expect(login.status).toBe(200);
  });

  it('renvoie 409 si l\'email est déjà utilisé', async () => {
    const token = await adminToken();
    await createUser({ email: 'taken@test.com' });
    const user = await createUser({ email: 'other@test.com' });
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'taken@test.com' });
    expect(res.status).toBe(409);
  });

  it('renvoie 400 si aucun champ fourni', async () => {
    const token = await adminToken();
    const user = await createUser({ email: 'empty@test.com' });
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id', () => {
  it('supprime un utilisateur (204)', async () => {
    const token = await adminToken();
    const user = await createUser({ email: 'del@test.com' });
    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('interdit la suppression de son propre compte (409)', async () => {
    const admin = await createUser({
      email: 'admin@test.com',
      motDePasse: 'Admin123!',
      role: 'ADMIN',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', motDePasse: 'Admin123!' });
    const res = await request(app)
      .delete(`/api/users/${admin._id}`)
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CANNOT_DELETE_SELF');
  });

  it('renvoie 404 si introuvable', async () => {
    const token = await adminToken();
    const res = await request(app)
      .delete('/api/users/64b7f8c2a1d3e4f5a6b7c8d9')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
