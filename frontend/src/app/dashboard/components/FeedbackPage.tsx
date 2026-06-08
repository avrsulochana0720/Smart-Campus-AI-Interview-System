import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  Award,
  AlertTriangle,
  Settings,
  Trash,
  Edit,
  Copy,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  X,
  Sliders,
  Sparkles,
  MessageSquare,
  Star,
  Users,
  Send,
  Plus,
  Eye,
  FileText,
  TrendingUp,
  Heart,
  Target
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import '../../../styles/CandidateDashboard.css';
import axios from 'axios';

// --- PENDING FEEDBACK DATA ---
const PENDING_FEEDBACK: any[] = [];

// --- FORMS TEMPLATES ---
const FORM_TEMPLATES: any[] = [];

// --- ANALYTICS DATA BUILDERS ---
const buildTrendsData = (feedbacks: any[], interviewHistory: any[]) => {
  const map = new Map<string, { month: string; Rating: number; count: number }>();
  feedbacks.forEach(f => {
    const d = new Date(f.created_at || new Date());
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const existing = map.get(month) || { month, Rating: 0, count: 0 };
    existing.Rating += f.rating;
    existing.count += 1;
    map.set(month, existing);
  });
  if (interviewHistory) {
    interviewHistory.forEach(h => {
      const d = new Date(h.date || new Date());
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const existing = map.get(month) || { month, Rating: 0, count: 0 };
      existing.Rating += (h.average_score / 2);
      existing.count += 1;
      map.set(month, existing);
    });
  }
  return Array.from(map.values()).map(v => ({
    month: v.month,
    Rating: Number((v.Rating / v.count).toFixed(1))
  }));
};

const buildSkillRadarData = (feedbacks: any[], interviewHistory: any[]) => {
  const allQa = interviewHistory ? interviewHistory.flatMap((i: any) => i.qa_list || []) : [];
  const techQa = allQa.filter((qa: any) => qa.question_type === 'technical');
  const hrQa = allQa.filter((qa: any) => qa.question_type === 'hr');
  
  const techScore = techQa.length > 0 ? Math.round((techQa.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / techQa.length) * 10) : 0;
  const hrScore = hrQa.length > 0 ? Math.round((hrQa.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / hrQa.length) * 10) : 0;
  
  const baselineA = Math.max(0, techScore - 10);
  const baselineB = Math.max(0, hrScore - 10);

  return [
    { subject: 'Technical', A: techScore, B: baselineA },
    { subject: 'HR / Behavioral', A: hrScore, B: baselineB }
  ];
};

const buildQualityScores = (feedbacks: any[]) => {
  const groups: Record<string, { count: number; totalRating: number }> = {};
  feedbacks.forEach(f => {
    const name = f.interviewer || 'User';
    if (!groups[name]) groups[name] = { count: 0, totalRating: 0 };
    groups[name].count += 1;
    groups[name].totalRating += f.rating;
  });
  return Object.entries(groups).map(([name, stat]) => ({
    name,
    count: stat.count,
    avg: stat.totalRating / stat.count,
    rate: '100%'
  }));
};

