import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import Home from './pages/Admin/Home';
import Email from './pages/Admin/Email';
import ChatHistory from './pages/Admin/ChatHistory';
import BlockedUsers from './pages/Admin/BlockedUsers';
import UserActivity from './pages/Admin/UserActivity';
import Analytics from './pages/Admin/Analytics';
import Reports from './pages/Admin/Reports';
import DeletedEmails from './pages/Admin/DeletedEmails';
import IndexPage from './pages/IndexPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 'user' or 'admin'

  useEffect(() => {
    // Check authentication status on mount
    const userId = localStorage.getItem('userId');
    const storedUserType = localStorage.getItem('userType');
    if (userId && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    setIsAuthenticated(false);
    setUserType(null);
  };

  

  // PrivateRoute component for protected routes
  const PrivateRoute = ({ element, isAdminRoute }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (isAdminRoute && userType !== 'admin') {
      return <Navigate to="/user" />; // Redirect non-admins to user page
    }
    return React.cloneElement(element, { handleLogout }); // Pass logout to protected pages
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<IndexPage />} />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                userType === 'admin' ? <Navigate to="/home" /> : <Navigate to="/user" />
              ) : (
                <LoginPage setIsAuthenticated={setIsAuthenticated} setUserType={setUserType} />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? (
                userType === 'admin' ? <Navigate to="/home" /> : <Navigate to="/user" />
              ) : (
                <RegisterPage setIsAuthenticated={setIsAuthenticated} setUserType={setUserType} />
              )
            } 
          />

          {/* User Route */}
          <Route 
            path="/user" 
            element={<PrivateRoute element={<UserPage />} isAdminRoute={false} />}
          />

          {/* Admin Routes */}
          <Route 
            path="/home" 
            element={<PrivateRoute element={<Home />} isAdminRoute={true} />}
          />
          <Route 
            path="/email" 
            element={<PrivateRoute element={<Email />} isAdminRoute={true} />}
          />
          <Route 
            path="/chat-history" 
            element={<PrivateRoute element={<ChatHistory />} isAdminRoute={true} />}
          />
          <Route 
            path="/blocked-users" 
            element={<PrivateRoute element={<BlockedUsers />} isAdminRoute={true} />}
          />
          <Route 
            path="/user-activity/:userId" 
            element={<PrivateRoute element={<UserActivity />} isAdminRoute={true} />}
          />
          <Route 
            path="/analytics" 
            element={<PrivateRoute element={<Analytics />} isAdminRoute={true} />}
          />
          <Route 
            path="/reports" 
            element={<PrivateRoute element={<Reports />} isAdminRoute={true} />}
          />
          <Route 
            path="/deleted-emails" 
            element={<PrivateRoute element={<DeletedEmails />} isAdminRoute={true} />}
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;