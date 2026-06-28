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
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, achievements, profile, portfolio

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

  const handleDownloadPortfolio = () => {
    // Import jsPDF dynamically for portfolio generation
    import('jspdf').then((jsPDF) => {
      const doc = new jsPDF.default();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Student Portfolio', 105, 20, { align: 'center' });
      
      // Add student info
      doc.setFontSize(12);
      let yPosition = 40;
      
      if (profile?.user) {
        doc.text(`Name: ${profile.user.name}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Email: ${profile.user.email}`, 20, yPosition);
        yPosition += 10;
      }
      
      if (profile) {
        doc.text(`Student ID: ${profile.studentId}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Department: ${profile.department}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Batch: ${profile.batch}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Semester: ${profile.semester}`, 20, yPosition);
        yPosition += 10;
        doc.text(`CGPA: ${profile.cgpa}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Attendance: ${profile.attendance}%`, 20, yPosition);
        yPosition += 20;
      }
      
      // Add achievements
      doc.setFontSize(16);
      doc.text('Achievements', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      const approvedAchievements = achievements.filter(a => a.verificationStatus === 'approved');
      
      if (approvedAchievements.length === 0) {
        doc.text('No approved achievements yet.', 20, yPosition);
      } else {
        approvedAchievements.forEach((achievement, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. ${achievement.title}`, 20, yPosition);
          yPosition += 7;
          doc.text(`   Category: ${achievement.category} | Level: ${achievement.level} | Credits: ${achievement.credits}`, 20, yPosition);
          yPosition += 7;
          doc.text(`   Date: ${new Date(achievement.date).toLocaleDateString()}`, 20, yPosition);
          yPosition += 10;
        });
      }
      
      // Add summary
      yPosition += 10;
      doc.setFontSize(14);
      doc.text('Summary', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Total Approved Achievements: ${approvedCount}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Total Credits Earned: ${totalCredits}`, 20, yPosition);
      
      // Save the PDF
      doc.save(`${profile?.user?.name || 'Student'}_Portfolio.pdf`);
    }).catch(err => {
      console.error('Error generating portfolio:', err);
      alert('Error generating portfolio. Please try again.');
    });
  };

  // Render different views based on activeView
  const renderDashboardView = () => (
    <>
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
    </>
  );

  const renderAchievementsView = () => (
    <section className="achievements-full-view">
      <div className="section-header">
        <h2>All Achievements</h2>
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
                <span><strong>Subcategory:</strong> {achievement.subCategory}</span>
                <span><strong>Level:</strong> {achievement.level}</span>
                <span><strong>Credits:</strong> {achievement.credits}</span>
                <span><strong>Date:</strong> {new Date(achievement.date).toLocaleDateString()}</span>
              </div>
              {achievement.description && (
                <div className="achievement-description">
                  <strong>Description:</strong> {achievement.description}
                </div>
              )}
              {achievement.organization && (
                <div className="achievement-organization">
                  <strong>Organization:</strong> {achievement.organization}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderProfileView = () => (
    <section className="profile-full-view">
      <h2>Complete Profile</h2>
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
              <span className="label"><strong>Roll Number:</strong></span>
              <span className="value">{profile.rollNumber || 'N/A'}</span>
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
              <span className="label"><strong>Section:</strong></span>
              <span className="value">{profile.section || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="label"><strong>Phone:</strong></span>
              <span className="value">{profile.phone || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="label"><strong>Date of Birth:</strong></span>
              <span className="value">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="label"><strong>Address:</strong></span>
              <span className="value">{profile.address || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="label"><strong>Parent Name:</strong></span>
              <span className="value">{profile.parentName || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="label"><strong>Parent Phone:</strong></span>
              <span className="value">{profile.parentPhone || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="label"><strong>Blood Group:</strong></span>
              <span className="value">{profile.bloodGroup || 'N/A'}</span>
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
  );

  const renderPortfolioView = () => (
    <section className="portfolio-download-view">
      <h2>Download Portfolio</h2>
      <div className="portfolio-info">
        <p>Download your complete portfolio as a PDF document including your profile information and approved achievements.</p>
        
        <div className="portfolio-summary">
          <h3>Portfolio Summary</h3>
          <div className="summary-item">
            <span className="label">Total Approved Achievements:</span>
            <span className="value">{approvedCount}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Credits Earned:</span>
            <span className="value">{totalCredits}</span>
          </div>
          <div className="summary-item">
            <span className="label">Current CGPA:</span>
            <span className="value">{profile?.cgpa || '0'}</span>
          </div>
          <div className="summary-item">
            <span className="label">Attendance:</span>
            <span className="value">{profile?.attendance || '0'}%</span>
          </div>
        </div>

        <button 
          className="download-portfolio-btn"
          onClick={handleDownloadPortfolio}
          disabled={approvedCount === 0}
        >
          📄 Download Portfolio PDF
        </button>
        
        {approvedCount === 0 && (
          <p className="warning-text">
            Note: You need at least one approved achievement to generate a portfolio.
          </p>
        )}
      </div>
    </section>
  );


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
            <li className={activeView === 'dashboard' ? 'active' : ''}>
              <button onClick={() => setActiveView('dashboard')} className="nav-link">
                <span className="icon">📊</span>
                Dashboard
              </button>
            </li>
            <li className={activeView === 'achievements' ? 'active' : ''}>
              <button onClick={() => setActiveView('achievements')} className="nav-link">
                <span className="icon">🏆</span>
                Achievements
              </button>
            </li>
            <li className={activeView === 'profile' ? 'active' : ''}>
              <button onClick={() => setActiveView('profile')} className="nav-link">
                <span className="icon">👤</span>
                Profile
              </button>
            </li>
            <li className={activeView === 'portfolio' ? 'active' : ''}>
              <button onClick={() => setActiveView('portfolio')} className="nav-link">
                <span className="icon">📄</span>
                Download Portfolio
              </button>
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

        {/* Render different views based on activeView */}
        {activeView === 'dashboard' && renderDashboardView()}
        {activeView === 'achievements' && renderAchievementsView()}
        {activeView === 'profile' && renderProfileView()}
        {activeView === 'portfolio' && renderPortfolioView()}
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
