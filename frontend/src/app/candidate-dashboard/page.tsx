import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Activity, Calendar, Play, Award } from 'lucide-react';
import { interviewAPI } from '../../utils/api';
import '../../styles/CandidateDashboard.css';

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await interviewAPI.getHistory();
        setHistory(data);
        
        // Transform for chart
        const chartData = data.map((item: any) => ({
          name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round((item.average_score || 0) * 10)
        })).sort((a: any, b: any) => new Date(a.name).getTime() - new Date(b.name).getTime());
        
        setPerformanceData(chartData);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalInterviews = history.length;
  const overallAvg = history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + ((curr.average_score || 0) * 10), 0) / history.length) : 0;

  return (
    <div className="candidate-dashboard">
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
            <div className="cd-stat-value">{totalInterviews}</div>
            <div className="cd-stat-label">Total Interviews Attended</div>
          </div>
          <div className="cd-glass-card">
            <div className="cd-stat-icon navy">
              <Award />
            </div>
            <div className="cd-stat-value">{overallAvg}%</div>
            <div className="cd-stat-label">Overall Average Score</div>
          </div>
          <div className="cd-glass-card">
            <div className="cd-stat-icon amber">
              <Calendar />
            </div>
            <div className="cd-stat-value">0</div>
            <div className="cd-stat-label">Upcoming Scheduled</div>
          </div>
        </div>

        {/* Performance Chart */}
        {performanceData.length > 0 && (
          <div className="cd-chart-section">
            <div className="cd-chart-card">
              <h2 className="cd-section-title">
                <Activity size={24} color="#DC2626" />
                Performance Trend
              </h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        )}

        <h2 className="cd-section-title" style={{ marginTop: '3rem' }}>
          Recent Interviews
        </h2>
        <div className="cd-history-grid">
          {history.length > 0 ? history.map((item: any) => {
            const score = Math.round((item.average_score || 0) * 10);
            return (
              <div key={item.interview_id} className="cd-history-card">
                <div className="cd-history-header">
                  <div className="cd-company-logo">
                    {item.company.charAt(0)}
                  </div>
                  <span className={`cd-status-badge completed`}>
                    Completed
                  </span>
                </div>
                <div className="cd-job-info">
                  <h3 className="cd-job-title">{item.job_role}</h3>
                  <p className="cd-job-company">{item.company}</p>
                </div>
                
                <div className="cd-score-section">
                  <div className="cd-date">
                    <Calendar size={14} />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <div className="cd-score-display" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="cd-stat-label">Readiness:</span>
                      <span className="cd-score-text" style={{ color: item.report?.hiring_readiness_score >= 70 ? '#10B981' : item.report?.hiring_readiness_score >= 40 ? '#F59E0B' : '#DC2626' }}>
                        {item.report?.hiring_readiness_score ?? score}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {item.report?.skill_gap_analysis && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(241, 245, 249, 0.5)', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#1e293b' }}>Skill Gap Analysis:</strong>
                    {item.report.skill_gap_analysis}
                  </div>
                )}

                <button className="cd-btn-action" onClick={() => navigate('/dashboard')}>
                  View Full Report
                </button>
              </div>
            );
          }) : (
            !loading && <div className="cd-history-card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No past interviews found. Start your first evaluation!</div>
          )}

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
