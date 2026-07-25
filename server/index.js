require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const { authAdmin, authCustomer } = require('./middleware/auth');
const Settings = require('./models/Settings');
const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');
const Admin = require('./models/Admin');

const { signToken, verifyToken } = require('./utils/jwt');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const app = express();
app.use(express.json({ limit: '2mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(__dirname));

// HTML Routes
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/checkout.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'checkout.html')));
app.get('/cart.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'cart.html')));
app.get('/product.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'product.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'admin.html')));
app.get('/my-orders.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'my-orders.html')));

// CORS Setup
function buildCorsOptions(req, callback) {
  const raw = process.env.ORIGIN || '';
  const allowedOrigins = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const isPermissive = allowedOrigins.length === 0;
  const reqOrigin = req ? req.header('Origin') : null;

  if (isPermissive || !reqOrigin || allowedOrigins.includes(reqOrigin)) {
    return callback(null, { origin: true });
  }

  return callback(null, { origin: false });
}

app.use(cors({
  origin: buildCorsOptions,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors({
  origin: buildCorsOptions,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const PORT = process.env.PORT || 3000;

// Database Connection Caching
let cached = { connPromise: null };

async function ensureAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await Admin.findOne({ username: adminUsername });
    if (!admin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await Admin.create({ username: adminUsername, passwordHash });
    }
  } catch (err) {
    console.error('ensureAdmin Error:', err.message);
  }
}

// Surface low-level connection events instead of failing silently.
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from MongoDB');
});

function explainMongoError(err) {
  const msg = String(err && err.message || err || '');
  if (/bad auth|authentication failed/i.test(msg)) {
    return 'Authentication failed — check MONGODB_URI username/password. If your password has special characters (@ # % : / ? etc.), they must be URL-encoded.';
  }
  if (/ENOTFOUND|querySrv|ECONNREFUSED/i.test(msg)) {
    return 'Could not resolve/reach the cluster host — double check the cluster address in MONGODB_URI for typos.';
  }
  if (/whitelist|IP address is not|not authorized/i.test(msg)) {
    return 'Your IP is likely not whitelisted — in MongoDB Atlas, go to Network Access and allow your current IP (or 0.0.0.0/0 for serverless hosts like Vercel).';
  }
  if (/timed out|timeout/i.test(msg)) {
    return 'Connection timed out — this is usually an Atlas IP whitelist issue, or a firewall blocking outbound MongoDB traffic.';
  }
  return null;
}

async function connectToDatabase() {
  // .trim() guards against a trailing space/newline/quote sneaking into .env,
  // which produces a URI that "looks right" but fails to parse or connect.
  const mongoUri = String(process.env.MONGODB_URI || '').trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI missing in environment variables');
  }
  if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGODB_URI is set but malformed — it must start with "mongodb://" or "mongodb+srv://"');
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return;
  }

  if (cached.connPromise) return cached.connPromise;

  cached.connPromise = (async () => {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
        socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 20000),
        family: 4, // avoid IPv6 resolution issues seen on some hosts (Vercel, some ISPs)
      });

      console.log('MongoDB Connected!');
      await ensureAdmin();

      const settings = await Settings.findOne({});
      if (!settings) await Settings.create({});
    } catch (err) {
      cached.connPromise = null;
      const hint = explainMongoError(err);
      console.error('MongoDB Connection Failure:', err.message + (hint ? ` — Hint: ${hint}` : ''));
      throw err;
    }
  })();

  return cached.connPromise;
}

// Database Connection Middleware
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database Connection Middleware Error:', err ? err.message : err);
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: err ? err.message : 'Unknown DB Error' 
    });
  }
});

// Health Endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      ok: true,
      mongooseReadyState: mongoose.connection ? mongoose.connection.readyState : 0,
      message: 'Backend & DB running smoothly!'
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      mongooseReadyState: mongoose.connection ? mongoose.connection.readyState : 0,
      error: 'Database connection failed',
      details: e ? e.message : 'Unknown error'
    });
  }
});

app.get('/', (req, res) => {
  res.send('Cartiva Backend Server is Running Perfectly!');
});

