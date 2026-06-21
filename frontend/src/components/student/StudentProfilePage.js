// frontend/src/components/student/StudentProfilePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/AdminPanel.css';

const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userEmail = user?.email;
        const res = await axios.get(
          `http://localhost:5000/api/test/get-profile-dynamic?email=${userEmail}`
        );
        setProfile(res.data.student);
      } catch (err) {
        console.error(err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile)
    return <p style={{ textAlign: 'center' }}>No profile data found.</p>;

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>Student Dashboard</p>
        </div>

        <nav className="admin-nav">
          <ul>
            {/* ✅ Dashboard link now connects to /dashboard */}
            <li>
              <a href="/dashboard">
                <span className="icon">📊</span> Dashboard
              </a>
            </li>
            <li>
              <a href="/all-achievements">
                <span className="icon">🏆</span> Achievements
              </a>
            </li>
            <li className="active">
              <a href="/student-profile">
                <span className="icon">👤</span> Profile
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Student Profile</h1>
        </header>

        <section className="students-section">
          <h2>Profile Details</h2>
          <div className="students-grid">
            <div className="student-card">
              <div className="student-header">
                <h3>{profile.user?.name}</h3>
                <p>{profile.department}</p>
              </div>
              <div className="achievement-body">
                <p><strong>Email:</strong> {profile.user?.email}</p>
                <p><strong>Student ID:</strong> {profile.studentId}</p>
                <p><strong>Batch:</strong> {profile.batch}</p>
                <p><strong>Semester:</strong> {profile.semester}</p>
                <p><strong>Section:</strong> {profile.section}</p>
                <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {profile.address || 'Not Provided'}</p>
                <p><strong>Parent Name:</strong> {profile.parentName || 'N/A'}</p>
                <p><strong>Parent Phone:</strong> {profile.parentPhone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentProfilePage;