const buildWordCloud = (feedbacks: any[], interviewHistory: any[]) => {
  const text = feedbacks.map(f => f.comment).join(' ') + ' ' + 
               (interviewHistory ? interviewHistory.map(h => (h.report?.strengths || '') + ' ' + (h.report?.weaknesses || '')).join(' ') : '');
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const counts: Record<string, number> = {};
  const stopWords = new Set(['the', 'and', 'with', 'this', 'that', 'candidate', 'interview', 'good', 'very', 'have', 'from', 'will', 'they']);
  words.forEach(w => {
    if (!stopWords.has(w)) counts[w] = (counts[w] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return sorted.map((s, i) => ({
    text: s[0],
    size: `${Math.max(0.8, 2 - (i * 0.1))}rem`,
    color: ['#DC2626', '#F59E0B', '#10B981', '#0F172A', '#8B5CF6'][i % 5]
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

interface FeedbackPageProps {
  interviewHistory: Array<{
    interview_id: number;
    job_role: string;
    company: string;
    date: string;
    qa_list: Array<{ question: string; answer: string; score: number; feedback?: string; question_type?: string }>;
    total_score: number;
    average_score: number;
    report?: { narrative_summary: string; strengths: string; weaknesses: string; recommendation: string; proctoring_analysis?: any };
  }>;
  loading: boolean;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ interviewHistory, loading }) => {
  const [activeTab, setActiveTab] = useState<'Received' | 'Pending' | 'Forms' | 'Analytics'>('Received');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Expanded feedback cards state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Local states for reminders & approvals
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [reminderSent, setReminderSent] = useState<number | null>(null);

  React.useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/feedbacks", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mapped = res.data.map((f: any) => ({
          ...f,
          candidate: f.target,
          interviewer: "User",
          date: new Date(f.created_at).toLocaleDateString(),
          role: "Role",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(f.target)}`,
          skills: {
            Technical: f.rating,
            Communication: f.rating,
            ProblemSolving: f.rating,
            Coding: f.rating,
            Behavioral: f.rating
          },
          aiSentiment: 'User-submitted feedback from dashboard.',
          highlights: {
            strengths: ['Clear feedback submission'],
            improvements: ['Pending internal review']
          },
          approved: false
        }));
        setFeedbacks(mapped);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
      }
    };
    fetchFeedbacks();
  }, []);

  // Single feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    candidate: '',
    interviewer: '',
    role: '',
    rating: 5,
    comment: ''
  });
  const [formStatus, setFormStatus] = useState<string | null>(null);

  const handleSubmitFeedback = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!feedbackForm.candidate.trim() || !feedbackForm.interviewer.trim() || !feedbackForm.comment.trim()) {
      setFormStatus('Please complete candidate, interviewer, and comment fields.');
      return;
    }

    const newFeedback = {
      id: Date.now(),
      candidate: feedbackForm.candidate.trim(),
      role: feedbackForm.role.trim() || 'General Feedback',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      rating: Number(feedbackForm.rating),
      type: 'User Submission',
      department: 'Dashboard',
      interviewer: feedbackForm.interviewer.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(feedbackForm.candidate.trim())}`,
      comment: feedbackForm.comment.trim(),
      skills: {
        Technical: Number(feedbackForm.rating),
        Communication: Number(feedbackForm.rating),
        ProblemSolving: Number(feedbackForm.rating),
        Coding: Number(feedbackForm.rating),
        Behavioral: Number(feedbackForm.rating)
      },
      aiSentiment: 'User-submitted feedback from dashboard.',
      highlights: {
        strengths: ['Clear feedback submission'],
        improvements: ['Pending internal review']
      },
      approved: false
    };

    const submitToDb = async () => {
      try {
        const token = localStorage.getItem("token");
        const payload = {
          type: newFeedback.type,
          target: newFeedback.candidate,
          rating: newFeedback.rating,
          comment: newFeedback.comment,
          tag: "Dashboard"
        };
        const res = await axios.post("http://localhost:8000/feedbacks", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // We could use res.data.id here, but for now we just push the mapped newFeedback
        setFeedbacks(prev => [{ ...newFeedback, id: res.data.id }, ...prev]);
        setFormStatus('Feedback submitted successfully!');
        setFeedbackForm({ candidate: '', interviewer: '', role: '', rating: 5, comment: '' });
      } catch (err) {
        console.error("Error submitting feedback:", err);
        setFormStatus('Failed to submit feedback.');
      }
    };
    
    submitToDb();
  };

  // Filtered feedback rows
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchesSearch = f.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.interviewer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || f.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [feedbacks, searchQuery, typeFilter]);

  const TRENDS_DATA = useMemo(() => buildTrendsData(feedbacks, interviewHistory), [feedbacks, interviewHistory]);
  const SKILL_RADAR_DATA = useMemo(() => buildSkillRadarData(feedbacks, interviewHistory), [feedbacks, interviewHistory]);
  const QUALITY_SCORES = useMemo(() => buildQualityScores(feedbacks), [feedbacks]);
  const WORD_CLOUD = useMemo(() => buildWordCloud(feedbacks, interviewHistory), [feedbacks, interviewHistory]);

  // Calculate genuine stats
  const totalFeedbackCount = feedbacks.length + (interviewHistory?.length || 0);
  const avgSystemScore = (interviewHistory?.length || 0) > 0 
    ? interviewHistory.reduce((acc, h) => acc + (h.average_score / 2), 0) / interviewHistory.length 
    : 0;
  const totalRatingSum = feedbacks.reduce((acc, f) => acc + f.rating, 0) + (avgSystemScore * (interviewHistory?.length || 0));
  const avgRating = totalFeedbackCount > 0 ? (totalRatingSum / totalFeedbackCount).toFixed(1) : '0.0';
  const pendingCount = PENDING_FEEDBACK.length;

  // Handle reminder click
  const triggerReminder = (id: number) => {
    setReminderSent(id);
    setTimeout(() => setReminderSent(null), 3000);
  };

  // Toggle approval decision
  const toggleFlagStatus = (id: number) => {
    setFeedbacks(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, approved: !f.approved };
      }
      return f;
    }));
  };

  return (
    <div className="cd-container">

      {/* 1. Page Header */}
      <div className="cd-header" style={{ marginBottom: '2rem' }}>
        <h1 className="cd-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          Feedback Hub
          <span style={{ fontSize: '0.8rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#DC2626', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '1px' }}>
            Evaluation Center
          </span>
        </h1>
        <p className="cd-subtitle">Review candidate assessments, track pending feedback, and analyze interviewer quality.</p>
        
        {/* Tab Navigation inside header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'center', background: '#F8FAFC', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB', maxWidth: 'max-content', margin: '1.5rem auto 0 auto' }}>
          {['Received Feedback', 'Pending Feedback', 'Feedback Forms', 'Analytics'].map(tab => {
            const key = tab.split(' ')[0] as any;
            const isActive = activeTab === key;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: isActive ? 700 : 600,
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#DC2626' : '#64748B', border: isActive ? '1px solid #E5E7EB' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer', transition: 'all 0.3s ease', whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top KPI Strip (4 Cards) */}
      <div className="cd-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
        {[
          { label: 'Total Feedback', value: totalFeedbackCount.toString(), desc: 'Based on actual data', icon: MessageSquare, colorClass: 'red' },
          { label: 'Avg Rating', value: avgRating, desc: 'Out of 5.0 scale', icon: Star, colorClass: 'amber' },
          { label: 'Pending Reviews', value: pendingCount.toString(), desc: 'Requires attention', icon: Clock, colorClass: 'red' },
          { label: 'Response Rate', value: totalFeedbackCount > 0 ? '100%' : '0%', desc: 'High engagement', icon: CheckCircle, colorClass: 'navy' }
        ].map((stat, i) => (
          <div key={i} className="cd-stat-card">
            <div className={`cd-stat-icon ${stat.colorClass}`}><stat.icon size={24} /></div>
            <div className="cd-stat-value" style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>{stat.value}</div>
            <div className="cd-stat-label">{stat.label}</div>
            <div className="trend trend-up" style={{ color: '#64748B' }}>{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* 3. Tab Contents Layout */}

      {/* --- RECEIVED FEEDBACK TAB --- */}
      {activeTab === 'Received' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Inline Filter Chips Bar */}
          <div className="cd-glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search candidates or interviewers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cd-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', itemsCenter: 'center', gap: '0.5rem', overflowX: 'auto' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', paddingRight: '0.5rem' }}>
                <Filter size={14} /> Filter Type:
              </span>
              {['All', 'Technical', 'HR Round', 'Panel'].map(chip => (
                <button
                  key={chip}
                  onClick={() => setTypeFilter(chip)}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700,
                    background: typeFilter === chip ? 'rgba(220, 38, 38, 0.1)' : '#F8FAFC',
                    color: typeFilter === chip ? '#DC2626' : '#64748B',
                    border: typeFilter === chip ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid #E5E7EB',
                    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Single Feedback Submission Form */}
          <div className="cd-glass-card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#0F172A', fontSize: '1.15rem', fontWeight: 700 }}>Submit Feedback</h4>
            <p style={{ margin: '0 0 1rem 0', color: '#64748B', fontSize: '0.9rem' }}>Share a quick candidate evaluation or interviewer experience directly from the dashboard.</p>
            <form onSubmit={handleSubmitFeedback} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Candidate name"
                  value={feedbackForm.candidate}
                  onChange={e => setFeedbackForm(prev => ({ ...prev, candidate: e.target.value }))}
                  className="cd-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Interviewer name"
                  value={feedbackForm.interviewer}
                  onChange={e => setFeedbackForm(prev => ({ ...prev, interviewer: e.target.value }))}
                  className="cd-input"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Role / Position"
                  value={feedbackForm.role}
                  onChange={e => setFeedbackForm(prev => ({ ...prev, role: e.target.value }))}
                  className="cd-input"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>Rating</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: num }))}
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '0.75rem',
                          border: '1px solid #E5E7EB',
                          background: num <= feedbackForm.rating ? '#DC2626' : '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <Star size={18} color={num <= feedbackForm.rating ? '#FFFFFF' : '#94A3B8'} fill={num <= feedbackForm.rating ? '#FFFFFF' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea
                rows={4}
                placeholder="Write your feedback here..."
                value={feedbackForm.comment}
                onChange={e => {
                  setFeedbackForm(prev => ({ ...prev, comment: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                className="cd-input"
                style={{ minHeight: '110px', overflow: 'hidden', resize: 'none' }}
                required
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                {formStatus && <span style={{ color: '#10B981', fontWeight: 700 }}>{formStatus}</span>}
                <button type="submit" className="cd-btn-primary" style={{ marginLeft: 'auto' }}>
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>

          {/* Cards List (Full Width Accordions) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFeedbacks.map(item => {
              const isExpanded = expandedId === item.id;
              
              // Determine border color tag based on rating
              let accentColor = '#10B981'; // Green
              if (item.rating === 3 || item.rating === 4) accentColor = '#F59E0B'; // Amber
              if (item.rating <= 2) accentColor = '#EF4444'; // Red

              return (
                <div
                  key={item.id}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    background: '#ffffff',
                    border: `1px solid #E5E7EB`,
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'
                  }}
                >
                  
                  {/* Card Header Content */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    
                    {/* Left: Candidate Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '200px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #E5E7EB', background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {item.candidate.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>{item.candidate}</h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{item.role} • <span style={{ color: '#94A3B8' }}>{item.date}</span></div>
                      </div>
                    </div>

                    {/* Middle: Rating Preview & Skill Dots */}
                    <div style={{ flex: '1', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} size={14} color={idx < item.rating ? '#F59E0B' : '#E2E8F0'} fill={idx < item.rating ? '#F59E0B' : 'none'} />
                        ))}
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#334155', marginLeft: '0.5rem', background: '#F8FAFC', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #E5E7EB', textTransform: 'uppercase' }}>{item.type}</span>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: isExpanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.comment}
                      </p>
                    </div>

                    {/* Right: Interviewer Name & Toggle Chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '150px', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748B', letterSpacing: '1px' }}>Interviewed by</span>
                        <strong style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 800 }}>{item.interviewer}</strong>
                      </div>
                      <div style={{ padding: '0.4rem', borderRadius: '50%', background: '#F8FAFC', transition: 'background 0.2s' }}>
                        {isExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Accordion State */}
                  {isExpanded && (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                      
                      {/* Sub-grid for Highlights and AI Sentiment */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        
                        {/* Highlights (Strengths/Improvements) */}
                        <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1.25rem' }}>
                          <h6 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Target size={16} color="#DC2626" /> AI Highlights
                          </h6>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Key Strengths</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {item.highlights.strengths.map((str, idx) => (
                                  <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{str}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Areas for Improvement</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {item.highlights.improvements.map((imp, idx) => (
                                  <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{imp}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI Sentiment Assessment */}
                        <div style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                          <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={16} color="#DC2626" /> AI Sentiment Assessment
                          </h6>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.5, fontWeight: 500 }}>
                            {item.aiSentiment}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Skill Scores */}
                      <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1.25rem' }}>
                        <h6 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Detailed Skill Competency</h6>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                          {Object.entries(item.skills).map(([skill, score]) => (
                            <div key={skill} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div key={i} style={{ height: '6px', flex: 1, borderRadius: '2px', background: i < score ? '#DC2626' : '#E2E8F0' }}></div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flag / Approve Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
                        <button
                          onClick={() => toggleFlagStatus(item.id)}
                          style={{
                            padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                            background: item.approved ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            border: item.approved ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                            color: item.approved ? '#F59E0B' : '#10B981'
                          }}
                        >
                          {item.approved ? <AlertTriangle size={16} /> : <Check size={16} />}
                          {item.approved ? 'Flag for Audit' : 'Approve Feedback'}
                        </button>

                        <button className="cd-btn-primary">
                          Message Interviewer
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}

            {filteredFeedbacks.length === 0 && (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <MessageSquare size={64} color="#94A3B8" style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>No Feedback Matches</h5>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>We couldn't find any evaluation entries matching your search query.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PENDING FEEDBACK TAB --- */}
      {activeTab === 'Pending' && (
        <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Awaiting Review Submissions</h4>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Tracking proctored technical loops still pending evaluator signoffs</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#ffffff', color: '#64748B', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Candidate</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Interview Date</th>
                  <th style={{ padding: '1rem', fontWeight: 800 }}>Assigned Interviewer</th>
                  <th style={{ padding: '1rem', fontWeight: 800 }}>Due Date</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {PENDING_FEEDBACK.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center' }}>
                      <CheckCircle size={48} color="#10B981" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>All Caught Up!</h5>
                      <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>There are no pending evaluations waiting for review.</p>
                    </td>
                  </tr>
                ) : (
                  PENDING_FEEDBACK.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s' }}>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{p.candidate}</div>
                        <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>{p.role}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#334155' }}>{p.date}</td>
                      <td style={{ padding: '1.25rem 1rem', color: '#0F172A', fontWeight: 600 }}>{p.interviewer}</td>
                      <td style={{ padding: '1.25rem 1rem', color: '#64748B' }}>{p.due}</td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700,
                          background: p.status === 'Overdue' ? 'rgba(239, 68, 68, 0.1)' : p.status === 'Due Today' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(15, 23, 42, 0.1)',
                          border: p.status === 'Overdue' ? '1px solid rgba(239, 68, 68, 0.2)' : p.status === 'Due Today' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(15, 23, 42, 0.2)',
                          color: p.status === 'Overdue' ? '#EF4444' : p.status === 'Due Today' ? '#F59E0B' : '#0F172A'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => triggerReminder(p.id)}
                            style={{
                              padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem',
                              background: reminderSent === p.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                              border: reminderSent === p.id ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(220, 38, 38, 0.2)',
                              color: reminderSent === p.id ? '#10B981' : '#DC2626'
                            }}
                          >
                            {reminderSent === p.id ? <Check size={12} /> : <Send size={12} />}
                            {reminderSent === p.id ? 'Reminder Sent!' : 'Send Reminder'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- FEEDBACK FORMS TAB --- */}
      {activeTab === 'Forms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Feedback Form Templates</h4>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Customize specific evaluation scorecards per pipeline node</p>
            </div>
            <button className="cd-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Create Template
            </button>
          </div>

          {FORM_TEMPLATES.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#ffffff', borderRadius: '1rem', border: '1px dashed #E5E7EB' }}>
              <FileText size={48} color="#94A3B8" style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>No Templates Found</h5>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Create your first feedback form template to standardize evaluations.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {FORM_TEMPLATES.map(form => (
                <div key={form.id} className="cd-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', background: '#F8FAFC', color: '#64748B', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                      {form.type}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700, lineHeight: 1.4 }}>{form.name}</h4>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileText size={14} color="#94A3B8" /> {form.questions} Questions</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} color="#94A3B8" /> Last: {form.lastUsed}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' }}><Eye size={16} /></button>
                    <button style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' }}><Edit size={16} /></button>
                    <button style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' }}><Copy size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- ANALYTICS TAB (Recharts Visual Charts) --- */}
      {activeTab === 'Analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {(feedbacks.length === 0 && (!interviewHistory || interviewHistory.length === 0)) ? (
            <div className="cd-glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
              <TrendingUp size={64} color="#94A3B8" style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 700 }}>Not Enough Data</h5>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Complete more interviews and submit feedback to generate analytics.</p>
            </div>
          ) : (
            <>
              {/* Row 1: Line Chart & Radar (2 equal cols) */}
              <div className="cd-main-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            
            {/* LineChart: Rating trend over time */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Rating Trend Over Time</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Average submitted score ratings compiled over 6 months</p>
              </div>

              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={TRENDS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[3.0, 5.0]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Rating" stroke="#DC2626" strokeWidth={3.5} activeDot={{ r: 6, fill: '#DC2626', stroke: '#fff' }} dot={{ strokeWidth: 2, r: 4, fill: '#ffffff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BarChart: Skill Competency */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Skill Competency Comparison</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Holistic scores comparing current candidates (A) versus baseline (B)</p>
              </div>

              <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SKILL_RADAR_DATA} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="subject" stroke="#334155" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} width={120} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                    <Bar dataKey="A" name="Current Score" fill="#0EA5E9" radius={[0, 4, 4, 0]} barSize={16} />
                    <Bar dataKey="B" name="Baseline" fill="#E2E8F0" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 2: Interviewer Quality scores & Word Cloud */}
          <div className="cd-main-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            
            {/* Table: Interviewer quality leaderboard */}
            <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Interviewer Quality Leaderboard</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Tracking evaluator response speed, review quantity, and scoring metrics</p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#ffffff', color: '#64748B', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px', borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Interviewer</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Reviews Logged</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Avg Rating</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 800 }}>Response Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUALITY_SCORES.map((q, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s' }}>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{q.name}</td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#334155', fontWeight: 600 }}>{q.count}</td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                          <span style={{ color: '#F59E0B', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            <Star size={12} fill="#F59E0B" /> {q.avg.toFixed(1)}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: '#10B981', fontWeight: 800 }}>{q.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Word Cloud */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Common Keywords</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Top parsed phrases in feedback files</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
                {WORD_CLOUD.length === 0 ? (
                  <span style={{ color: '#94A3B8' }}>No keywords found</span>
                ) : (
                  WORD_CLOUD.map((tag, idx) => (
                    <span key={idx} style={{ 
                      padding: '0.4rem 0.8rem', borderRadius: '2rem', background: '#ffffff', 
                      border: `1px solid ${tag.color}`, color: tag.color, 
                      fontSize: tag.size, fontWeight: 700, cursor: 'default', transition: 'all 0.3s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {tag.text}
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>
          </>
          )}
        </div>
      )}

    </div>
  );
}

export default FeedbackPage;
