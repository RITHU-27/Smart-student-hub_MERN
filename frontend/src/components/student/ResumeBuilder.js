import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../styles/ResumeBuilder.css';

const ResumeBuilder = () => {
  const [resumeData, setResumeData] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [studentId, setStudentId] = useState(null);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = userInfo.email;

  // Fetch student profile to get studentId
  useEffect(() => {
    const fetchStudentId = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching student profile for email:', userEmail);
        console.log('Token:', token ? 'exists' : 'missing');
        
        const response = await axios.get(`http://localhost:5000/api/test/get-profile-dynamic?email=${userEmail}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Student profile response:', response.data);
        const studentObjectId = response.data.student._id;
        console.log('Student ObjectId:', studentObjectId);
        setStudentId(studentObjectId);
      } catch (err) {
        console.error('Error fetching student ID:', err);
        console.error('Error response:', err.response?.data);
        setError('Failed to load student profile');
      }
    };

    if (userEmail) {
      fetchStudentId();
    } else {
      console.error('No user email found in localStorage');
      setError('No user email found');
    }
  }, [userEmail]);

  const fetchResumeHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching resume history for studentId:', studentId);
      console.log('Token:', token ? 'exists' : 'missing');
      
      const response = await axios.get(`http://localhost:5000/api/resume/history/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Resume history response:', response.data);
      setResumeHistory(response.data.resumes || []);
    } catch (err) {
      console.error('Error fetching resume history:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error URL:', `http://localhost:5000/api/resume/history/${studentId}`);
      setError(`Failed to fetch resume history: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchResumeHistory();
    }
  }, [studentId, fetchResumeHistory]);

  const generateResume = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const token = localStorage.getItem('token');
      console.log('🚀 Starting AI resume generation...');
      console.log('Student ID:', studentId);
      console.log('Template:', selectedTemplate);
      console.log('Token exists:', !!token);

      const response = await axios.post('http://localhost:5000/api/ai-resume/generate-ai-resume', {
        studentId: studentId,
        template: selectedTemplate,
        jobDescription: jobDescription,
        useAI: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Resume generation response:', response.data);
      setResumeData(response.data.content);
      setShowPreview(true);
      
      // Refresh history
      await fetchResumeHistory();
      
    } catch (err) {
      console.error('=== RESUME GENERATION ERROR ===');
      console.error('Error generating resume:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Student ID used:', studentId);
      console.error('Request URL:', 'http://localhost:5000/api/ai-resume/generate-ai-resume');
      
      let errorMessage = 'Failed to generate AI resume';
      if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (resumeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/resume/pdf/${resumeId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume_${selectedTemplate}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF');
    }
  };

  const deleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/resume/${resumeId}`);
      await fetchResumeHistory();
      
      if (resumeData && resumeData.id === resumeId) {
        setResumeData(null);
        setShowPreview(false);
      }
      
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError('Failed to delete resume');
    }
  };

  const loadResume = (resume) => {
    setResumeData(resume);
    setSelectedTemplate(resume.template);
    setShowPreview(true);
  };

  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean, contemporary design' },
    { id: 'classic', name: 'Classic', description: 'Traditional, professional layout' },
    { id: 'technical', name: 'Technical', description: 'Skills-focused for tech roles' },
    { id: 'creative', name: 'Creative', description: 'Visually appealing for creative fields' }
  ];

  const renderResumePreview = () => {
    if (!resumeData) {
      return (
        <div className="resume-preview">
          <div className="no-data">
            <h3>No Resume Data</h3>
            <p>Generate a resume to see the preview</p>
          </div>
        </div>
      );
    }

    const { header, summary, skills, experience, education, achievements } = resumeData;
    
    // Add defensive checks
    if (!header) {
      return (
        <div className="resume-preview">
          <div className="no-data">
            <h3>Invalid Resume Data</h3>
            <p>Resume data is incomplete. Please try generating again.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="resume-preview">
        <div className="resume-header">
          <h1>{header?.name || 'Name'}</h1>
          <div className="contact-info">
            <span>{header?.email || 'Email'}</span> | <span>{header?.phone || 'Phone'}</span> | <span>{header?.department || 'Department'}</span>
          </div>
        </div>

        <div className="resume-section">
          <h2>Professional Summary</h2>
          <p>{summary || 'No summary available'}</p>
        </div>

        <div className="resume-section">
          <h2>Skills</h2>
          <div className="skills-grid">
            {skills && Object.entries(skills).map(([category, skillList]) => (
              <div key={category} className="skill-category">
                <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <div className="skill-tags">
                  {skillList && skillList.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill.name}
                      <span className="confidence">{Math.round((skill.confidence || 0) * 100)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="resume-section">
          <h2>Achievements</h2>
          {experience && Object.entries(experience).map(([category, achievements]) => (
            <div key={category} className="achievement-category">
              <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              {achievements && achievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <h4>{achievement.title || 'No title'}</h4>
                  <p>{achievement.description || 'No description'}</p>
                  <div className="achievement-meta">
                    <span>{achievement.organization || 'No organization'}</span> | <span>{achievement.date || 'No date'}</span> | 
                    <span>{achievement.level || 'No level'}</span> | <span>{achievement.credits || 0} points</span>
                  </div>
                  {achievement.skills && achievement.skills.length > 0 && (
                    <div className="achievement-skills">
                      <strong>Skills:</strong> {achievement.skills.map(s => s.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="resume-section">
          <h2>Education</h2>
          <div className="education-item">
            <h3>{education?.institution || 'No institution'}</h3>
            <p>{education?.department || 'No department'} - {education?.studentId || 'No ID'}</p>
            <p>Batch: {education?.batch || 'No batch'} | Semester: {education?.currentSemester || 'No semester'}</p>
          </div>
        </div>

        <div className="resume-section">
          <h2>Achievement Summary</h2>
          <div className="achievement-summary">
            <div className="summary-item">
              <strong>Total Achievements:</strong> {achievements?.total || 0}
            </div>
            <div className="summary-item">
              <strong>Total Points:</strong> {achievements?.points || 0}
            </div>
            <div className="summary-item">
              <strong>Categories:</strong> {achievements?.categories?.join(', ') || 'None'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="resume-builder">
      <div className="builder-header">
        <h1>AI Resume Builder</h1>
        <p>Generate professional resumes using ML-powered achievement analysis</p>
      </div>

      <div className="builder-tabs">
        <button
          className={`tab-button ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          Build Resume
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Resume History ({resumeHistory.length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'builder' && (
        <div className="builder-content">
          <div className="builder-sidebar">
            <div className="form-section">
              <h3>Resume Settings</h3>
              
              <div className="form-group">
                <label>Select Template</label>
                <div className="template-grid">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Job Description (Optional)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here to optimize your resume for ATS..."
                  rows={6}
                />
                <small>AI will customize your resume based on job requirements</small>
              </div>

              <button
                className="generate-btn"
                onClick={generateResume}
                disabled={generating || !studentId}
              >
                {generating ? 'Generating...' : 'Generate Resume'}
              </button>

              {resumeData && (
                <div className="preview-actions">
                  <button
                    className="download-btn"
                    onClick={() => downloadPDF(resumeData.id)}
                  >
                    Download PDF
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>
              )}
            </div>

            {resumeData && (
              <div className="analysis-section">
                <h3>AI Analysis Results</h3>
                <div className="analysis-stats">
                  <div className="stat-item">
                    <span className="stat-label">Skills Extracted:</span>
                    <span className="stat-value">{resumeData.skills?.length || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Achievements:</span>
                    <span className="stat-value">{resumeData.achievements?.total || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Points:</span>
                    <span className="stat-value">{resumeData.achievements?.points || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="builder-main">
            {showPreview && resumeData ? (
              <div className="preview-container">
                <div className="preview-header">
                  <h3>Resume Preview</h3>
                  <span className="template-badge">{selectedTemplate}</span>
                </div>
                {renderResumePreview()}
              </div>
            ) : (
              <div className="placeholder">
                <div className="placeholder-icon">📄</div>
                <h3>Your resume preview will appear here</h3>
                <p>Generate a resume to see the AI-powered preview</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-content">
          {!studentId ? (
            <div className="loading">Loading student profile...</div>
          ) : loading ? (
            <div className="loading">Loading resume history...</div>
          ) : resumeHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No resumes generated yet</h3>
              <p>Start by generating your first AI-powered resume</p>
              <button
                className="generate-btn"
                onClick={() => setActiveTab('builder')}
              >
                Generate Resume
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {resumeHistory.map(resume => (
                <div key={resume.id} className="history-card">
                  <div className="card-header">
                    <h4>{resume.template.charAt(0).toUpperCase() + resume.template.slice(1)} Template</h4>
                    <span className="date">
                      {new Date(resume.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="label">Skills:</span>
                      <span className="value">{resume.skillCount}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Points:</span>
                      <span className="value">{resume.totalPoints}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="load-btn"
                      onClick={() => loadResume(resume)}
                    >
                      Load
                    </button>
                    <button
                      className="download-btn"
                      onClick={() => downloadPDF(resume.id)}
                    >
                      PDF
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteResume(resume.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
