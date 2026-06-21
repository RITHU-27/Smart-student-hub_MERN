const Achievement = require('../models/Achievement');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');
const { calculateActivityPoints } = require('../utils/activityPointsCalculator');


// Create a new achievement (for students)
exports.createAchievement = async (req, res) => {
  try {
    // Get student profile for the logged-in user
    const student = await Student.findOne({ user: req.userId });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Calculate activity points automatically
    const calculatedCredits = calculateActivityPoints(
      req.body.category,
      req.body.subCategory,
      req.body.level
    );
    
    // Create new achievement
    const achievement = new Achievement({
      student: student._id,
      title: req.body.title,
      category: req.body.category,
      subCategory: req.body.subCategory,
      description: req.body.description,
      date: req.body.date,
      organization: req.body.organization,
      level: req.body.level,
      credits: calculatedCredits, // Use calculated points
      certificateUrl: req.body.certificateUrl,
      verificationStatus: 'pending'
    });
    
    await achievement.save();
    
    // Add achievement to student's achievements array
    student.achievements = student.achievements || [];
    student.achievements.push(achievement._id);
    await student.save();
    
    res.status(201).json({
      message: 'Achievement created successfully',
      achievement
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ message: 'Error creating achievement', error: error.message });
  }
};

// Get a student's own achievements
exports.getAchievements = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.userId });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    const achievements = await Achievement.find({ student: student._id })
      .sort({ date: -1 });
      
    res.json({
      achievements,
      count: achievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
};

// Get achievements for faculty's department
exports.getAchievementsForFaculty = async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    
    // Find faculty profile for logged in user
    const faculty = await Faculty.findOne({ user: req.userId });
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }
    
    // Find all students in this department
    const students = await Student.find({ department: faculty.department })
      .select('_id user');
      
    const studentIds = students.map(s => s._id);
    
    // Get achievements for these students
    const achievements = await Achievement.find({ student: { $in: studentIds } })
      .populate({
        path: 'student',
        select: 'user department batch semester',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });
      
    res.json({
      message: `Achievements for ${faculty.department} department`,
      count: achievements.length,
      achievements
    });
  } catch (error) {
    console.error('Error fetching faculty achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
};

// Verify an achievement (faculty/admin)
exports.verifyAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Get the faculty/admin user who is approving
    const User = require('../models/User');
    const facultyUser = await User.findById(req.userId);
    const facultyName = facultyUser ? facultyUser.name : 'Faculty Member';
    
    // Find the achievement and student
    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    // Update status
    achievement.verificationStatus = status;
    achievement.verifiedBy = req.userId; // Record who verified it
    achievement.verifiedByName = facultyName; // Store verifier name
    
    if (reason) {
      achievement.rejectionReason = reason;
    }
    
    achievement.verificationDate = new Date();
    await achievement.save();
    
    // Now get the student's email to send notification
    const student = await Student.findById(achievement.student).populate('user');
    
    if (student && student.user) {
      if (status === 'approved') {
        await sendApprovalEmail(
          student.user.email,
          achievement.title,
          student.user.name,
          facultyName
        );
      } else if (status === 'rejected') {
        await sendRejectionEmail(
          student.user.email,
          achievement.title, 
          student.user.name,
          reason,
          facultyName
        );
      }
    }
    
    res.json({
      message: `Achievement ${status} successfully`,
      achievement
    });
  } catch (error) {
    console.error('Error verifying achievement:', error);
    res.status(500).json({ message: 'Error verifying achievement', error: error.message });
  }
};
