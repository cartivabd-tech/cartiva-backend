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
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json({ limit: '2mb' }));

// Serve static files from the project root (parent of server/)
// so that index.html, admin.html, css/, js/, etc. are all accessible.
app.use(express.static(path.join(__dirname, '..')));

function buildCorsOptions(req, callback) {
  // Handle edge case where req is undefined (can happen in serverless
  // environments like Vercel when the preflight/OPTIONS request is
  // intercepted before reaching the Express app). In that case we
  // fall back to permissive CORS to avoid a hard 500 crash.
  if (!req || typeof req.header !== 'function') {
    const raw = process.env.ORIGIN || '';
    const allowedOrigins = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const isPermissive = allowedOrigins.length === 0;
    return callback(null, { origin: isPermissive ? true : false });
  }

  // Allow multiple origins: ORIGIN="https://a.com,https://b.com"
  const raw = process.env.ORIGIN || '';
  const allowedOrigins = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // If ORIGIN is not set, fall back to permissive mode
  // (useful for local dev; replace with explicit ORIGIN in production).
  const isPermissive = allowedOrigins.length === 0;

  const reqOrigin = req.header('Origin');

  if (isPermissive) return callback(null, { origin: true });
  if (!reqOrigin) return callback(null, { origin: false });
  if (allowedOrigins.includes(reqOrigin)) {
    return callback(null, { origin: true });
  }

  return callback(null, { origin: false });
}

app.use(
  cors({
    origin: buildCorsOptions,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Ensure CORS preflight works reliably on mobile browsers
app.options('*', cors({
  origin: buildCorsOptions,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const PORT = process.env.PORT || 5000;

// Serverless-safe cached connection
let cached = { connPromise: null };

async function ensureAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  let admin = await Admin.findOne({ username: adminUsername });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await Admin.create({ username: adminUsername, passwordHash });
  }
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[DB] MONGODB_URI missing');
    throw new Error('MONGODB_URI missing in environment variables');
  }

  // Helpful logging (mask credentials in case URI includes them)
  try {
    const masked = mongoUri.replace(/(mongodb\+srv:\/\/)(.*?:.*?@)/, '$1****@');
    const host = (() => {
      const m = masked.match(/@([^/?]+)/);
      return m?.[1] || 'unknown-host';
    })();
    console.log('[DB] Connecting to', host);
  } catch {
    // ignore masking/logging failures
  }


  // If connection is already established, don't reconnect.
  if (mongoose.connection.readyState === 1) return;

  if (cached.connPromise) return cached.connPromise;

  cached.connPromise = (async () => {
    try {
      console.log('Connecting to MongoDB...');

      // Options tuned to prevent long hangs and improve failure clarity
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
        socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 20000),
      });

      console.log('MongoDB connected');

      await ensureAdmin();

      const settings = await Settings.findOne({});
      if (!settings) await Settings.create({});
    } catch (err) {
      // Important: allow future retries (do not keep a rejected promise forever)
      cached.connPromise = null;
      console.error('MongoDB connection failed:', err);
      throw err;
    }
  })();

  return cached.connPromise;
}

// Connect to DB only for API routes (avoid blocking static file requests)
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database Connection Error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});



// Root route (Vercel home endpoint)

app.get('/', (req, res) => {
  res.send('Cartiva Backend Server is Running Perfectly!');
});

app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      ok: true,
      mongooseReadyState: mongoose.connection.readyState,
      message: 'Cartiva Backend Server is Running Perfectly!',
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      mongooseReadyState: mongoose.connection?.readyState ?? 0,
      error: 'Database connection failed',
    });
  }
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
    const user = await User.create({ email: e, passwordHash, authProvider: 'password' });
    console.log('[auth/register] new customer created:', e);

    // Return a token so the shopper is signed in immediately after signing up
    // and their first order is linked to the new account.
    const token = signToken({ sub: user._id.toString(), role: 'customer', email: user.email });
    res.json({ ok: true, token, user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    console.error('[auth/register] failed:', err);
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
      return res.status(500).json({ error: 'Google Sign-In is not configured on the server (missing GOOGLE_CLIENT_ID)' });
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
    } catch (verifyErr) {
      console.error('[auth/google] token verification failed:', verifyErr.message);
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Google account has no verified email' });
    }
    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }

    const email = String(payload.email).trim().toLowerCase();
    const name = String(payload.name || '').trim();
    const picture = String(payload.picture || '').trim();
    const googleId = String(payload.sub || '').trim();

    // Find by googleId first, then fall back to matching an existing
    // password-based account with the same email (so a customer who
    // registered manually can still sign in with Google afterwards).
    let user = await User.findOne({ googleId });
    if (!user) user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, googleId, name, picture, authProvider: 'google' });
      console.log('[auth/google] new customer created:', email);
    } else {
      // Keep the profile fresh and link the Google account if not linked yet.
      user.googleId = user.googleId || googleId;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      await user.save();
      console.log('[auth/google] existing customer signed in:', email);
    }

    const token = signToken({ sub: user._id.toString(), role: 'customer', email: user.email });
    res.json({
      ok: true,
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name, picture: user.picture },
    });
  } catch (err) {
    console.error('[auth/google] failed:', err);
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
    const user = await User.findById(req.user.id).lean();
    res.json({
      email: req.user.email,
      name: user?.name || '',
      picture: user?.picture || '',
    });
  } catch {
    res.json({ email: req.user.email });
  }
});

