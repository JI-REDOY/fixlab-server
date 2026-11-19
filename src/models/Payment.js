const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  serviceTitle: { type: String },
  customerName: { type: String },
  customerEmail: { type: String },
  technicianName: { type: String },
  technicianEmail: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  transactionId: { type: String, required: true },
  stripeSessionId: { type: String, required: true, unique: true },
  paymentStatus: { type: String, default: 'paid' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);