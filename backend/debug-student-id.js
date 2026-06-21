// Debug script to identify Student ID issues
const mongoose = require('mongoose');
require('dotenv').config();

async function debugStudentIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-student-hub');
    console.log('Connected to MongoDB');

    // Get models
    const Student = require('./models/Student');
    const User = require('./models/User');

    console.log('\n=== DEBUGGING STUDENT IDs ===');

    // Find all users
    const users = await User.find().limit(5);
    console.log('\n📋 Available Users:');
    users.forEach(user => {
      console.log(`  User ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log('---');
    });

    // Find all students
    const students = await Student.find().populate('user', 'name email').limit(5);
    console.log('\n🎓 Available Students:');
    students.forEach(student => {
      console.log(`  Student ID: ${student._id}`);
      console.log(`  User ID: ${student.user._id}`);
      console.log(`  Name: ${student.user.name}`);
      console.log(`  Email: ${student.user.email}`);
      console.log(`  Student ID: ${student.studentId}`);
      console.log('---');
    });

    // Check for ID mismatches
    console.log('\n🔍 ID Relationship Check:');
    for (const student of students) {
      console.log(`Student ${student.user.name}:`);
      console.log(`  Student._id: ${student._id}`);
      console.log(`  Student.user: ${student.user._id}`);
      console.log(`  Same ID: ${student._id.toString() === student.user._id.toString()}`);
      console.log('---');
    }

    // Test specific scenarios
    console.log('\n🧪 Test Scenarios:');
    
    // Test 1: Find student by Student ID
    if (students.length > 0) {
      const testStudent = students[0];
      console.log(`\nTest 1: Find student by Student ID (${testStudent._id})`);
      const foundByStudentId = await Student.findById(testStudent._id).populate('user');
      console.log(`Result: ${foundByStudentId ? 'FOUND' : 'NOT FOUND'}`);
      
      // Test 2: Find student by User ID
      console.log(`\nTest 2: Find student by User ID (${testStudent.user._id})`);
      const foundByUserId = await Student.findOne({ user: testStudent.user._id }).populate('user');
      console.log(`Result: ${foundByUserId ? 'FOUND' : 'NOT FOUND'}`);
      
      // Test 3: Check if IDs are the same
      console.log(`\nTest 3: ID Comparison`);
      console.log(`Student ID: ${testStudent._id}`);
      console.log(`User ID: ${testStudent.user._id}`);
      console.log(`Are they equal? ${testStudent._id.toString() === testStudent.user._id.toString()}`);
    }

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugStudentIds();
