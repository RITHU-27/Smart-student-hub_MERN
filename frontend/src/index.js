import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ Create React root
const root = ReactDOM.createRoot(document.getElementById('root'));

// ✅ Render the App component (which includes all routes: login, register, student, faculty, admin)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Optional: Performance tracking (keep as-is or remove)
reportWebVitals();
