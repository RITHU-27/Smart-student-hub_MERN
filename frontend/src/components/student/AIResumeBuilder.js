import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../styles/AdminPanel.css';
import { API_BASE_URL } from '../../utils/constants';

const AIResumeBuilder = () => {
  const [studentData, setStudentData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeContent, setResumeContent] = useState(null);
  
  // Form states
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [jobDescription, setJobDescription] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [resumeScore, setResumeScore] = useState(null);
  
  // AI Features states
  const [skillsAnalysis, setSkillsAnalysis] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [skillsRecommendations, setSkillsRecommendations] = useState(null);
  const [careerObjective, setCareerObjective] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get student profile
      const profileResponse = await axios.get(`${API_BASE_URL}/api/test/get-profile-dynamic?email=${user?.email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Get achievements
      const achievementsResponse = await axios.get(`${API_BASE_URL}/api/achievements/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setStudentData(profileResponse.data.student);
      setAchievements(achievementsResponse.data.achievements || []);
      
    } catch (error) {
      console.error('Error loading student data:', error);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [user?.email, token]);

  useEffect(() => {
    loadStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStudentData]);

  const generateResume = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await axios.post(`${API_BASE_URL}/api/ai-resume/generate-ai-resume`, {
        studentId: studentData._id,
        template: selectedTemplate,
        jobDescription: jobDescription,
        useAI: useAI
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResumeContent(response.data.content);
      setSuccess('AI Resume generated successfully!');
      
      // Generate resume score
      const scoreResponse = await axios.post(`${API_BASE_URL}/api/ai-resume/resume-score`, {
        resumeContent: response.data.content
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResumeScore(scoreResponse.data.score);
      
    } catch (error) {
      console.error('Error generating resume:', error);
      setError(error.response?.data?.message || 'Failed to generate resume');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkills = async () => {
    try {
      const allText = achievements.map(a => `${a.title} ${a.description || ''}`).join(' ');
      
      const response = await axios.post(`${API_BASE_URL}/api/ai-resume/analyze-skills`, {
        text: allText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSkillsAnalysis(response.data.skills);
      
    } catch (error) {
      console.error('Error analyzing skills:', error);
      setError('Failed to analyze skills');
    }
  };

  const generateAIInsights = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-resume/ai-insights`, {
        achievements: achievements
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setAiInsights(response.data.insights);
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setError('Failed to generate AI insights');
    }
  };

  const getSkillsRecommendations = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-resume/skills-recommendations`, {
        currentSkills: skillsAnalysis,
        jobDescription: jobDescription
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSkillsRecommendations(response.data.recommendations);
      
    } catch (error) {
      console.error('Error getting skills recommendations:', error);
      setError('Failed to get skills recommendations');
    }
  };

  const generateCareerObjective = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-resume/career-objective`, {
        studentProfile: {
          name: studentData.user.name,
          department: studentData.department
        },
        skills: skillsAnalysis,
        achievements: achievements,
        jobDescription: jobDescription
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setCareerObjective(response.data.careerObjective);
      
    } catch (error) {
      console.error('Error generating career objective:', error);
      setError('Failed to generate career objective');
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      
      // Create a simple PDF download (in production, use proper PDF generation)
      const resumeText = formatResumeForDownload(resumeContent);
      const blob = new Blob([resumeText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentData.user.name}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Resume downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      setError('Failed to download resume');
    } finally {
      setLoading(false);
    }
  };

  const formatResumeForDownload = (content) => {
    if (!content) return '';
    
    let text = '';
    
    // Header
    if (content.header) {
      text += `${content.header.name}\n`;
      text += `${content.header.email} | ${content.header.phone}\n`;
      text += `${content.header.department}\n\n`;
    }
    
    // Summary
    if (content.summary) {
      text += `PROFESSIONAL SUMMARY\n${content.summary}\n\n`;
    }
    
    // Career Objective
    if (content.careerObjective) {
      text += `CAREER OBJECTIVE\n${content.careerObjective}\n\n`;
    }
    
    // Skills
    if (content.skills) {
      text += `SKILLS\n`;
      Object.entries(content.skills).forEach(([category, skills]) => {
        if (skills.length > 0) {
          text += `${category.toUpperCase()}: ${skills.map(s => s.name).join(', ')}\n`;
        }
      });
      text += '\n';
    }
    
    // Experience/Achievements
    if (content.experience) {
      text += `ACHIEVEMENTS\n`;
      Object.entries(content.experience).forEach(([category, achievements]) => {
        achievements.forEach(achievement => {
          text += `• ${achievement.title}\n`;
          text += `  ${achievement.description}\n`;
          if (achievement.organization) {
            text += `  ${achievement.organization} | ${achievement.date}\n`;
          }
          text += '\n';
        });
      });
    }
    
    // Education
    if (content.education) {
      text += `EDUCATION\n`;
      text += `${content.education.institution}\n`;
      text += `${content.education.department} - ${content.education.studentId}\n`;
      text += `Semester: ${content.education.currentSemester}, Batch: ${content.education.batch}\n\n`;
    }
    
    return text;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#28a745';
    if (score >= 80) return '#17a2b8';
    if (score >= 70) return '#ffc107';
    if (score >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  if (loading && !studentData) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading AI Resume Builder...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Smart Student Hub</h2>
          <p>AI Resume Builder</p>
        </div>

        <nav className="admin-nav">
          <ul>
            <li>
              <a href="/dashboard">📊 Dashboard</a>
            </li>
            <li className="active">
              <a href="/ai-resume">🤖 AI Resume</a>
            </li>
            <li>
              <a href="/all-achievements">🏆 Achievements</a>
            </li>
            <li>
              <a href="/resume-builder">📄 Resume Builder</a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>🤖 AI-Powered Resume Builder</h1>
          <p>Generate professional resumes with advanced ML algorithms</p>
        </header>

        {/* Error and Success Messages */}
        {error && (
          <div className="admin-alert admin-alert-error">
            <span className="admin-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="admin-alert admin-alert-success">
            <span className="admin-alert-icon">✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Resume Generation Section */}
        <section className="resume-builder-section">
          <div className="section-header">
            <h2>🚀 Generate AI Resume</h2>
            <p>Use machine learning to create a professional resume</p>
          </div>

          <div className="admin-card">
            <div className="admin-card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Resume Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="admin-select"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="technical">Technical</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Use AI Enhancement</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="useAI"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                    />
                    <label htmlFor="useAI" className="toggle-label"></label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Job Description (Optional - for tailored resume)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here to get a tailored resume..."
                  className="admin-textarea"
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button
                  onClick={generateResume}
                  disabled={loading || !studentData}
                  className="admin-btn admin-btn-primary admin-btn-lg"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Generating AI Resume...
                    </>
                  ) : (
                    <>
                      🤖 Generate AI Resume
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI Analysis Section */}
        {studentData && (
          <section className="ai-analysis-section">
            <div className="section-header">
              <h2>🧠 AI Analysis Tools</h2>
              <p>Advanced ML-powered analysis and recommendations</p>
            </div>

            <div className="admin-grid">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>🔍 Skills Analysis</h3>
                  <p>Extract and analyze technical skills</p>
                </div>
                <div className="admin-card-body">
                  <button
                    onClick={analyzeSkills}
                    disabled={loading}
                    className="admin-btn admin-btn-info"
                  >
                    Analyze Skills
                  </button>
                  {skillsAnalysis.length > 0 && (
                    <div className="skills-analysis-results">
                      <h4>Detected Skills ({skillsAnalysis.length})</h4>
                      <div className="skills-grid">
                        {skillsAnalysis.slice(0, 10).map((skill, index) => (
                          <div key={index} className="skill-badge">
                            <span className="skill-name">{skill.name}</span>
                            <span className="skill-confidence">
                              {Math.round(skill.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>💡 AI Insights</h3>
                  <p>Get intelligent insights about your profile</p>
                </div>
                <div className="admin-card-body">
                  <button
                    onClick={generateAIInsights}
                    disabled={loading}
                    className="admin-btn admin-btn-info"
                  >
                    Generate Insights
                  </button>
                  {aiInsights.length > 0 && (
                    <div className="ai-insights-results">
                      {aiInsights.map((insight, index) => (
                        <div key={index} className="insight-item">
                          <div className="insight-type">{insight.type}</div>
                          <div className="insight-message">{insight.message}</div>
                          <div className="insight-confidence">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>📚 Skills Recommendations</h3>
                  <p>Get personalized skill recommendations</p>
                </div>
                <div className="admin-card-body">
                  <button
                    onClick={getSkillsRecommendations}
                    disabled={loading || skillsAnalysis.length === 0}
                    className="admin-btn admin-btn-info"
                  >
                    Get Recommendations
                  </button>
                  {skillsRecommendations && (
                    <div className="skills-recommendations">
                      <div className="recommendation-section">
                        <h4>Suggested Skills</h4>
                        {skillsRecommendations.suggestedSkills.map((skill, index) => (
                          <div key={index} className="recommendation-item">
                            <span className="skill-name">{skill.name}</span>
                            <span className="skill-reason">{skill.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>🎯 Career Objective</h3>
                  <p>Generate AI-powered career objective</p>
                </div>
                <div className="admin-card-body">
                  <button
                    onClick={generateCareerObjective}
                    disabled={loading || skillsAnalysis.length === 0}
                    className="admin-btn admin-btn-info"
                  >
                    Generate Objective
                  </button>
                  {careerObjective && (
                    <div className="career-objective-result">
                      <h4>AI-Generated Career Objective</h4>
                      <p>{careerObjective}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Resume Preview Section */}
        {resumeContent && (
          <section className="resume-preview-section">
            <div className="section-header">
              <h2>📄 Resume Preview</h2>
              <div className="section-actions">
                {resumeScore && (
                  <div className="resume-score-badge" style={{ backgroundColor: getScoreColor(resumeScore.score) }}>
                    <span className="score-grade">{getScoreGrade(resumeScore.score)}</span>
                    <span className="score-value">{resumeScore.score}/100</span>
                  </div>
                )}
                <button
                  onClick={downloadPDF}
                  disabled={loading}
                  className="admin-btn admin-btn-success"
                >
                  📥 Download Resume
                </button>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-body">
                <div className="resume-preview">
                  {/* Header */}
                  {resumeContent.header && (
                    <div className="resume-header">
                      <h3>{resumeContent.header.name}</h3>
                      <p>{resumeContent.header.email} | {resumeContent.header.phone}</p>
                      <p>{resumeContent.header.department}</p>
                    </div>
                  )}

                  {/* Summary */}
                  {resumeContent.summary && (
                    <div className="resume-section">
                      <h4>Professional Summary</h4>
                      <p>{resumeContent.summary}</p>
                    </div>
                  )}

                  {/* Career Objective */}
                  {resumeContent.careerObjective && (
                    <div className="resume-section">
                      <h4>Career Objective</h4>
                      <p>{resumeContent.careerObjective}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {resumeContent.skills && (
                    <div className="resume-section">
                      <h4>Skills</h4>
                      {Object.entries(resumeContent.skills).map(([category, skills]) => (
                        <div key={category} className="skill-category">
                          <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                          <div className="skill-list">
                            {skills.map((skill, index) => (
                              <span key={index} className="skill-tag">{skill.name}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Experience/Achievements */}
                  {resumeContent.experience && (
                    <div className="resume-section">
                      <h4>Achievements</h4>
                      {Object.entries(resumeContent.experience).map(([category, achievements]) => (
                        <div key={category}>
                          <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                          {achievements.map((achievement, index) => (
                            <div key={index} className="achievement-item">
                              <h6>{achievement.title}</h6>
                              <p>{achievement.description}</p>
                              {achievement.organization && (
                                <small>{achievement.organization} | {achievement.date}</small>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {resumeContent.education && (
                    <div className="resume-section">
                      <h4>Education</h4>
                      <p><strong>{resumeContent.education.institution}</strong></p>
                      <p>{resumeContent.education.department} - {resumeContent.education.studentId}</p>
                      <p>Semester: {resumeContent.education.currentSemester}, Batch: {resumeContent.education.batch}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Resume Score Details */}
        {resumeScore && (
          <section className="resume-score-section">
            <div className="section-header">
              <h2>📊 Resume Quality Analysis</h2>
              <p>ML-powered resume quality assessment</p>
            </div>

            <div className="admin-card">
              <div className="admin-card-body">
                <div className="score-overview">
                  <div className="score-circle" style={{ borderColor: getScoreColor(resumeScore.score) }}>
                    <span className="score-grade-large" style={{ color: getScoreColor(resumeScore.score) }}>
                      {getScoreGrade(resumeScore.score)}
                    </span>
                    <span className="score-value-large">{resumeScore.score}/100</span>
                  </div>
                  <div className="score-feedback">
                    <h3>Quality Assessment</h3>
                    <p>{resumeScore.feedback}</p>
                  </div>
                </div>

                {resumeScore.recommendations && resumeScore.recommendations.length > 0 && (
                  <div className="improvement-suggestions">
                    <h4>💡 Improvement Suggestions</h4>
                    <ul>
                      {resumeScore.recommendations.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AIResumeBuilder;
