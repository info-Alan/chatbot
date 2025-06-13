import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';

const API_URL = process.env.REACT_APP_API_URL;
const STATIC_URL = process.env.REACT_APP_STATIC_URL;

const VIEWABLE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];

function Email({handleLogout}) {
  const [emails, setEmails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch(`${API_URL}/get_all_email`);
      const data = await response.json();
      if (data.success) {
        setEmails(data.message);
        setFilteredEmails(data.message);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
    setLoading(false);
  };

  const syncEmails = async () => {
    setSyncing(true);
    setSyncProgress(10);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(`${API_URL}/sync_email`);
      const data = await response.json();
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      if (data.success) {
        await fetchEmails(); // Refresh email list after sync
      } else {
        console.error('Sync failed:', data.message);
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
      }, 1000); // Brief delay to show 100% completion
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    const filtered = emails.filter(email =>
      email.sender.toLowerCase().includes(term.toLowerCase()) ||
      email.subject.toLowerCase().includes(term.toLowerCase()) ||
      email.date.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredEmails(filtered);
  };

  const handleRowClick = (email) => {
    setSelectedEmail(email);
  };

  const isViewableAttachment = (contentType) => {
    return VIEWABLE_TYPES.includes(contentType);
  };

  const handleDownload = (filePath, filename) => {
    const downloadUrl = `${API_URL}/download${filePath.split('/attachment')[1]}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="email-section">
            <h2 className="section-title">Email Management</h2>

            {/* Syncing Bar */}
            {syncing && (
              <div className="syncing-bar-container">
                <div className="syncing-bar">
                  <div 
                    className="syncing-progress" 
                    style={{ width: `${syncProgress}%` }}
                  ></div>
                </div>
                <p className="syncing-text">
                  Syncing emails... ({syncProgress}%)
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="controls-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search emails by sender, subject, or date..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={syncing}
              />
              <button 
                className="sync-button"
                onClick={syncEmails}
                disabled={syncing}
              >
                Sync Emails
              </button>
            </div>

            <div className="email-table">
              {loading ? (
                <div className="loading">Loading emails...</div>
              ) : filteredEmails.length > 0 ? (
                <table className="email-table-content">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Subject</th>
                      <th>Date</th>
                      <th>Body</th>
                      <th>Attachments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmails.map((email) => (
                      <tr
                        key={email.id}
                        className="clickable-row"
                        onClick={() => handleRowClick(email)}
                      >
                        <td>{email.sender}</td>
                        <td>{email.subject}</td>
                        <td>{email.date}</td>
                        <td>
                          {email.body && email.body.length > 50
                            ? `${email.body.substring(0, 50)}...`
                            : email.body}
                        </td>
                        <td>
                          {email.attachments.length > 0 ? (
                            <span className="attachment-indicator">
                              📎 ({email.attachments.length})
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No emails found.</div>
              )}
            </div>
          </section>

          {selectedEmail && (
            <div className="modal-overlay fullscreen">
              <div className="email-modal fullscreen">
                <div className="modal-header">
                  <h2 className="modal-title">{selectedEmail.subject}</h2>
                  <button
                    className="modal-close-icon"
                    onClick={() => setSelectedEmail(null)}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="email-metadata">
                    <p className="metadata-item">
                      <span className="detail-label">From:</span>
                      <span className="detail-value">{selectedEmail.sender}</span>
                    </p>
                    <p className="metadata-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{selectedEmail.date}</span>
                    </p>
                  </div>
                  <div className="email-content">
                    <p>{selectedEmail.body}</p>
                  </div>
                  {selectedEmail.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h3>Attachments ({selectedEmail.attachments.length})</h3>
                      <div className="attachments-list">
                        {selectedEmail.attachments.map((attachment) => (
                          <div key={attachment.id} className="attachment-item">
                            <p>{attachment.filename} ({(attachment.size / 1024).toFixed(2)} KB)</p>
                            {isViewableAttachment(attachment.content_type) ? (
                              <div className="attachment-preview">
                                {attachment.content_type === 'application/pdf' ? (
                                  <iframe
                                    src={`${STATIC_URL}${attachment.file_path}`}
                                    title={attachment.filename}
                                    width="100%"
                                    height="300px"
                                  />
                                ) : (
                                  <img
                                    src={`${STATIC_URL}${attachment.file_path}`}
                                    alt={attachment.filename}
                                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                                  />
                                )}
                                <br />
                                <button
                                  className="download-btn"
                                  onClick={() => handleDownload(attachment.file_path, attachment.filename)}
                                >
                                  Download
                                </button>
                              </div>
                            ) : (
                              <button
                                className="download-btn"
                                onClick={() => handleDownload(attachment.file_path, attachment.filename)}
                              >
                                Download {attachment.filename}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    className="modal-close-btn"
                    onClick={() => setSelectedEmail(null)}
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

export default Email;