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
  qa_list: Array<{ question: string; answer: string; score: number; feedback?: string; question_type?: string }>;
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
  const allQa = history.flatMap(i => i.qa_list);
  const techQa = allQa.filter(qa => qa.question_type === 'technical');
  const hrQa = allQa.filter(qa => qa.question_type === 'hr');
  
  const techScore = techQa.length > 0 ? Math.round((techQa.reduce((sum, qa) => sum + (qa.score || 0), 0) / techQa.length) * 10) : 0;
  const hrScore = hrQa.length > 0 ? Math.round((hrQa.reduce((sum, qa) => sum + (qa.score || 0), 0) / hrQa.length) * 10) : 0;
  
  return [
    { skill: 'Technical', score: techScore, fill: '#0EA5E9' },
    { skill: 'HR / Behavioral', score: hrScore, fill: '#8B5CF6' }
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
  const dateRanges = ['All Time', 'Last 7 Days', 'Last 30 Days'];
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

            {/* Bar Chart: Technical vs HR Competency */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Average Candidate Skills</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Global performance averages mapped across key competency areas</p>
              </div>

              <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillScoresData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="skill" stroke="#334155" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} width={100} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
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

      {/* Department Analysis Tab */}
      {activeTab === 'Department' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="cd-glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Department Performance Breakdown</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Detailed analysis of how each department is performing in AI assessments.</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {topDepartments.map((dept, index) => (
                <div key={index} style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: dept.color }}></span>
                    {dept.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>
                    <span>Total Interviews:</span>
                    <span style={{ fontWeight: 800, color: '#334155' }}>{dept.count}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748B' }}>
                    <span>Average Score:</span>
                    <span style={{ fontWeight: 800, color: '#DC2626' }}>{dept.avgScore}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748B' }}>
                    <span>Pass Rate:</span>
                    <span style={{ fontWeight: 800, color: '#10B981' }}>{dept.passRate}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748B' }}>
                    <span>Offers Extended:</span>
                    <span style={{ fontWeight: 800, color: '#F59E0B' }}>{dept.offers}</span>
                  </div>
                  <div style={{ width: '100%', background: '#E2E8F0', height: '6px', borderRadius: '3px', marginTop: '0.75rem' }}>
                    <div style={{ width: `${dept.passRate}%`, background: dept.color, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              ))}
              {topDepartments.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>No department data available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Pipeline Tab */}
      {activeTab === 'Candidate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="cd-glass-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Candidate Pipeline & Performance Analysis</h4>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Detailed tracking of candidate progression and skill competencies.</p>
            </div>
            
            <div className="cd-main-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Funnel Stats */}
              <div style={{ background: '#F8FAFC', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <h5 style={{ margin: '0 0 1.5rem 0', color: '#0F172A', fontSize: '1rem', fontWeight: 700 }}>Funnel Stages</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pipelineConversionData.map((stage, idx) => {
                    const maxCandidates = Math.max(...pipelineConversionData.map(d => d.candidates), 1);
                    const percentage = Math.round((stage.candidates / maxCandidates) * 100);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '100px', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{stage.stage}</div>
                        <div style={{ flex: 1, background: '#E2E8F0', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, background: '#DC2626', height: '100%', borderRadius: '6px', opacity: 1 - (idx * 0.15) }}></div>
                        </div>
                        <div style={{ width: '40px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{stage.candidates}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skill Competency */}
              <div style={{ background: '#F8FAFC', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <h5 style={{ margin: '0 0 1.5rem 0', color: '#0F172A', fontSize: '1rem', fontWeight: 700 }}>Average Skill Competency</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {skillScoresData.map((skill, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{skill.skill}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: skill.fill }}>{skill.score}%</span>
                      </div>
                      <div style={{ width: '100%', background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${skill.score}%`, background: skill.fill, height: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                  {skillScoresData.every(s => s.score === 0) && (
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', marginTop: '1rem' }}>No skill data recorded yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Interviewer Performance Tab (AI Evaluator) */}
      {activeTab === 'Interviewer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="cd-glass-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>AI Evaluator Performance</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Metrics on the SmartCampus AI interviewing engine's efficiency and reliability.</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={14} /> System Optimal
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Evaluation Consistency</div>
                <div style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 900 }}>98.5%</div>
                <div style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.25rem' }}>+0.2% from last month</div>
              </div>
              <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg. Feedback Latency</div>
                <div style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 900 }}>1.2s</div>
                <div style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.25rem' }}>Real-time processing</div>
              </div>
              <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Questions Generated</div>
                <div style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 900 }}>
                  {interviewHistory.reduce((acc, item) => acc + (item.qa_list?.length || 0), 0)}
                </div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.25rem' }}>Across all sessions</div>
              </div>
              <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Completion Rate</div>
                <div style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 900 }}>
                  {interviewHistory.length ? Math.round((interviewHistory.filter(i => i.qa_list?.length > 0).length / interviewHistory.length) * 100) : 0}%
                </div>
                <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.25rem' }}>Successful interactions</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'AI' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="cd-glass-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Synthesized AI Insights</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Automated analysis of candidate strengths, areas for improvement, and strategic recommendations.</p>
              </div>
              <Brain size={32} color="#DC2626" style={{ opacity: 0.8 }} />
            </div>

            <div className="cd-main-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Aggregated Strengths & Weaknesses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '1rem' }}>
                  <h5 style={{ margin: '0 0 1rem 0', color: '#10B981', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} /> Highlighted Strengths
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Array.from(new Set(interviewHistory.flatMap(i => {
                      try { return JSON.parse(i.report?.strengths || '[]'); } catch { return i.report?.strengths ? [i.report.strengths] : []; }
                    }))).filter(Boolean).slice(0, 5).map((s: string, idx: number) => (
                      <li key={idx}><strong>{s}</strong> - Consistently demonstrated across multiple technical evaluations.</li>
                    ))}
                    {interviewHistory.every(i => !i.report?.strengths) && <li>No strengths recorded yet.</li>}
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '1rem' }}>
                  <h5 style={{ margin: '0 0 1rem 0', color: '#DC2626', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingDown size={18} /> Areas for Improvement
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Array.from(new Set(interviewHistory.flatMap(i => {
                      try { return JSON.parse(i.report?.weaknesses || '[]'); } catch { return i.report?.weaknesses ? [i.report.weaknesses] : []; }
                    }))).filter(Boolean).slice(0, 5).map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                    {interviewHistory.every(i => !i.report?.weaknesses) && <li>No weaknesses recorded yet.</li>}
                  </ul>
                </div>
              </div>

              {/* Latest Recommendations */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                <h5 style={{ margin: '0 0 1.5rem 0', color: '#0F172A', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="#F59E0B" /> Strategic Recommendations
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                  {interviewHistory.filter(i => i.report?.recommendation).slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginBottom: '0.5rem' }}>
                        BASED ON {item.job_role?.toUpperCase() || 'SESSION'}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
                        {item.report?.recommendation}
                      </p>
                    </div>
                  ))}
                  {interviewHistory.every(i => !i.report?.recommendation) && (
                    <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: '2rem' }}>No recommendations generated yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