// ===== Auth (Customer) =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    const pw = String(password || '');

    if (!e || !e.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    if (pw.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: e });
    if (exists) return res.status(409).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(pw, 10);
    const user = await User.create({
      email: e,
      passwordHash,
      authProvider: 'password',
    });

    res.json({ ok: true, user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    const pw = String(password || '');
    if (!e) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: e });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'This account is registered using Google. Please use Google Sign-In.' });
    }

    const ok = await bcrypt.compare(pw, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ sub: user._id.toString(), role: 'customer', email: user.email });
    res.json({ ok: true, token, user: { id: user._id.toString(), email: user.email } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google Sign-In missing GOOGLE_CLIENT_ID' });
    }

    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }

    const email = String(payload.email).trim().toLowerCase();
    const name = String(payload.name || '').trim();
    const picture = String(payload.picture || '').trim();
    const googleId = String(payload.sub || '').trim();

    let user = await User.findOne({ googleId });
    if (!user) user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, googleId, name, picture, authProvider: 'google' });
    } else {
      user.googleId = user.googleId || googleId;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      await user.save();
    }

    const token = signToken({ sub: user._id.toString(), role: 'customer', email: user.email });
    res.json({
      ok: true,
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name, picture: user.picture },
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Auth (Admin) =====
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const u = String(username || '').trim();
    const pw = String(password || '');

    const admin = await Admin.findOne({ username: u });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(pw, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: admin._id.toString(), role: 'admin', username: admin.username });
    res.json({ ok: true, token, admin: { username: admin.username } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/me/customer', authCustomer, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    const user = userId ? await User.findById(userId).lean() : null;
    res.json({
      email: req.user?.email || '',
      name: user?.name || '',
      picture: user?.picture || '',
    });
  } catch {
    res.json({ email: req.user?.email || '' });
  }
});

app.get('/api/my/orders', authCustomer, async (req, res) => {
  try {
    const email = req.user?.email || '';
    const orders = await Order.find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ok: true, orders });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Store & Products
function normalizeStock(stock) {
  const s = String(stock || '').trim().toLowerCase();
  if (s === 'in-stock' || s === 'in stock' || s === 'in') return 'in-stock';
  if (s === 'out-of-stock' || s === 'out of stock' || s === 'out') return 'out-of-stock';
  return stock;
}

function normalizeDeliveryOption(opt) {
  const o = String(opt || '').trim().toLowerCase();
  if (o === 'delivery included' || o === 'delivery include' || o === 'delivery-included') return 'delivery-included';
  if (o === 'free-delivery' || o === 'free delivery' || o === 'delivery charge extra') return 'free-delivery';
  return opt;
}

app.get('/api/store', async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    const settingsDoc = await Settings.findOne({});
    const settings = settingsDoc ? settingsDoc.toObject() : {};

    res.json({
      products: (products || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        stock: p.stock,
        deliveryOption: p.deliveryOption,
        category: p.category,
        description: p.description,
        image: p.image,
        images: p.images,
      })),
      settings: {
        logoUrl: settings.logoUrl || '',
        waUrl: settings.waUrl || '',
        fbUrl: settings.fbUrl || '',
        igUrl: settings.igUrl || '',
        tikTokUrl: settings.tikTokUrl || '',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching store data' });
  }
});

app.post('/api/products', authAdmin, async (req, res) => {
  try {
    const p = req.body || {};
    const productId = String(p.id || '').trim();
    if (!productId) return res.status(400).json({ error: 'Product id is required' });

    const payload = {
      id: productId,
      name: String(p.name || '').trim(),
      price: Number(p.price),
      originalPrice: p.originalPrice === null || p.originalPrice === undefined || p.originalPrice === '' ? null : Number(p.originalPrice),
      stock: normalizeStock(p.stock),
      deliveryOption: normalizeDeliveryOption(p.deliveryOption),
      category: String(p.category || '').trim(),
      description: String(p.description || '').trim(),
      image: String(p.image || ''),
      images: Array.isArray(p.images) ? p.images.map(String) : (p.images ? [String(p.images)] : []),
    };

    if (!payload.name || !Number.isFinite(payload.price) || !payload.category || !payload.description) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existing = await Product.findOne({ id: payload.id });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return res.json({ ok: true });
    }

    await Product.create(payload);
    return res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error saving product' });
  }
});

