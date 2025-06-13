import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';

const API_URL = process.env.REACT_APP_API_URL;

function UserActivity({ handleLogout }) {
  const { userId } = useParams();
  const [activity, setActivity] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnblockMessage, setShowUnblockMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UserActivity mounted with userId from useParams:', userId);

    const fetchUserActivity = async () => {
      if (!userId || userId === 'undefined') {
        setError('Invalid or missing userId.');
        setLoading(false);
        console.error('No valid userId provided:', userId);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching user activity for userId:', userId);
        const response = await fetch(`${API_URL}/get_user_activity?userId=${userId}`);
        const data = await response.json();
        console.log('API Response:', data);
        if (data.success) {
          if (data.data.length > 0) {
            setActivity(data.data);
            setUsername(data.data[0].username || 'Unknown User');
          } else {
            setError('No activity found for this user.');
          }
        } else {
          setError(data.message || 'Failed to fetch user activity.');
        }
      } catch (error) {
        setError('Network error while fetching user activity.');
        console.error('Error fetching user activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [userId]);

  const handleUnblockUser = async () => {
    try {
      const response = await fetch(`${API_URL}/unblock_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();

      if (data.success) {
        setShowUnblockMessage(true);
        setTimeout(() => {
          setShowUnblockMessage(false);
          navigate('/blocked-users');
        }, 2000);
      } else {
        alert(data.message || 'Failed to unblock user.');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user.');
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="user-activity-section">
            <div className="user-activity-header">
              <h2 className="section-title">User Activity - {username || 'Unknown User'}</h2>
              <button className="unblock-user-btn" onClick={handleUnblockUser}>
                Unblock User
              </button>
            </div>

            <div className="user-activity-table">
              {loading ? (
                <div className="loading">Loading user activity...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : activity.length > 0 ? (
                <table className="user-activity-table-content">
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Response</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((log, index) => (
                      <tr key={index}>
                        <td>{log.query}</td>
                        <td>{log.response}</td>
                        <td>{log.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No user activity found.</div>
              )}
            </div>
          </section>

          {showUnblockMessage && (
            <div className="modal-overlay">
              <div className="modal-content success-modal">
                <h2 className="modal-title">User Unblocked</h2>
                <p className="modal-message">The user {username || 'with User ID ' + userId} has been successfully unblocked.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UserActivity;