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
}, { timestamps: true, collection: 'user' });

module.exports = mongoose.model('User', userSchema);