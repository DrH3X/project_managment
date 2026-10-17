const request = require('supertest');
const app = require('../src/app');
const { connect, clear, disconnect } = require('./helpers/db');
const { createUser } = require('./helpers/users');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('POST /api/auth/login', () => {
  it('renvoie un jeton et l\'utilisateur pour des identifiants valides', async () => {
    await createUser({ email: 'login@test.com', motDePasse: 'Password123!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', motDePasse: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
    expect(res.body.user.motDePasse).toBeUndefined();
  });

  it('renvoie 401 pour un mot de passe incorrect', async () => {
    await createUser({ email: 'login@test.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', motDePasse: 'mauvais' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('renvoie 401 pour un email inexistant', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inexistant@test.com', motDePasse: 'Password123!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('renvoie 400 pour un email invalide', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pasunemail', motDePasse: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('renvoie 400 si le mot de passe est manquant', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com' });
    expect(res.status).toBe(400);
  });

  it('fonctionne aussi avec un email en majuscules (insensible à la casse)', async () => {
    await createUser({ email: 'case@test.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'CASE@TEST.COM', motDePasse: 'Password123!' });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  it('renvoie l\'utilisateur connecté avec un jeton valide', async () => {
    const user = await createUser({ email: 'me@test.com', role: 'ADMIN' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@test.com', motDePasse: 'Password123!' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user._id.toString());
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('renvoie 401 sans jeton', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('renvoie 401 avec un jeton invalide', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer jetoninvalide');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('POST /api/auth/logout', () => {
  it('renvoie 204 (le front supprime le jeton)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});
