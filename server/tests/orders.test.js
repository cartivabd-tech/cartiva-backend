/**
 * Orders tests
 */
const request = require('supertest');
const {
  startMongoServer,
  stopMongoServer,
  generateAdminToken,
  generateCustomerToken,
  createSampleOrder,
} = require('./setup');

let app;
let adminToken;
let customerToken;

beforeAll(async () => {
  const result = await startMongoServer();
  app = result.app;
  adminToken = await generateAdminToken();
  customerToken = await generateCustomerToken('customer@test.com');
}, 30000);

afterAll(async () => {
  await stopMongoServer();
}, 30000);

describe('POST /api/orders', () => {
  it('should create an order for a guest', async () => {
    const res = await request(app).post('/api/orders').send({
      customerEmail: 'guest@test.com',
      customer: {
        fullName: 'Guest User',
        phone: '1234567890',
        email: 'guest@test.com',
        address: '123 Guest St',
        city: 'Guest City',
        postal: '12345',
      },
      items: [
        { productId: 'P-TEST-001', name: 'Test Product', price: 1000, qty: 1 },
      ],
      totals: { subtotal: 1000, delivery: 0, total: 1000 },
      payment: 'cash',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.orderId).toMatch(/^ORD-/);
  });

  it('should create an order for a logged-in customer', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customer: {
          fullName: 'Logged In Customer',
          phone: '0987654321',
          email: 'customer@test.com',
          address: '456 Customer Ave',
          city: 'Customer City',
          postal: '54321',
        },
        items: [
          { productId: 'P-TEST-002', name: 'Another Product', price: 2000, qty: 2 },
        ],
        totals: { subtotal: 4000, delivery: 500, total: 4500 },
        payment: 'transfer',
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.orderId).toBeDefined();
  });

  it('should reject order with no items', async () => {
    const res = await request(app).post('/api/orders').send({
      customerEmail: 'test@test.com',
      items: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No items');
  });

  it('should reject order with no customer email', async () => {
    const res = await request(app).post('/api/orders').send({
      items: [{ productId: 'P-1', name: 'Product', price: 100, qty: 1 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email');
  });
});

describe('GET /api/my/orders', () => {
  it('should return orders for logged-in customer', async () => {
    const res = await request(app)
      .get('/api/my/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/my/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/orders', () => {
  it('should return all orders for admin', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toBeDefined();
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('should reject without admin token', async () => {
    const res = await request(app).get('/api/admin/orders');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/admin/orders/:id', () => {
  let orderCounter = 1;

  it('should update order status as admin', async () => {
    const order = await createSampleOrder({ orderId: `ORD-PATCH-${orderCounter++}` });
    const res = await request(app)
      .patch(`/api/admin/orders/${order.orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status).toBe('processing');
  });

  it('should reject invalid status', async () => {
    const order = await createSampleOrder({ orderId: `ORD-PATCH-${orderCounter++}` });
    const res = await request(app)
      .patch(`/api/admin/orders/${order.orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid-status' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status');
  });

  it('should reject non-existent order', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/ORD-NONEXISTENT')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should reject without admin token', async () => {
    const order = await createSampleOrder({ orderId: `ORD-PATCH-${orderCounter++}` });
    const res = await request(app)
      .patch(`/api/admin/orders/${order.orderId}`)
      .send({ status: 'delivered' });
    expect(res.status).toBe(401);
  });
});

