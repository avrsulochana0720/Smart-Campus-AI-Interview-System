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

// --- MOCK RECEIVED FEEDBACK DATA ---
const INITIAL_FEEDBACK = [
  {
    id: 1,
    candidate: 'Aarav Mehta',
    role: 'Software Engineer',
    date: 'Oct 28, 2026',
    rating: 5,
    type: 'Technical',
    department: 'Engineering',
    interviewer: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    comment: 'Exceptional system design logic. Aarav clearly explained distributed systems concepts, partition tolerance, and cache invalidation. His SQL optimizations were pristine. Strong technical knowledge and precise code structure.',
    skills: { Technical: 5, Communication: 5, ProblemSolving: 4, Coding: 5, Behavioral: 4 },
    aiSentiment: 'Highly Positive. Candidate demonstrates senior-level architectural intuition. Strong fit for scale-heavy backend squads.',
    highlights: {
      strengths: ['System Architecture', 'SQL Optimization', 'Clear Communication'],
      improvements: ['Minor edge case testing']
    },
    approved: true
  },
  {
    id: 2,
    candidate: 'Diya Patel',
    role: 'Product Manager',
    date: 'Oct 27, 2026',
    rating: 4,
    type: 'Panel',
    department: 'Product',
    interviewer: 'Mike Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diya',
    comment: 'Great user-centric approach. Diya structured her product roadmap decisions effectively. Communication was clear, although system metrics trade-off could be slightly more analytical.',
    skills: { Technical: 3, Communication: 5, ProblemSolving: 4, Coding: 0, Behavioral: 5 },
    aiSentiment: 'Positive. Candidate displays high user empathy and cross-functional coordination ability. Minor improvements needed in quantitative benchmarking.',
    highlights: {
      strengths: ['User Empathy', 'Roadmap Structuring', 'Cross-functional Collaboration'],
      improvements: ['Quantitative Benchmarking']
    },
    approved: true
  },
  {
    id: 3,
    candidate: 'Kabir Sharma',
    role: 'Frontend Developer',
    date: 'Oct 26, 2026',
    rating: 2,
    type: 'Technical',
    department: 'Engineering',
    interviewer: 'Alex Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir',
    comment: 'Struggled with React optimization patterns. The candidate was unable to explain context performance re-renders, and code quality in the hooks section was messy. Did not finish the layout mock.',
    skills: { Technical: 2, Communication: 3, ProblemSolving: 2, Coding: 1, Behavioral: 3 },
    aiSentiment: 'Constructive / Negative. Core React fundamentals are currently lacking. Recommended to defer for 6 months.',
    highlights: {
      strengths: ['Basic CSS formatting'],
      improvements: ['React Hooks', 'Performance Optimization', 'Code Cleanliness']
    },
    approved: false
  },
  {
    id: 4,
    candidate: 'Isha Rao',
    role: 'UX Designer',
    date: 'Oct 26, 2026',
    rating: 4,
    type: 'HR Round',
    department: 'Design',
    interviewer: 'Emma Watson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isha',
    comment: 'Fantastic storytelling. Isha justified her design portfolio decisions with precise user telemetry. Behavioral alignment was top-tier and collaboration mindset is excellent.',
    skills: { Technical: 4, Communication: 5, ProblemSolving: 4, Coding: 0, Behavioral: 5 },
    aiSentiment: 'Highly Positive. Culture add with exceptional articulate representation skills. Recommended for immediate offer routing.',
    highlights: {
      strengths: ['Storytelling', 'Telemetry Integration', 'Culture Fit'],
      improvements: ['None flagged']
    },
    approved: true
  }
];

// --- PENDING FEEDBACK DATA ---
const PENDING_FEEDBACK = [
  { id: 101, candidate: 'Rohan Nair', role: 'Backend Dev', date: 'Oct 29, 2026', interviewer: 'Sarah Chen', due: 'Today', status: 'Due Today' },
  { id: 102, candidate: 'Sneha Iyer', role: 'Data Scientist', date: 'Oct 28, 2026', interviewer: 'David Lee', due: '2 days ago', status: 'Overdue' },
  { id: 103, candidate: 'Karan Singh', role: 'DevOps Engineer', date: 'Oct 29, 2026', interviewer: 'Emma Watson', due: 'In 2 days', status: 'Pending' },
  { id: 104, candidate: 'Meera Patel', role: 'QA Engineer', date: 'Oct 29, 2026', interviewer: 'Alex Kim', due: 'In 3 days', status: 'Pending' }
];

