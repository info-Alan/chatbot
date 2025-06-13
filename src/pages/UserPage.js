// src/pages/UserPage.js
import React, { useState, useEffect, useRef } from 'react';
import '../style/UserPage.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL;

function UserPage({ handleLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState(''); // Changed from browserId to userId
  const [chatHistory, setChatHistory] = useState([]);
  const [keywordData, setKeywordData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const chatBodyRef = useRef(null);

  const suggestions = [
    'Summarize my latest email',
    'Find emails from last week',
    'Who emailed me today?',
  ];

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Set userId from localStorage after login
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const syncEmails = async () => {
      setSyncProgress(30);
      await fetch(`${API_URL}/sync_email`);
      setSyncProgress(100);
      setTimeout(() => setSyncProgress(0), 1000);
    };

    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/get_chat_history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }), // Changed from browserId to userId
        });
        const { success, message } = await response.json();
        if (success) {
          const sortedHistory = message.sort((a, b) => new Date(b.date) - new Date(a.date));
          setChatHistory(sortedHistory);
          updateAnalytics(sortedHistory);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    const checkBlockedStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/get_blocked_user`);
        const { success, message } = await response.json();
        if (success) {
          const isBlocked = message.some(user => user.user_id === userId); // Changed from browserId to user_id
          setIsBlocked(isBlocked);
        }
      } catch (error) {
        console.error('Error checking blocked status:', error);
      }
    };

    syncEmails();
    fetchChatHistory();
    checkBlockedStatus();
  }, [userId]); // Changed from browserId to userId

  const updateAnalytics = (history) => {
    const keywordMap = history.reduce((acc, { query }) => {
      query.toLowerCase().split(/\s+/).forEach((word) => {
        acc[word] = (acc[word] || 0) + 1;
      });
      return acc;
    }, {});
    const sortedKeywords = Object.entries(keywordMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
    setKeywordData(sortedKeywords);

    const timeMap = history.reduce((acc, { date: chatDate }) => {
      const formattedDate = new Date(chatDate).toLocaleDateString();
      acc[formattedDate] = (acc[formattedDate] || 0) + 1;
      return acc;
    }, {});
    const timeData = Object.entries(timeMap).map(([date, count]) => ({ date, count }));
    setTimeData(timeData);
  };

  const typeMessage = async (text) => {
    setIsTyping(true);
    const startTime = Date.now();
    const chars = text.split('');
    let currentText = '';

    const typeNextChar = (index) => {
      if (index >= chars.length) {
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;
        setTypingSpeed((chars.length / timeTaken).toFixed(2));
        setIsTyping(false);
        return;
      }

      currentText += chars[index];
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'bot', text: currentText, timestamp: new Date() };
        return updated;
      });

      setTimeout(() => typeNextChar(index + 1), 50);
    };

    typeNextChar(0);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (isBlocked) {
      setShowBlockedPopup(true);
      return;
    }

    const timestamp = new Date();
    const newMessages = [...messages, { sender: 'user', text: inputValue, timestamp }];
    setMessages(newMessages);
    setInputValue('');

    try {
      setIsTyping(true);
      const lastBotMessage = messages
        .slice()
        .reverse()
        .find((msg) => msg.sender === 'bot')?.text || '';
      const response = await fetch(`${API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: inputValue,
          userId, // Changed from browserId to userId
          context: lastBotMessage,
        }),
      });
      const { message } = await response.json();
      setMessages([...newMessages, { sender: 'bot', text: '', timestamp: new Date() }]);
      await typeMessage(message || 'Sorry, I couldn’t find that in your emails.');

      const historyResponse = await fetch(`${API_URL}/get_chat_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }), // Changed from browserId to userId
      });
      const { success, message: updatedHistory } = await historyResponse.json();
      if (success) {
        const sortedHistory = updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        setChatHistory(sortedHistory);
        updateAnalytics(sortedHistory);
      }
    } catch (error) {
      setMessages([...newMessages, { sender: 'bot', text: 'Network error. Try again later.', timestamp: new Date() }]);
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setTypingSpeed(0);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleShare = (text) => {
    const subject = 'ChatBot Email Response';
    const body = `Check out this response from my email assistant:\n\n${text}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleRowClick = (chat) => {
    if (isBlocked) {
      setShowBlockedPopup(true);
    } else {
      setSelectedChat(chat);
    }
  };

  const renderSuggestionsPanel = () => {
    const topSender = chatHistory.reduce((acc, curr) => acc.query?.length > curr.query?.length ? acc : curr, {}).query || 'N/A';
    const lastMessage = chatHistory[chatHistory.length - 1]?.query || 'N/A';

    return (
      <div className="suggestions-panel">
        <div className="insights">
          <span>Longest Query: {topSender}</span>
          <span>Last Query: {lastMessage}</span>
        </div>
        <div className="suggestion-buttons">
          {suggestions.map((suggestion, index) => (
            <button key={index} className="suggestion-btn" onClick={() => setInputValue(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`guest-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="guest-header">
        <div className="header-left">
          <h1 className="header-title">Email Assistant</h1>
          <p className="header-subtitle">Your Smart Email Companion</p>
        </div>
        <div className="navbar-actions">
          <button className="logout-btn prominent-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
          <button className="toggle-mode-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="analytics-btn" onClick={() => setShowAnalytics(true)}>
            📊 Analytics
          </button>
          <button className="new-chat-btn" onClick={handleNewChat}>
            🆕 New Chat
          </button>
        </div>
      </header>

      {syncProgress > 0 && (
        <div className="sync-progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${syncProgress}%` }} />
          </div>
          <span className="progress-text">Syncing emails... {syncProgress}%</span>
        </div>
      )}

      <div className="guest-layout">
        <aside className="history-panel">
          <h2 className="panel-title">Email Queries</h2>
          <ul className="history-list">
            {chatHistory.map((chat, index) => (
              <li
                key={index}
                className="history-item clickable-row"
                onClick={() => handleRowClick(chat)}
              >
                <span>{chat.query.length > 50 ? `${chat.query.substring(0, 50)}...` : chat.query}</span>
                <span className="history-timestamp">{new Date(chat.date).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="chat-panel">
          {messages.length === 0 ? (
            <div className="no-chat-screen">
              <h2>Welcome! Ask about your emails.</h2>
              <p>Type a question below to get started.</p>
              {renderSuggestionsPanel()}
              <div className="chat-input chat-input-prominent">
                <input
                  type="text"
                  placeholder="Ask about your emails..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="input-field"
                />
                <button onClick={handleSendMessage} className="send-button">
                  <span>Send</span>
                  <svg viewBox="0 0 24 24" className="send-icon">
                    <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-wrapper">
              <div className="chat-messages" ref={chatBodyRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender === 'user' ? 'message-user' : 'message-bot'}`}>
                    <span className="message-text">{msg.text}</span>
                    <div className="message-meta">
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                      {msg.sender === 'bot' && !isTyping && index === messages.length - 1 && (
                        <>
                          <button onClick={() => handleCopy(msg.text)}>Copy</button>
                          <button onClick={() => handleShare(msg.text)}>Share</button>
                          <span>Typing Speed: {typingSpeed} chars/sec</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="typing-indicator">Fetching from emails...</div>}
              </div>
              {renderSuggestionsPanel()}
              <div className="chat-input chat-input-prominent">
                <input
                  type="text"
                  placeholder="Ask about your emails..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="input-field"
                />
                <button onClick={handleSendMessage} className="send-button">
                  <span>Send</span>
                  <svg viewBox="0 0 24 24" className="send-icon">
                    <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAnalytics && (
        <div className="popup-overlay" onClick={() => setShowAnalytics(false)}>
          <div className="popup-content analytics-popup" onClick={(e) => e.stopPropagation()}>
            <h2 className="panel-title">Analytics</h2>
            <div className="chart-section">
              <h3>Top Keywords</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={keywordData}>
                  <XAxis dataKey="keyword" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-section">
              <h3>Queries Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <button className="close-btn" onClick={() => setShowAnalytics(false)}>Close</button>
          </div>
        </div>
      )}

      {selectedChat && !isBlocked && (
        <div className="popup-overlay" onClick={() => setSelectedChat(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Query Details</h3>
            <p><strong>Question:</strong> {selectedChat.query}</p>
            <p><strong>Response:</strong> {selectedChat.response}</p>
            <p><strong>Timestamp:</strong> {new Date(selectedChat.date).toLocaleString()}</p>
            <button className="close-btn" onClick={() => setSelectedChat(null)}>Close</button>
          </div>
        </div>
      )}

      {showBlockedPopup && (
        <div className="popup-overlay" onClick={() => setShowBlockedPopup(false)}>
          <div className="popup-content blocked-popup" onClick={(e) => e.stopPropagation()}>
            <h2 className="panel-title">Access Denied</h2>
            <p>You have violated our policy and are blocked from accessing chat details.</p>
            <button className="close-btn" onClick={() => setShowBlockedPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPage;