require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { authAdmin, authCustomer } = require('./middleware/auth');
const Settings = require('./models/Settings');
const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');
const Admin = require('./models/Admin');

const { signToken } = require('./utils/jwt');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json({ limit: '2mb' }));

app.use(
  cors({
    origin: process.env.ORIGIN || '*',
    credentials: true,
  })
);

const PORT = process.env.PORT || 3000;

async function ensureAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  let admin = await Admin.findOne({ username: adminUsername });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await Admin.create({ username: adminUsername, passwordHash });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
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
    const user = await User.create({ email: e, passwordHash });

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

    const ok = await bcrypt.compare(pw, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ sub: user._id.toString(), role: 'customer', email: user.email });
    res.json({ ok: true, token, user: { id: user._id.toString(), email: user.email } });
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
  res.json({ email: req.user.email });
});

// ===== Products + Settings =====
app.get('/api/store', async (req, res) => {
  const products = await Product.find({}).lean();
  const settingsDoc = await Settings.findOne({});
  const settings = settingsDoc ? settingsDoc.toObject() : { logoUrl: '', waUrl: '', fbUrl: '', igUrl: '', tikTokUrl: '' };

  res.json({
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
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
  } catch {
    res.status(500).json({ error: 'Server error' });
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
app.post('/api/orders', authCustomer, async (req, res) => {
  try {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return res.status(400).json({ error: 'No items' });

    const order = await Order.create({
      customerEmail: req.user.email,
      customer: {
        fullName: String(b.customer?.fullName || '').trim(),
        phone: String(b.customer?.phone || '').trim(),
        email: String(b.customer?.email || req.user.email),
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

// ===== DB bootstrap =====
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI missing in .env');
    }

    await mongoose.connect(mongoUri);
    await ensureAdmin();

    const settings = await Settings.findOne({});
    if (!settings) await Settings.create({});

    app.listen(PORT, () => {
      console.log(`Cartiva backend listening on port ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;