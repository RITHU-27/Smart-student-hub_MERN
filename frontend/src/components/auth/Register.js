import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/Auth.css';
import { API_BASE_URL } from '../../utils/constants';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student specific fields
    studentId: '',
    department: '',
    batch: '',
    semester: '',
    rollNumber: '',
    section: 'A',
    phone: '',
    dateOfBirth: '',
    address: '',
    parentName: '',
    parentPhone: '',
    bloodGroup: '',
    // Admin specific field
    adminCode: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); // eslint-disable-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    // Validate field on blur
    validateField(name, formData[name]);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateField = (name, value) => {
    const fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    switch (name) {
      case 'name':
        if (!value.trim()) {
          fieldErrors[name] = 'Name is required';
        } else if (value.trim().length < 2) {
          fieldErrors[name] = 'Name must be at least 2 characters long';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          fieldErrors[name] = 'Name should only contain letters and spaces';
        }
        break;
      
      case 'email':
        if (!value) {
          fieldErrors[name] = 'Email is required';
        } else if (!emailRegex.test(value)) {
          fieldErrors[name] = 'Please enter a valid email address';
        }
        break;
      
      case 'password':
        if (!value) {
          fieldErrors[name] = 'Password is required';
        } else if (value.length < 8) {
          fieldErrors[name] = 'Password must be at least 8 characters long';
        } else if (!passwordRegex.test(value)) {
          fieldErrors[name] = 'Password must include uppercase, lowercase, number, and special character';
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          fieldErrors[name] = 'Please confirm your password';
        } else if (value !== formData.password) {
          fieldErrors[name] = 'Passwords do not match';
        }
        break;
      
      case 'phone':
        if (!value) {
          fieldErrors[name] = 'Phone number is required';
        } else if (!phoneRegex.test(value)) {
          fieldErrors[name] = 'Please enter a valid 10-digit phone number';
        }
        break;
      
      case 'studentId':
        if (formData.role === 'student' && !value.trim()) {
          fieldErrors[name] = 'Student ID is required';
        } else if (value && !/^[0-9A-Za-z]+$/.test(value)) {
          fieldErrors[name] = 'Student ID should only contain letters and numbers';
        }
        break;
      
      case 'rollNumber':
        if (formData.role === 'student' && !value.trim()) {
          fieldErrors[name] = 'Roll number is required';
        }
        break;
      
      case 'department':
        if (formData.role !== 'admin' && !value) {
          fieldErrors[name] = 'Department is required';
        }
        break;
      
      case 'batch':
        if (formData.role === 'student' && !value) {
          fieldErrors[name] = 'Batch is required';
        }
        break;
      
      case 'semester':
        if (formData.role === 'student' && !value) {
          fieldErrors[name] = 'Semester is required';
        }
        break;
      
      case 'dateOfBirth':
        if (formData.role === 'student' && value) {
          const dob = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          if (age < 16) {
            fieldErrors[name] = 'You must be at least 16 years old to register';
          } else if (age > 100) {
            fieldErrors[name] = 'Please enter a valid date of birth';
          }
        }
        break;
      
      case 'adminCode':
        if (formData.role === 'admin' && !value) {
          fieldErrors[name] = 'Admin code is required';
        } else if (value && value !== 'ADMIN123') {
          fieldErrors[name] = 'Invalid admin code';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
  };

  const validateForm = () => { // eslint-disable-line no-unused-vars
    // Validate all required fields based on role
    const requiredFields = ['name', 'email', 'password', 'confirmPassword'];
    
    if (formData.role === 'student') {
      requiredFields.push('studentId', 'department', 'batch', 'semester', 'rollNumber', 'phone');
    } else if (formData.role === 'faculty') {
      requiredFields.push('department', 'phone');
    } else if (formData.role === 'admin') {
      requiredFields.push('adminCode');
    }

    // Validate each required field
    requiredFields.forEach(field => {
      validateField(field, formData[field]);
    });

    // Return combined errors
    return { ...errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Mark all fields as touched
    const allFields = Object.keys(formData);
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    // Validate all fields
    const requiredFields = ['name', 'email', 'password', 'confirmPassword'];
    if (formData.role === 'student') {
      requiredFields.push('studentId', 'department', 'batch', 'semester', 'rollNumber', 'phone');
    } else if (formData.role === 'faculty') {
      requiredFields.push('department', 'phone');
    } else if (formData.role === 'admin') {
      requiredFields.push('adminCode');
    }

    let hasErrors = false;
    requiredFields.forEach(field => {
      validateField(field, formData[field]);
      if (errors[field]) hasErrors = true;
    });

    if (hasErrors) {
      setLoading(false);
      // Scroll to first error
      const firstErrorField = requiredFields.find(field => errors[field]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      console.log('Sending registration data:', formData);

      await axios.post(`${API_BASE_URL}/api/auth/register`, formData);

      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        if (err.response.data.message.includes('already exists')) {
          setErrors({
            general: 'This email is already registered. Please use a different email or login.'
          });
        } else {
          setErrors({ general: err.response.data.message });
        }
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2>Register for Smart Student Hub</h2>

        {errors.general && <div className="error-message">{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label>I am a:</label>
            <div className="role-selection">
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                />
                <span>Student</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="faculty"
                  checked={formData.role === 'faculty'}
                  onChange={handleChange}
                />
                <span>Faculty</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                />
                <span>Admin</span>
              </label>
            </div>
          </div>

          {/* Common fields */}
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Create password (min 8 chars)"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className={`strength-fill strength-${passwordStrength}`}
                      style={{ width: `${(passwordStrength / 6) * 100}%` }}
                    ></div>
                  </div>
                  <span className="strength-text">
                    {passwordStrength === 0 && 'Very Weak'}
                    {passwordStrength === 1 && 'Weak'}
                    {passwordStrength === 2 && 'Fair'}
                    {passwordStrength === 3 && 'Good'}
                    {passwordStrength === 4 && 'Strong'}
                    {passwordStrength === 5 && 'Very Strong'}
                    {passwordStrength === 6 && 'Excellent'}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Admin Registration Fields */}
          {formData.role === 'admin' && (
            <div className="form-group">
              <label>Admin Access Code *</label>
              <input
                type="password"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleChange}
                placeholder="Enter admin access code"
                className={errors.adminCode ? 'error' : ''}
              />
              {errors.adminCode && <span className="field-error">{errors.adminCode}</span>}
            </div>
          )}
          {/* Faculty Specific Fields */}
{formData.role === 'faculty' && (
  <>
    <div className="form-group">
      <label>Department *</label>
      <select
        name="department"
        value={formData.department}
        onChange={handleChange}
        className={errors.department ? 'error' : ''}
      >
        <option value="">Select Department</option>
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
      {errors.department && <span className="field-error">{errors.department}</span>}
    </div>

    <div className="form-group">
      <label>Phone Number *</label>
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="10-digit phone number"
        maxLength="10"
        className={errors.phone ? 'error' : ''}
      />
      {errors.phone && <span className="field-error">{errors.phone}</span>}
    </div>

    <div className="form-group">
      <label>Address</label>
      <textarea
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Enter your address"
        rows="2"
      />
    </div>
  </>
)}

{/* Student Specific Fields */}
{formData.role === 'student' && (
  <>
    {/* existing student fields here */}
  </>
)}

          {/* Student Specific Fields */}
          {formData.role === 'student' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Student ID *</label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="e.g., 2021CS001"
                    className={errors.studentId ? 'error' : ''}
                  />
                  {errors.studentId && <span className="field-error">{errors.studentId}</span>}
                </div>

                <div className="form-group">
                  <label>Roll Number *</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g., 21CS001"
                    className={errors.rollNumber ? 'error' : ''}
                  />
                  {errors.rollNumber && <span className="field-error">{errors.rollNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={errors.department ? 'error' : ''}
                  >
                    <option value="">Select Department</option>
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
                  {errors.department && <span className="field-error">{errors.department}</span>}
                </div>

                <div className="form-group">
                  <label>Batch *</label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className={errors.batch ? 'error' : ''}
                  >
                    <option value="">Select Batch</option>
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                  {errors.batch && <span className="field-error">{errors.batch}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Current Semester *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className={errors.semester ? 'error' : ''}
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                  {errors.semester && <span className="field-error">{errors.semester}</span>}
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <select name="section" value={formData.section} onChange={handleChange}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    maxLength="10"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Parent/Guardian Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="Parent/Guardian name"
                  />
                </div>

                <div className="form-group">
                  <label>Parent Phone</label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="Parent phone number"
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
