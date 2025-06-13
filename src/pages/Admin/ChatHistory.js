import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';

const API_URL = process.env.REACT_APP_API_URL;

function ChatHistory({ handleLogout }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/get_all_chat_history`);
      const data = await response.json();
      if (data.success) {
        setChats(data.message);
        setFilteredChats(data.message);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    const filtered = chats.filter(chat =>
      chat.query.toLowerCase().includes(term.toLowerCase()) ||
      chat.response.toLowerCase().includes(term.toLowerCase()) ||
      chat.date.toLowerCase().includes(term.toLowerCase()) ||
      chat.username.toLowerCase().includes(term.toLowerCase()) // Search by username instead of user_id
    );
    setFilteredChats(filtered);
  };

  const handleBlockUser = async (userId, event) => {
    event.stopPropagation(); // Prevent row click when blocking
    try {
      const response = await fetch(`${API_URL}/block_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      alert(data.message);
      fetchChatHistory();
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user.');
    }
  };

  const handleRowClick = (chat) => {
    setSelectedChat(chat);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="chat-history-section">
            <h2 className="section-title">Chat History</h2>

            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search chats by query, response, date, or username..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Chat History Table */}
            <div className="chat-table">
              {loading ? (
                <div className="loading">Loading chat history...</div>
              ) : filteredChats.length > 0 ? (
                <table className="chat-table-content">
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Response</th>
                      <th>Date</th>
                      <th>Username</th> {/* Changed from User ID to Username */}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChats.map((chat) => (
                      <tr
                        key={chat.user_id} // Still use user_id as key for uniqueness
                        className="clickable-row"
                        onClick={() => handleRowClick(chat)}
                      >
                        <td>
                          {chat.query.length > 50
                            ? `${chat.query.substring(0, 50)}...`
                            : chat.query}
                        </td>
                        <td>
                          {chat.response.length > 50
                            ? `${chat.response.substring(0, 50)}...`
                            : chat.response}
                        </td>
                        <td>{chat.date}</td>
                        <td>{chat.username}</td> {/* Display username instead of user_id */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="block-user-btn"
                            onClick={(e) => handleBlockUser(chat.user_id, e)} // Still use user_id for blocking
                          >
                            Block User
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No chat history found.</div>
              )}
            </div>
          </section>

          {/* Enhanced Full-Screen Modal */}
          {selectedChat && (
            <div className="modal-overlay fullscreen">
              <div className="chat-modal fullscreen">
                <div className="modal-header">
                  <h2 className="modal-title">Chat Details</h2>
                  <button
                    className="modal-close-icon"
                    onClick={() => setSelectedChat(null)}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="chat-metadata">
                    <p className="metadata-item">
                      <span className="detail-label">Query:</span>
                      <span className="detail-value">{selectedChat.query}</span>
                    </p>
                    <p className="metadata-item">
                      <span className="detail-label">Response:</span>
                      <span className="detail-value">{selectedChat.response}</span>
                    </p>
                    <p className="metadata-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{selectedChat.date}</span>
                    </p>
                    <p className="metadata-item">
                      <span className="detail-label">Username:</span> {/* Changed from User ID to Username */}
                      <span className="detail-value">{selectedChat.username}</span> {/* Display username */}
                    </p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="modal-close-btn"
                    onClick={() => setSelectedChat(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ChatHistory;