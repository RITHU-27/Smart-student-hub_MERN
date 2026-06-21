// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// 🔐 Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ErrorBoundary from './components/ErrorBoundary';

// 🧑‍🎓 Student Components
import StudentDashboard from './components/student/StudentDashboard';
import StudentProfilePage from './components/student/StudentProfilePage';
import AllAchievements from './components/student/AllAchievements';
import ResumeBuilderPage from './pages/student/ResumeBuilderPage';

// 👩‍🏫 Faculty Components
import FacultyDashboard from './components/faculty/FacultyDashboard';
import FacultyStudents from './components/faculty/FacultyStudents';
import FacultyAchievementsPage from './components/faculty/FacultyAchievementsPage';

// 🧑‍💼 Admin Components
import AdminPanel from './components/admin/AdminPanel';
import StudentsPage from './components/admin/StudentsPage';
import AdminAchievements from './components/admin/AdminAchievements';
import AdminReportsPage from './components/admin/AdminReportsPage';

import './App.css';

// 🔒 Simple Private Route Wrapper (optional)
const PrivateRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 🔐 Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🧑‍🎓 Student Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <ErrorBoundary>
                  <StudentDashboard />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/student-profile"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/all-achievements"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <AllAchievements />
              </PrivateRoute>
            }
          />
          <Route
            path="/resume-builder"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <ResumeBuilderPage />
              </PrivateRoute>
            }
          />

          {/* 👩‍🏫 Faculty Routes */}
          <Route
            path="/faculty-dashboard"
            element={
              <PrivateRoute allowedRoles={['faculty']}>
                <FacultyDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/faculty-students"
            element={
              <PrivateRoute allowedRoles={['faculty']}>
                <FacultyStudents />
              </PrivateRoute>
            }
          />
          <Route
            path="/faculty-achievements"
            element={
              <PrivateRoute allowedRoles={['faculty']}>
                <FacultyAchievementsPage />
              </PrivateRoute>
            }
          />

          {/* 🧑‍💼 Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <StudentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminAchievements />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminReportsPage />
              </PrivateRoute>
            }
          />

          {/* 🚫 404 Fallback */}
          <Route
            path="*"
            element={
              <h2 style={{ textAlign: 'center', marginTop: '40px', color: '#888' }}>
                404 - Page Not Found
              </h2>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
