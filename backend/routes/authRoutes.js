// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty'); // ✅ Added faculty model
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

/* --------------------------------------------------
   🔐 REGISTER USER (Student, Faculty, Admin)
   Endpoint: POST /api/auth/register
-------------------------------------------------- */
router.post('/register', async (req, res) => {
  try {
    console.log('=== Registration Request Started ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Role:', req.body.role);
    console.log('Email:', req.body.email);
    console.log('Department:', req.body.department);
    console.log('Semester:', req.body.semester, 'Type:', typeof req.body.semester);

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

    // ✅ Validate Admin Registration Code
    if (role === 'admin') {
      const correctAdminCode = process.env.ADMIN_CODE || 'ADMIN123';
      if (adminCode !== correctAdminCode) {
        return res.status(400).json({ message: 'Invalid Admin Code' });
      }
    }

    // ✅ Check if user already exists
    console.log('Checking if user exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Create new user (password hashed by User model pre-save hook)
    console.log('Creating new user...');
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'student'
    });
    await newUser.save();
    console.log('User created successfully:', newUser._id);

    // ✅ Auto-create Student profile if role is 'student'
    if (newUser.role === 'student') {
      try {
        // try to find faculty for this department and link
        const facultyForDept = await Faculty.findOne({ department });
        console.log('Faculty found for department:', department, facultyForDept ? facultyForDept._id : 'None');

        const studentProfile = new Student({
          user: newUser._id,
          studentId: studentId || `S${Date.now()}`,
          department: department || 'Unknown',
          batch: batch || '2024',
          semester: semester ? parseInt(semester) : 1,
          rollNumber: rollNumber || '',
          section: section || 'A',
          phone: phone || '',
          dateOfBirth: dateOfBirth || null,
          address: address || '',
          parentName: parentName || '',
          parentPhone: parentPhone || '',
          bloodGroup: bloodGroup || '',
          cgpa: 0,
          attendance: 0,
          faculty: facultyForDept ? facultyForDept._id : null
        });
        await studentProfile.save();
        console.log('Student profile created successfully');
      } catch (studentError) {
        console.error('Error creating student profile:', studentError);
        // Cleanup user if student profile creation fails
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({ message: 'Error creating student profile: ' + studentError.message });
      }
    }

        // ✅ Auto-create Faculty profile if role is 'faculty'
        // Ensure only one faculty per department
        if (newUser.role === 'faculty') {
          if (!department || !department.trim()) {
            // cleanup created user
            await User.findByIdAndDelete(newUser._id);
            return res.status(400).json({ message: 'Faculty must have a department' });
          }

          const existing = await Faculty.findOne({ department: department.trim() });
          if (existing) {
            // cleanup created user
            await User.findByIdAndDelete(newUser._id);
            return res.status(400).json({ message: `Department ${department} already has an assigned faculty` });
          }

          const facultyProfile = new Faculty({
            user: newUser._id,
            department: department.trim(),
            phone: phone || '',
            address: address || ''
          });
          await facultyProfile.save();
        }


    res.status(201).json({ message: `${newUser.role} registered successfully` });
  } catch (err) {
    console.error('Registration Error:', err);
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
