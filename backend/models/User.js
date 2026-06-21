// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },

  // Student-specific fields
  studentId: { type: String, trim: true },
  rollNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  batch: { type: String, trim: true },
  semester: { type: String, trim: true },
  section: { type: String, trim: true },
  phone: { type: String, trim: true },
  dateOfBirth: { type: String, trim: true },
  address: { type: String, trim: true },
  parentName: { type: String, trim: true },
  parentPhone: { type: String, trim: true },
  bloodGroup: { type: String, trim: true }

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare input password with hashed password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
