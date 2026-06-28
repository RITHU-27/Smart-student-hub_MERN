import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../../styles/AdminPanel.css';
import { API_BASE_URL } from '../../utils/constants';

const AdminReportsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ department: '', status: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/all-achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAchievements(res.data.achievements || []);
      setFiltered(res.data.achievements || []);
      calculateStats(res.data.achievements || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const calculateStats = (data) => {
    const stats = { total: data.length, approved: 0, rejected: 0, pending: 0 };
    data.forEach((a) => {
      if (a.verificationStatus === 'approved') stats.approved++;
      else if (a.verificationStatus === 'rejected') stats.rejected++;
      else stats.pending++;
    });
    setStats(stats);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    let result = [...achievements];
    if (filters.department)
      result = result.filter(a => a.student?.department?.toLowerCase() === filters.department.toLowerCase());
    if (filters.status)
      result = result.filter(a => a.verificationStatus === filters.status);
    if (filters.startDate)
      result = result.filter(a => new Date(a.date) >= new Date(filters.startDate));
    if (filters.endDate)
      result = result.filter(a => new Date(a.date) <= new Date(filters.endDate));

    setFiltered(result);
    calculateStats(result);
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/export-achievements`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'admin-achievements-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Generating report...</p>
      </div>
    );
  }

  // Chart Colors
  const COLORS = ['#00C49F', '#FF8042', '#0088FE'];

  const pieData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Pending', value: stats.pending },
    { name: 'Rejected', value: stats.rejected },
  ];

  const barData = Object.values(
    filtered.reduce((acc, ach) => {
      const dept = ach.student?.department || 'Unknown';
      if (!acc[dept]) acc[dept] = { department: dept, count: 0 };
      acc[dept].count++;
      return acc;
    }, {})
  );

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>Reports</p>
        </div>

        <nav className="admin-nav">
          <ul>
            <li><a href="/admin-dashboard">📊 Dashboard</a></li>
            <li><a href="/admin/achievements">🏆 Achievements</a></li>
            <li><a href="/admin/students">👨‍🎓 Students</a></li>
            <li className="active"><a href="/admin/reports">📑 Reports</a></li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Reports & Analytics</h1>
          <button className="export-btn" onClick={handleExportPDF}>Export PDF</button>
        </header>

        {/* Filter Section */}
        <section className="filter-section">
          <h2>Filters</h2>
          <div className="filters-grid">
            <div className="filter-row">
              <select name="department" value={filters.department} onChange={handleFilterChange}>
                <option value="">All Departments</option>
                <option value="ARTIFICIAL INTELLIGENCE AND DATA SCIENCE">ARTIFICIAL INTELLIGENCE AND DATA SCIENCE</option>
                <option value="ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING">ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING</option>
                <option value="AUTOMOBILE ENGINEERING">AUTOMOBILE ENGINEERING</option>
                <option value="CIVIL ENGINEERING">CIVIL ENGINEERING</option>
                <option value="CHEMICAL ENGINEERING">CHEMICAL ENGINEERING</option>
                <option value="COMPUTER SCIENCE AND DESIGN">COMPUTER SCIENCE AND DESIGN</option>
                <option value="COMPUTER SCIENCE AND ENGINEERING">COMPUTER SCIENCE AND ENGINEERING</option>
                <option value="INFORMATION TECHNOLOGY">INFORMATION TECHNOLOGY</option>
                <option value="ELECTRONIC AND COMMUNICATION ENGINEERING">ELECTRONIC AND COMMUNICATION ENGINEERING</option>
                <option value="ELECTRICAL AND ELECTRONIC ENGINEERING">ELECTRICAL AND ELECTRONIC ENGINEERING</option>
                <option value="ELECTRONIC AND INSTRUMENTATION ENGINEERING">ELECTRONIC AND INSTRUMENTATION ENGINEERING</option>
                <option value="FOOD TECHNOLOGY">FOOD TECHNOLOGY</option>
                <option value="MECHANICAL ENGINEERING">MECHANICAL ENGINEERING</option>
                <option value="MECHATRONICS ENGINEERING">MECHATRONICS ENGINEERING</option>
              </select>


              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-row">
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>

            <div className="filter-actions">
              <button className="apply-btn" onClick={applyFilters}>Apply Filters</button>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          <h2>Achievement Statistics</h2>
          <div className="charts-container">
            <div className="chart-card">
              <h3>Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Achievements by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="reports-table-section">
          <h2>Detailed Report ({filtered.length} records)</h2>
          {filtered.length === 0 ? (
            <p>No records found.</p>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Student Activity Points</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ach) => (
                  <tr key={ach._id}>
                    <td>{ach.title}</td>
                    <td>{ach.student?.user?.name}</td>
                    <td>{ach.student?.department || 'N/A'}</td>
                    <td className={`status-${ach.verificationStatus}`}>{ach.verificationStatus}</td>
                    <td>{ach.credits}</td>
                    <td>{new Date(ach.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminReportsPage;
