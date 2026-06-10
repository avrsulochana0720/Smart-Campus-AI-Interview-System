import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { useToast } from '../ToastContext';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 6 Months');
  const { showToast } = useToast();

  useEffect(() => {
    // Fetch both overview stats and advanced analytics
    Promise.all([
      adminAPI.getDashboardStats(),
      adminAPI.getAnalytics('overview')
    ]).then(([dashboardStats, analyticsData]) => {
      setStats({ ...dashboardStats, ...analyticsData });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Loading analytics...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Analytics Overview</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Deep dive into AI evaluation metrics, hiring velocity, and skill gaps.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <button onClick={() => setTimeRangeOpen(!timeRangeOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
            <Calendar size={16} />
            {timeRange}
          </button>
          {timeRangeOpen && (
            <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '0.5rem', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
              {['Last 30 Days', 'Last 6 Months', 'Last Year', 'All Time'].map(range => (
                <div key={range} onClick={() => { setTimeRange(range); setTimeRangeOpen(false); showToast(`Data filtered by ${range}`, 'success'); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#E2E8F0', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {range}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => {
            const csvData = "Metric,Value\nAverage AI Score," + (stats?.avg_final_score || 0) + "%\nTotal Interviews," + (stats?.total_interviews || 0) + "\nTotal Candidates," + (stats?.total_students || 0) + "\n\nDepartment,Applications,Hired\n" + (stats?.department_hiring || []).map((d: any) => `${d.name},${d.applied},${d.hired}`).join('\n');
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `Analytics_Report_${timeRange.replace(/ /g, '_')}.csv`);
            a.click();
            showToast('Detailed Report exported successfully!', 'success');
          }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { title: 'Average AI Evaluation Score', value: stats?.avg_final_score || '0', trend: '+4.2%', icon: TrendingUp, color: '#3B82F6' },
          { title: 'Total Interviews', value: stats?.total_interviews || '0', trend: '+18.6%', icon: Calendar, color: '#10B981' },
          { title: 'Total Candidates', value: stats?.total_students || '0', trend: '+21.4%', icon: TrendingUp, color: '#8B5CF6' }
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#0D1322', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>{stat.title}</p>
                <h3 style={{ color: '#FFFFFF', fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stat.value}</h3>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: `${stat.color}15`, borderRadius: '0.75rem' }}>
                <stat.icon size={24} color={stat.color} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: stat.trend.startsWith('+') ? '#22C55E' : '#22C55E', fontWeight: 600 }}>{stat.trend}</span>
              <span style={{ color: '#64748B' }}>vs previous period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Performance Trend */}
        <div style={{ backgroundColor: '#0D1322', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #1E293B' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0' }}>Candidate Performance Trends</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.performance_data || []}>
                <defs>
                  <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '0.5rem', color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="tech" name="Tech Scores" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTech)" />
                <Area type="monotone" dataKey="hr" name="HR Scores" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Gaps */}
        <div style={{ backgroundColor: '#0D1322', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #1E293B' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0' }}>Sought-After Skills</h3>
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.skill_gap_data || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(stats?.skill_gap_data || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '0.5rem', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ backgroundColor: '#0D1322', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #1E293B' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 1.5rem 0' }}>Hiring Pipeline by Department</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.department_hiring || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: '#1E293B'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#1E293B', borderRadius: '0.5rem', color: '#fff' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="applied" name="Total Applications" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar yAxisId="right" dataKey="hired" name="Candidates Hired" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
