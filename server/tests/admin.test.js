/**
 * Admin tests - Stats, Settings, and other admin endpoints
 */
const request = require('supertest');
const {
  startMongoServer,
  stopMongoServer,
  generateAdminToken,
  createSampleProduct,
  createSampleOrder,
} = require('./setup');

let app;
let adminToken;

beforeAll(async () => {
  const result = await startMongoServer();
  app = result.app;
  adminToken = await generateAdminToken();
}, 30000);

afterAll(async () => {
  await stopMongoServer();
}, 30000);

describe('GET /api/admin/stats', () => {
  it('should return stats with zero values when empty', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBe(0);
    expect(res.body.totalOrders).toBe(0);
    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.orderStatusCounts).toEqual({});
  });

  it('should return accurate stats with data', async () => {
    // Create products
    await createSampleProduct();
    await createSampleProduct({ id: 'P-TEST-002', name: 'Test Product 2' });

    // Create orders
    await createSampleOrder({
      orderId: 'ORD-STATS-001',
      totals: { subtotal: 2000, delivery: 0, total: 2000 },
    });
    await createSampleOrder({
      orderId: 'ORD-STATS-002',
      customerEmail: 'another@test.com',
      totals: { subtotal: 3000, delivery: 500, total: 3500 },
      status: 'delivered',
    });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBe(2);
    expect(res.body.totalOrders).toBe(2);
    expect(res.body.totalRevenue).toBeGreaterThan(0);
    expect(res.body.orderStatusCounts).toBeDefined();
  });

  it('should reject without admin token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/settings', () => {
  it('should update store settings as admin', async () => {
    const res = await request(app)
      .post('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        logoUrl: 'https://example.com/logo.png',
        waUrl: 'https://wa.me/123456789',
        fbUrl: 'https://facebook.com/store',
        igUrl: 'https://instagram.com/store',
        tikTokUrl: 'https://tiktok.com/@store',
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should verify settings persist after update', async () => {
    const res = await request(app).get('/api/store');
    expect(res.status).toBe(200);
    expect(res.body.settings.logoUrl).toBe('https://example.com/logo.png');
    expect(res.body.settings.waUrl).toBe('https://wa.me/123456789');
    expect(res.body.settings.fbUrl).toBe('https://facebook.com/store');
  });

  it('should reject without admin token', async () => {
    const res = await request(app)
      .post('/api/settings')
      .send({ logoUrl: 'https://example.com/logo.png' });
    expect(res.status).toBe(401);
  });
});

