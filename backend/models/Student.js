// backend/models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    trim: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  parentName: {
    type: String,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    trim: true
  },
  cgpa: {
    type: Number,
    default: 0
  },
  attendance: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    trim: true
  },

  // Assigned faculty (department representative)
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },

  // Relationships
  achievements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    }
  ],
  activities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }
  ]
}, { timestamps: true });

// 🔁 Virtual to populate all achievements for this student
studentSchema.virtual('achievementDetails', {
  ref: 'Achievement',
  localField: '_id',
  foreignField: 'student',
  justOne: false
});

// 🧾 Optional virtual for student's full name
studentSchema.virtual('fullName').get(function () {
  if (this.user && this.user.name) return this.user.name;
  return 'Unnamed Student';
});

module.exports = mongoose.model('Student', studentSchema);
