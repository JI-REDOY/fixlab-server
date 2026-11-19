const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  basePrice: { type: Number, required: true },
  estimatedDuration: { type: String },
  serviceMode: { type: String, enum: ['Home Visit', 'Shop Drop-off'], required: true },
  serviceArea: { type: String },
  technicianName: { type: String },
  technicianEmail: { type: String, required: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);