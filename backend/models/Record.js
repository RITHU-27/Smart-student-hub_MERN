const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  activityType: String,
  description: String,
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }, // pending | approved
});

module.exports = mongoose.model('Record', recordSchema);
