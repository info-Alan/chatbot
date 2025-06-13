import React from 'react';
import { Link } from 'react-router-dom';
import '../style/IndexPage.css'; // New CSS file

function IndexPage() {
  return (
    <div className="index-page">
      <h1>Welcome to Email Assistant</h1>
      <p>Your smart email companion awaits!</p>
      <div className="auth-buttons">
        <Link to="/login" className="auth-btn login-btn">Login</Link>
        <Link to="/register" className="auth-btn register-btn">Register</Link>
      </div>
    </div>
  );
}

export default IndexPage;