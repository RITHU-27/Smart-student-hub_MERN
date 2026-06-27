// frontend/src/components/faculty/FacultyStudents.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import '../../styles/AdminPanel.css';

const FacultyStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // === Fetch all students under this faculty ===
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/students/for-faculty`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      const msg = err.response?.data?.message || 'Failed to load students.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // === Download Portfolio PDF ===
  const handleDownloadPortfolio = async (student) => {
    if (!student || !student._id) {
      alert('Student ID not found');
      return;
    }

    try {
      setDownloading(student._id);
      const res = await axios.get(
        `${API_BASE_URL}/api/students/${student._id}/portfolio`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `portfolio_${student.user?.name || 'student'}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading portfolio:', err);
      alert('Failed to download portfolio.');
    } finally {
      setDownloading(null);
    }
  };

  // === Logout handler ===
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // === Loading state ===
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  // === Error state ===
  if (error) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchStudents} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // === Render ===
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>Faculty Panel</p>
        </div>

        <nav className="admin-nav">
          <ul>
            <li>
              <a href="/faculty-dashboard">
                <span className="icon">📊</span> Dashboard
              </a>
            </li>
            <li>
              <a href="/faculty-dashboard#achievements">
                <span className="icon">🏆</span> Achievements
              </a>
            </li>
            <li className="active">
              <a href="/faculty-students">
                <span className="icon">👨‍🎓</span> Students
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

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Students Under Faculty</h1>
          <div className="admin-actions">
            <div className="admin-profile">
              <div className="profile-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div className="profile-info">
                <span>{user?.name || 'Faculty'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="students-section">
          {students.length === 0 ? (
            <div className="empty-state">
              <p>No students found under your supervision.</p>
            </div>
          ) : (
            <div className="students-grid">
              {students.map((student) => (
                <div key={student._id} className="student-card">
                  <div className="student-header">
                    <h3>{student.user?.name || 'Unnamed'}</h3>
                    <p>{student.department}</p>
                  </div>
                  <div className="achievement-body">
                    <p><strong>Email:</strong> {student.user?.email}</p>
                    <p><strong>Student ID:</strong> {student.studentId}</p>
                    <p><strong>Batch:</strong> {student.batch}</p>
                    <p><strong>Semester:</strong> {student.semester}</p>
                    <p><strong>Section:</strong> {student.section}</p>
                    <p><strong>CGPA:</strong> {student.cgpa || 'N/A'}</p>
                  </div>
                  <div className="student-actions">
                    <button
                      className="export-btn"
                      onClick={() => handleDownloadPortfolio(student)}
                      disabled={downloading === student._id}
                    >
                      {downloading === student._id
                        ? 'Downloading...'
                        : 'Download Portfolio'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default FacultyStudents;
