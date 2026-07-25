/**
 * Test Setup - MongoDB Memory Server & Mock Data
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// Set environment before requiring the app
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.GOOGLE_CLIENT_ID = '';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // will be overridden
process.env.ORIGIN = '*';
process.env.NODE_ENV = 'test';

let mongoServer;
let app;
let server;

// Models - loaded after env setup
let User, Admin, Product, Order, Settings;

/**
 * Start in-memory MongoDB and connect
 */
async function startMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  // Clear any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  });

  // Clear the cache so the app re-connects
  const indexModule = require('../index.js');
  app = indexModule;

  // Models
  User = require('../models/User');
  Admin = require('../models/Admin');
  Product = require('../models/Product');
  Order = require('../models/Order');
  Settings = require('../models/Settings');

  // Ensure admin exists
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  let admin = await Admin.findOne({ username: adminUsername });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await Admin.create({ username: adminUsername, passwordHash });
  }

  return { app, mongoose };
}

/**
 * Stop MongoDB server and disconnect
 */
async function stopMongoServer() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  // Clear require cache
  delete require.cache[require.resolve('../index.js')];
  delete require.cache[require.resolve('../models/User')];
  delete require.cache[require.resolve('../models/Admin')];
  delete require.cache[require.resolve('../models/Product')];
  delete require.cache[require.resolve('../models/Order')];
  delete require.cache[require.resolve('../models/Settings')];
}

/**
 * Token and real-user cache
 */
let _testAdminId = null;
let _testCustomerId = null;
let _testCustomerEmail = 'testcustomer@example.com';

/**
 * Create a real admin in the DB and return its _id
 */
async function createTestAdmin() {
  const Admin = require('../models/Admin');
  const existing = await Admin.findOne({ username: 'testadmin' });
  if (existing) {
    _testAdminId = existing._id.toString();
    return _testAdminId;
  }
  const passwordHash = await bcrypt.hash('testpass', 10);
  const admin = await Admin.create({ username: 'testadmin', passwordHash });
  _testAdminId = admin._id.toString();
  return _testAdminId;
}

/**
 * Create a real customer user in the DB and return its _id
 */
async function createTestCustomer() {
  const User = require('../models/User');
  const existing = await User.findOne({ email: _testCustomerEmail });
  if (existing) {
    _testCustomerId = existing._id.toString();
    return _testCustomerId;
  }
  const passwordHash = await bcrypt.hash('testpass', 10);
  const user = await User.create({
    email: _testCustomerEmail,
    passwordHash,
    authProvider: 'password',
  });
  _testCustomerId = user._id.toString();
  return _testCustomerId;
}

/**
 * Generate an admin JWT token for testing (uses real admin ID from DB)
 */
async function generateAdminToken() {
  const id = await createTestAdmin();
  return jwt.sign(
    { sub: id, role: 'admin', username: 'testadmin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate a customer JWT token for testing (uses real customer ID from DB)
 */
async function generateCustomerToken(email) {
  const customerEmail = email || _testCustomerEmail;
  const id = await createTestCustomer();
  return jwt.sign(
    { sub: id, role: 'customer', email: customerEmail },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create sample product data
 */
function getSampleProduct(overrides = {}) {
  return {
    id: 'P-TEST-001',
    name: 'Test Product',
    price: 1000,
    originalPrice: 1200,
    stock: 'in-stock',
    deliveryOption: 'delivery-included',
    category: 'TWS',
    description: 'A test product for unit testing',
    image: 'https://example.com/test.jpg',
    images: ['https://example.com/test.jpg'],
    ...overrides,
  };
}

/**
 * Create sample order data
 */
function getSampleOrder(overrides = {}) {
  return {
    orderId: 'ORD-TEST-001',
    customerEmail: 'customer@test.com',
    customer: {
      fullName: 'Test Customer',
      phone: '1234567890',
      email: 'customer@test.com',
      address: '123 Test St',
      city: 'Test City',
      postal: '12345',
    },
    items: [
      { productId: 'P-TEST-001', name: 'Test Product', price: 1000, qty: 2 },
    ],
    totals: {
      subtotal: 2000,
      delivery: 0,
      total: 2000,
    },
    payment: 'cash',
    status: 'pending',
    ...overrides,
  };
}

/**
 * Create a product in the database
 */
async function createSampleProduct(overrides = {}) {
  const data = getSampleProduct(overrides);
  return await Product.create(data);
}

/**
 * Create an order in the database
 */
async function createSampleOrder(overrides = {}) {
  const data = getSampleOrder(overrides);
  return await Order.create(data);
}

module.exports = {
  startMongoServer,
  stopMongoServer,
  generateAdminToken,
  generateCustomerToken,
  getSampleProduct,
  getSampleOrder,
  createSampleProduct,
  createSampleOrder,
};

