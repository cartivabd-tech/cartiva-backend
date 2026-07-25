/**
 * Middleware (auth) unit tests
 */
const { authAdmin, authCustomer } = require('../middleware/auth');

// We need to mock the models to avoid DB dependency for middleware tests
jest.mock('../models/Admin', () => {
  return {
    findById: jest.fn(),
  };
});

jest.mock('../models/User', () => {
  return {
    findById: jest.fn(),
  };
});

const Admin = require('../models/Admin');
const User = require('../models/User');

describe('authAdmin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    await authAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    await authAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid admin token', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 'admin123', role: 'admin', username: 'admin' },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '1h' }
    );
    req.headers.authorization = `Bearer ${token}`;
    Admin.findById.mockResolvedValue({ _id: 'admin123', username: 'admin' });

    await authAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.username).toBe('admin');
  });
});

describe('authCustomer middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    await authCustomer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if role is not customer', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 'admin123', role: 'admin' },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '1h' }
    );
    req.headers.authorization = `Bearer ${token}`;

    await authCustomer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should call next() with valid customer token', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: 'customer123', role: 'customer', email: 'test@test.com' },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '1h' }
    );
    req.headers.authorization = `Bearer ${token}`;
    User.findById.mockResolvedValue({ _id: 'customer123', email: 'test@test.com' });

    await authCustomer(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('test@test.com');
  });
});

