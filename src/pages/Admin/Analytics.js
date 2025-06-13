import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL;

function Analytics({ handleLogout }) {
  const [promptData, setPromptData] = useState(null);
  const [emailData, setEmailData] = useState(null);
  const [chatHistoryData, setChatHistoryData] = useState(null);
  const [senderData, setSenderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGraph, setSelectedGraph] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promptRes, emailRes, chatRes, senderRes] = await Promise.all([
          fetch(`${API_URL}/prompt_per_date`).then(res => res.json()),
          fetch(`${API_URL}/email_per_date`).then(res => res.json()),
          fetch(`${API_URL}/get_chat_history_chart_data`).then(res => res.json()),
          fetch(`${API_URL}/get_email_chart_data`).then(res => res.json()),
        ]);

        if (!promptRes.success || !emailRes.success || !chatRes.success || !senderRes.success) {
          throw new Error("Failed to fetch analytics data.");
        }

        setPromptData(promptRes);
        setEmailData(emailRes);
        setChatHistoryData(chatRes);
        setSenderData(senderRes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading Analytics...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e7eb' }, beginAtZero: true } },
  };

  const promptTrendData = {
    labels: promptData?.count_by_date?.map(item => item.date) || [],
    datasets: [{
      label: 'Prompts Over Time',
      data: promptData?.count_by_date?.map(item => item.count) || [],
      backgroundColor: 'rgba(107, 114, 128, 0.6)',
      borderColor: '#6b7280',
      tension: 0.1,
    }],
  };

  const emailTrendData = {
    labels: emailData?.count_by_date?.map(item => item.date) || [],
    datasets: [{
      label: 'Emails Over Time',
      data: emailData?.count_by_date?.map(item => item.count) || [],
      backgroundColor: 'rgba(249, 115, 22, 0.6)',
      borderColor: '#f97316',
      tension: 0.1,
    }],
  };

  const queryFreqData = {
    labels: chatHistoryData?.query?.slice(0, 10).map(item => item.query.slice(0, 20) + '...') || [],
    datasets: [{
      label: 'Top Queries',
      data: chatHistoryData?.query?.slice(0, 10).map(item => item.query_count) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
    }],
  };

  const senderFreqData = {
    labels: senderData?.data?.slice(0, 10).map(item => item.sender.slice(0, 20) + '...') || [],
    datasets: [{
      label: 'Top Senders',
      data: senderData?.data?.slice(0, 10).map(item => item.sender_count) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
    }],
  };

  const GraphCard = ({ title, data, type = 'bar' }) => (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        {type === 'line' ? (
          <Line data={data} options={graphOptions} />
        ) : (
          <Bar data={data} options={graphOptions} />
        )}
      </div>
      <button className="view-details-btn" onClick={() => setSelectedGraph({ title, data })}>
        View Details
      </button>
    </div>
  );

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="analytics-section">
            <h2 className="section-title">Advanced Analytics</h2>
            <div className="charts-grid">
              <GraphCard title="Prompt Trends" data={promptTrendData} type="line" />
              <GraphCard title="Email Trends" data={emailTrendData} type="line" />
              <GraphCard title="Top Chat Queries" data={queryFreqData} />
              <GraphCard title="Top Email Senders" data={senderFreqData} />
            </div>
          </section>

          {selectedGraph && (
            <div className="modal-overlay">
              <div className="analytics-modal">
                <div className="modal-header">
                  <h2 className="modal-title">{selectedGraph.title}</h2>
                  <button className="modal-close-icon" onClick={() => setSelectedGraph(null)} aria-label="Close modal">
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="chart-container modal-chart">
                    {selectedGraph.title.includes('Trends') ? (
                      <Line data={selectedGraph.data} options={graphOptions} />
                    ) : (
                      <Bar data={selectedGraph.data} options={graphOptions} />
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="modal-close-btn" onClick={() => setSelectedGraph(null)}>
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

export default Analytics;