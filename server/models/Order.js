const mongoose = require('mongoose');

function genOrderId() {
  return 'ORD-' + Math.random().toString(16).slice(2, 8).toUpperCase();
}

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, default: genOrderId, index: true },
    customerEmail: { type: String, index: true, required: true },
    customer: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      postal: { type: String, default: '' },
    },
    payment: { type: String, default: '' },
    deliveryLocation: { type: String, default: '' },
    deliveryCharge: { type: Number, default: 0 },
    totals: {
      subtotal: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    items: [
      {
        productId: { type: String, default: '' },
        name: { type: String, default: '' },
        price: { type: Number, default: 0 },
        qty: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);

