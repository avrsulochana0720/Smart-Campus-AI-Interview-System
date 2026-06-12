import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { Video, Users, BrainCircuit, Star, TrendingUp, Trophy, AlertTriangle, Clock, Plus, UserPlus, FileText, Settings, Activity, Server, Database, CheckCircle2, Calendar } from 'lucide-react';
import { adminAPI } from '../utils/api';

const Card = ({ children, style = {} }: any) => (
  <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', border: 'none', borderRadius: '1rem', padding: '1.5rem', boxShadow: '6px 6px 16px rgba(139, 120, 95, 0.15), -6px -6px 16px #FFFFFF', ...style }}>
    {children}
  </div>
);

export default function AdminOverview({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ color: '#fff', padding: '2rem' }}>Loading dashboard...</div>;
  }

  // Map real pie data from company stats if available, otherwise fallback
  const colors = ['#E11D48', '#8B5CF6', '#F59E0B', '#10B981', '#F43F5E', '#64748B'];
  const pieData = (stats?.role_stats?.length > 0 ? stats.role_stats : []).map((r: any, i: number) => ({
    name: r.role,
    value: r.count,
    color: colors[i % colors.length],
    percent: Math.round((r.count / Math.max(1, stats?.total_interviews || 1)) * 100) + '%'
  }));

  const upcomingInterviews = (stats?.upcoming_interviews || []).map((a: any) => ({
    name: a.name,
    role: a.role,
    time: new Date(a.date).toLocaleString(),
    type: a.status
  }));

  const getIcon = (name: string, color: string) => {
    switch(name) {
      case 'TrendingUp': return <TrendingUp size={18} color={color} style={{ marginTop: '2px' }} />;
      case 'Trophy': return <Trophy size={18} color={color} style={{ marginTop: '2px' }} />;
      case 'AlertTriangle': return <AlertTriangle size={18} color={color} style={{ marginTop: '2px' }} />;
      case 'Clock': return <Clock size={18} color={color} style={{ marginTop: '2px' }} />;
      case 'BrainCircuit': return <BrainCircuit size={18} color={color} style={{ marginTop: '2px' }} />;
      default: return <AlertTriangle size={18} color={color} style={{ marginTop: '2px' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#0F172A', paddingBottom: '2rem' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Welcome back, Admin <span style={{ fontSize: '1.25rem' }}>👋</span></h1>
          <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>Here's what's happening with your smart campus AI interview system today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '1px solid #BE123C', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <span>May 20 – May 26, 2024</span>
          <Calendar size={14} color="#64748B" />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Total Interviews</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats?.total_interviews || 0}</h2>
                {stats?.interviews_growth !== undefined && (
                  <span style={{ color: stats.interviews_growth >= 0 ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    {stats.interviews_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.interviews_growth)}%
                  </span>
                )}
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs last week</p>
            </div>
            <div style={{ backgroundColor: 'rgba(76, 5, 25, 0.4)', border: '1px solid #4C0519', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#FDA4AF', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Today</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF1F2' }}>{stats?.interviews_today || 0}</span>
            </div>
          </div>
          <div style={{ height: '60px', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.sparkline1 || []}>
                  <Area type="monotone" dataKey="v" stroke="#E11D48" fill="#E11D48" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </Card>

        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Candidates</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats?.total_students || 0}</h2>
                {stats?.students_growth !== undefined && (
                  <span style={{ color: stats.students_growth >= 0 ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    {stats.students_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.students_growth)}%
                  </span>
                )}
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs last week</p>
            </div>
            <div style={{ backgroundColor: 'rgba(6, 78, 59, 0.4)', border: '1px solid #064E3B', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Resumes</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ECFDF5' }}>{stats?.resume_upload_count || 0}</span>
            </div>
          </div>
          <div style={{ height: '60px', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.sparkline3 || []}>
                  <Area type="monotone" dataKey="v" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </Card>

        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>AI Evaluations</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats?.completed_interviews || 0}</h2>
                {stats?.completed_interviews_growth !== undefined && (
                  <span style={{ color: stats.completed_interviews_growth >= 0 ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    {stats.completed_interviews_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.completed_interviews_growth)}%
                  </span>
                )}
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs last week</p>
            </div>
            <div style={{ backgroundColor: 'rgba(76, 29, 149, 0.4)', border: '1px solid #4C1D95', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pending</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F5F3FF' }}>{stats?.pending_interviews || 0}</span>
            </div>
          </div>
          <div style={{ height: '60px', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.sparkline2 || []}>
                  <Area type="monotone" dataKey="v" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </Card>

        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Avg. Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats?.avg_final_score || 0}<span style={{ fontSize: '1rem', color: '#64748B' }}>/100</span></h2>
                {stats?.avg_score_growth !== undefined && (
                  <span style={{ color: stats.avg_score_growth >= 0 ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    {stats.avg_score_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.avg_score_growth)}%
                  </span>
                )}
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs last week</p>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #FCD34D', borderRadius: '0.5rem', padding: '0.35rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: '70px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>TECH</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{stats?.avg_technical_score || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>HR</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{stats?.avg_hr_score || 0}</span>
              </div>
            </div>
          </div>
          <div style={{ height: '60px', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.sparkline4 || []}>
                  <Area type="monotone" dataKey="v" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Area Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Interviews Over Time</h3>
            <div style={{ backgroundColor: '#334155', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              Daily <span>˅</span>
            </div>
          </div>
          <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.area_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.5rem', color: '#E11D48', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#E11D48' }}
                />
                <Area type="monotone" dataKey="value" stroke="#E11D48" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6, fill: '#E11D48', stroke: '#0F172A', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart */}
        {/* Donut Chart */}
        <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1.5rem 0', color: '#0F172A' }}>Interviews by Department</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', flex: 1 }}>
            
            {/* Left side: Pie Chart */}
            <div style={{ flex: '1 1 200px', height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{stats?.total_interviews || 0}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
              </div>
            </div>

            {/* Right side: Department Details */}
            <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flex: 1 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color, marginTop: '0.35rem', flexShrink: 0 }}></div>
                    <span style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.9rem' }}>{d.value}</span>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', width: '35px', textAlign: 'right' }}>({d.percent})</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
          
          <div style={{ textAlign: 'right', marginTop: '2rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#E11D48', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              View full report <span style={{ fontSize: '1rem' }}>→</span>
            </span>
          </div>
        </Card>

        {/* Upcoming Interviews */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Upcoming Interviews</h3>
            <span style={{ fontSize: '0.75rem', color: '#E11D48', cursor: 'pointer' }} onClick={() => setActiveTab?.('Interviews')}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {(stats?.upcoming_interviews || []).map((u: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E11D48', color: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #BE123C' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={`https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=random`} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, color: '#334155' }}>{u.name}</h4>
                    <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>{u.role}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#334155', margin: 0 }}>{u.time}</p>
                  <button 
                    onClick={() => setActiveTab?.('Interviews')} 
                    style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#E11D48', border: '1px solid rgba(225, 29, 72, 0.2)', borderRadius: '0.25rem', padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                  >
                    <BrainCircuit size={10} /> View {u.type}
                  </button>
                </div>
              </div>
            ))}
            {(stats?.upcoming_interviews || []).length === 0 && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', padding: '1rem', textAlign: 'center' }}>No pending interviews.</p>
            )}
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#E11D48', cursor: 'pointer', fontWeight: 500 }}>View Calendar →</span>
          </div>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Radar Chart */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0' }}>AI Evaluation Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#E11D48' }}></div> This Week
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#64748B', borderStyle: 'dashed' }}></div> Last Week
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats?.radar_data || []}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Platform Average" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.5rem', color: '#E11D48' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Candidate Performance Distribution</h3>
            <div style={{ backgroundColor: '#334155', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              Score Range <span>˅</span>
            </div>
          </div>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.bar_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{fill: '#E2E8F0'}} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.5rem', color: '#E11D48' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {
                    (stats?.bar_data || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Insights */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>AI Insights</h3>
            <span style={{ fontSize: '0.75rem', color: '#E11D48', cursor: 'pointer', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', borderRadius: '0.25rem' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {(stats?.ai_insights || []).map((insight: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {getIcon(insight.icon, insight.color)}
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>{insight.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Footer Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '1.5rem' }}>
        
        {/* Quick Actions */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab?.('Interviews')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Plus size={14} /> Schedule Interview
            </button>
            <button onClick={() => setActiveTab?.('Candidates')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}>
              <UserPlus size={14} /> Add Candidate
            </button>
            <button onClick={() => setActiveTab?.('Reports')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}>
              <FileText size={14} /> Generate Report
            </button>
            <button onClick={() => setActiveTab?.('AI Evaluations')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}>
              <BrainCircuit size={14} /> AI Evaluation Rules
            </button>
            <button onClick={() => setActiveTab?.('Settings')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #334155', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Settings size={14} /> System Settings
            </button>
          </div>
        </Card>

        {/* System Status */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0' }}>System Status</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {(stats?.system_status || []).map((sys: any, i: number) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B' }}><Server size={14} /> {sys.name}</div>
                <div style={{ color: sys.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sys.color }}></div> 
                  <span style={{ fontWeight: 600 }}>{sys.status}</span>
                </div>
                {sys.metric && <div style={{ color: '#64748B', fontSize: '0.65rem' }}>{sys.metric}</div>}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Recent Activity</h3>
            <span style={{ fontSize: '0.75rem', color: '#E11D48', cursor: 'pointer', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', borderRadius: '0.25rem' }} onClick={() => setActiveTab?.('Audit Logs')}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            {(stats?.recent_activity?.slice(0, 3) || []).map((activity: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: activity.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(225, 29, 72, 0.1)', padding: '0.4rem', borderRadius: '50%' }}>
                  <CheckCircle2 size={16} color={activity.status === 'completed' ? '#10B981' : '#E11D48'} />
                </div>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#475569' }}>Interview {activity.status} for {activity.name}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B' }}>{new Date(activity.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>No recent activity.</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
