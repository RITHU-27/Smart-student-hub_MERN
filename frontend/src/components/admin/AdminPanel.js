import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/AdminPanel.css';
import TopStudents from '../common/TopStudents';
import { API_BASE_URL } from '../../utils/constants';

const AdminPanel = () => {
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [bestStudent, setBestStudent] = useState(null);
  const [stats, setStats] = useState({
    pendingAchievements: 0,
    approvedAchievements: 0,
    totalStudents: 0,
    totalCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch statistics directly from the API endpoint we created
      await axios.get(`${API_BASE_URL}/api/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch pending achievements
      const [allAchievementsRes, topStudentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/all-achievements`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/test/top-students`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const allAchievements = allAchievementsRes.data.achievements || [];
      setPendingAchievements(allAchievements.filter(a => a.verificationStatus === 'pending'));
      
      // Calculate statistics
      const stats = {
        pendingAchievements: allAchievements.filter(a => a.verificationStatus === 'pending').length,
        approvedAchievements: allAchievements.filter(a => a.verificationStatus === 'approved').length,
        totalStudents: [...new Set(allAchievements.map(a => a.student?._id).filter(id => id))].length,
        totalCredits: allAchievements.reduce((sum, a) => sum + (a.credits || 0), 0)
      };
      setStats(stats);

      // Set top students directly from the new endpoint
      const topStudentsData = topStudentsRes.data.achievements || [];
      setTopStudents(topStudentsData);
      
      // Set best student (top performer)
      if (topStudentsData.length > 0) {
        setBestStudent(topStudentsData[0]);
      }
      
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load achievements. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleApprove = async (achievementId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/achievements/${achievementId}/verify`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Achievement approved successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving achievement:', error);
      alert('Failed to approve achievement');
    }
  };

  const handleReject = async (achievementId) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/achievements/${achievementId}/verify`,
        { status: 'rejected', reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Achievement rejected successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting achievement:', error);
      alert('Failed to reject achievement');
    }
  };

  const handleViewDetails = (achievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/export-achievements`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'achievements-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>Admin Dashboard</p>
        </div>
        
        <nav className="admin-nav">
          <ul>
            <li className="active">
              <a href="/admin-dashboard">
                <span className="icon">📊</span>
                Dashboard
              </a>
            </li>
            <li>
              <a href="/admin/achievements">
                <span className="icon">🏆</span>
                Achievements
              </a>
            </li>
            <li>
              <a href="/admin/students">
                <span className="icon">👨‍🎓</span>
                Students
              </a>
            </li>
            <li>
              <a href="/admin/reports">
                <span className="icon">📑</span>
                Reports
              </a>
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

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-actions">
            <button className="export-btn" onClick={handleExportPDF}>
              Export PDF Report
            </button>
            <div className="admin-profile">
              <div className="profile-avatar">A</div>
              <div className="profile-info">
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon pending">🕒</div>
            <div className="stat-info">
              <h3>Pending Achievements</h3>
              <p className="stat-number">{stats.pendingAchievements || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-info">
              <h3>Approved Achievements</h3>
              <p className="stat-number">{stats.approvedAchievements || 0}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total-students">👥</div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <p className="stat-number">{stats.totalStudents || 0}</p>
            </div>
          </div>
          {bestStudent && (
            <div className="stat-card best-student-card">
              <div className="stat-icon best-student">🏆</div>
              <div className="stat-info">
                <h3>Overall Best Student</h3>
                <p className="stat-number student-name">{bestStudent.name}</p>
              </div>
            </div>
          )}
        </section>

        {/* Top Students Section */}
        <TopStudents topStudents={topStudents} loading={loading} />

        {/* Pending Achievements */}
        <section className="pending-achievements-section">
          <h2>Pending Approvals</h2>
          
          {pendingAchievements.length === 0 ? (
            <div className="empty-state">
              <p>No pending achievements to review</p>
            </div>
          ) : (
            <div className="achievements-grid">
              {pendingAchievements.map(ach => (
                <div key={ach._id} className="achievement-card">
                  <div className="achievement-header">
                    <h3>{ach.title}</h3>
                    <span className="status-badge pending">Pending</span>
                  </div>
                  <div className="achievement-body">
                    <div className="student-info">
                      <p><strong>Student:</strong> {ach.student?.user?.name}</p>
                      <p><strong>Department:</strong> {ach.student?.department || 'N/A'}</p>
                    </div>
                    <div className="achievement-meta">
                      <p><strong>Category:</strong> {ach.category}</p>
                      <p><strong>Level:</strong> {ach.level}</p>
                      <p><strong>Student Activity Points:</strong> {ach.credits}</p>
                    </div>
                    {ach.description && (
                      <div className="achievement-description">
                        <p>{ach.description}</p>
                      </div>
                    )}
                    {ach.certificateFile && (
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
                  <div className="achievement-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => handleApprove(ach._id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="details-btn"
                      onClick={() => handleViewDetails(ach)}
                    >
                      Details
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReject(ach._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Achievement Details Modal */}
      {showModal && selectedAchievement && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Achievement Details</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Title:</label>
                <span>{selectedAchievement.title}</span>
              </div>
              <div className="detail-row">
                <label>Student:</label>
                <span>{selectedAchievement.student?.user?.name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedAchievement.student?.user?.email}</span>
              </div>
              <div className="detail-row">
                <label>Department:</label>
                <span>{selectedAchievement.student?.department}</span>
              </div>
              <div className="detail-row">
                <label>Category:</label>
                <span>{selectedAchievement.category}</span>
              </div>
              <div className="detail-row">
                <label>Level:</label>
                <span>{selectedAchievement.level}</span>
              </div>
              <div className="detail-row">
                <label>Student Activity Points:</label>
                <span>{selectedAchievement.credits}</span>
              </div>
              <div className="detail-row">
                <label>Date:</label>
                <span>{new Date(selectedAchievement.date).toLocaleDateString()}</span>
              </div>
              {selectedAchievement.description && (
                <div className="detail-row">
                  <label>Description:</label>
                  <p className="description-text">{selectedAchievement.description}</p>
                </div>
              )}
              {selectedAchievement.certificateFile && selectedAchievement.certificateFile.path && (
                <div className="certificate-container">
                  <a
                    href={`${API_BASE_URL}${selectedAchievement.certificateFile.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="certificate-link"
                  >
                    View Certificate
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="approve-btn"
                onClick={() => {
                  handleApprove(selectedAchievement._id);
                  setShowModal(false);
                }}
              >
                Approve
              </button>
              <button 
                className="reject-btn"
                onClick={() => {
                  handleReject(selectedAchievement._id);
                  setShowModal(false);
                }}
              >
                Reject
              </button>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
