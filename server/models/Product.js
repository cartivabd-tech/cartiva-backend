const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    stock: { type: String, default: 'in-stock' },
    deliveryOption: { type: String, default: 'delivery-included' },
    category: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);

