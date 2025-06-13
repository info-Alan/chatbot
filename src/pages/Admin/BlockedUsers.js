import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';

const API_URL = process.env.REACT_APP_API_URL;

function BlockedUsers({ handleLogout }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/get_blocked_user`);
      const data = await response.json();
      if (data.success && Array.isArray(data.message)) {
        setBlockedUsers(data.message);
        // Log the data to verify user_id and username are present
        console.log('Blocked Users Data:', data.message);
      } else {
        setBlockedUsers([]);
        setError('No blocked users found.');
      }
    } catch (error) {
      setBlockedUsers([]);
      setError('Failed to fetch blocked users.');
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/unblock_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();

      if (data.success) {
        setBlockedUsers((prevUsers) =>
          prevUsers.filter((user) => user.user_id !== userId)
        );
        alert('User unblocked successfully.');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user.');
    }
  };

  const handleViewActivity = (userId) => {
    if (!userId) {
      console.error('Attempted to navigate with undefined userId');
      alert('Cannot view activity: User ID is missing.');
      return;
    }
    console.log('Navigating to User Activity for userId:', userId);
    navigate(`/user-activity/${userId}`);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="blocked-users-section">
            <h2 className="section-title">Blocked Users</h2>

            <div className="blocked-users-table">
              {loading ? (
                <div className="loading">Loading blocked users...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : blockedUsers.length === 0 ? (
                <div className="no-data">No blocked users found.</div>
              ) : (
                <table className="blocked-users-table-content">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedUsers.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.username}</td>
                        <td>
                          <button
                            className="view-activity-btn"
                            onClick={() => handleViewActivity(user.user_id)}
                          >
                            View Activity
                          </button>
                          <button
                            className="unblock-user-btn"
                            onClick={() => handleUnblockUser(user.user_id)}
                          >
                            Unblock User
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default BlockedUsers;