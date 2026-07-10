const mongoose = require('mongoose');

// OrderId generator is kept in the backend (server/index.js) where needed.
// This schema validates the checkout -> /api/orders payload.

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    postal: { type: String, default: '' },
  },
  { _id: false }
);

const TotalsSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    // For admin display; client may also send it.
    orderId: { type: String, required: true, unique: true, index: true },

    customerEmail: { type: String, required: true, index: true },
    customer: { type: CustomerSchema, default: () => ({}) },

    payment: { type: String, default: '' },
    deliveryLocation: { type: String, default: '' },
    deliveryCharge: { type: Number, default: 0 },

    totals: { type: TotalsSchema, default: () => ({}) },

    items: { type: [OrderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },

    status: { type: String, default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);