// Order history for the logged-in customer (requires Google/email login).
app.get('/api/my/orders', authCustomer, async (req, res) => {
  try {
    // Match on the linked account id (orders placed while signed in) OR the
    // account email (guest orders placed with the same email address), so the
    // customer sees their full history either way.
    const orders = await Order.find({
      $or: [{ userId: req.user.id }, { customerEmail: req.user.email }],
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ok: true, orders });
  } catch (err) {
    console.error('[my/orders] failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== Products + Settings =====
app.get('/api/store', async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    const settingsDoc = await Settings.findOne({});
    const settings = settingsDoc ? settingsDoc.toObject() : { logoUrl: '', waUrl: '', fbUrl: '', igUrl: '', tikTokUrl: '' };

    res.json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice === null || p.originalPrice === undefined || p.originalPrice === '' ? null : p.originalPrice,
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
  } catch {
    res.status(500).json({ error: 'Server error fetching store data' });
  }
});

// Admin-only: must have Bearer admin token
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
      stock: p.stock,
      deliveryOption: p.deliveryOption,
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
    console.error(err);
    res.status(500).json({ error: 'Server error saving product' });
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
// NOTE: checkout.html supports guest checkout (no customer login/token is ever
// sent from the frontend), but this route used to require authCustomer.
// That made every real checkout request fail with 401, silently falling back
// to a localStorage-only "success" on the frontend, so the order never
// reached MongoDB and never appeared in admin.html. Removing the auth
// requirement here (and validating customerEmail directly) fixes that.
app.post('/api/orders', async (req, res) => {
  try {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return res.status(400).json({ error: 'No items' });

    // Optional: if a customer is logged in (Google or email/password), the
    // frontend sends their JWT. It's never required (guest checkout keeps
    // working), but if present and valid we trust its email and tag the
    // order as "loggedIn" for the admin dashboard.
    let loggedInEmail = '';
    let loggedInUserId = null;
    let loggedInName = '';
    let authProvider = '';
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (bearerToken) {
      try {
        const payload = verifyToken(bearerToken);
        if (payload && payload.role === 'customer') {
          const user = await User.findById(payload.sub).lean();
          if (user) {
            loggedInEmail = user.email;
            loggedInUserId = user._id;
            loggedInName = user.name || '';
            authProvider = user.authProvider || 'password';
          }
        }
      } catch (tokenErr) {
        // Invalid/expired token: fall back to guest checkout silently.
        console.warn('[orders] ignoring invalid customer token:', tokenErr.message);
      }
    }

    const customerEmail = String(loggedInEmail || b.customerEmail || b.customer?.email || '')
      .trim()
      .toLowerCase();
    if (!customerEmail) return res.status(400).json({ error: 'Customer email is required' });

    // Validate + normalise line items up front so a malformed cart returns a
    // clear 400 instead of an opaque Mongoose validation 500.
    const requestedIds = items.map(it => String(it?.productId || it?.id || '').trim()).filter(Boolean);
    const catalog = await Product.find({ id: { $in: requestedIds } }).lean();
    const catalogById = new Map(catalog.map(p => [p.id, p]));

    const normalizedItems = [];
    for (const it of items) {
      const productId = String(it?.productId || it?.id || '').trim();
      const qty = Math.floor(Number(it?.qty));

      if (!productId) {
        return res.status(400).json({ error: 'Each cart item needs a productId' });
      }
      if (!Number.isFinite(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ error: `Invalid quantity for product ${productId}` });
      }

      // Prices and names always come from the database when the product still
      // exists, so a tampered client payload cannot change what is charged.
      const dbProduct = catalogById.get(productId);
      const name = String(dbProduct?.name || it?.name || '').trim();
      const price = Number(dbProduct?.price ?? it?.price);

      if (!name || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: `Unknown or invalid product: ${productId}` });
      }

      normalizedItems.push({ productId, name, price, qty });
    }

    // Recompute money server-side; never trust client totals.
    const subtotal = normalizedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const deliveryRaw = Number(b.deliveryCharge ?? b.totals?.delivery ?? 0);
    const delivery = Number.isFinite(deliveryRaw) && deliveryRaw >= 0 ? deliveryRaw : 0;

    // Always generate the id here. A client-supplied id can collide with an
    // existing order, which used to surface as an unexplained 500.
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await Order.create({
      orderId,
      customerEmail,
      userId: loggedInUserId,
      customerName: String(b.customer?.fullName || loggedInName || '').trim(),
      loggedIn: Boolean(loggedInUserId),
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
      deliveryCharge: delivery,
      totals: {
        subtotal,
        delivery,
        total: subtotal + delivery,
      },
      items: normalizedItems,
      status: String(b.status || 'pending'),
    });

    console.log('[orders] saved', order.orderId, 'for', customerEmail, order.loggedIn ? '(logged in)' : '(guest)');
    res.json({ ok: true, orderId: order.orderId });
  } catch (err) {
    console.error('[orders] failed to save order:', err);

    if (err?.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    // Duplicate orderId: retry once with a fresh server-generated id so the
    // customer is never blocked by an id collision.
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Duplicate order id, please try again' });
    }
    res.status(500).json({ error: 'Could not save your order. Please try again.' });
  }
});

