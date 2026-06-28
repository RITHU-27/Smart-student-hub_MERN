import React, { useState, useEffect } from 'react';
import axios from "axios";
import "../../styles/AdminPanel.css";
import { API_BASE_URL } from '../../utils/constants';
import AddAchievement from "./AddAchievement";

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // Calculate achievement stats
  const pendingCount = achievements.filter(a => a.verificationStatus === 'pending').length;
  const approvedCount = achievements.filter(a => a.verificationStatus === 'approved').length;
  const rejectedCount = achievements.filter(a => a.verificationStatus === 'rejected').length;
  const totalCredits = achievements
    .filter(a => a.verificationStatus === 'approved')
    .reduce((sum, a) => sum + (a.credits || 0), 0);

  // ===== Fetch Data =====
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const userEmail = user?.email;
      const token = localStorage.getItem("token");
      
      console.log('Fetching student dashboard data...');
      console.log('User email:', userEmail);
      console.log('Token:', token ? 'exists' : 'missing');
      
      if (!userEmail) {
        setError('User email not found. Please login again.');
        return;
      }

      const [profileRes, achievementsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/test/get-profile-dynamic?email=${userEmail}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get(`${API_BASE_URL}/api/test/achievements-dynamic?email=${userEmail}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      console.log('Profile response:', profileRes.data);
      console.log('Achievements response:', achievementsRes.data);

      setProfile(profileRes.data.student);
      setAchievements(achievementsRes.data.achievements || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (error.response?.status === 404) {
        setError('Profile not found. Please complete your profile first.');
      } else {
        setError("Failed to load data: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };


  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // ===== Loading & Error States =====
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Student Dashboard...</p>
        <small>Checking user data and profile...</small>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <strong>Debug Info:</strong><br/>
            User exists: {user ? 'Yes' : 'No'}<br/>
            User email: {user?.email || 'Not found'}<br/>
            Profile exists: {profile ? 'Yes' : 'No'}<br/>
            Profile user exists: {profile?.user ? 'Yes' : 'No'}<br/>
            Achievements count: {achievements?.length || 0}
          </div>
          <button onClick={fetchData} className="retry-btn">
            Retry
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }} 
            className="retry-btn" 
            style={{ marginLeft: '10px', backgroundColor: '#e74c3c' }}
          >
            Logout & Login Again
          </button>
        </div>
      </div>
    );
  }

  // ===== Render UI =====
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
            <li className="active">
              <a href="#dashboard">
                <span className="icon">📊</span>
                Dashboard
              </a>
            </li>
            <li>
              <a href="#achievements">
                <span className="icon">🏆</span>
                Achievements
              </a>
            </li>
            <li>
              <a href="#profile">
                <span className="icon">👤</span>
                Profile
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Student Dashboard</h1>
          <div className="admin-actions">
            <div className="admin-profile">
              <div className="profile-avatar">{user?.name?.charAt(0) || 'S'}</div>
              <div className="profile-info">
                <span>{user?.name || 'Student'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Achievement Summary Cards */}
        <section className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon pending">🕒</div>
            <div className="stat-info">
              <h3>Pending Achievements</h3>
              <p className="stat-number">{pendingCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-info">
              <h3>Approved Achievements</h3>
              <p className="stat-number">{approvedCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">❌</div>
            <div className="stat-info">
              <h3>Rejected Achievements</h3>
              <p className="stat-number">{rejectedCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon credits">⭐</div>
            <div className="stat-info">
              <h3>Total Credits</h3>
              <p className="stat-number">{totalCredits}</p>
            </div>
          </div>
        </section>

        {/* Student Profile Section */}
        <section className="student-profile-section">
          <h2>Student Profile</h2>
          <div className="profile-card">
            {profile ? (
              <div className="profile-details">
                <div className="profile-row">
                  <span className="label"><strong>Name:</strong></span>
                  <span className="value">{profile.user?.name || 'N/A'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>Email:</strong></span>
                  <span className="value">{profile.user?.email || 'N/A'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>Student ID:</strong></span>
                  <span className="value">{profile.studentId || 'N/A'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>Department:</strong></span>
                  <span className="value">{profile.department || 'N/A'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>Batch:</strong></span>
                  <span className="value">{profile.batch || 'N/A'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>Semester:</strong></span>
                  <span className="value">{profile.semester || 'N/A'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>CGPA:</strong></span>
                  <span className="value">{profile.cgpa || '0'}</span>
                </div>
                <div className="profile-row">
                  <span className="label"><strong>Attendance:</strong></span>
                  <span className="value">{profile.attendance || '0'}%</span>
                </div>
              </div>
            ) : (
              <p>No profile data available</p>
            )}
          </div>
        </section>

        {/* My Achievements Section */}
        <section className="my-achievements-section">
          <div className="section-header">
            <h2>My Achievements</h2>
            <button
              className="add-achievement-btn"
              onClick={() => setShowAddModal(true)}
            >
              + ADD ACHIEVEMENT
            </button>
          </div>

          {achievements.length === 0 ? (
            <div className="empty-state">
              <h3>No achievements yet</h3>
              <p>Start adding your achievements to build your portfolio!</p>
            </div>
          ) : (
            <div className="achievements-list">
              {achievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <div className="achievement-header">
                    <h4>{achievement.title}</h4>
                    <span className={`status-badge ${achievement.verificationStatus || 'pending'}`}>
                      {achievement.verificationStatus || 'pending'}
                    </span>
                  </div>
                  <div className="achievement-meta">
                    <span><strong>Category:</strong> {achievement.category}</span>
                    <span><strong>Level:</strong> {achievement.level}</span>
                    <span><strong>Credits:</strong> {achievement.credits}</span>
                    <span><strong>Date:</strong> {new Date(achievement.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Achievement Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Add New Achievement</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <AddAchievement
              onClose={() => setShowAddModal(false)}
              onAchievementAdded={(newAchievement) => {
                setAchievements([newAchievement, ...achievements]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
