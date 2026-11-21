const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  role: { type: String, enum: ['customer', 'technician', 'admin'], default: 'customer' },
  roleConfirmed: { type: Boolean, default: false },
  phone: { type: String },
  area: { type: String },
  bio: { type: String },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  isVerifiedPro: { type: Boolean, default: false },
  proPlanId: { type: String, default: null },
  proUpgradedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'user' });

module.exports = mongoose.model('User', userSchema);