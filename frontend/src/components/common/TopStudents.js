import React from 'react';
import '../../styles/AdminPanel.css';

const TopStudents = ({ topStudents, loading }) => {
  if (loading) {
    return (
      <section className="top-students-section">
        <h2>Top Performing Students</h2>
        <div className="loading-state">
          <p>Loading student performance data...</p>
        </div>
      </section>
    );
  }

  if (topStudents.length === 0) {
    return (
      <section className="top-students-section">
        <h2>Top Performing Students</h2>
        <div className="empty-state">
          <p>No student performance data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="top-students-section">
      <h2>Top Performing Students</h2>
      
      <div className="student-leaderboard">
        <div className="podium">
          {topStudents.slice(0, 3).map((student, index) => (
            <div key={student.id} className={`podium-student rank-${index + 1}`}>
              <div className="rank-badge">
                {index === 0 ? '👑' : (index + 1)}
              </div>
              <div className="student-avatar">{student.name.charAt(0)}</div>
              <div className="student-info">
                <h3>{student.name}</h3>
                <p className="department">{student.department}</p>
                <div className="student-stats">
                  <div className="student-activity-points-badge">{student.studentActivityPoints} points</div>
                  <div className="achievements-count">{student.achievements} achievements</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="leaderboard-list">
          <table className="leaderboard-table">
            <tbody>
              {topStudents.slice(3).map((student, index) => (
                <tr key={student.id}>
                  <td className="rank-cell">#{index + 4}</td>
                  <td className="student-cell">
                    <div className="student-mini-avatar">{student.name.charAt(0)}</div>
                    <div className="student-details">
                      <div className="student-name">{student.name}</div>
                      <div className="student-email">{student.email}</div>
                    </div>
                  </td>
                  <td>{student.department}</td>
                  <td className="points-cell">{student.studentActivityPoints}</td>
                  <td>{student.achievements}</td>
                  <td>
                    <div className="status-badges">
                      <span className="approved-badge">{student.approved} approved</span>
                      <span className="pending-badge">{student.pending} pending</span>
                      {student.rejected > 0 && (
                        <span className="rejected-badge">{student.rejected} rejected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default TopStudents;
