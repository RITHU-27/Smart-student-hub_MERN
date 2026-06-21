const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['club', 'event', 'workshop', 'seminar', 'course', 'other'],
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  duration: String,
  venue: String,
  organizer: String,
  participants: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    role: {
      type: String,
      enum: ['participant', 'organizer', 'volunteer', 'speaker', 'coordinator'],
      default: 'participant'
    }
  }],
  certificateTemplate: String,
  credits: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
