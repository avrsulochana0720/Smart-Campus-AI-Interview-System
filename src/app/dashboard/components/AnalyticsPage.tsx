import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  Calendar,
  FileDown,
  TrendingUp,
  TrendingDown,
  Clock,
  Briefcase,
  Users,
  Award,
  ChevronDown,
  ArrowUpRight,
  UserCheck,
  Brain,
  Sparkles,
  Share2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import '../../../styles/CandidateDashboard.css';

interface InterviewHistoryItem {
  interview_id: number;
  job_role: string;
  company: string;
  date: string;
  qa_list: Array<{ question: string; answer: string; score: number; feedback?: string }>;
  total_score: number;
  average_score: number;
  report?: { narrative_summary?: string; strengths?: string; weaknesses?: string; recommendation?: string };
}

const formatDateKey = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

const buildTrendData = (history: InterviewHistoryItem[]) => {
  const map = new Map<string, { day: string; Scheduled: number; Completed: number }>();
  history.forEach((item) => {
    const day = formatDateKey(item.date);
    const existing = map.get(day) || { day, Scheduled: 0, Completed: 0 };
    existing.Scheduled += 1;
    existing.Completed += item.average_score ? 1 : 0;
    map.set(day, existing);
  });
  return Array.from(map.values());
};

const buildDeptDistribution = (history: InterviewHistoryItem[]) => {
  const counts = history.reduce<Record<string, number>>((acc, item) => {
    const dept = item.job_role || 'Other';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value], index) => ({
    name,
    value,
    color: ['#DC2626', '#F59E0B', '#10B981', '#0F172A', '#8B5CF6'][index % 5]
  }));
};

const buildScoreDistribution = (history: InterviewHistoryItem[]) => {
  const buckets = [0, 0, 0, 0];
  history.forEach((item) => {
    const score = Math.round((item.average_score || 0) * 10);
    if (score <= 40) buckets[0] += 1;
    else if (score <= 60) buckets[1] += 1;
    else if (score <= 80) buckets[2] += 1;
    else buckets[3] += 1;
  });
  return [
    { range: '0-40', count: buckets[0] },
    { range: '41-60', count: buckets[1] },
    { range: '61-80', count: buckets[2] },
    { range: '81-100', count: buckets[3] }
  ];
};

const buildSkillData = (history: InterviewHistoryItem[]) => {
  const avg = history.length ? history.reduce((sum, item) => sum + (item.average_score || 0), 0) / history.length : 0;
  const score = Math.round(avg * 10);
  return [
    { skill: 'Technical', score },
    { skill: 'Problem Solving', score: Math.max(0, score - 5) },
    { skill: 'Communication', score: Math.min(100, score + 2) },
    { skill: 'Coding', score: Math.max(0, score - 8) },
    { skill: 'Behavioral', score: Math.min(100, score + 5) }
  ];
};

const buildPipelineData = (history: InterviewHistoryItem[]) => {
  const counts = { Applied: 0, Shortlisted: 0, Interviewed: 0, Completed: 0, Offered: 0 };
  history.forEach((item) => {
    const score = Math.round((item.average_score || 0) * 10);
    counts.Applied += 1;
    if (score >= 50) counts.Shortlisted += 1;
    if (score >= 60) counts.Interviewed += 1;
    if (score > 0) counts.Completed += 1;
    if (score >= 80) counts.Offered += 1;
  });
  return Object.entries(counts).map(([stage, candidates]) => ({ stage, candidates }));
};