// --- FORMS TEMPLATES ---
const FORM_TEMPLATES = [
  { id: 201, name: 'Technical Interview Evaluation', questions: 12, lastUsed: 'Oct 28, 2026', type: 'Engineering' },
  { id: 202, name: 'HR / Culture Fit Assessment', questions: 8, lastUsed: 'Oct 26, 2026', type: 'HR' },
  { id: 203, name: 'Product/Design Panel Review', questions: 10, lastUsed: 'Oct 25, 2026', type: 'Product' },
  { id: 204, name: 'Behavioral & Core Values Audit', questions: 6, lastUsed: 'Oct 24, 2026', type: 'General' }
];

// --- ANALYTICS MOCK DATA ---
const TRENDS_DATA = [
  { month: 'Jan', Rating: 4.0 },
  { month: 'Feb', Rating: 4.1 },
  { month: 'Mar', Rating: 3.9 },
  { month: 'Apr', Rating: 4.2 },
  { month: 'May', Rating: 4.3 },
  { month: 'Jun', Rating: 4.2 }
];

const SKILL_RADAR_DATA = [
  { subject: 'Technical', A: 82, B: 65, fullMark: 100 },
  { subject: 'Problem Solving', A: 78, B: 70, fullMark: 100 },
  { subject: 'Communication', A: 88, B: 85, fullMark: 100 },
  { subject: 'Coding', A: 75, B: 55, fullMark: 100 },
  { subject: 'Behavioral', A: 92, B: 80, fullMark: 100 }
];

const QUALITY_SCORES = [
  { name: 'Sarah Chen', count: 42, avg: 4.4, rate: '98%' },
  { name: 'Mike Johnson', count: 28, avg: 4.1, rate: '92%' },
  { name: 'Emma Watson', count: 34, avg: 4.5, rate: '96%' },
  { name: 'Alex Kim', count: 18, avg: 3.8, rate: '88%' }
];

const WORD_CLOUD = [
  { text: 'Problem Solver', color: '#F97316', size: '1.2rem' },
  { text: 'SQL Optimization', color: '#DC2626', size: '0.9rem' },
  { text: 'Articulate', color: '#EF4444', size: '1rem' },
  { text: 'System Architecture', color: '#10B981', size: '1.1rem' },
  { text: 'Hooks re-render', color: '#EF4444', size: '0.8rem' },
  { text: 'Culture Alignment', color: '#F59E0B', size: '1.05rem' },
  { text: 'Figma Interaction', color: '#0F172A', size: '0.85rem' },
  { text: 'Scalable Architecture', color: '#EC4899', size: '1.15rem' }
];

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
    qa_list: Array<{ question: string; answer: string; score: number; feedback?: string }>;
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
  const [feedbacks, setFeedbacks] = useState(INITIAL_FEEDBACK);
  const [reminderSent, setReminderSent] = useState<number | null>(null);

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

    setFeedbacks(prev => [newFeedback, ...prev]);
    setFormStatus('Feedback submitted successfully!');
    setFeedbackForm({ candidate: '', interviewer: '', role: '', rating: 5, comment: '' });
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
          { label: 'Total Feedback', value: '184', desc: '+24 this week', icon: MessageSquare, colorClass: 'red' },
          { label: 'Avg Rating', value: '4.2', desc: 'Out of 5.0 scale', icon: Star, colorClass: 'amber' },
          { label: 'Pending Reviews', value: '23', desc: 'Requires attention', icon: Clock, colorClass: 'red' },
          { label: 'Response Rate', value: '94%', desc: 'High engagement', icon: CheckCircle, colorClass: 'navy' }
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
                onChange={e => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                className="cd-input"
                style={{ minHeight: '110px' }}
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
                {PENDING_FEEDBACK.map(p => (
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
                ))}
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
        </div>
      )}

      {/* --- ANALYTICS TAB (Recharts Visual Charts) --- */}
      {activeTab === 'Analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
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

            {/* RadarChart: Skill Competency Radar */}
            <div className="cd-glass-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Skill Competency Radar</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Holistic scores comparing current candidates (A) versus baseline (B)</p>
              </div>

              <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={SKILL_RADAR_DATA}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={10} fontWeight={600} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Active Candidate Avg" dataKey="A" stroke="#DC2626" fill="#DC2626" fillOpacity={0.4} />
                    <Radar name="Position Baseline" dataKey="B" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#64748B' }} />
                  </RadarChart>
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
                {WORD_CLOUD.map((tag, idx) => (
                  <span key={idx} style={{ 
                    padding: '0.4rem 0.8rem', borderRadius: '2rem', background: '#ffffff', 
                    border: `1px solid ${tag.color}`, color: tag.color, 
                    fontSize: tag.size, fontWeight: 700, cursor: 'default', transition: 'all 0.3s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    {tag.text}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default FeedbackPage;
