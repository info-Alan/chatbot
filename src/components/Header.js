// src/components/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/Admin.css';

function Header({ handleLogout }) {  // Add handleLogout as a prop
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();  // Call the parent's logout function
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-title">
          <h1>Welcome, Admin</h1>
          <p>Dashboard Overview</p>
        </div>
        <div className="header-actions">
          <span className="user-info">Admin User</span>
          <button className="logout-button" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;