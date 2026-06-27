// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty'); // ✅ Added faculty model
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const allowedRoles = ['student', 'faculty', 'admin'];

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');

const getMissingFields = (fields, values) => (
  fields.filter((field) => !trimString(values[field]))
);

const duplicateMessage = (err) => {
  const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];

  if (duplicateField === 'email') return 'User already exists';
  if (duplicateField === 'studentId') return 'Student ID already exists';
  if (duplicateField === 'department') return 'Department already has an assigned faculty';
  return 'Duplicate registration detail';
};

/* --------------------------------------------------
   🔐 REGISTER USER (Student, Faculty, Admin)
   Endpoint: POST /api/auth/register
-------------------------------------------------- */
router.post('/register', async (req, res) => {
  let newUser;

  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      department,
      batch,
      semester,
      rollNumber,
      section,
      phone,
      dateOfBirth,
      address,
      parentName,
      parentPhone,
      bloodGroup,
      adminCode
    } = req.body;

    const requestedRole = trimString(role) || 'student';
    const normalizedName = trimString(name);
    const normalizedEmail = trimString(email).toLowerCase();
    const normalizedDepartment = trimString(department);
    const normalizedStudentId = trimString(studentId);
    const normalizedSemester = trimString(semester);
    const normalizedAdminCode = trimString(adminCode);

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const missingCommonFields = getMissingFields(['name', 'email', 'password'], {
      name: normalizedName,
      email: normalizedEmail,
      password
    });

    if (missingCommonFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field${missingCommonFields.length > 1 ? 's' : ''}: ${missingCommonFields.join(', ')}`
      });
    }

    // ✅ Validate Admin Registration Code
    if (requestedRole === 'admin') {
      const correctAdminCode = process.env.ADMIN_CODE || 'ADMIN123';
      if (normalizedAdminCode !== correctAdminCode) {
        return res.status(400).json({ message: 'Invalid Admin Code' });
      }
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (requestedRole === 'student') {
      const missingStudentFields = getMissingFields(['studentId', 'department', 'batch', 'semester'], {
        studentId: normalizedStudentId,
        department: normalizedDepartment,
        batch,
        semester: normalizedSemester
      });

      if (missingStudentFields.length > 0) {
        return res.status(400).json({
          message: `Missing required student field${missingStudentFields.length > 1 ? 's' : ''}: ${missingStudentFields.join(', ')}`
        });
      }

      const parsedSemester = parseInt(normalizedSemester, 10);
      if (Number.isNaN(parsedSemester)) {
        return res.status(400).json({ message: 'Semester must be a number' });
      }

      const existingStudent = await Student.findOne({ studentId: normalizedStudentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    if (requestedRole === 'faculty') {
      if (!normalizedDepartment) {
        return res.status(400).json({ message: 'Faculty must have a department' });
      }

      const existingFaculty = await Faculty.findOne({ department: normalizedDepartment });
      if (existingFaculty) {
        return res.status(400).json({ message: `Department ${normalizedDepartment} already has an assigned faculty` });
      }
    }

    // ✅ Create new user (password hashed by User model pre-save hook)
    newUser = new User({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: requestedRole
    });
    await newUser.save();

    // ✅ Auto-create Student profile if role is 'student'
    if (newUser.role === 'student') {
      // try to find faculty for this department and link
      const facultyForDept = await Faculty.findOne({ department: normalizedDepartment });

      const studentProfile = new Student({
        user: newUser._id,
        studentId: normalizedStudentId,
        department: normalizedDepartment,
        batch: trimString(batch),
        semester: parseInt(normalizedSemester, 10),
        rollNumber: trimString(rollNumber),
        section: section || 'A',
        phone: trimString(phone),
        dateOfBirth: dateOfBirth || null,
        address: trimString(address),
        parentName: trimString(parentName),
        parentPhone: trimString(parentPhone),
        bloodGroup: trimString(bloodGroup),
        cgpa: 0,
        attendance: 0,
        faculty: facultyForDept ? facultyForDept._id : null
      });
      await studentProfile.save();
    }

    // ✅ Auto-create Faculty profile if role is 'faculty'
    // Ensure only one faculty per department
    if (newUser.role === 'faculty') {
      const facultyProfile = new Faculty({
        user: newUser._id,
        department: normalizedDepartment,
        phone: trimString(phone),
        address: trimString(address)
      });
      await facultyProfile.save();
    }


    res.status(201).json({ message: `${newUser.role} registered successfully` });
  } catch (err) {
    console.error('Registration Error:', err);
    if (newUser?._id) {
      await User.findByIdAndDelete(newUser._id).catch((cleanupErr) => {
        console.error('Registration cleanup failed:', cleanupErr);
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({ message: duplicateMessage(err) });
    }

    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

/* --------------------------------------------------
   🔑 LOGIN USER
   Endpoint: POST /api/auth/login
-------------------------------------------------- */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // ✅ Compare password (using method from User model)
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // ✅ Respond with user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

module.exports = router;
