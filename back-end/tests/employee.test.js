const request = require('supertest');
const app = require('../src/app');
const { connect, clear, disconnect } = require('./helpers/db');
const { createUser } = require('./helpers/users');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, motDePasse: password });
  return res.body.token;
}

describe('GET /api/employees', () => {
  it('ADMIN voit la liste des employés', async () => {
    await createUser({ email: 'admin@test.com', motDePasse: 'Admin123!', role: 'ADMIN' });
    await createUser({ email: 'e1@test.com', role: 'EMPLOYE' });
    await createUser({ email: 'e2@test.com', role: 'EMPLOYE' });
    await createUser({ email: 'c1@test.com', role: 'CHEF_PROJET' });
    const token = await loginAs('admin@test.com', 'Admin123!');
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((u) => u.role === 'EMPLOYE')).toBe(true);
    expect(res.body.data.every((u) => u.motDePasse === undefined)).toBe(true);
  });

  it('CHEF_PROJET voit la liste des employés', async () => {
    await createUser({ email: 'chef@test.com', motDePasse: 'Chef123!', role: 'CHEF_PROJET' });
    await createUser({ email: 'e1@test.com', role: 'EMPLOYE' });
    const token = await loginAs('chef@test.com', 'Chef123!');
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('EMPLOYE n\'y a pas accès (403)', async () => {
    await createUser({ email: 'emp@test.com', motDePasse: 'Password123!', role: 'EMPLOYE' });
    const token = await loginAs('emp@test.com', 'Password123!');
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('renvoie 401 sans authentification', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });
});
