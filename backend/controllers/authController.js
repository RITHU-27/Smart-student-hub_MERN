const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ Register a new user (Student, Faculty, or Admin)
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      role, 
      name, 
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

    // ✅ Admin Code Validation
    if (role === 'admin') {
      if (adminCode !== 'ADMIN123') {
        return res.status(400).json({ message: 'Invalid Admin Code' });
      }
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user document
    const user = new User({
      email,
      password: hashedPassword,
      role: role || 'student',
      name
    });

    await user.save();

    // ✅ If role is student, create a student profile
    if (user.role === 'student') {
      // find faculty for the student's department (if exists) and link
      const facultyForDept = await require('../models/Faculty').findOne({ department });

      const studentProfile = new Student({
        user: user._id,
        studentId,
        department,
        batch,
        semester: parseInt(semester),
        rollNumber,
        section: section || 'A',
        phone,
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
    }

    // If role is faculty, create a Faculty document and ensure only one faculty per department
    if (user.role === 'faculty') {
      const { department: facultyDept, phone: facultyPhone, address: facultyAddress } = req.body;

      if (!facultyDept || !facultyDept.trim()) {
        // remove created user when invalid faculty registration
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Faculty registration requires a department' });
      }

      // Check if department already has a faculty
      const existingFaculty = await require('../models/Faculty').findOne({ department: facultyDept.trim() });
      if (existingFaculty) {
        // remove created user to avoid orphan user
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: `Department ${facultyDept} already has an assigned faculty` });
      }

      const facultyDoc = new (require('../models/Faculty'))({
        user: user._id,
        department: facultyDept.trim(),
        phone: facultyPhone || '',
        address: facultyAddress || ''
      });

      await facultyDoc.save();
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// ✅ Login User (Student, Faculty, or Admin)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password. Please try again.' });
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password. Please try again.' });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

module.exports = { register, login };
