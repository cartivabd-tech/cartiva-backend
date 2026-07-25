/**
 * Authentication Tests - Customer & Admin
 */
const request = require('supertest');
const {
  startMongoServer,
  stopMongoServer,
  generateAdminToken,
  generateCustomerToken,
} = require('./setup');

let app;

beforeAll(async () => {
  const result = await startMongoServer();
  app = result.app;
}, 30000);

afterAll(async () => {
  await stopMongoServer();
}, 30000);

describe('POST /api/auth/register', () => {
  it('should register a new customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.email).toBe('newuser@test.com');
  });

  it('should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@test.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email');
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'shortpw@test.com', password: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Password');
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    // First register
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'loginuser@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loginuser@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('loginuser@test.com');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loginuser@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });

  it('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Email');
  });
});

describe('POST /api/admin/login', () => {
  it('should login admin with default credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.admin.username).toBe('admin');
  });

  it('should reject invalid admin credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });

  it('should reject non-existent admin', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'nonexistent', password: 'admin123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid');
  });
});

describe('GET /api/me/customer', () => {
  it('should return customer info with valid token', async () => {
    const token = await generateCustomerToken();
    const res = await request(app)
      .get('/api/me/customer')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email');
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/me/customer');
    expect(res.status).toBe(401);
  });

  it('should reject with invalid token', async () => {
    const res = await request(app)
      .get('/api/me/customer')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

