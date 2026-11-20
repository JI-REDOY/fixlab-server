const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    currentRole: {
      type: String,
      enum: ['customer', 'technician', 'admin'],
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ['customer', 'technician'],
      required: true,
    },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoleRequest', roleRequestSchema);