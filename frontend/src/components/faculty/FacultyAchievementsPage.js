// frontend/src/components/faculty/FacultyAchievementsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/constants';
import '../../styles/AdminPanel.css';

const FacultyAchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.ACHIEVEMENTS.FOR_FACULTY);
      setAchievements(response.data.achievements || []);
      setError('');
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const approved = achievements.filter((a) => a.verificationStatus === 'approved');
  const rejected = achievements.filter((a) => a.verificationStatus === 'rejected');
  const pending = achievements.filter((a) => a.verificationStatus === 'pending');

  const renderAchievements = (title, list, badgeClass) => (
    <section className="achievements-section">
      <h2>{title}</h2>
      {list.length === 0 ? (
        <div className="empty-state">
          <p>No {title.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="achievements-grid">
          {list.map((ach) => (
            <div key={ach._id} className="achievement-card">
              <div className="achievement-header">
                <h3>{ach.title}</h3>
                <span className={`status-badge ${badgeClass}`}>
                  {ach.verificationStatus}
                </span>
              </div>
              <div className="achievement-body">
                <p><strong>Student:</strong> {ach.student?.user?.name}</p>
                <p><strong>Email:</strong> {ach.student?.user?.email}</p>
                <p><strong>Category:</strong> {ach.category}</p>
                <p><strong>Level:</strong> {ach.level}</p>
                <p><strong>Student Activity Points:</strong> {ach.credits}</p>
                {ach.certificateFile?.path && (
                  <a
                    href={`${API_BASE_URL}${ach.certificateFile.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-certificate"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar (same as FacultyDashboard) */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>Faculty Panel</p>
        </div>

        <nav className="admin-nav">
          <ul>
            <li>
              <Link to="/faculty-dashboard">
                <span className="icon">📊</span>
                Dashboard
              </Link>
            </li>
            <li className="active">
              <Link to="/faculty/achievements">
                <span className="icon">🏆</span>
                Achievements
              </Link>
            </li>
            <li>
              <Link to="/faculty-students">
                <span className="icon">👨‍🎓</span>
                Students
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>All Achievements</h1>
          <div className="admin-actions">
            <div className="admin-profile">
              <div className="profile-avatar">F</div>
              <div className="profile-info">
                <span>{user?.name || 'Faculty'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Achievements Sections */}
        {renderAchievements('Pending Achievements', pending, 'pending')}
        {renderAchievements('Approved Achievements', approved, 'approved')}
        {renderAchievements('Rejected Achievements', rejected, 'rejected')}
      </main>
    </div>
  );
};

export default FacultyAchievementsPage;