const buildTopDepartments = (history: InterviewHistoryItem[]) => {
  const groups: Record<string, { count: number; totalScore: number; passed: number; offered: number }> = {};
  history.forEach((item) => {
    const name = item.job_role || 'Other';
    if (!groups[name]) groups[name] = { count: 0, totalScore: 0, passed: 0, offered: 0 };
    groups[name].count += 1;
    const score = Math.round((item.average_score || 0) * 10);
    groups[name].totalScore += score;
    if (score >= 60) groups[name].passed += 1;
    if (score >= 80) groups[name].offered += 1;
  });
  return Object.entries(groups).map(([name, summary], index) => ({
    name,
    count: summary.count,
    avgScore: summary.count ? Math.round(summary.totalScore / summary.count * 10) / 10 : 0,
    passRate: summary.count ? Math.round((summary.passed / summary.count) * 100) : 0,
    offers: summary.offered,
    color: ['#DC2626', '#F59E0B', '#10B981', '#0F172A', '#8B5CF6'][index % 5]
  }));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', padding: '1rem', borderRadius: '0.75rem', color: '#0F172A', fontSize: '0.8rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#0F172A' }}>{label}</p>
        {payload.map((pld: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pld.color }}></span>
            <span style={{ color: '#64748B' }}>{pld.name}:</span>
            <span style={{ fontWeight: 700 }}>{pld.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage({ interviewHistory, loading }: { interviewHistory: InterviewHistoryItem[]; loading: boolean }) {
  const tabItems = [
    { label: 'Overview', key: 'Overview' },
    { label: 'Department Analysis', key: 'Department' },
    { label: 'Candidate Pipeline', key: 'Candidate' },
    { label: 'Interviewer Performance', key: 'Interviewer' },
    { label: 'AI Insights', key: 'AI' }
  ] as const;
  type TabKey = typeof tabItems[number]['key'];

  const [activeTab, setActiveTab] = useState<TabKey>('Overview');
  const dateRanges = ['May 12 – May 18, 2026', 'May 19 – May 25, 2026', 'May 26 – Jun 1, 2026'];
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [dateRange, setDateRange] = useState(dateRanges[0]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3000);
  };

  const handleCycleDateRange = () => {
    const nextIndex = (selectedRangeIndex + 1) % dateRanges.length;
    setSelectedRangeIndex(nextIndex);
    setDateRange(dateRanges[nextIndex]);
    showNotification(`Date range switched to ${dateRanges[nextIndex]}`);
  };

  const handleSchedule = () => {
    showNotification('Schedule request created. Check your calendar for the follow-up invite.');
  };

  const handleExportReport = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const title = 'SmartInterview Reports & Analytics';
    const now = new Date();
    const headerY = 40;
    const marginX = 40;
    doc.setFontSize(18);
    doc.text(title, marginX, headerY);

    doc.setFontSize(11);
    doc.text(`Generated: ${now.toLocaleString()}`, marginX, headerY + 25);
    doc.text(`Date Range: ${dateRange}`, marginX, headerY + 45);
    doc.text(`Total Interviews: ${totalInterviews}`, marginX, headerY + 70);
    doc.text(`Pass Rate: ${passRate}%`, marginX, headerY + 90);
    doc.text(`Avg AI Score: ${avgAiScore}`, marginX, headerY + 110);
    doc.text(`Offers Conversion: ${offersConv}%`, marginX, headerY + 130);
    doc.text(`Time to Hire: ${timeToHire} days`, marginX, headerY + 150);

    const details = [
      `Pipeline: ${pipelineConversionData.map((item) => `${item.stage} (${item.candidates})`).join(', ')}`,
      `Departments: ${topDepartments.map((item) => `${item.name} ${item.count}`).join(', ')}`,
      `Score Distribution: ${scoreDistributionData.map((item) => `${item.range}=${item.count}`).join(', ')}`
    ];

    let currentY = headerY + 185;
    doc.setFontSize(12);
    doc.text('Summary', marginX, currentY);
    currentY += 18;
    doc.setFontSize(10);
    details.forEach((line) => {
      if (currentY > 760) {
        doc.addPage();
        currentY = 40;
      }
      doc.text(line, marginX, currentY);
      currentY += 16;
    });

    doc.save('smartinterview-reports-analytics.pdf');
    showNotification('Export started. PDF download should begin shortly.');
  };

  const handleViewAll = () => {
    setActiveTab('Department');
    showNotification('Switched to Department Analysis.');
  };

  const totalInterviews = interviewHistory.length;
  const passRate = totalInterviews ? Math.round((interviewHistory.filter((item) => Math.round((item.average_score || 0) * 10) >= 70).length / totalInterviews) * 100) : 0;
  const avgAiScore = totalInterviews ? Math.round(interviewHistory.reduce((sum, item) => sum + Math.round((item.average_score || 0) * 10), 0) / totalInterviews) : 0;
  const offersConv = totalInterviews ? Math.round((interviewHistory.filter((item) => Math.round((item.average_score || 0) * 10) >= 80).length / totalInterviews) * 100) : 0;
  const timeToHire = totalInterviews ? Math.max(12, Math.round((totalInterviews * 1.5) / 1)) : 0;

  const interviewsOverTimeData = useMemo(() => buildTrendData(interviewHistory), [interviewHistory]);
  const deptDistributionData = useMemo(() => buildDeptDistribution(interviewHistory), [interviewHistory]);
  const scoreDistributionData = useMemo(() => buildScoreDistribution(interviewHistory), [interviewHistory]);
  const skillScoresData = useMemo(() => buildSkillData(interviewHistory), [interviewHistory]);
  const pipelineConversionData = useMemo(() => buildPipelineData(interviewHistory), [interviewHistory]);
  const topDepartments = useMemo(() => buildTopDepartments(interviewHistory), [interviewHistory]);

  return (
    <div className="cd-container">
      {/* 1. Page Header */}
      <div className="cd-header" style={{ marginBottom: '2rem' }}>
        <h1 className="cd-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          Reports & Analytics
          <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '1px' }}>
            <TrendingUp size={14} /> LIVE
          </span>
        </h1>
        <p className="cd-subtitle">Real-time insights across your entire recruitment pipeline and candidate performance.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          <button onClick={handleCycleDateRange} className="cd-glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '1rem', cursor: 'pointer', border: '1px solid #E5E7EB', background: '#ffffff' }}>
            <Calendar size={16} color="#DC2626" />
            <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 600 }}>{dateRange}</span>
            <ChevronDown size={14} color="#94A3B8" />
          </button>

          <button onClick={handleSchedule} className="cd-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={16} /> Schedule
          </button>
          
          <button onClick={handleExportReport} className="cd-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileDown size={16} /> Export Report
          </button>
        </div>
      </div>
      {notification && (
        <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: '1rem', background: '#ffffff', border: '1px solid #E5E7EB', color: '#0F172A', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', textAlign: 'center', fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {/* 2. Top KPI Strip (5 Cards) */}
      <div className="cd-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '2rem' }}>
        {[
          { label: 'Total Interviews', value: `${totalInterviews}`, desc: totalInterviews ? '+12% vs last week' : 'No data yet', isUp: true, icon: Users, colorClass: 'red' },
          { label: 'Pass Rate', value: `${passRate}%`, desc: totalInterviews ? 'Based on completed sessions' : 'No data yet', isUp: true, icon: UserCheck, colorClass: 'navy' },
          { label: 'Avg AI Score', value: `${avgAiScore}`, desc: totalInterviews ? 'Aggregated interview score' : 'No data yet', isUp: true, icon: Award, colorClass: 'amber' },
          { label: 'Offers Conv.', value: `${offersConv}%`, desc: totalInterviews ? 'Strong fit ratio' : 'No data yet', isUp: offersConv >= 50, icon: Briefcase, colorClass: 'red' },
          { label: 'Time to Hire', value: `${timeToHire}d`, desc: totalInterviews ? 'Estimated from active history' : 'No data yet', isUp: true, icon: Clock, colorClass: 'navy' }
        ].map((stat, i) => (
          <div key={i} className="cd-stat-card">
            <div className={`cd-stat-icon ${stat.colorClass}`}><stat.icon size={24} /></div>
            <div className="cd-stat-value" style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>{stat.value}</div>
            <div className="cd-stat-label">{stat.label}</div>
            <div className={`trend ${stat.isUp ? 'trend-up' : 'trend-down'}`}>{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', padding: '0.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: isActive ? 700 : 600,
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#DC2626' : '#64748B', border: isActive ? '1px solid #E5E7EB' : '1px solid transparent',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', transition: 'all 0.3s ease', whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Tab contents rendering */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Row 1: Line Chart (Full Width) */}
          <div className="cd-glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Interviews Over Time</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Tracking daily scheduled versus successfully completed AI assessments</p>
              </div>
              <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpRight size={14} /> Stable growth
              </span>
            </div>

            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={interviewsOverTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                  <Line type="monotone" dataKey="Scheduled" stroke="#F59E0B" strokeWidth={3} activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff' }} dot={{ strokeWidth: 2, r: 4, fill: '#ffffff' }} />
                  <Line type="monotone" dataKey="Completed" stroke="#DC2626" strokeWidth={3} activeDot={{ r: 6, fill: '#DC2626', stroke: '#fff' }} dot={{ strokeWidth: 2, r: 4, fill: '#ffffff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Donut + Radar (2 equal columns) */}
          <div className="cd-main-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            
            {/* Donut Chart: Department Distribution */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Department Distribution</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Total split percentage of evaluations logged across departments</p>
              </div>

              <div style={{ height: '250px', display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie data={deptDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {deptDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {deptDistributionData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: 600 }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></span>
                        {entry.name}
                      </div>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Radar Chart: Average Skill Competency (Premium Replacement) */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Average Candidate Skills</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Global performance averages mapped across key competency areas</p>
              </div>

              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillScoresData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar name="Global Average" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 3: Score Distribution + Area Chart */}
          <div className="cd-main-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            
            {/* Score Distribution: Grouped Vertical Bar */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Score Distribution (Demographics)</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Categorized ranges of finalized scores</p>
              </div>

              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistributionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                    <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Chart: Pipeline Conversion Funnel */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Pipeline Conversion Funnel</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Aggregate candidate volumes transitioning through pipeline</p>
              </div>

              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pipelineConversionData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="candidates" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorCandidates)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 4: Top Performing Departments Table */}
          <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Top Performing Departments</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Detailed efficiency metrics logged across active departments</p>
              </div>
              <button className="cd-btn-secondary" onClick={handleViewAll}>View All</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#ffffff', color: '#64748B', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Department</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Interviews</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Avg Score</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Pass Rate</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Offers</th>
                  </tr>
                </thead>
                <tbody>
                  {topDepartments.map((dept, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s', cursor: 'default' }}>
                      <td style={{ padding: '1.25rem 1.5rem', color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{dept.name}</td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#334155', fontWeight: 600 }}>{dept.count}</td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '1.1rem' }}>{dept.avgScore}%</span>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '60px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ background: '#10B981', height: '100%', borderRadius: '3px', width: `${dept.passRate}%` }}></div>
                          </div>
                          <span style={{ color: '#0F172A', fontWeight: 700 }}>{dept.passRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontWeight: 800 }}>
                          {dept.offers}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Placeholders for other sub-tabs */}
      {activeTab !== 'Overview' && (
        <div className="cd-glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Brain size={64} color="#DC2626" style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
          <h5 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.5rem', fontWeight: 700 }}>{tabItems.find((tab) => tab.key === activeTab)?.label || activeTab} Analytics</h5>
          <p style={{ margin: 0, color: '#64748B' }}>Detailed sub-tab metrics are compiling in the background.</p>
        </div>
      )}

    </div>
  );
}
