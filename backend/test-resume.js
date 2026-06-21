// Test script to verify resume generation
const mongoose = require('mongoose');
require('dotenv').config();

async function testResumeGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-student-hub');
    console.log('Connected to MongoDB');

    // Get models
    const Student = require('./models/Student');
    const User = require('./models/User'); // Import User model
    const ResumeController = require('./controllers/resumeController');

    // Find a student
    const students = await Student.find().populate('user').limit(1);
    
    if (students.length === 0) {
      console.log('No students found in database');
      return;
    }

    const student = students[0];
    console.log('Testing with student:', student.user.name);
    console.log('Student ID:', student._id);
    console.log('User ID:', student.user._id);

    // Test the resume controller logic directly
    const mockReq = {
      userId: student.user._id, // Simulate logged in user
      body: {
        studentId: student._id, // Send the actual student ID
        template: 'modern',
        jobDescription: 'Software Engineer position'
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response (${code}):`, data);
        }
      }),
      json: (data) => {
        console.log('Response:', data);
      }
    };

    console.log('\n=== Testing Resume Generation ===');
    console.log('Request data:', mockReq.body);
    
    // Test the controller method
    await ResumeController.generateResume(mockReq, mockRes);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testResumeGeneration();
