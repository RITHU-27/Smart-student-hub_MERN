import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/AddAchievement.css';
import { API_BASE_URL } from '../../utils/constants';
import { calculateActivityPoints, getSubCategories } from '../../utils/activityPointsCalculator';

const AddAchievement = ({ onClose, onSuccess, userEmail }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'academic',
    subCategory: 'certification',
    description: '',
    date: '',
    organization: '',
    level: 'college',
    credits: 0,
    certificateUrl: '',
    email: userEmail || '' // Initialize with the passed email
  });
  
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [creditsUpdated, setCreditsUpdated] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Update email in formData when prop changes
  useEffect(() => {
    if (userEmail && userEmail !== formData.email) {
      setFormData(prev => ({
        ...prev,
        email: userEmail
      }));
    }
  }, [userEmail, formData.email]);

  // Update available subcategories when category changes
  useEffect(() => {
    const subCategories = getSubCategories(formData.category);
    setAvailableSubCategories(subCategories);
    
    // Reset subcategory if current one is not available in new category
    if (!subCategories.includes(formData.subCategory)) {
      setFormData(prev => ({
        ...prev,
        subCategory: subCategories[0] || 'other'
      }));
    }
  }, [formData.category, formData.subCategory]);

  // Automatically calculate credits when category, subcategory, or level changes
  useEffect(() => {
    const calculatedCredits = calculateActivityPoints(
      formData.category,
      formData.subCategory,
      formData.level
    );
    
    setFormData(prev => ({
      ...prev,
      credits: calculatedCredits
    }));
    
    // Trigger animation for credits update
    setCreditsUpdated(true);
    setTimeout(() => setCreditsUpdated(false), 500);
  }, [formData.category, formData.subCategory, formData.level]);

  const [certificateFile, setCertificateFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Close on ESC key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? Number(value) : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setCertificateFile(file);
      setError('');
      // Clear certificate file error when file is selected
      if (errors.certificateFile) {
        setErrors(prev => ({ ...prev, certificateFile: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    // Organization validation
    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required';
    }
    
    // Certificate file validation (MANDATORY)
    if (!certificateFile) {
      newErrors.certificateFile = 'Certificate upload is mandatory';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setUploadProgress(0);
    
    // Ensure email is present
    if (!formData.email && !userEmail) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    try {
      // Certificate is now mandatory, so always use file upload
      if (certificateFile) {
        // Use FormData for file upload
        const uploadData = new FormData();
        uploadData.append('certificate', certificateFile);
        
        // Add email explicitly
        uploadData.append('email', userEmail || formData.email);
        
        // Add all form fields
        Object.keys(formData).forEach(key => {
          if (key !== 'email') { // Skip email as already added
            uploadData.append(key, formData[key]);
          }
        });

        // Log for debugging
        console.log("Submitting with certificate and email:", userEmail || formData.email);

        await axios.post(
          `${API_BASE_URL}/api/test/upload-achievement`,
          uploadData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
              setUploadProgress(percentCompleted);
            }
          }
        );

        onSuccess?.();
        onClose();
      } else {
        // This case should not happen due to validation, but handle it gracefully
        setError('Certificate upload is mandatory. Please select a file.');
      }
    } catch (err) {
      console.error('Error creating achievement:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create achievement';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <h2>Add New Achievement</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {/* Hidden email field */}
            <input 
              type="hidden" 
              name="email" 
              value={formData.email} 
            />
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Won Hackathon 2024"
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="academic">Academic</option>
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                  <option value="technical">Technical</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sub Category *</label>
                <select name="subCategory" value={formData.subCategory} onChange={handleChange}>
                  {availableSubCategories.map(subCat => (
                    <option key={subCat} value={subCat}>
                      {subCat.charAt(0).toUpperCase() + subCat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of your achievement"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                {errors.date && <span className="field-error">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label>Level *</label>
                <select name="level" value={formData.level} onChange={handleChange}>
                  <option value="international">International</option>
                  <option value="national">National</option>
                  <option value="state">State</option>
                  <option value="district">District</option>
                  <option value="college">College</option>
                  <option value="department">Department</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Organization</label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="Organizing body"
                />
                {errors.organization && <span className="field-error">{errors.organization}</span>}
              </div>

              <div className="form-group">
                <label>Activity Points</label>
                <div className={`credits-display ${creditsUpdated ? 'points-updated' : ''}`}>
                  <span className="credits-value">{formData.credits} points</span>
                  <small className="credits-info">
                    Based on {formData.category} - {formData.subCategory} - {formData.level}
                  </small>
                </div>
              </div>
            </div>

            {/* Certificate Upload Section */}
            <div className="certificate-section">
              <h3>Certificate Upload <span className="required">*</span></h3>
              
              <div className="form-group">
                <label>Upload Certificate (Image/PDF) <span className="required">*</span></label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className={`file-input ${errors.certificateFile ? 'error' : ''}`}
                  required
                />
                {errors.certificateFile && (
                  <span className="field-error">{errors.certificateFile}</span>
                )}
                {certificateFile && (
                  <p className="file-name">Selected: {certificateFile.name}</p>
                )}
              </div>

              <div className="form-group">
                <label>Certificate Verification URL (Optional)</label>
                <input
                  type="url"
                  name="certificateUrl"
                  value={formData.certificateUrl}
                  onChange={handleChange}
                  placeholder="e.g., https://coursera.org/verify/ABC123"
                />
                <small>Enter verification URL from Coursera, NPTEL, Udemy, etc.</small>
              </div>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                  {uploadProgress}%
                </div>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Adding...' : 'Add Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAchievement;
