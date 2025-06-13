import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './../../style/Admin.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL;

function Home({ handleLogout }) {
  const [data, setData] = useState(null);
  const [emailData, setEmailData] = useState(null);
  const [chatHistoryData, setChatHistoryData] = useState(null);
  const [emailPerDate, setEmailPerDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promptRes, emailRes, chatRes, emailDateRes] = await Promise.all([
          fetch(`${API_URL}/prompt_per_date`).then(res => res.json()),
          fetch(`${API_URL}/get_email_chart_data`).then(res => res.json()),
          fetch(`${API_URL}/get_chat_history_chart_data`).then(res => res.json()),
          fetch(`${API_URL}/email_per_date`).then(res => res.json()),
        ]);

        if (!promptRes.success || !emailRes.success || !chatRes.success || !emailDateRes.success) {
          throw new Error("Failed to fetch data from API.");
        }

        setData(promptRes);
        setEmailData(emailRes);
        setChatHistoryData(chatRes);
        setEmailPerDate(emailDateRes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading Dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data || !emailPerDate) return <div className="no-data">No data available.</div>;

  const todayCount = data?.overall_count?.day || 0;
  const thisMonthCount = data?.overall_count?.month || 0;
  const thisYearCount = data?.overall_count?.year || 0;
  const todayEmailCount = emailPerDate?.overall_count?.day || 0;
  const thisMonthEmailCount = emailPerDate?.overall_count?.month || 0;
  const thisYearEmailCount = emailPerDate?.overall_count?.year || 0;

  const promptGraphData = {
    labels: data?.count_by_date?.map(item => item.date) || [],
    datasets: [{ label: 'Prompts', data: data?.count_by_date?.map(item => item.count) || [], backgroundColor: '#6b7280' }],
  };
  const emailGraphData = {
    labels: emailData?.data?.map(item => item.sender) || [],
    datasets: [{ label: 'Emails', data: emailData?.data?.map(item => item.sender_count) || [], backgroundColor: '#f97316' }],
  };
  const chatGraphData = {
    labels: chatHistoryData?.query?.map(item => item.query) || [],
    datasets: [{ label: 'Queries', data: chatHistoryData?.query?.map(item => item.query_count) || [], backgroundColor: '#10b981' }],
  };
  const emailPerDateGraphData = {
    labels: emailPerDate?.count_by_date?.map(item => item.date) || [],
    datasets: [{ label: 'Emails', data: emailPerDate?.count_by_date?.map(item => item.count) || [], backgroundColor: '#3b82f6' }],
  };

  const cardData = [
    { title: 'Prompts Today', value: todayCount, color: '#6b7280' },
    { title: 'Prompts This Month', value: thisMonthCount, color: '#6b7280' },
    { title: 'Prompts This Year', value: thisYearCount, color: '#6b7280' },
    { title: 'Emails Today', value: todayEmailCount, color: '#f97316' },
    { title: 'Emails This Month', value: thisMonthEmailCount, color: '#f97316' },
    { title: 'Emails This Year', value: thisYearEmailCount, color: '#f97316' },
  ];

  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12, family: "'Inter', sans-serif" }, color: '#4b5563' } },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' }, beginAtZero: true },
    },
  };

  const Graph = ({ title, data }) => (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <Bar data={data} options={graphOptions} />
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header handleLogout={handleLogout} />
        <main className="content">
          <section className="stats-section">
            <h2 className="section-title">Key Metrics</h2>
            <div className="stats-grid">
              {cardData.map((card) => (
                <div key={card.title} className="stat-card" style={{ '--accent-color': card.color }}>
                  <h3>{card.title}</h3>
                  <p className="stat-number">{card.value}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="charts-section">
            <h2 className="section-title">Analytics Overview</h2>
            <div className="charts-grid">
              <Graph title="Prompts by Date" data={promptGraphData} />
              <Graph title="Emails by Sender" data={emailGraphData} />
              <Graph title="Chat Queries" data={chatGraphData} />
              <Graph title="Emails by Date" data={emailPerDateGraphData} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Home;