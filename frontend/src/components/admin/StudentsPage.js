import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/AdminPanel.css";
import { API_BASE_URL } from '../../utils/constants';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]); // ✅ store all faculties
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchFaculties(); // ✅ also fetch faculties
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.students || [];
      setStudents(data);

      const deptSet = new Set(data.map((s) => s.department));
      setDepartments([...deptSet]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students.");
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/admin/faculties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFaculties(response.data.faculties || []);
    } catch (err) {
      console.error("Error fetching faculties:", err);
    }
  };

  // ✅ Find faculty name based on student's department
  const getFacultyByDepartment = (dept) => {
    const faculty = faculties.find((f) => f.department === dept);
    return faculty ? faculty.user?.name : "Not Assigned";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleDownloadPortfolio = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/student/${studentId}/portfolio`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "student-portfolio.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading portfolio:", error);
      alert("Failed to download portfolio");
    }
  };

  const filteredStudents = selectedDept
    ? students.filter((s) => s.department === selectedDept)
    : students;

  if (loading)
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading students...</p>
      </div>
    );

  if (error)
    return (
      <div className="admin-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  return (
    <div className="admin-dashboard">
      {/* ✅ Sidebar */}
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
            <li>
              <a href="/admin/achievements">🏆 Achievements</a>
            </li>
            <li className="active">
              <a href="/admin/students">👨‍🎓 Students</a>
            </li>
            <li>
              <a href="/admin/reports">📑 Reports</a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ✅ Main Section */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Students Overview</h1>
          <div className="admin-actions">
            <select
              className="filter-dropdown"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="students-section">
          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <p>No students found</p>
            </div>
          ) : (
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Incharge Faculty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.user?.name}</td>
                    <td>{student.user?.email}</td>
                    <td>{student.department}</td>
                    {/* ✅ Automatically find faculty by department */}
                    <td>{getFacultyByDepartment(student.department)}</td>
                    <td>
                      <button
                        className="details-btn"
                        onClick={() => handleViewDetails(student)}
                      >
                        View Details
                      </button>
                      <button
                        className="export-btn"
                        onClick={() => handleDownloadPortfolio(student._id)}
                      >
                        Download Portfolio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* ✅ Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Details</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Name:</strong> {selectedStudent.user?.name}</p>
              <p><strong>Email:</strong> {selectedStudent.user?.email}</p>
              <p><strong>Department:</strong> {selectedStudent.department}</p>
              <p>
                <strong>Incharge Faculty:</strong>{" "}
                {getFacultyByDepartment(selectedStudent.department)}
              </p>
              <p><strong>Total Student Activity Points:</strong> {selectedStudent.totalCredits || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
