// ===== Imports =====
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Achievement = require('../models/Achievement');
const PDFDocument = require('pdfkit');

// ===== Create or Update Profile =====
const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profileData = req.body;

    // Check if profile exists
    let student = await Student.findOne({ user: userId });

    if (student) {
      // Update existing profile
      Object.keys(profileData).forEach(key => {
        if (key !== 'user' && key !== 'achievements' && key !== 'activities') {
          student[key] = profileData[key];
        }
      });

      // If department changed (or present), update faculty link
      if (profileData.department) {
        const facultyForDept = await Faculty.findOne({ department: profileData.department });
        student.faculty = facultyForDept ? facultyForDept._id : null;
      }

      await student.save();
      res.json({ message: 'Profile updated successfully', student });
    } else {
      // Create new profile
      const facultyForDept = profileData.department
        ? await Faculty.findOne({ department: profileData.department })
        : null;

      student = new Student({
        user: userId,
        ...profileData,
        faculty: facultyForDept ? facultyForDept._id : null
      });

      await student.save();
      res.status(201).json({ message: 'Profile created successfully', student });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating/updating profile', error: error.message });
  }
};

// ===== Get Student Profile =====
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const student = await Student.findOne({ user: userId })
      .populate('user', 'name email role')
      .populate('achievements')
      .populate('activities');

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// ===== Get All Students (for admin/faculty) =====
const getAllStudents = async (req, res) => {
  return res.status(403).json({ message: 'Access denied. Faculty can only view their own students.' });
};

// ===== Get Students for Faculty =====
const getStudentsForFaculty = async (req, res) => {
  try {
    const userId = req.userId;
    const faculty = await Faculty.findOne({ user: userId });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    const students = await Student.find({ department: faculty.department })
      .populate('user', 'name email')
      .select('-achievements -activities')
      .lean();

    res.json({ count: students.length, students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty students', error: error.message });
  }
};

// ===== Get Student by ID (for admin/faculty) =====
const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    const student = await Student.findById(studentId)
      .populate('user', 'name email role')
      .populate('achievements')
      .populate('activities');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

// ===== Get Achievements for Logged-in Student =====
const getMyAchievements = async (req, res) => {
  try {
    const userId = req.userId;

    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const achievements = await Achievement.find({ student: student._id }).sort({ date: -1 });
    res.json({ achievements });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
};

// ===== Generate PDF Portfolio =====
const generatePortfolio = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student id' });
    }

    console.log('generatePortfolio: received id=', studentId);

    // Try to find the student
    let student =
      (await Student.findById(studentId).populate('user', 'name email')) ||
      (await Student.findOne({ user: studentId }).populate('user', 'name email')) ||
      (await Student.findOne({ studentId: studentId }).populate('user', 'name email'));

    if (!student) {
      console.warn('No student found for id=', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    // 🧩 Authorization check
    const requesterRole = req.userRole?.toLowerCase();
    const requesterId = req.userId?.toString();

    if (requesterRole === 'admin') {
      // ✅ allowed
    } else if (requesterRole === 'faculty') {
      const faculty = await Faculty.findOne({ user: requesterId });
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty profile not found' });
      }
      if (faculty.department !== student.department) {
        return res.status(403).json({ message: 'Access denied. You can only generate portfolios for students in your department.' });
      }
    } else if (requesterRole === 'student') {
      // ✅ Fix: handle populated user object correctly
      const studentUserId = student.user?._id ? student.user._id.toString() : student.user.toString();
      if (studentUserId !== requesterId) {
        return res.status(403).json({ message: 'Access denied. Students can only generate their own portfolio.' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Fetch achievements
    const achievements = await Achievement.find({ student: student._id }).sort({ date: -1 });

    // Generate PDF
    res.setHeader('Content-Type', 'application/pdf');
    const filename = `portfolio_${student.studentId || student._id}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).text(`${student.user?.name || 'Student Portfolio'}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Email: ${student.user?.email || 'N/A'}`, { align: 'center' });
    doc.moveDown(1);

    // Profile details
    doc.fontSize(14).text('Profile', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Student ID: ${student.studentId || 'N/A'}`);
    doc.text(`Department: ${student.department || 'N/A'}`);
    doc.text(`Batch: ${student.batch || 'N/A'}`);
    doc.text(`Semester: ${student.semester || 'N/A'}`);
    if (student.rollNumber) doc.text(`Roll Number: ${student.rollNumber}`);
    if (student.phone) doc.text(`Phone: ${student.phone}`);
    doc.moveDown(1);

    // Achievements
    doc.fontSize(14).text('Achievements', { underline: true });
    doc.moveDown(0.5);

    if (!achievements || achievements.length === 0) {
      doc.fontSize(11).text('No achievements found');
    } else {
      achievements.forEach((a, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${a.title} (${a.level})`);
        doc.fontSize(10).text(`Category: ${a.category} • Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}`);
        if (a.organization) doc.text(`Organization: ${a.organization}`);
        if (a.credits) doc.text(`Student Activity Points: ${a.credits}`);
        if (a.description) {
          doc.moveDown(0.25);
          doc.fontSize(10).text(a.description, { indent: 20, align: 'left' });
        }
        if (a.certificateUrl) {
          doc.moveDown(0.1);
          doc.fillColor('blue').text(`Certificate URL: ${a.certificateUrl}`, { link: a.certificateUrl, underline: true });
          doc.fillColor('black');
        }
        doc.moveDown(0.8);
      });
    }

    doc.end();
  } catch (error) {
    console.error('generatePortfolio error:', error);
    res.status(500).json({ message: 'Error generating portfolio', error: error.message });
  }
};

// ===== Create Faculty Profile for Logged-in Faculty =====
async function createMyFaculty(req, res) {
  try {
    const userId = req.userId;
    const { department, phone, address } = req.body;

    if (!department || !department.trim()) {
      return res.status(400).json({ message: 'Department is required' });
    }

    const existing = await Faculty.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ message: 'Faculty profile already exists' });
    }

    const deptTaken = await Faculty.findOne({ department: department.trim() });
    if (deptTaken) {
      return res.status(400).json({ message: `Department ${department.trim()} already has an assigned faculty` });
    }

    const faculty = new Faculty({
      user: userId,
      department: department.trim(),
      phone: phone || '',
      address: address || ''
    });

    await faculty.save();

    const updateResult = await Student.updateMany(
      { department: department.trim(), faculty: null },
      { faculty: faculty._id }
    );

    const linked = updateResult.modifiedCount || updateResult.nModified || 0;

    res.status(201).json({ message: 'Faculty profile created', faculty, linkedStudents: linked });
  } catch (error) {
    console.error('createMyFaculty error:', error);
    res.status(500).json({ message: 'Error creating faculty profile', error: error.message });
  }
}

// ===== Export All Functions =====
module.exports = {
  createOrUpdateProfile,
  getProfile,
  getAllStudents,
  getStudentsForFaculty,
  getStudentById,
  getMyAchievements,
  generatePortfolio,
  createMyFaculty
};