app.post('/api/admin/reset', authAdmin, async (req, res) => {
  try {
    const defaults = require('../data/products.js');
    await Product.deleteMany({});
    if (Array.isArray(defaults) && defaults.length) {
      await Product.insertMany(defaults.map(p => ({
        ...p,
        stock: normalizeStock(p.stock),
        deliveryOption: normalizeDeliveryOption(p.deliveryOption),
        originalPrice: p.originalPrice === undefined ? null : p.originalPrice,
        images: Array.isArray(p.images) ? p.images : (p.images ? [String(p.images)] : []),
      })));
    }

    await Settings.deleteMany({});
    await Settings.create({});

    res.json({ ok: true, reset: true, inserted: Array.isArray(defaults) ? defaults.length : 0 });
  } catch (e) {
    res.status(500).json({ error: 'Server error resetting database' });
  }
});

app.delete('/api/products/:id', authAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    await Product.deleteOne({ id });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/settings', authAdmin, async (req, res) => {
  try {
    const s = req.body || {};
    let doc = await Settings.findOne({});
    if (!doc) doc = await Settings.create({});

    doc.logoUrl = String(s.logoUrl || '');
    doc.waUrl = String(s.waUrl || '');
    doc.fbUrl = String(s.fbUrl || '');
    doc.igUrl = String(s.igUrl || '');
    doc.tikTokUrl = String(s.tikTokUrl || '');

    await doc.save();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Orders =====
app.post('/api/orders', async (req, res) => {
  try {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return res.status(400).json({ error: 'No items' });

    let loggedInEmail = '';
    let authProvider = '';
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

    if (bearerToken) {
      try {
        const payload = verifyToken(bearerToken);
        if (payload && payload.role === 'customer' && payload.email) {
          const user = await User.findById(payload.sub).lean();
          if (user) {
            loggedInEmail = user.email;
            authProvider = user.authProvider || 'password';
          }
        }
      } catch {
        // guest checkout fallback
      }
    }

    const customerEmail = String(loggedInEmail || b.customerEmail || b.customer?.email || '').trim();
    if (!customerEmail) return res.status(400).json({ error: 'Customer email is required' });

    const generatedOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await Order.create({
      orderId: String(b.orderId || generatedOrderId),
      customerEmail,
      loggedIn: Boolean(loggedInEmail),
      authProvider,
      customer: {
        fullName: String(b.customer?.fullName || '').trim(),
        phone: String(b.customer?.phone || '').trim(),
        email: String(b.customer?.email || customerEmail),
        address: String(b.customer?.address || '').trim(),
        city: String(b.customer?.city || '').trim(),
        postal: String(b.customer?.postal || '').trim(),
      },
      payment: String(b.payment || ''),
      deliveryLocation: String(b.deliveryLocation || ''),
      deliveryCharge: Number(b.deliveryCharge || 0),
      totals: {
        subtotal: Number(b.totals?.subtotal || 0),
        delivery: Number(b.totals?.delivery || b.deliveryCharge || 0),
        total: Number(b.totals?.total || 0),
      },
      items: items.map(it => ({
        productId: String(it.productId || ''),
        name: String(it.name || ''),
        price: Number(it.price || 0),
        qty: Number(it.qty || 0),
      })),
      status: String(b.status || 'pending'),
    });

    res.json({ ok: true, orderId: order.orderId });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/orders', authAdmin, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ orders });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/orders/:id', authAdmin, async (req, res) => {
  try {
    const orderId = String(req.params.id || '').trim();
    const { status } = req.body || {};

    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const newStatus = String(status || '').trim().toLowerCase();

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = newStatus;
    await order.save();

    res.json({ ok: true, orderId: order.orderId, status: order.status });
  } catch {
    res.status(500).json({ error: 'Server error updating order status' });
  }
});

app.get('/api/admin/stats', authAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);
    const orderStatusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {};
    (orderStatusCounts || []).forEach(s => { statusCounts[s._id] = s.count; });

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      orderStatusCounts: statusCounts
    });
  } catch {
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// Global Error Catch Middleware (To stop crash)
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err ? err.stack || err.message : err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err ? err.message : 'Unknown Server Error'
  });
});

if (process.env.MONGODB_URI) {
  connectToDatabase().catch((err) => {
    // Don't crash on cold start — the /api middleware will retry per-request
    // and report the error — but do log it instead of swallowing it silently.
    console.error('Initial MongoDB connection attempt failed:', err.message);
  });
}

if (require.main === module) {
  app.listen(PORT, async () => {
    try {
      await connectToDatabase();
      console.log(`Server listening on port ${PORT}`);
    } catch (err) {
      console.error('Failed to start standalone server', err);
      process.exitCode = 1;
    }
  });
}

module.exports = app;