import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Activity, Calendar, Play, ChevronRight, Award } from 'lucide-react';
import '../../styles/CandidateDashboard.css';

const MOCK_HISTORY = [
  { id: 1, role: 'Software Engineer', company: 'Google', date: 'May 28, 2024', status: 'Completed', score: 89 },
  { id: 2, role: 'Frontend Developer', company: 'Microsoft', date: 'May 20, 2024', status: 'Completed', score: 93 },
  { id: 3, role: 'Backend Engineer', company: 'Amazon', date: 'May 15, 2024', status: 'Completed', score: 77 },
  { id: 4, role: 'Full Stack Dev', company: 'Meta', date: 'May 05, 2024', status: 'Completed', score: 84 },
];

const MOCK_PERFORMANCE_DATA = [
  { name: 'May 05', score: 84 },
  { name: 'May 15', score: 77 },
  { name: 'May 20', score: 93 },
  { name: 'May 28', score: 89 },
];

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="candidate-dashboard">
      {/* Navigation matching Hero.css aesthetics */}
      <nav className="candidate-navbar">
        <div className="navbar-brand">
          <span className="brand-text">Smart Campus AI</span>
        </div>
        <div className="navbar-links">
          <a href="/" className="nav-link">Home</a>
          <a href="#" className="nav-link" style={{ color: '#DC2626' }}>My Dashboard</a>
          <a href="#" className="nav-link">Jobs</a>
        </div>
        <div className="navbar-right">
          <div className="navbar-profile" onClick={() => navigate('/dashboard?section=profile')} style={{ cursor: 'pointer' }}>
            <div className="profile-avatar-nav">
              <svg width="40" height="40" viewBox="0 0 40 40" className="avatar-svg-nav">
                <defs>
                  <linearGradient id="avatarGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#DC2626', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#EF4444', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#F59E0B', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill="url(#avatarGradientNav)" />
                <circle cx="20" cy="15" r="6" fill="#ffffff" opacity="0.9" />
                <ellipse cx="20" cy="28" rx="8" ry="5" fill="#ffffff" opacity="0.9" />
              </svg>
            </div>
          </div>
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu" style={{ display: 'flex' }}>
          <a href="/" className="mobile-nav-link">Home</a>
          <a href="#" className="mobile-nav-link" style={{ color: '#DC2626' }}>My Dashboard</a>
          <a href="#" className="mobile-nav-link">Jobs</a>
        </div>
      )}

      <div className="cd-container">
        <div className="cd-header">
          <h1 className="cd-title">Welcome back, Candidate</h1>
          <p className="cd-subtitle">Track your interview performance and upcoming schedules.</p>
        </div>

        {/* Top Stats Cards */}
        <div className="cd-stats-grid">
          <div className="cd-glass-card">
            <div className="cd-stat-icon red">
              <Briefcase />
            </div>
            <div className="cd-stat-value">12</div>
            <div className="cd-stat-label">Total Interviews Attended</div>
          </div>
          <div className="cd-glass-card">
            <div className="cd-stat-icon navy">
              <Award />
            </div>
            <div className="cd-stat-value">86%</div>
            <div className="cd-stat-label">Overall Average Score</div>
          </div>
          <div className="cd-glass-card">
            <div className="cd-stat-icon amber">
              <Calendar />
            </div>
            <div className="cd-stat-value">2</div>
            <div className="cd-stat-label">Upcoming Scheduled</div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="cd-chart-section">
          <div className="cd-chart-card">
            <h2 className="cd-section-title">
              <Activity size={24} color="#DC2626" />
              Performance Trend
            </h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={MOCK_PERFORMANCE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#F59E0B' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* History Grid */}
        <h2 className="cd-section-title" style={{ marginTop: '3rem' }}>
          Recent Interviews
        </h2>
        <div className="cd-history-grid">
          {MOCK_HISTORY.map((item) => (
            <div key={item.id} className="cd-history-card">
              <div className="cd-history-header">
                <div className="cd-company-logo">
                  {item.company.charAt(0)}
                </div>
                <span className={`cd-status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
              <div className="cd-job-info">
                <h3 className="cd-job-title">{item.role}</h3>
                <p className="cd-job-company">{item.company}</p>
              </div>
              
              <div className="cd-score-section">
                <div className="cd-date">
                  <Calendar size={14} />
                  {item.date}
                </div>
                <div className="cd-score-display">
                  <span className="cd-stat-label">Score:</span>
                  <span className="cd-score-text">{item.score}%</span>
                </div>
              </div>

              <button className="cd-btn-action" onClick={() => alert('Viewing detailed report for ' + item.role)}>
                View Report
              </button>
            </div>
          ))}

          {/* Start New Interview Card */}
          <div className="cd-history-card" style={{ 
            border: '2px dashed #94a3b8', 
            background: 'rgba(248, 250, 252, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }} onClick={() => navigate('/interview')}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white'
              }}>
                <Play fill="white" size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Start New Interview</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Click here to launch an evaluation</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
