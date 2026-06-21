// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Achievement = require('../models/Achievement');

/* --------------------------------------------------
   🔒 AUTH MIDDLEWARE — protect admin routes
   Assumes server mounts this router under /api/admin
-------------------------------------------------- */
router.use(authenticateUser);
router.use(authorizeRole('faculty', 'admin'));

/* --------------------------------------------------
   /api/admin/statistics
   Return counts used by admin dashboard
-------------------------------------------------- */
router.get('/statistics', async (req, res) => {
  try {
    const pendingCount = await Achievement.countDocuments({ verificationStatus: 'pending' });
    const approvedCount = await Achievement.countDocuments({ verificationStatus: 'approved' });
    const totalStudents = await Student.countDocuments();

    const studentActivityPointsAgg = await Achievement.aggregate([
      { $group: { _id: null, totalStudentActivityPoints: { $sum: { $ifNull: ['$credits', 0] } } } }
    ]);
    const totalStudentActivityPoints = studentActivityPointsAgg[0]?.totalStudentActivityPoints || 0;

    res.json({
      statistics: {
        pendingAchievements: pendingCount,
        approvedAchievements: approvedCount,
        totalStudents,
        totalStudentActivityPoints
      }
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Error fetching statistics', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/students
   Return students with populated user and achievements info
-------------------------------------------------- */
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'name email')
      .populate({
        path: 'achievements',
        select: 'title category verificationStatus date certificateUrl credits description certificateFile organization level'
      })
      .lean();

    const faculties = await Faculty.find().populate('user', 'name').lean();
    const facultyMap = {};
    faculties.forEach((f) => { if (f.department) facultyMap[f.department] = f.user?.name || 'N/A'; });

    const enriched = students.map((s) => ({
      ...s,
      facultyIncharge: facultyMap[s.department] || 'Not Assigned'
    }));

    res.json({ count: enriched.length, students: enriched });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/student/:id
   Return a single student by id
-------------------------------------------------- */
router.get('/student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'achievements',
        select: 'title category verificationStatus date certificateUrl credits description certificateFile organization level'
      })
      .lean();

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const faculty = await Faculty.findOne({ department: student.department }).populate('user', 'name').lean();
    const facultyIncharge = faculty?.user?.name || 'Not Assigned';

    res.json({ student: { ...student, facultyIncharge } });
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Error fetching student', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/faculties
   Return faculties (used by StudentsPage)
-------------------------------------------------- */
router.get('/faculties', async (req, res) => {
  try {
    const faculties = await Faculty.find().populate('user', 'name email').lean();
    res.json({ count: faculties.length, faculties });
  } catch (err) {
    console.error('Error fetching faculties:', err);
    res.status(500).json({ message: 'Error fetching faculties', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/achievements
   Return all achievements (formatted)
-------------------------------------------------- */
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = achievements.map((a) => ({
      _id: a._id,
      title: a.title,
      category: a.category,
      verificationStatus: a.verificationStatus,
      date: a.date,
      level: a.level,
      studentActivityPoints: a.credits,
      certificateUrl: a.certificateUrl,
      certificateFile: a.certificateFile || null,
      student: {
        user: { name: a.student?.user?.name || 'Unknown', email: a.student?.user?.email || 'N/A' },
        department: a.student?.department || 'N/A'
      }
    }));

    res.json({ count: formatted.length, achievements: formatted });
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).json({ message: 'Error fetching achievements', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/all-achievements
   Alias for /achievements used by admin panel
-------------------------------------------------- */
router.get('/all-achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ achievements });
  } catch (err) {
    console.error('Error fetching all achievements:', err);
    res.status(500).json({ message: 'Error fetching achievements', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/pending-achievements
   Return pending achievements (used by AdminPanel)
-------------------------------------------------- */
router.get('/pending-achievements', async (req, res) => {
  try {
    const pending = await Achievement.find({ verificationStatus: 'pending' })
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ achievements: pending });
  } catch (err) {
    console.error('Error fetching pending achievements:', err);
    res.status(500).json({ message: 'Error fetching pending achievements', error: err.message });
  }
});

/* --------------------------------------------------
   GET /api/admin/achievement/:id
   Single achievement details
-------------------------------------------------- */
router.get('/achievement/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .lean();

    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });
    res.json({ achievement });
  } catch (err) {
    console.error('Error fetching achievement:', err);
    res.status(500).json({ message: 'Error fetching achievement', error: err.message });
  }
});

/* --------------------------------------------------
   PUT /api/achievements/:id/verify
   Approve or reject with single endpoint used by frontend
   Body: { status: 'approved'|'rejected'|'pending', reason?: string }
-------------------------------------------------- */
router.put('/achievements/:id/verify', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    achievement.verificationStatus = status;
    achievement.verificationDate = new Date();
    achievement.verifiedBy = req.user._id;

    if (status === 'rejected') achievement.rejectionReason = reason || 'No reason provided';
    if (status === 'approved') achievement.rejectionReason = null;

    await achievement.save();

    // Optionally update student's total student activity points when approved (if your Student model tracks this)
    if (status === 'approved' && achievement.student) {
      try {
        const student = await Student.findById(achievement.student);
        if (student) {
          // ensure numeric addition
          student.totalCredits = (student.totalCredits || 0) + (achievement.credits || 0);
          await student.save();
        }
      } catch (err) {
        console.warn('Failed to update student totalStudentActivityPoints (not fatal):', err.message);
      }
    }

    res.json({ message: 'Achievement updated', achievement });
  } catch (err) {
    console.error('Error verifying achievement:', err);
    res.status(500).json({ message: 'Error verifying achievement', error: err.message });
  }
});

/* --------------------------------------------------
   Export achievements PDF
   GET /api/admin/export-achievements
   Streams a simple PDF back to the client
-------------------------------------------------- */
router.get('/export-achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .lean();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="achievements-report.pdf"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text('Achievements Report', { align: 'center' });
    doc.moveDown(1);

    achievements.forEach((a, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${a.title}`);
      doc.fontSize(10).text(`   Student: ${a.student?.user?.name || 'Unknown'} (${a.student?.user?.email || 'N/A'})`);
      doc.text(`   Department: ${a.student?.department || 'N/A'}`);
      doc.text(`   Category: ${a.category || 'N/A'} | Level: ${a.level || 'N/A'} | Student Activity Points: ${a.credits || 0}`);
      doc.text(`   Status: ${a.verificationStatus || 'N/A'} | Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error('Error exporting achievements:', err);
    res.status(500).json({ message: 'Error exporting achievements', error: err.message });
  }
});

/* --------------------------------------------------
   Generate a student's portfolio PDF
   GET /api/admin/student/:id/portfolio
   Streams back a simple PDF for the student
-------------------------------------------------- */
router.get('/student/:id/portfolio', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'achievements',
        populate: { path: 'student', populate: { path: 'user', select: 'name email' } }
      })
      .lean();

    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${student.user?.name || 'student'}-portfolio.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`${student.user?.name}'s Portfolio`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Email: ${student.user?.email || 'N/A'}`);
    doc.text(`Department: ${student.department || 'N/A'}`);
    doc.text(`Total Student Activity Points: ${student.totalCredits || 0}`);
    doc.moveDown();

    doc.fontSize(14).text('Achievements', { underline: true });
    doc.moveDown(0.5);

    const achievements = student.achievements || [];
    if (achievements.length === 0) {
      doc.fontSize(12).text('No achievements found.');
    } else {
      achievements.forEach((a, i) => {
        doc.fontSize(12).text(`${i + 1}. ${a.title}`);
        doc.fontSize(10).text(`   Category: ${a.category || 'N/A'} | Level: ${a.level || 'N/A'} | Student Activity Points: ${a.credits || 0}`);
        doc.text(`   Status: ${a.verificationStatus || 'N/A'} | Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}`);
        if (a.description) doc.text(`   Description: ${a.description}`);
        doc.moveDown(0.4);
      });
    }

    doc.end();
  } catch (err) {
    console.error('Error generating portfolio PDF:', err);
    res.status(500).json({ message: 'Error generating portfolio', error: err.message });
  }
});

module.exports = router;
