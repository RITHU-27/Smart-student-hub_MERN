import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import '../../styles/AdminPanel.css';

const AllAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // ===== Fetch Student's Own Achievements =====
  const fetchAllAchievements = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.email) {
        setError('User email not found. Please log in again.');
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `${API_BASE_URL}/api/students/achievements?email=${encodeURIComponent(user.email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAchievements(res.data.achievements || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load achievements.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.email, token]);

  useEffect(() => {
    fetchAllAchievements();
  }, [fetchAllAchievements]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ===== Loading & Error States =====
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchAllAchievements} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ===== Render =====
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>My Achievements</p>
        </div>

        <nav className="admin-nav">
          <ul>
            <li>
              <a href="/dashboard">
                <span className="icon">🏠</span> Dashboard
              </a>
            </li>
            <li className="active">
              <a href="/all-achievements">
                <span className="icon">🏆</span> Achievements
              </a>
            </li>
            <li>
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

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>My Achievements</h1>
          <div className="admin-actions">
            <div className="admin-profile">
              <div className="profile-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="profile-info">
                <span>{user?.name || 'Student'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="pending-achievements-section">
          {achievements.length === 0 ? (
            <div className="empty-state">
              <p>No achievements found.</p>
            </div>
          ) : (
            <div className="achievements-grid">
              {achievements.map((a) => (
                <div key={a._id} className="achievement-card">
                  <div className="achievement-header">
                    <h3>{a.title}</h3>
                    <span
                      className={`status-badge ${a.verificationStatus || 'pending'}`}
                    >
                      {a.verificationStatus}
                    </span>
                  </div>

                  <div className="achievement-body">
                    <p><strong>Category:</strong> {a.category}</p>
                    <p><strong>Level:</strong> {a.level}</p>
                    <p><strong>Student Activity Points:</strong> {a.credits}</p>
                    {a.description && (
                      <p><strong>Description:</strong> {a.description}</p>
                    )}
                    {a.date && (
                      <p><strong>Date:</strong> {new Date(a.date).toLocaleDateString()}</p>
                    )}
                    {a.verificationStatus === 'rejected' && a.rejectionReason && (
                      <div className="rejection-reason">
                        <p><strong>Rejection Reason:</strong></p>
                        <p className="reason-text">{a.rejectionReason}</p>
                      </div>
                    )}
                    {a.certificateFile?.path && (
                      <a
                        href={`${API_BASE_URL}${a.certificateFile.path}`}
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
      </main>
    </div>
  );
};

export default AllAchievements;
