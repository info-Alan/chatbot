import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';

const API_URL = process.env.REACT_APP_API_URL;

function Reports({ handleLogout }) {
  const [emails, setEmails] = useState([]);
  const [chats, setChats] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('emails');

  const [emailFilters, setEmailFilters] = useState({ startDate: '', endDate: '', year: '', month: '', day: '' });
  const [chatFilters, setChatFilters] = useState({ startDate: '', endDate: '', year: '', month: '', day: '' });
  const [blockedFilters, setBlockedFilters] = useState({ startDate: '', endDate: '', year: '', month: '', day: '' });

  const ROW_LIMIT = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [emailRes, chatRes, blockedRes] = await Promise.all([
        fetch(`${API_URL}/get_all_email`).then(res => res.json()),
        fetch(`${API_URL}/get_all_chat_history`).then(res => res.json()),
        fetch(`${API_URL}/get_blocked_user`).then(res => res.json()),
      ]);

      if (!emailRes.success || !chatRes.success || !blockedRes.success) {
        throw new Error("Failed to fetch report data.");
      }

      setEmails(emailRes.message);
      setChats(chatRes.message);
      setBlockedUsers(blockedRes.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data, filters) => {
    return data.filter(item => {
      const itemDate = new Date(item.date);
      const { startDate, endDate, year, month, day } = filters;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (itemDate < start || itemDate > end) return false;
      }
      if (year && itemDate.getFullYear() !== parseInt(year)) return false;
      if (month && itemDate.getMonth() !== parseInt(month) - 1) return false;
      if (day && itemDate.getDate() !== parseInt(day)) return false;

      return true;
    });
  };

  const handleFilterChange = (e, setFilters) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getUniqueValues = (data, key) => {
    const values = [...new Set(data.map(item => {
      const date = new Date(item.date);
      switch (key) {
        case 'year': return date.getFullYear();
        case 'month': return date.getMonth() + 1; // 1-12
        case 'day': return date.getDate();
        default: return null;
      }
    }).filter(v => v !== null))];
    return values.sort((a, b) => a - b);
  };

  const filteredEmails = applyFilters(emails, emailFilters);
  const filteredChats = applyFilters(chats, chatFilters);
  const filteredBlocked = applyFilters(blockedUsers, blockedFilters);

  const downloadPDF = (data, title, headers) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 10);
    doc.autoTable({
      startY: 20,
      head: [headers],
      body: data.map(item => headers.map(h => {
        const keyMap = {
          'Sender': 'sender',
          'Subject': 'subject',
          'Date': 'date',
          'Body': 'body',
          'UID': 'uid',
          'Query': 'query',
          'Response': 'response',
          'Username': 'username', // Changed to Username
        };
        return item[keyMap[h]] || '';
      })),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });
    doc.save(`${title}.pdf`);
  };

  const generateCSVData = (data, headers) => {
    const keyMap = {
      'Sender': 'sender',
      'Subject': 'subject',
      'Date': 'date',
      'Body': 'body',
      'UID': 'uid',
      'Query': 'query',
      'Response': 'response',
      'Username': 'username', // Changed to Username
    };
    return [headers, ...data.map(item => headers.map(h => item[keyMap[h]] || ''))];
  };

  const ReportTab = ({ title, data, headers, filters, setFilters, type }) => {
    const years = getUniqueValues(data, 'year');
    const months = getUniqueValues(data, 'month');
    const days = getUniqueValues(data, 'day');

    const keyMap = {
      'Sender': 'sender',
      'Subject': 'subject',
      'Date': 'date',
      'Body': 'body',
      'UID': 'uid',
      'Query': 'query',
      'Response': 'response',
      'Username': 'username', // Changed to Username
    };

    return (
      <div className="report-tab-content">
        <div className="report-filter-container">
          <input type="date" name="startDate" value={filters.startDate} onChange={(e) => handleFilterChange(e, setFilters)} />
          <input type="date" name="endDate" value={filters.endDate} onChange={(e) => handleFilterChange(e, setFilters)} />
          <select name="year" value={filters.year} onChange={(e) => handleFilterChange(e, setFilters)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select name="month" value={filters.month} onChange={(e) => handleFilterChange(e, setFilters)}>
            <option value="">All Months</option>
            {months.map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select name="day" value={filters.day} onChange={(e) => handleFilterChange(e, setFilters)}>
            <option value="">All Days</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>{headers.map((header, index) => <th key={index}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.slice(0, ROW_LIMIT).map((item, index) => (
                  <tr key={index} onClick={() => setSelectedRow({ type, data: item })} className="clickable-row">
                    {headers.map((header, i) => (
                      <td key={i}>{item[keyMap[header]] || ''}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={headers.length} className="no-data">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="report-actions">
          {data.length > ROW_LIMIT && (
            <button className="view-more-btn" onClick={() => setSelectedReport({ title, data, headers, type })}>
              View More
            </button>
          )}
          <button className="download-btn pdf-btn" onClick={() => downloadPDF(data, title, headers)}>
            Download PDF
          </button>
          <CSVLink
            data={generateCSVData(data, headers)}
            filename={`${title}.csv`}
            className="download-btn csv-btn"
          >
            Download CSV
          </CSVLink>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading Reports...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const emailHeaders = ['Sender', 'Subject', 'Date', 'Body', 'UID'];
  const chatHeaders = ['Query', 'Response', 'Date', 'Username']; // Changed to Username
  const blockedHeaders = ['Username', 'Date']; // Changed to Username

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="reports-section">
            <h2 className="section-title">Detailed Reports</h2>
            <div className="tabs-container">
              <div className="tab-header">
                <button
                  className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
                  onClick={() => setActiveTab('emails')}
                >
                  Emails
                </button>
                <button
                  className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chats')}
                >
                  Chat History
                </button>
                <button
                  className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('blocked')}
                >
                  Blocked Users
                </button>
              </div>
              <div className="tab-content">
                {activeTab === 'emails' && (
                  <ReportTab
                    title="Email Report"
                    data={filteredEmails}
                    headers={emailHeaders}
                    filters={emailFilters}
                    setFilters={setEmailFilters}
                    type="email"
                  />
                )}
                {activeTab === 'chats' && (
                  <ReportTab
                    title="Chat History Report"
                    data={filteredChats}
                    headers={chatHeaders}
                    filters={chatFilters}
                    setFilters={setChatFilters}
                    type="chat"
                  />
                )}
                {activeTab === 'blocked' && (
                  <ReportTab
                    title="Blocked Users Report"
                    data={filteredBlocked}
                    headers={blockedHeaders}
                    filters={blockedFilters}
                    setFilters={setBlockedFilters}
                    type="blocked"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Full Report Modal */}
          {selectedReport && (
            <div className="modal-overlay">
              <div className="report-modal">
                <div className="modal-header">
                  <h2 className="modal-title">{selectedReport.title}</h2>
                  <button className="modal-close-icon" onClick={() => setSelectedReport(null)} aria-label="Close modal">
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="report-table-wrapper">
                    <table className="report-table full-report">
                      <thead>
                        <tr>{selectedReport.headers.map((header, index) => <th key={index}>{header}</th>)}</tr>
                      </thead>
                      <tbody>
                        {selectedReport.data.map((item, index) => (
                          <tr key={index} onClick={() => setSelectedRow({ type: selectedReport.type, data: item })} className="clickable-row">
                            {selectedReport.headers.map((header, i) => (
                              <td key={i}>{item[keyMap[header]] || ''}</td> // Use keyMap here too
                            ))}
                          </tr>
                        ))}
                        {selectedReport.data.length === 0 && (
                          <tr><td colSpan={selectedReport.headers.length} className="no-data">No data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="download-btn pdf-btn" onClick={() => downloadPDF(selectedReport.data, selectedReport.title, selectedReport.headers)}>
                    Download PDF
                  </button>
                  <CSVLink
                    data={generateCSVData(selectedReport.data, selectedReport.headers)}
                    filename={`${selectedReport.title}.csv`}
                    className="download-btn csv-btn"
                  >
                    Download CSV
                  </CSVLink>
                  <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Row Detail Modal */}
          {selectedRow && (
            <div className="modal-overlay">
              <div className="row-detail-modal">
                <div className="modal-header">
                  <h2 className="modal-title">{selectedRow.type === 'email' ? 'Email Details' : selectedRow.type === 'chat' ? 'Chat Details' : 'Blocked User Details'}</h2>
                  <button className="modal-close-icon" onClick={() => setSelectedRow(null)} aria-label="Close modal">
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="row-details">
                    {selectedRow.type === 'email' && (
                      <>
                        <p><span className="detail-label">Sender:</span> {selectedRow.data.sender}</p>
                        <p><span className="detail-label">Subject:</span> {selectedRow.data.subject}</p>
                        <p><span className="detail-label">Date:</span> {selectedRow.data.date}</p>
                        <p><span className="detail-label">Body:</span> {selectedRow.data.body}</p>
                        <p><span className="detail-label">UID:</span> {selectedRow.data.uid}</p>
                      </>
                    )}
                    {selectedRow.type === 'chat' && (
                      <>
                        <p><span className="detail-label">Query:</span> {selectedRow.data.query}</p>
                        <p><span className="detail-label">Response:</span> {selectedRow.data.response}</p>
                        <p><span className="detail-label">Date:</span> {selectedRow.data.date}</p>
                        <p><span className="detail-label">Username:</span> {selectedRow.data.username}</p> {/* Changed to Username */}
                      </>
                    )}
                    {selectedRow.type === 'blocked' && (
                      <>
                        <p><span className="detail-label">Username:</span> {selectedRow.data.username}</p> {/* Changed to Username */}
                        <p><span className="detail-label">Date:</span> {selectedRow.data.date}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="modal-close-btn" onClick={() => setSelectedRow(null)}>
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

const keyMap = {
  'Sender': 'sender',
  'Subject': 'subject',
  'Date': 'date',
  'Body': 'body',
  'UID': 'uid',
  'Query': 'query',
  'Response': 'response',
  'Username': 'username', // Changed to Username
};

export default Reports;