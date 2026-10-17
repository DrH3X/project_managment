const request = require('supertest');
const app = require('../src/app');
const { connect, clear, disconnect } = require('./helpers/db');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('GET /api/health', () => {
  it('renvoie 200 et le statut ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Route inconnue', () => {
  it('renvoie 404 NOT_FOUND au format normalisé', async () => {
    const res = await request(app).get('/api/inconnue');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
