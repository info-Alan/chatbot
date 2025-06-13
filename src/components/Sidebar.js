// src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../style/Admin.css'; // Assuming styles are here

function Sidebar({ handleLogout }) {
  const menuItems = [
    { path: '/home', label: 'Dashboard', icon: '🏠' },
    { path: '/email', label: 'Email', icon: '✉️' },
    { path: '/chat-history', label: 'Chat History', icon: '💬' },
    { path: '/blocked-users', label: 'Blocked Users', icon: '🚫' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/reports', label: 'Reports', icon: '📋' },
    { path: '/deleted-emails', label: 'Deleted Emails', icon: '🗑️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Admin Panel</h2>
      </div>
      <nav className="sidebar-menu">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.label}</span>
              </NavLink>
            </li>
          ))}
          {/* <li>
            <button className="menu-item logout-btn" onClick={handleLogout}>
              <span className="menu-icon">↩</span>
              <span className="menu-text">Logout</span>
            </button>
          </li> */}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;