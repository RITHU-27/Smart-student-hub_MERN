const express = require('express');
const router = express.Router();
const {
  createAchievement,
  getAchievements,
  getAchievementsForFaculty,
  verifyAchievement
} = require('../controllers/achievementController');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.post('/', authorizeRole('student'), createAchievement);
router.get('/mine', authorizeRole('student'), getAchievements);
router.get('/for-faculty', authorizeRole('faculty'), getAchievementsForFaculty);
router.put('/:id/verify', authorizeRole('faculty', 'admin'), verifyAchievement);

module.exports = router;
// backend/controllers/achievementController.js

// Add this if it doesn't exist
exports.verifyAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Get the faculty/admin user who is approving
    const User = require('../models/User');
    const Faculty = require('../models/Faculty');
    const Student = require('../models/Student');
    const Achievement = require('../models/Achievement');
    
    // Find the achievement
    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    // Get faculty info
    const facultyUser = await User.findById(req.userId);
    const facultyName = facultyUser ? facultyUser.name : 'Faculty Member';
    
    // Update achievement status
    achievement.verificationStatus = status;
    achievement.verifiedBy = req.userId;
    achievement.verifiedByName = facultyName;
    
    if (reason) {
      achievement.rejectionReason = reason;
    }
    
    achievement.verificationDate = new Date();
    await achievement.save();
    
    // Send email notification
    try {
      // Get student information
      const student = await Student.findById(achievement.student).populate('user');
      
      if (student && student.user) {
        const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');
        
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
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Continue even if email fails
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
