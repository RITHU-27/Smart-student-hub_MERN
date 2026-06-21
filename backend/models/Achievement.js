const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  organization: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['college', 'university', 'state', 'national', 'international'],
    default: 'college'
  },
  credits: {
    type: Number,
    default: 0
  },
  certificateUrl: {
    type: String,
    trim: true
  },
  certificateFile: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  verification: {
    isVerified: Boolean,
    platform: String,
    hasQRCode: Boolean,
    verifiedAt: Date
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationDate: {
    type: Date
  },
  // New fields for faculty verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedByName: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