app.get('/api/admin/orders', authAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ ok: true, count: orders.length, orders });
  } catch (err) {
    console.error('[admin/orders] failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Registered customers (email/password + Google sign-ins) for the admin panel.
app.get('/api/admin/customers', authAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .select('email name picture authProvider createdAt')
      .lean();

    const emails = users.map(u => u.email);
    const ids = users.map(u => u._id);

    // Order count + lifetime spend per customer, in one pass.
    const agg = await Order.aggregate([
      { $match: { $or: [{ userId: { $in: ids } }, { customerEmail: { $in: emails } }] } },
      {
        $group: {
          _id: '$customerEmail',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totals.total' },
        },
      },
    ]);
    const statsByEmail = new Map(agg.map(a => [a._id, a]));

    res.json({
      ok: true,
      customers: users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name || '',
        picture: u.picture || '',
        authProvider: u.authProvider || 'password',
        createdAt: u.createdAt,
        orderCount: statsByEmail.get(u.email)?.orderCount || 0,
        totalSpent: statsByEmail.get(u.email)?.totalSpent || 0,
      })),
    });
  } catch (err) {
    console.error('[admin/customers] failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/orders/:id', authAdmin, async (req, res) => {
  try {
    const orderId = String(req.params.id || '').trim();
    const { status } = req.body || {};
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') });
    }
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.status = status;
    await order.save();
    res.json({ ok: true, status: order.status });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/stats', authAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const orderAgg = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totals.total' } } },
    ]);
    const totalRevenue = orderAgg.length > 0 ? orderAgg[0].totalRevenue : 0;
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const orderStatusCounts = {};
    statusCounts.forEach(s => { orderStatusCounts[s._id] = s.count; });
    res.json({ totalProducts, totalOrders, totalRevenue, orderStatusCounts });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/reset', authAdmin, async (req, res) => {
  try {
    await Product.deleteMany({});
    await Order.deleteMany({});
    res.json({ ok: true, reset: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// লোকাল ডেভেলপমেন্ট এবং ক্লাউড ওয়ার্মআপের জন্য
if (process.env.MONGODB_URI) {
  connectToDatabase().catch(() => {});
}


// Standalone Local development server listener
if (require.main === module) {
  app.listen(PORT, async () => {
    try {
      await connectToDatabase();
      console.log(`Cartiva backend listening on port ${PORT}`);
    } catch (err) {
      console.error('Failed to start standalone server', err);
      process.exitCode = 1;
    }
  });
}

module.exports = app;
