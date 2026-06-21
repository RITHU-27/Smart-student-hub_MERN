import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/AdminPanel.css';
import TopStudents from '../common/TopStudents';
import { calculateTopStudents } from '../../utils/topStudentsCalculator';

const AdminAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [achievementsRes, topStudentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/all-achievements', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/test/top-students', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const data = achievementsRes.data.achievements || [];
      setAchievements(data);
      setFiltered(data);
      
      // Set top students directly from the new endpoint
      const topStudentsData = topStudentsRes.data.achievements || [];
      setTopStudents(topStudentsData);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to fetch achievements.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (list, searchValue, status) => {
    let filteredList = list;

    if (status !== 'all') {
      filteredList = filteredList.filter(a => a.verificationStatus === status);
    }

    if (searchValue.trim() !== '') {
      const value = searchValue.toLowerCase();
      filteredList = filteredList.filter(a =>
        a.title.toLowerCase().includes(value) ||
        a.student?.user?.name.toLowerCase().includes(value) ||
        a.category.toLowerCase().includes(value)
      );
    }

    return filteredList;
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setFiltered(applyFilters(achievements, value, statusFilter));
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setFiltered(applyFilters(achievements, search, value));
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/achievements/${id}/verify`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Achievement approved successfully');
      fetchAchievements();
    } catch (err) {
      console.error(err);
      alert('Error approving achievement');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/achievements/${id}/verify`,
        { status: 'rejected', reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Achievement rejected successfully');
      fetchAchievements();
    } catch (err) {
      console.error(err);
      alert('Error rejecting achievement');
    }
  };

  // Group achievements by department
  const groupByDepartment = (achievementsList) => {
    const groups = {};
    achievementsList.forEach((a) => {
      const dept = a.student?.department || 'Unknown Department';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(a);
    });
    return groups;
  };

  const groupedAchievements = groupByDepartment(filtered);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchAchievements} className="retry-btn">Retry</button>
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
            <li>
              <a href="/admin-dashboard">📊 Dashboard</a>
            </li>
            <li className="active">
              <a href="/admin/achievements">🏆 Achievements</a>
            </li>
            <li>
              <a href="/admin/students">👨‍🎓 Students</a>
            </li>
            <li>
              <a href="/admin/reports">📑 Reports</a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Achievements by Department</h1>
          <div className="filter-container">
            <input
              type="text"
              placeholder="Search by student, title or category..."
              value={search}
              onChange={handleSearch}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </header>

        {Object.keys(groupedAchievements).length === 0 ? (
          <div className="empty-state">
            <p>No achievements found.</p>
          </div>
        ) : (
          Object.entries(groupedAchievements).map(([dept, achList]) => (
            <section key={dept} className="department-section">
              <h2 className="department-title">{dept}</h2>
              <div className="achievements-grid">
                {achList.map((ach) => (
                  <div key={ach._id} className={`achievement-card ${ach.verificationStatus}`}>
                    <div className="achievement-header">
                      <h3>{ach.title}</h3>
                      <span className={`status-badge ${ach.verificationStatus}`}>
                        {ach.verificationStatus.charAt(0).toUpperCase() + ach.verificationStatus.slice(1)}
                      </span>
                    </div>
                    <div className="achievement-body">
                      <p><strong>Student:</strong> {ach.student?.user?.name}</p>
                      <p><strong>Category:</strong> {ach.category}</p>
                      <p><strong>Level:</strong> {ach.level}</p>
                      <p><strong>Student Activity Points:</strong> {ach.credits}</p>
                      {ach.description && (
                        <p className="achievement-description">{ach.description}</p>
                      )}
                      {ach.certificateFile && ach.certificateFile.path && (
                        <a
                          href={`http://localhost:5000${ach.certificateFile.path}`}
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
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(ach._id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="details-btn"
                        onClick={() => {
                          setSelectedAchievement(ach);
                          setShowModal(true);
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
        {/* Top Performing Students */}
        <TopStudents topStudents={topStudents} loading={loading} />
      </main>

      {/* Modal for Details */}
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
              <p><strong>Date:</strong> {new Date(selectedAchievement.date).toLocaleDateString()}</p>
              {selectedAchievement.description && (
                <p><strong>Description:</strong> {selectedAchievement.description}</p>
              )}
              {selectedAchievement.certificateFile && (
                <a
                  href={`http://localhost:5000${selectedAchievement.certificateFile.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-certificate"
                >
                  View Certificate
                </a>
              )}
            </div>
            <div className="modal-footer">
              {selectedAchievement.verificationStatus === 'pending' && (
                <>
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
                </>
              )}
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

export default AdminAchievements;
