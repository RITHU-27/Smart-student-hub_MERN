const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

// Import middleware
const { authenticateUser, authorizeRole } = require('./middleware/authMiddleware');

// Create Express app
const app = express();

// Middleware - MUST BE BEFORE ROUTES
app.use(cors({
  origin: [
    'https://smart-student-hub-mern-git-main-rithanyaa-v-s-projects.vercel.app',
    'https://smart-student-hub-mern.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for uploaded certificates)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Student Hub API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      achievements: '/api/achievements',
      test: '/api/test',
      'test-auth': '/api/test-auth',
      'test-create-profile': '/api/test/create-profile',
      'test-get-profile': '/api/test/get-profile',
      'test-create-faculty': '/api/test/create-faculty',
      'test-create-student': '/api/test/create-student',
      'test-get-profile-dynamic': '/api/test/get-profile-dynamic',
      'test-achievements-dynamic': '/api/test/achievements-dynamic',
      'test-create-achievement-dynamic': '/api/test/create-achievement-dynamic',
      'test-upload-achievement': '/api/test/upload-achievement',
      'test-check-users': '/api/test/check-users'
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date(),
    status: 'success',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'
  });
});

// Test authentication route
app.get('/api/test-auth', authenticateUser, (req, res) => {
  res.json({
    message: 'Authentication successful!',
    userId: req.userId,
    role: req.userRole,
    authenticated: true
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);

// ================= DIRECT ACHIEVEMENT ROUTES =================
// Direct endpoint for student to get own achievements
app.get('/api/achievements/mine', authenticateUser, async (req, res) => {
  try {
    // Only allow students
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Student = require('./models/Student');
    const Achievement = require('./models/Achievement');
    
    // Find student profile
    const student = await Student.findOne({ user: req.userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Get achievements
    const achievements = await Achievement.find({ student: student._id })
      .sort({ createdAt: -1 });
    
    res.json({
      message: 'Achievements fetched successfully',
      achievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct endpoint to get faculty department achievements
app.get('/api/achievements/for-faculty', authenticateUser, async (req, res) => {
  try {
    // Only allow faculty
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const Achievement = require('./models/Achievement');
    
    // Find faculty profile
    const faculty = await Faculty.findOne({ user: req.userId });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }
    
    // Log for debugging
    console.log('Faculty Department:', faculty.department);
    
    // Get students in this department
    const students = await Student.find({ department: faculty.department }).select('_id');
    console.log('Students in department:', students.length);
    
    const studentIds = students.map(s => s._id);
    
    // Get achievements for these students
    const achievements = await Achievement.find({ student: { $in: studentIds } })
      .populate({ 
        path: 'student', 
        select: 'user department batch semester', 
        populate: { path: 'user', select: 'name email' } 
      })
      .sort({ createdAt: -1 });
    
    console.log('Found achievements:', achievements.length);
    
    res.json({
      message: 'Department achievements fetched successfully',
      count: achievements.length,
      achievements
    });
  } catch (error) {
    console.error('Error fetching faculty achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faculty profile endpoint
app.get('/api/faculty/profile', authenticateUser, async (req, res) => {
  try {
    // Only allow faculty
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied. Only faculty can access this endpoint.' });
    }
    
    const Faculty = require('./models/Faculty');
    const User = require('./models/User');
    
    // Find faculty profile
    const faculty = await Faculty.findOne({ user: req.userId })
      .populate('user', 'name email');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }
    
    console.log('✅ Faculty profile loaded:', {
      _id: faculty._id,
      name: faculty.user?.name,
      email: faculty.user?.email,
      department: faculty.department
    });
    
    res.json({
      message: 'Faculty profile fetched successfully',
      _id: faculty._id,
      name: faculty.user?.name,
      email: faculty.user?.email,
      department: faculty.department,
      specialization: faculty.specialization,
      phone: faculty.phone,
      office: faculty.office,
      joinDate: faculty.joinDate
    });
  } catch (error) {
    console.error('❌ Error fetching faculty profile:', error);
    res.status(500).json({ 
      message: 'Error fetching faculty profile', 
      error: error.message 
    });
  }
});

// Direct endpoint to verify achievement
app.put('/api/achievements/:id/verify', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Check authorization
    if (req.userRole !== 'faculty' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only faculty or admin can verify achievements' });
    }
    
    // Get models
    const Achievement = require('./models/Achievement');
    const User = require('./models/User');
    const Student = require('./models/Student');
    
    // Get faculty info
    const facultyUser = await User.findById(req.userId);
    const facultyName = facultyUser ? facultyUser.name : 'Faculty Member';
    
    console.log('Faculty verifying achievement:', facultyName);
    
    // Find achievement
    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    // Update achievement
    achievement.verificationStatus = status;
    achievement.verifiedBy = req.userId;
    achievement.verifiedByName = facultyName;
    achievement.verificationDate = new Date();
    
    if (reason) {
      achievement.rejectionReason = reason;
    }
    
    await achievement.save();
    console.log(`Achievement ${id} status updated to: ${status}`);
    
    // Send email notification
    try {
      // Get student information
      const student = await Student.findById(achievement.student).populate('user');
      
      if (student && student.user) {
        const { sendApprovalEmail, sendRejectionEmail } = require('./services/emailService');
        
        if (status === 'approved') {
          await sendApprovalEmail(
            student.user.email,
            achievement.title,
            student.user.name,
            facultyName
          );
          console.log(`📧 Approval email sent to ${student.user.email}`);
        } else if (status === 'rejected') {
          await sendRejectionEmail(
            student.user.email,
            achievement.title, 
            student.user.name,
            reason,
            facultyName
          );
          console.log(`📧 Rejection email sent to ${student.user.email}`);
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
});

// Create achievement endpoint for student
app.post('/api/achievements', authenticateUser, async (req, res) => {
  try {
    // Only students can create achievements
    if (req.userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can create achievements' });
    }
    
    const Student = require('./models/Student');
    const Achievement = require('./models/Achievement');
    
    // Get student profile
    const student = await Student.findOne({ user: req.userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Create achievement
    const achievement = new Achievement({
      student: student._id,
      title: req.body.title,
      category: req.body.category,
      subCategory: req.body.subCategory,
      description: req.body.description,
      date: req.body.date,
      organization: req.body.organization,
      level: req.body.level,
      studentActivityPoints: req.body.credits || 0,
      certificateUrl: req.body.certificateUrl,
      verificationStatus: 'pending'
    });
    
    await achievement.save();
    
    // Update student's achievements array
    if (!student.achievements) {
      student.achievements = [];
    }
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
});

// ================ DYNAMIC ROUTES FOR STUDENT/FACULTY DASHBOARDS ================

// Dynamic test route to get profile based on logged-in user's email
app.get('/api/test/get-profile-dynamic', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const User = require('./models/User');
    
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let student = await Student.findOne({ user: user._id })
      .populate('user', 'name email role');
    
    if (!student) {
      // Create a new profile if it doesn't exist
      student = new Student({
        user: user._id,
        studentId: `STU${Date.now()}`,
        department: 'Not Specified',
        batch: new Date().getFullYear().toString(),
        semester: 1,
        section: 'A',
        rollNumber: `ROLL${Date.now()}`,
        phone: '0000000000',
        cgpa: 0,
        attendance: 0
      });
      
      await student.save();
      
      student = await Student.findById(student._id)
        .populate('user', 'name email role');
    }
    
    res.json({
      message: 'Profile fetched successfully',
      student
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching profile', 
      error: error.message 
    });
  }
});

// Dynamic test route to get achievements based on logged-in user's email
app.get('/api/test/achievements-dynamic', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Achievement = require('./models/Achievement');
    
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const student = await Student.findOne({ user: user._id });
    if (!student) {
      return res.json({ 
        message: 'No student profile found', 
        achievements: [] 
      });
    }
    
    const achievements = await Achievement.find({ student: student._id })
      .sort({ date: -1 });
    
    res.json({
      message: 'Achievements fetched successfully',
      count: achievements.length,
      achievements
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching achievements', 
      error: error.message 
    });
  }
});

// Dynamic test route to create achievement for specific user
app.post('/api/test/create-achievement-dynamic', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Achievement = require('./models/Achievement');
    const { calculateActivityPoints } = require('./utils/activityPointsCalculator');
    
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const student = await Student.findOne({ user: user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Calculate activity points automatically
    const calculatedCredits = calculateActivityPoints(
      req.body.category,
      req.body.subCategory,
      req.body.level
    );
    
    // Create achievement with calculated points
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
    student.achievements.push(achievement._id);
    await student.save();
    
    res.status(201).json({
      message: 'Achievement created successfully',
      achievement
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating achievement', 
      error: error.message 
    });
  }
});

// ================ CERTIFICATE UPLOAD WITH LOCAL STORAGE ================

// Import upload middleware and verification service
const upload = require('./middleware/uploadMiddleware');
const CertificateVerificationService = require('./services/certificateVerification');

// Upload achievement with certificate
app.post('/api/test/upload-achievement', upload.single('certificate'), async (req, res) => {
  try {
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Achievement = require('./models/Achievement');
    const { calculateActivityPoints } = require('./utils/activityPointsCalculator');
    
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const student = await Student.findOne({ user: user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Calculate activity points automatically
    const calculatedCredits = calculateActivityPoints(
      req.body.category,
      req.body.subCategory,
      req.body.level
    );
    
    // Prepare achievement data with calculated points
    const achievementData = {
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
    };
    
    // If certificate file uploaded
    if (req.file) {
      achievementData.certificateFile = {
        filename: req.file.filename,
        path: `/uploads/certificates/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
      
      // Verify certificate
      const verification = await CertificateVerificationService.verifyCertificate(
        req.file.path,
        req.body.certificateUrl
      );
      
      achievementData.verification = {
        isVerified: verification.isVerified,
        platform: verification.platform,
        hasQRCode: verification.hasQRCode,
        verifiedAt: verification.isVerified ? new Date() : null
      };
      
      // Auto-approve if verified from major platform
      if (verification.isVerified && verification.platform) {
        achievementData.verificationStatus = 'approved';
        achievementData.verificationDate = new Date();
      }
    }
    
    const achievement = new Achievement(achievementData);
    await achievement.save();
    
    student.achievements.push(achievement._id);
    await student.save();
    
    res.status(201).json({
      message: 'Achievement created successfully',
      achievement,
      certificateUrl: achievementData.certificateFile?.path
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error creating achievement', 
      error: error.message 
    });
  }
});

// Get achievements (secured) - admins get all, faculty get department-scoped
app.get('/api/test/all-achievements', authenticateUser, async (req, res) => {
  try {
    const Achievement = require('./models/Achievement');
    const Student = require('./models/Student');

    // Admins can fetch all achievements
    if (req.userRole === 'admin') {
      const achievements = await Achievement.find()
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        })
        .sort({ createdAt: -1 });

      return res.json({
        message: 'All achievements fetched (admin)',
        count: achievements.length,
        achievements: achievements.map(ach => ({
          ...ach.toObject(),
          studentName: ach.student?.user?.name || 'Unknown',
          studentEmail: ach.student?.user?.email || 'Unknown'
        }))
      });
    }

    // Faculty can fetch only achievements for their department
    if (req.userRole === 'faculty') {
      const Faculty = require('./models/Faculty');
      const faculty = await Faculty.findOne({ user: req.userId });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      // Get students in this department
      const students = await Student.find({ department: faculty.department }).select('_id');
      const studentIds = students.map(s => s._id);

      const achievements = await Achievement.find({ student: { $in: studentIds } })
        .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
        .sort({ createdAt: -1 });

      return res.json({
        message: 'Achievements for faculty department fetched',
        count: achievements.length,
        achievements: achievements.map(ach => ({
          ...ach.toObject(),
          studentName: ach.student?.user?.name || 'Unknown',
          studentEmail: ach.student?.user?.email || 'Unknown'
        }))
      });
    }

    // Other roles are not allowed
    return res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    console.error('Error in all-achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
});

// Get top performing students (for all authenticated users)
app.get('/api/test/top-students', authenticateUser, async (req, res) => {
  try {
    const Achievement = require('./models/Achievement');
    const Student = require('./models/Student');

    let achievements;
    
    // Admins can see all achievements
    if (req.userRole === 'admin') {
      achievements = await Achievement.find()
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        })
        .sort({ createdAt: -1 });
    }
    // Faculty can see achievements from their department
    else if (req.userRole === 'faculty') {
      const Faculty = require('./models/Faculty');
      const faculty = await Faculty.findOne({ user: req.userId });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

      const students = await Student.find({ department: faculty.department }).select('_id');
      const studentIds = students.map(s => s._id);

      achievements = await Achievement.find({ student: { $in: studentIds } })
        .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
        .sort({ createdAt: -1 });
    }
    // Students can see all achievements for leaderboard purposes (anonymized or limited data)
    else if (req.userRole === 'student') {
      achievements = await Achievement.find({ verificationStatus: 'approved' }) // Only approved achievements
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        })
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate top students
    const studentMap = {};
    
    achievements.forEach(ach => {
      if (!ach.student || !ach.student.user) return;
      
      const studentId = ach.student._id;
      const studentActivityPoints = ach.credits || 0;
      
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          id: studentId,
          name: ach.student.user.name,
          email: req.userRole === 'admin' ? ach.student.user.email : '', // Hide email from students
          department: ach.student.department || 'Not specified',
          studentActivityPoints: 0,
          achievements: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }
      
      studentMap[studentId].studentActivityPoints += studentActivityPoints;
      studentMap[studentId].achievements += 1;
      
      if (ach.verificationStatus === 'approved') {
        studentMap[studentId].approved += 1;
      } else if (ach.verificationStatus === 'pending') {
        studentMap[studentId].pending += 1;
      } else if (ach.verificationStatus === 'rejected') {
        studentMap[studentId].rejected += 1;
      }
    });
    
    // Convert to array and sort by student activity points (descending)
    const topStudents = Object.values(studentMap)
      .sort((a, b) => b.studentActivityPoints - a.studentActivityPoints)
      .slice(0, 20); // Show top 20 students

    res.json({
      message: 'Top students fetched successfully',
      count: topStudents.length,
      achievements: topStudents
    });
  } catch (error) {
    console.error('Error in top-students:', error);
    res.status(500).json({ message: 'Error fetching top students', error: error.message });
  }
});

// Test route to check existing users
app.get('/api/test/check-users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('email name role');
    res.json({ 
      users: users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Test route to reset password
app.post('/api/test/reset-password', async (req, res) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const { email, newPassword } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// ================ ADMIN ROUTES ================

// Create faculty user
app.post('/api/test/create-faculty', async (req, res) => {
  try {
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const bcrypt = require('bcryptjs');
    
    const { name, email, password, department, specialization } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password || 'faculty123', 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'faculty'
    });
    
    await user.save();
    
    // Create faculty profile
    const faculty = new Faculty({
      user: user._id,
      department: department || 'COMPUTER SCIENCE',
      specialization: specialization || 'Software Engineering',
      phone: '0000000000',
      office: 'Room 101',
      joinDate: new Date()
    });
    
    await faculty.save();
    
    console.log('✅ Faculty user created:', { name, email, department });
    
    res.status(201).json({ 
      message: 'Faculty user created successfully', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      faculty: {
        _id: faculty._id,
        department: faculty.department,
        specialization: faculty.specialization
      }
    });
  } catch (error) {
    console.error('❌ Error creating faculty user:', error);
    res.status(500).json({ message: 'Error creating faculty user', error: error.message });
  }
});

// Create test students for attendance
app.post('/api/test/create-students', async (req, res) => {
  try {
    const User = require('./models/User');
    const Student = require('./models/Student');
    const bcrypt = require('bcryptjs');
    
    const { department = 'COMPUTER SCIENCE', semester = 3, batch = '2024', count = 5 } = req.body;
    
    const createdStudents = [];
    
    for (let i = 1; i <= count; i++) {
      const studentName = `Test Student ${i}`;
      const studentEmail = `student${i}@test.com`;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: studentEmail });
      if (existingUser) {
        console.log(`⚠️ Student ${studentEmail} already exists, skipping...`);
        continue;
      }
      
      // Create user
      const hashedPassword = await bcrypt.hash('student123', 10);
      const user = new User({
        name: studentName,
        email: studentEmail,
        password: hashedPassword,
        role: 'student'
      });
      
      await user.save();
      
      // Create student profile
      const student = new Student({
        user: user._id,
        studentId: `STU${Date.now()}${i}`,
        department,
        batch,
        semester,
        section: 'A',
        rollNumber: `${department.substring(0, 3).toUpperCase()}${semester}${String(i).padStart(3, '0')}`,
        phone: '0000000000',
        cgpa: 0,
        attendance: 0
      });
      
      await student.save();
      
      createdStudents.push({
        name: studentName,
        email: studentEmail,
        rollNumber: student.rollNumber,
        department,
        semester,
        batch
      });
    }
    
    console.log(`✅ Created ${createdStudents.length} test students`);
    
    res.status(201).json({ 
      message: 'Test students created successfully', 
      count: createdStudents.length,
      students: createdStudents
    });
  } catch (error) {
    console.error('❌ Error creating test students:', error);
    res.status(500).json({ message: 'Error creating test students', error: error.message });
  }
});

// Create test student
app.post('/api/test/create-student', async (req, res) => {
  try {
    const { name, email, password, department, rollNumber, semester, batch } = req.body;
    
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const User = require('./models/User');
    const Student = require('./models/Student');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create user
    const user = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: 'student'
    });
    
    await user.save();
    
    // Create student profile
    const generatedStudentId = rollNumber || `CS${semester || 1}001`;
    console.log('🔧 Creating student with studentId:', generatedStudentId);
    console.log('🔧 All fields:', { name, email, department, rollNumber, semester, batch });
    
    // Check if studentId already exists
    const existingStudent = await Student.findOne({ studentId: generatedStudentId });
    if (existingStudent) {
      // Generate unique ID with timestamp
      const uniqueId = `CS${semester || 1}${Date.now().toString().slice(-4)}`;
      console.log('🔧 StudentId exists, using unique ID:', uniqueId);
      
      const newStudent = new Student({
        user: user._id,
        studentId: uniqueId,
        department: department || 'COMPUTER SCIENCE',
        rollNumber: rollNumber || uniqueId,
        semester: Number(semester) || 1,
        batch: batch || '2024',
        section: 'A',
        phone: '0000000000',
        cgpa: 0,
        attendance: 0
      });
      
      console.log('🔧 Student object before save:', JSON.stringify(newStudent, null, 2));
      await newStudent.save();
    } else {
      const newStudent = new Student({
        user: user._id,
        studentId: generatedStudentId,
        department: department || 'COMPUTER SCIENCE',
        rollNumber: rollNumber || generatedStudentId,
        semester: Number(semester) || 1,
        batch: batch || '2024',
        section: 'A',
        phone: '0000000000',
        cgpa: 0,
        attendance: 0
      });
      
      console.log('🔧 Student object before save:', JSON.stringify(newStudent, null, 2));
      await newStudent.save();
    }
    
    console.log('✅ Student user created:', { name, email, department });
    
    res.status(201).json({ 
      message: 'Student user created successfully', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      student: {
        _id: newStudent._id,
        department: newStudent.department,
        rollNumber: newStudent.rollNumber
      }
    });
  } catch (error) {
    console.error('❌ Error creating student user:', error);
    res.status(500).json({ message: 'Error creating student user', error: error.message });
  }
});

// Get faculty statistics for attendance
app.get('/api/test/faculty-stats', authenticateUser, async (req, res) => {
  try {
    if (req.userRole !== 'faculty') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const Attendance = require('./models/Attendance');
    
    const faculty = await Faculty.findOne({ user: req.userId });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }
    
    // Get students in department
    const students = await Student.find({ department: faculty.department });
    const studentCount = students.length;
    
    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          department: faculty.department,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      faculty: {
        name: faculty.user?.name || 'Unknown',
        department: faculty.department,
        studentCount
      },
      attendanceStats,
      message: 'Faculty statistics fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching faculty stats:', error);
    res.status(500).json({ message: 'Error fetching faculty stats', error: error.message });
  }
});

// Create admin user
app.post('/api/test/create-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await User.findOne({ email: 'admin@college.com' });
    if (existingAdmin) {
      return res.json({ message: 'Admin user already exists', user: existingAdmin });
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@college.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    res.status(201).json({ message: 'Admin user created successfully', user: adminUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
});

// Get system statistics for admin
app.get('/api/admin/statistics', async (req, res) => {
  try {
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Achievement = require('./models/Achievement');
    
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalAchievements = await Achievement.countDocuments();
    const pendingAchievements = await Achievement.countDocuments({ verificationStatus: 'pending' });
    const approvedAchievements = await Achievement.countDocuments({ verificationStatus: 'approved' });
    const rejectedAchievements = await Achievement.countDocuments({ verificationStatus: 'rejected' });
    
    const achievements = await Achievement.find({ verificationStatus: 'approved' });
    const totalCredits = achievements.reduce((sum, ach) => sum + (ach.credits || 0), 0);
    
    const recentAchievements = await Achievement.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });
    
    res.json({
      statistics: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAchievements,
        pendingAchievements,
        approvedAchievements,
        rejectedAchievements,
        totalCredits
      },
      recentAchievements
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get all users for admin
app.get('/api/admin/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const Student = require('./models/Student');
    
    const users = await User.find().select('-password');
    
    const usersWithProfiles = await Promise.all(users.map(async (user) => {
      if (user.role === 'student') {
        const studentProfile = await Student.findOne({ user: user._id })
          .select('studentId department batch semester');
        return {
          ...user.toObject(),
          studentProfile
        };
      }
      return user;
    }));
    
    res.json({ users: usersWithProfiles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Export achievements to PDF
app.get('/api/admin/export-achievements', async (req, res) => {
  try {
    const Achievement = require('./models/Achievement');
    
    const achievements = await Achievement.find()
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });
    
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=achievements-report.pdf');
    
    doc.pipe(res);
    
    // PDF content generation...
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Smart Student Hub', { align: 'center' })
       .fontSize(18)
       .text('Achievements Report', { align: 'center' })
       .moveDown()
       .fontSize(12)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
       .moveDown(2);
    
    const totalAchievements = achievements.length;
    const approved = achievements.filter(a => a.verificationStatus === 'approved').length;
    const pending = achievements.filter(a => a.verificationStatus === 'pending').length;
    const rejected = achievements.filter(a => a.verificationStatus === 'rejected').length;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Summary Statistics:')
       .fontSize(12)
       .font('Helvetica')
       .text(`Total Achievements: ${totalAchievements}`)
       .text(`Approved: ${approved}`)
       .text(`Pending: ${pending}`)
       .text(`Rejected: ${rejected}`)
       .moveDown(2);

    // Add achievements...
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Achievement Details:')
       .moveDown();

    achievements.forEach((achievement, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(`${index + 1}. ${achievement.title}`)
         .fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text(`Student: ${achievement.student?.user?.name || 'Unknown'} (${achievement.student?.user?.email || 'N/A'})`)
         .text(`Category: ${achievement.category} | Level: ${achievement.level}`)
         .text(`Organization: ${achievement.organization || 'N/A'}`)
         .text(`Date: ${new Date(achievement.date).toLocaleDateString()}`)
         .text(`Status: ${achievement.verificationStatus.toUpperCase()}`)
         .text(`Student Activity Points: ${achievement.credits}`)
         .fillColor('#000000')
         .moveDown();
         
      if (achievement.description) {
        doc.fontSize(10)
           .text(`Description: ${achievement.description}`)
           .moveDown();
      }
      
      // Add a separator
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown();
    });
    
    doc.end();
    
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// ================ OTHER TEST ROUTES ================

// Create faculty user
app.post('/api/test/create-faculty', async (req, res) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const existingFaculty = await User.findOne({ email: 'faculty@college.com' });
    if (existingFaculty) {
      return res.json({ message: 'Faculty user already exists', user: existingFaculty });
    }
    
    const hashedPassword = await bcrypt.hash('faculty123', 10);
    const facultyUser = new User({
      name: 'Dr. Smith',
      email: 'faculty@college.com',
      password: hashedPassword,
      role: 'faculty'
    });
    
    await facultyUser.save();
    res.status(201).json({ message: 'Faculty user created successfully', user: facultyUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating faculty user', error: error.message });
  }
});

// Test routes for default test user
app.post('/api/test/create-profile', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const User = require('./models/User');
    
    const user = await User.findOne({ email: 'test@student.com' });
    if (!user) {
      return res.status(404).json({ message: 'Test user not found. Please login first.' });
    }
    
    let student = await Student.findOne({ user: user._id });
    if (student) {
      return res.json({ message: 'Profile already exists', student });
    }
    
    student = new Student({
      user: user._id,
      studentId: 'STU2024001',
      department: 'COMPUTER SCIENCE AND ENGINEERING',
      batch: '2024',
      semester: 1,
      section: 'A',
      rollNumber: '001',
      phone: '9876543210',
      cgpa: 0,
      attendance: 0
    });
    
    await student.save();
    res.status(201).json({ message: 'Profile created successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error creating profile', error: error.message });
  }
});

app.get('/api/test/get-profile', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const User = require('./models/User');
    
    const user = await User.findOne({ email: 'test@student.com' });
    if (!user) {
      return res.status(404).json({ message: 'Test user not found' });
    }
    
    const student = await Student.findOne({ user: user._id })
      .populate('user', 'name email role');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found. Create one first.' });
    }
    
    res.json({ message: 'Profile fetched successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Demo data population endpoint
app.post('/api/test/populate-demo-data', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const Achievement = require('./models/Achievement');
    const User = require('./models/User');
    
    // Find a student to add achievements to
    const user = await User.findOne({ role: 'student' }).limit(1);
    if (!user) {
      return res.status(404).json({ message: 'No student found to add demo data' });
    }
    
    const student = await Student.findOne({ user: user._id });
    if (!student) {
      return res.status(404).json({ message: 'No student profile found' });
    }
    
    // Demo achievements
    const demoAchievements = [
      { 
        title: 'First Place - National Hackathon 2024', 
        category: 'competition', 
        subCategory: 'technical',
        description: 'Won first place in 48-hour national level hackathon',
        studentActivityPoints: 5,
        level: 'national',
        organization: 'Tech Ministry',
        date: new Date('2024-03-15')
      },
      { 
        title: 'Research Paper Published - AI in Healthcare', 
        category: 'academic', 
        subCategory: 'research',
        description: 'Published research paper in International Journal',
        studentActivityPoints: 10,
        level: 'international',
        organization: 'IEEE',
        date: new Date('2024-02-20')
      },
      { 
        title: 'Community Service - Teaching Underprivileged', 
        category: 'social', 
        subCategory: 'volunteer',
        description: 'Conducted computer literacy program for 100+ students',
        studentActivityPoints: 3,
        level: 'state',
        organization: 'NGO Foundation',
        date: new Date('2024-01-10')
      },
      {
        title: 'Best Student Award - Academic Excellence',
        category: 'academic',
        subCategory: 'award',
        description: 'Awarded for maintaining 9.5+ CGPA',
        studentActivityPoints: 4,
        level: 'college',
        organization: 'University',
        date: new Date('2024-04-01')
      },
      {
        title: 'Sports Championship - Basketball',
        category: 'sports',
        subCategory: 'tournament',
        description: 'Led college team to state championship',
        studentActivityPoints: 3,
        level: 'state',
        organization: 'State Sports Board',
        date: new Date('2024-03-25')
      }
    ];
    
    // Create achievements
    const createdAchievements = [];
    for (const achData of demoAchievements) {
      const achievement = new Achievement({
        ...achData,
        student: student._id,
        verificationStatus: ['pending', 'approved', 'approved', 'pending', 'approved'][Math.floor(Math.random() * 3)]
      });
      await achievement.save();
      createdAchievements.push(achievement._id);
    }
    
    // Update student's achievements array
    student.achievements.push(...createdAchievements);
    await student.save();
    
    res.json({ 
      message: 'Demo data populated successfully!', 
      achievementsAdded: demoAchievements.length,
      studentName: user.name 
    });
    
  } catch (error) {
    console.error('Demo data error:', error);
    res.status(500).json({ message: 'Error populating demo data', error: error.message });
  }
});
// Admin endpoint to get all pending achievements
app.get('/api/admin/pending-achievements', authenticateUser, async (req, res) => {
  try {
    // Only allow admins
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Achievement = require('./models/Achievement');
    
    // Get all pending achievements
    const achievements = await Achievement.find({ verificationStatus: 'pending' })
      .populate({
        path: 'student',
        select: 'department batch semester',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${achievements.length} pending achievements for admin`);
    
    res.json({
      message: 'Pending achievements fetched successfully',
      count: achievements.length,
      achievements
    });
  } catch (error) {
    console.error('Error fetching admin achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint to get all achievements
app.get('/api/admin/all-achievements', authenticateUser, async (req, res) => {
  try {
    // Only allow admins
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Achievement = require('./models/Achievement');
    
    // Get all achievements
    const achievements = await Achievement.find()
      .populate({
        path: 'student',
        select: 'department batch semester',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${achievements.length} total achievements for admin`);
    
    res.json({
      message: 'All achievements fetched successfully',
      count: achievements.length,
      achievements
    });
  } catch (error) {
    console.error('Error fetching admin achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Emergency password reset route
app.get('/api/emergency-reset/:email', async (req, res) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const email = req.params.email;
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Set a simple password
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Update directly in database
    await User.updateOne(
      { _id: user._id }, 
      { $set: { password: hashedPassword }}
    );
    
    res.json({ 
      message: 'Password reset to "123456"', 
      email,
      success: true
    });
  } catch (error) {
    console.error('Emergency reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force login route
app.post('/api/force-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = require('./models/User');
    const jwt = require('jsonwebtoken');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate token (bypassing password verification)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Force login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Force login error:', error);
    res.status(500).json({ message: 'Error during force login', error: error.message });
  }
});

// Debug route to check all users
app.get('/api/users-list', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('email name role');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error getting users', error: error.message });
  }
});

// Test email route
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendApprovalEmail } = require('./services/emailService');
    
    // Get email address from query parameter or use EMAIL_USER
    const testEmail = req.query.email || process.env.EMAIL_USER;
    
    console.log('📧 Email configuration:');
    console.log('- EMAIL_USER:', process.env.EMAIL_USER || 'not set');
    console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'is set' : 'not set');
    console.log('- Test recipient:', testEmail);
    
        const result = await sendApprovalEmail(
      testEmail,
      'Test Achievement for Smart Student Hub',
      'Test Student',
      'System Faculty'
    );
    
    if (result) {
      res.json({ 
        success: true, 
        message: `✅ Test email sent successfully! Check inbox (${testEmail})`
      });
    } else {
      res.status(500).json({
        success: false,
        message: '❌ Failed to send test email. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-student-hub')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 API Endpoints:`);
  console.log(`  Auth: http://localhost:${PORT}/api/auth`);
  console.log(`  Students: http://localhost:${PORT}/api/students`);
  console.log(`  Achievements: http://localhost:${PORT}/api/achievements`);
  console.log(`  Test: http://localhost:${PORT}/api/test`);
  console.log(`  Profile Dynamic: http://localhost:${PORT}/api/test/get-profile-dynamic`);
  console.log(`  Achievements Dynamic: http://localhost:${PORT}/api/test/achievements-dynamic`);
  console.log(`  Upload Achievement: http://localhost:${PORT}/api/test/upload-achievement`);
  console.log(`  Admin Statistics: http://localhost:${PORT}/api/admin/statistics`);
  console.log(`  Admin Users: http://localhost:${PORT}/api/admin/users`);
  console.log(`  Export PDF: http://localhost:${PORT}/api/admin/export-achievements`);
  console.log(`  Check Users: http://localhost:${PORT}/api/test/check-users`);
  console.log(`  Uploaded Files: http://localhost:${PORT}/uploads`);
});
