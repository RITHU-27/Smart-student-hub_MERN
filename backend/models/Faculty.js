// backend/models/Faculty.js
const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    // Reference to the user document (login info)
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    // Department assigned — unique ensures one incharge per department
    department: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },

    // Optional but helpful fields for display
    designation: { 
      type: String, 
      default: 'Faculty'   // 👈 added for better clarity (optional)
    },

    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
