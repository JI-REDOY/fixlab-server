const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  serviceTitle: { type: String },
  serviceImage: { type: String },
  category: { type: String },
  basePrice: { type: Number },
  technicianName: { type: String },
  technicianEmail: { type: String },
  customerName: { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  problemDescription: { type: String, required: true },
  status: { type: String, enum: ['requested', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'], default: 'requested' },
  finalAmount: { type: Number },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
