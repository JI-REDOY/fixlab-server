const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['booking', 'subscription'], default: 'booking' },
    planId: { type: String, default: null },
    bookingId: {
      type: String,
      required: function () {
        return this.type === 'booking';
      },
    },
    serviceTitle: { type: String },
    customerName: { type: String },
    customerEmail: { type: String },
    technicianName: { type: String },
    technicianEmail: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    transactionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, index: true },
    stripeSessionId: { type: String, sparse: true },
    paymentStatus: { type: String, default: 'paid' },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);