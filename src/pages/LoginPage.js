import React, { useState } from 'react';
import { loginUser } from '../services/apiService';
import '../style/LoginPage.css';


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const response = await loginUser(email, password);

    if (response.success) {
      alert(`Success: ${response.data.message}`);
      if (response.data.userType === 'admin') {
        window.location.href = '/home' // Redirect to admin page
      }
      else if (response.data.userType === 'user') {
        window.location.href = '/user' // Redirect to user page
      }
      else{
        window.location.href = '/' // Redirect to home page
      }
      
    } else {
      setError(response.data.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className='login-button'>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p className="register-link">
        Create account? <a href="/register">Register here</a>
      </p>
      </div>
    </div>
  );
}

export default LoginPage;
