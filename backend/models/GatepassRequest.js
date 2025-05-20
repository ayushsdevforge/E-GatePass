const mongoose = require('mongoose');

const gatepassRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tg: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  ticketId: { type: String, default: null }, // Remove unique constraint to avoid duplicate key errors
  status: { type: String, enum: ['pending', 'forwarded', 'approved', 'rejected'], default: 'pending' },
  forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  forwardedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // New fields for gatepass token and QR code
  gatepassToken: { type: String },
  gatepassTokenExpiry: { type: Date },
  qrCodeUrl: { type: String }
});

module.exports = mongoose.model('GatepassRequest', gatepassRequestSchema); 