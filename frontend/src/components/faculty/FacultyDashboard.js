import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import api from '../../services/api';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/constants';
import '../../styles/AdminPanel.css'; // Reuse same style
import TopStudents from '../common/TopStudents';
import { calculateTopStudents } from '../../utils/topStudentsCalculator';

const FacultyDashboard = () => {
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [topStudents, setTopStudents] = useState([]);
  const [bestStudent, setBestStudent] = useState({ name: '', achievements: [] });
  const [facultyData, setFacultyData] = useState({ department: '' });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const isLoadingRef = useRef(false);

  const fetchFacultyProfile = useCallback(async () => {
    try {
      console.log('🔍 Fetching faculty profile...');
      const response = await axios.get('http://localhost:5000/api/faculty/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Faculty profile response:', response.data);
      setFacultyData(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching faculty profile:', error);
      console.error('❌ Faculty profile error response:', error.response?.data);
      console.error('❌ Faculty profile error status:', error.response?.status);
      return null;
    }
  }, [token]);

  const loadDashboard = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('⏳ Dashboard already loading, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Loading faculty dashboard...');
      
      const faculty = await fetchFacultyProfile();
      console.log('👨‍🏫 Faculty profile:', faculty);
      
      // Continue loading dashboard even if faculty profile fails
      if (faculty) {
        console.log('⚠️ Faculty profile not loaded, continuing with dashboard...');
      }

      console.log('📊 Fetching achievement stats...');
      
      try {
        // Make a single call to get all achievements, then filter by status
        const response = await api.get(API_ENDPOINTS.ACHIEVEMENTS.ALL);
        const allAchievements = response.data?.achievements || response.data || [];
        
        console.log('✅ Achievement response:', response.data);
        console.log('📈 Total achievements received:', allAchievements.length);

        // Filter achievements by status
        const pendingAchievements = allAchievements.filter(a => a.verificationStatus === 'pending');
        const approvedAchievements = allAchievements.filter(a => a.verificationStatus === 'approved');
        const rejectedAchievements = allAchievements.filter(a => a.verificationStatus === 'rejected');
        
        const allAchievementsData = [...pendingAchievements, ...approvedAchievements, ...rejectedAchievements];

        console.log('📈 Achievement counts:', {
          pending: pendingAchievements.length,
          approved: approvedAchievements.length,
          rejected: rejectedAchievements.length,
          total: allAchievementsData.length
        });

        setPendingAchievements(pendingAchievements);
        setAllAchievements(allAchievementsData);
        
        setStats({
          pending: pendingAchievements.length,
          approved: approvedAchievements.length,
          rejected: rejectedAchievements.length
        });

        // Calculate top students
        const top = calculateTopStudents(allAchievementsData);
        console.log('🏆 Top students calculated:', top.length);
        setTopStudents(top);
        
        if (top.length > 0) {
          setBestStudent(top[0]);
          console.log('🥇 Best student set:', top[0].name);
        }

        console.log('✅ Dashboard loaded successfully');

      } catch (apiError) {
        console.error('❌ API Error fetching achievements:', apiError);
        console.error('❌ API Error response:', apiError.response?.data);
        
        // Set default values if API fails
        setPendingAchievements([]);
        setAllAchievements([]);
        setStats({
          pending: 0,
          approved: 0,
          rejected: 0
        });
        setTopStudents([]);
        setBestStudent(null);
        
        // Don't throw error, just log it and continue
        console.log('⚠️ Dashboard loaded with default values due to API error');
      }

    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Failed to load dashboard data';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have faculty privileges.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Faculty profile not found. Please contact administrator.';
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchFacultyProfile]);

  // Initial Load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleApprove = async (achievementId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/achievements/${achievementId}/verify`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Achievement approved successfully!');
      await loadDashboard();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving achievement:', error);
      alert('Failed to approve achievement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (achievementId) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/achievements/${achievementId}/verify`,
        { status: 'rejected', reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('❌ Achievement rejected.');
      await loadDashboard();
      setShowModal(false);
    } catch (error) {
      console.error('Error rejecting achievement:', error);
      alert('Failed to reject achievement.');
    } finally {
      setActionLoading(false);
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
        <p>Loading Faculty Dashboard...</p>
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
            Token exists: {token ? 'Yes' : 'No'}<br/>
            Faculty data: {facultyData ? 'Loaded' : 'Not loaded'}<br/>
            API Endpoints: <br/>
            - Achievements: {API_ENDPOINTS.ACHIEVEMENTS.ALL}<br/>
            - Faculty Profile: http://localhost:5000/api/faculty/profile
          </div>
          <button onClick={loadDashboard} className="retry-btn">
            Retry
          </button>
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
          <p>{facultyData?.department || 'Faculty'} Dashboard</p>
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
              <a href="/faculty/achievements">
              <span className="icon">👨‍�</span>
              Students
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
          <h1>Faculty Dashboard</h1>
          <div className="admin-actions">
            <div className="admin-profile">
              <div className="profile-avatar">F</div>
              <div className="profile-info">
                <span>{user?.name || 'Faculty'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon pending">🕒</div>
            <div className="stat-info">
              <h3>Pending Achievements</h3>
              <p className="stat-number">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">✅</div>
            <div className="stat-info">
              <h3>Approved Achievements</h3>
              <p className="stat-number">{stats.approved}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">❌</div>
            <div className="stat-info">
              <h3>Rejected Achievements</h3>
              <p className="stat-number">{stats.rejected}</p>
            </div>
          </div>
          {bestStudent && (
            <div className="stat-card best-student-card">
              <div className="stat-icon best-student">🏆</div>
              <div className="stat-info">
                <h3>Department Best Student</h3>
                <p className="stat-number student-name">{bestStudent.name}</p>
              </div>
            </div>
          )}
        </section>

        {/* Top Performing Students */}
        <TopStudents topStudents={topStudents} loading={loading} />

        {/* Pending Achievements */}
        <section className="pending-achievements-section" id="achievements">
          <h2>Pending Achievements for Verification</h2>

          {pendingAchievements.length === 0 ? (
            <div className="empty-state">
              <p>No pending achievements to review</p>
            </div>
          ) : (
            <div className="achievements-grid">
              {pendingAchievements.map((ach) => (
                <div key={ach._id} className="achievement-card">
                  <div className="achievement-header">
                    <h3>{ach.title}</h3>
                    <span className="status-badge pending">Pending</span>
                  </div>
                  <div className="achievement-body">
                    <p><strong>Student:</strong> {ach.student?.user?.name}</p>
                    <p><strong>Email:</strong> {ach.student?.user?.email}</p>
                    <p><strong>Category:</strong> {ach.category}</p>
                    <p><strong>Level:</strong> {ach.level}</p>
                    <p><strong>Student Activity Points:</strong> {ach.credits}</p>
                    {ach.description && <p><strong>Description:</strong> {ach.description}</p>}
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
                  <div className="achievement-actions">
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(ach._id)}
                      disabled={actionLoading}
                    >
                      Approve
                    </button>
                    <button
                      className="details-btn"
                      onClick={() => {
                        setSelectedAchievement(ach);
                        setShowModal(true);
                      }}
                    >
                      Details
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleReject(ach._id)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Achievements Section */}
        <section className="pending-achievements-section">
          <h2>All Achievements</h2>

          {allAchievements.length === 0 ? (
            <div className="empty-state">
              <p>No achievements found</p>
            </div>
          ) : (
            <div className="achievements-grid">
              {allAchievements.map((ach) => (
                <div key={ach._id} className="achievement-card">
                  <div className="achievement-header">
                    <h3>{ach.title}</h3>
                    <span className={`status-badge ${ach.verificationStatus || 'pending'}`}>
                      {ach.verificationStatus}
                    </span>
                  </div>
                  <div className="achievement-body">
                    <p><strong>Student:</strong> {ach.student?.user?.name}</p>
                    <p><strong>Email:</strong> {ach.student?.user?.email}</p>
                    <p><strong>Category:</strong> {ach.category}</p>
                    <p><strong>Level:</strong> {ach.level}</p>
                    <p><strong>Student Activity Points:</strong> {ach.credits}</p>
                    {ach.description && <p><strong>Description:</strong> {ach.description}</p>}
                    {ach.verificationStatus === 'rejected' && ach.rejectionReason && (
                      <div className="rejection-reason">
                        <p><strong>Rejection Reason:</strong></p>
                        <p className="reason-text">{ach.rejectionReason}</p>
                      </div>
                    )}
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
                  <div className="achievement-actions">
                    {ach.verificationStatus === 'pending' && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(ach._id)}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                        <button
                          className="details-btn"
                          onClick={() => {
                            setSelectedAchievement(ach);
                            setShowModal(true);
                          }}
                        >
                          Details
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleReject(ach._id)}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {ach.verificationStatus !== 'pending' && (
                      <button
                        className="details-btn"
                        onClick={() => {
                          setSelectedAchievement(ach);
                          setShowModal(true);
                        }}
                      >
                        View Details
                      </button>
                    )}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Achievement Details</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Title:</strong> {selectedAchievement.title}</p>
              <p><strong>Student:</strong> {selectedAchievement.student?.user?.name}</p>
              <p><strong>Email:</strong> {selectedAchievement.student?.user?.email}</p>
              <p><strong>Department:</strong> {selectedAchievement.student?.department}</p>
              <p><strong>Category:</strong> {selectedAchievement.category}</p>
              <p><strong>Level:</strong> {selectedAchievement.level}</p>
              <p><strong>Student Activity Points:</strong> {selectedAchievement.credits}</p>
              <p><strong>Status:</strong> {selectedAchievement.verificationStatus}</p>
              <p><strong>Date:</strong> {new Date(selectedAchievement.date).toLocaleDateString()}</p>
              {selectedAchievement.description && (
                <p><strong>Description:</strong> {selectedAchievement.description}</p>
              )}
              {selectedAchievement.certificate && (
                <a
                  href={`http://localhost:5000${selectedAchievement.certificate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="certificate-link"
                >
                  View Certificate
                </a>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="approve-btn"
                onClick={() => handleApprove(selectedAchievement._id)}
              >
                Approve
              </button>
              <button
                className="reject-btn"
                onClick={() => handleReject(selectedAchievement._id)}
              >
                Reject
              </button>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
