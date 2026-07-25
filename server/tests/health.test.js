/**
 * Health endpoint tests
 */
const request = require('supertest');
const { startMongoServer, stopMongoServer } = require('./setup');

let app;

beforeAll(async () => {
  const result = await startMongoServer();
  app = result.app;
}, 30000);

afterAll(async () => {
  await stopMongoServer();
}, 30000);

describe('GET /api/health', () => {
  it('should return health status with ok: true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('mongooseReadyState');
    expect(res.body.mongooseReadyState).toBe(1);
    expect(res.body.message).toContain('Backend');
  });
});

describe('GET /', () => {
  it('should return the main index.html page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    // Since static files are served, index.html is returned
    expect(res.text).toContain('Cartiva');
  });
});

