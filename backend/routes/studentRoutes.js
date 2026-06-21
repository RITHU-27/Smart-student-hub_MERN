const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateUser, authorizeRole, authorizeSelfOrRole } = require('../middleware/authMiddleware');

// ✅ All routes require authentication
router.use(authenticateUser);

// 🧩 Student routes
router.post('/profile', studentController.createOrUpdateProfile);
router.get('/profile', studentController.getProfile);
router.get('/achievements', studentController.getMyAchievements);

// 🧱 Admin/Faculty routes
router.get('/all', authorizeRole('admin', 'faculty'), studentController.getAllStudents);

// 🧑‍🏫 Faculty-only
router.post('/create-my-faculty', authorizeRole('faculty'), studentController.createMyFaculty);
router.get('/for-faculty', authorizeRole('faculty'), studentController.getStudentsForFaculty);

// 🧩 Generate student portfolio (PDF)
// ✅ Students can access their own portfolio
// ✅ Faculty/Admin can access any portfolio
router.get(
  '/:studentId/portfolio',
  authorizeSelfOrRole('admin', 'faculty'),
  studentController.generatePortfolio
);

// 🧱 Get specific student (admin/faculty only)
router.get('/:studentId', authorizeRole('admin', 'faculty'), studentController.getStudentById);

module.exports = router;
