import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Check,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Clock,
  Award,
  AlertTriangle,
  Activity,
  Archive,
  Copy,
  Trash,
  Brain,
  ShieldCheck,
  AlertCircle,
  X,
  Timer
} from 'lucide-react';
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

interface AssessmentItem {
  id: number;
  name: string;
  department: string;
  jobRole: string;
  difficulty: string;
  questionsCount: number;
  avgDuration: string;
  completionRate: number;
  isActive: boolean;
  isArchived: boolean;
  lastUsed: string;
  attempts: number;
  avgScore: number;
  passRate: number;
  weights: Record<string, number>;
  skills: { top: string[]; weak: string[] };
  aiInsights: string[];
  candidates: Array<{ name: string; score: number; status: string; date: string; avatar: string; trustScore: number; timeSpent: string }>;
  questions: Array<{ text: string; category: string; difficulty: string }>;
  scoreDistribution: number[];
}

const deriveAssessments = (history: InterviewHistoryItem[]): AssessmentItem[] => {
  return history.map((item) => {
    const avgScore = Math.round((item.average_score || 0) * 10);
    const questionCount = item.qa_list?.length || 0;
    const strengths = item.report?.strengths ? item.report.strengths.split(/[\n;]+/).filter(Boolean) : [];
    const weaknesses = item.report?.weaknesses ? item.report.weaknesses.split(/[\n;]+/).filter(Boolean) : [];
    return {
      id: item.interview_id,
      name: `${item.job_role || 'Interview'} — ${item.company || 'Company'}`,
      department: item.job_role || 'Engineering',
      jobRole: item.job_role || 'General Interview',
      difficulty: questionCount >= 6 ? 'Hard' : questionCount >= 3 ? 'Medium' : 'Easy',
      questionsCount: questionCount,
      avgDuration: `${Math.max(20, questionCount * 5)}m`,
      completionRate: questionCount > 0 ? 100 : 0,
      isActive: true,
      isArchived: false,
      lastUsed: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      attempts: 1,
      avgScore,
      passRate: avgScore,
      weights: {
        Technical: 20,
        ProblemSolving: 20,
        Communication: 20,
        Coding: 20,
        Behavioral: 20
      },
      skills: {
        top: strengths.length ? strengths.slice(0, 2) : ['Communication', 'Problem Solving'],
        weak: weaknesses.length ? weaknesses.slice(0, 2) : ['Coding Accuracy']
      },
      aiInsights: [
        item.report?.narrative_summary || 'No narrative summary available.',
        `Average score from this session was ${avgScore}%.`,
        strengths.length ? `Strengths detected: ${strengths.slice(0, 3).join(', ')}.` : 'Strengths were not explicitly captured.'
      ],
      candidates: [
        {
          name: `${item.company || 'Candidate'}`,
          score: avgScore,
          status: avgScore >= 70 ? 'Passed' : 'Failed',
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.interview_id}`,
          trustScore: Math.max(50, Math.min(100, avgScore + 15)),
          timeSpent: `${Math.max(10, questionCount * 5)}m`
        }
      ],
      questions: item.qa_list.map((qa) => ({ text: qa.question, category: 'Generated', difficulty: qa.score >= 8 ? 'Medium' : 'Easy' })),
      scoreDistribution: [
        avgScore > 0 ? Math.max(0, avgScore - 20) : 0,
        avgScore > 0 ? Math.max(0, avgScore - 10) : 0,
        avgScore > 0 ? avgScore : 0,
        avgScore > 0 ? Math.min(100, avgScore + 5) : 0,
        avgScore > 0 ? Math.min(100, avgScore + 10) : 0
      ]
    };
  });
};

export default function AssessmentsPage({ interviewHistory, loading }: { interviewHistory: InterviewHistoryItem[]; loading: boolean }) {
  const [assessments, setAssessments] = useState<AssessmentItem[]>(() => deriveAssessments(interviewHistory || []));
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
  const [selectedId, setSelectedId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  const [detailTab, setDetailTab] = useState<'Overview' | 'Questions' | 'Results' | 'Settings'>('Overview');
  const [newAssessment, setNewAssessment] = useState({
    name: 'New AI Assessment',
    department: 'Engineering',
    jobRole: 'Role Screening',
    difficulty: 'Medium',
    selectedQuestions: [] as string[],
    weights: {
      Technical: 20,
      ProblemSolving: 20,
      Communication: 20,
      Coding: 20,
      Behavioral: 20
    }
  });

  useEffect(() => {
    setAssessments(deriveAssessments(interviewHistory || []));
  }, [interviewHistory]);

  useEffect(() => {
    if (assessments.length && !assessments.some((item) => item.id === selectedId)) {
      setSelectedId(assessments[0].id);
    }
  }, [assessments, selectedId]);

  const toggleActiveStatus = (id: number) => {
    setAssessments(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isActive: !item.isActive };
      }
      return item;
    }));
  };

  const handleDuplicate = (id: number) => {
    const original = assessments.find(item => item.id === id);
    if (!original) return;
    const duplicated = {
      ...original,
      id: Date.now(),
      name: `${original.name} (Copy)`,
      attempts: 0,
      avgScore: 0,
      passRate: 0,
      candidates: [],
      lastUsed: 'Never used',
    };
    setAssessments(prev => [duplicated, ...prev]);
  };

  const handleDelete = (id: number) => {
    setAssessments(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isArchived: true, isActive: false };
      }
      return item;
    }));
    if (selectedId === id) {
      const remaining = assessments.filter(item => item.id !== id && !item.isArchived);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }
  };

  const handleCreateAssessment = () => {
    const newId = Date.now();
    const assessmentName = newAssessment.name || `New AI Assessment ${newId}`;
    const created: AssessmentItem = {
      id: newId,
      name: assessmentName,
      department: newAssessment.department,
      jobRole: newAssessment.jobRole || 'Role Screening',
      difficulty: newAssessment.difficulty,
      questionsCount: newAssessment.selectedQuestions.length || 5,
      avgDuration: `${Math.max(20, (newAssessment.selectedQuestions.length || 5) * 5)}m`,
      completionRate: 0,
      isActive: true,
      isArchived: false,
      lastUsed: 'Never used',
      attempts: 0,
      avgScore: 0,
      passRate: 0,
      weights: newAssessment.weights,
      skills: {
        top: ['Communication', 'Problem Solving'],
        weak: ['Coding Accuracy']
      },
      aiInsights: ['New assessment created. Configure questions to begin the evaluation.'],
      candidates: [],
      questions: newAssessment.selectedQuestions.length ? newAssessment.selectedQuestions.map((text) => ({ text, category: 'Generated', difficulty: 'Medium' })) : [
        { text: 'Describe your experience with system design.', category: 'Behavioral', difficulty: 'Medium' },
        { text: 'Explain a time you solved a hard technical problem.', category: 'Problem Solving', difficulty: 'Medium' }
      ],
      scoreDistribution: [0, 0, 0, 0, 0]
    };

    setAssessments(prev => [created, ...prev]);
    setSelectedId(newId);
    setActiveTab('Active');
    setDeptFilter('All');
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter(item => {
      const matchesArchiveTab = activeTab === 'Active' ? !item.isArchived : item.isArchived;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.jobRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'All' || item.department === deptFilter;
      return matchesArchiveTab && matchesSearch && matchesDept;
    });
  }, [assessments, activeTab, searchQuery, deptFilter]);

  const selectedAssessment = useMemo(() => {
    return assessments.find(item => item.id === selectedId) || assessments[0];
  }, [assessments, selectedId]);

  return (
    <div className="cd-container">
      <div className="cd-header">
        <h1 className="cd-title">AI Assessments</h1>
        <p className="cd-subtitle">Deploy custom technical screenings and review comprehensive candidate AI analytics.</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', padding: '0.25rem', borderRadius: '0.75rem', background: '#E5E7EB' }}>
            <button
              onClick={() => { setActiveTab('Active'); setDeptFilter('All'); }}
              style={{
                padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 600,
                background: activeTab === 'Active' ? '#ffffff' : 'transparent',
                color: activeTab === 'Active' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'Active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer'
              }}
            >
              <Activity size={16} /> Active
            </button>
            <button
              onClick={() => { setActiveTab('Archived'); setDeptFilter('All'); }}
              style={{
                padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 600,
                background: activeTab === 'Archived' ? '#ffffff' : 'transparent',
                color: activeTab === 'Archived' ? '#0F172A' : '#64748B',
                boxShadow: activeTab === 'Archived' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer'
              }}
            >
              <Archive size={16} /> Archived
            </button>
          </div>
          
          <button
            onClick={handleCreateAssessment}
            className="cd-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Create Assessment
          </button>
        </div>
      </div>

      <div className="cd-stats-grid">
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon red"><Brain size={24} /></div>
          <div>
            <div className="cd-stat-value">{assessments.filter(a => !a.isArchived).length}</div>
            <div className="cd-stat-label">Active Assessments</div>
          </div>
        </div>
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon navy"><ShieldCheck size={24} /></div>
          <div>
            <div className="cd-stat-value">87%</div>
            <div className="cd-stat-label">Avg Completion Rate</div>
          </div>
        </div>
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon amber"><Award size={24} /></div>
          <div>
            <div className="cd-stat-value">78.5</div>
            <div className="cd-stat-label">Avg AI Score</div>
          </div>
        </div>
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon red"><AlertTriangle size={24} /></div>
          <div>
            <div className="cd-stat-value">6</div>
            <div className="cd-stat-label">Flagged Responses</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Left Side: Assessment List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="cd-glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cd-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="cd-input"
                style={{ paddingRight: '2.5rem', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
              </select>
              <Filter size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAssessments.map(item => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="cd-glass-card"
                  style={{
                    padding: '1.5rem', cursor: 'pointer',
                    border: isSelected ? '1px solid #DC2626' : '1px solid #E5E7EB',
                    boxShadow: isSelected ? '0 4px 15px rgba(220, 38, 38, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#64748B', textTransform: 'uppercase' }}>
                          {item.department}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: item.difficulty === 'Hard' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: item.difficulty === 'Hard' ? '#DC2626' : '#F59E0B', textTransform: 'uppercase' }}>
                          {item.difficulty}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>{item.name}</h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDuplicate(item.id); }} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: '0.5rem', borderRadius: '0.5rem', color: '#64748B', cursor: 'pointer' }}>
                        <Copy size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'rgba(220, 38, 38, 0.1)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', color: '#DC2626', cursor: 'pointer' }}>
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', marginBottom: '0.25rem', fontWeight: 600 }}>
                      <span>Completion Rate</span>
                      <span style={{ color: '#0F172A' }}>{item.completionRate}%</span>
                    </div>
                    <div style={{ width: '100%', background: '#F1F5F9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ background: '#DC2626', height: '100%', width: `${item.completionRate}%`, borderRadius: '3px' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><HelpCircle size={14} /> {item.questionsCount} Qs</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {item.avgDuration}</span>
                    </div>
                    <span>Last used: <strong style={{ color: '#0F172A' }}>{item.lastUsed}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Assessment Details */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '2rem' }}>
            
            <div style={{ padding: '2rem', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', textTransform: 'uppercase' }}>
                {selectedAssessment?.department}
              </span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>{selectedAssessment?.name}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>Active Position: <strong style={{ color: '#0F172A' }}>{selectedAssessment?.jobRole}</strong></p>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#ffffff' }}>
              {['Overview', 'Questions', 'Results', 'Settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab as any)}
                  style={{
                    flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: detailTab === tab ? '#DC2626' : '#64748B',
                    fontWeight: detailTab === tab ? 700 : 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease',
                    borderBottom: detailTab === tab ? '2px solid #DC2626' : '2px solid transparent'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: '2rem', maxHeight: '600px', overflowY: 'auto' }}>
              
              {detailTab === 'Overview' && selectedAssessment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'Attempts', val: selectedAssessment.attempts },
                      { label: 'Avg Score', val: `${selectedAssessment.avgScore}%` },
                      { label: 'Pass Rate', val: `${selectedAssessment.passRate}%` }
                    ].map((st, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{st.label}</span>
                        <strong style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{st.val}</strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1.5rem', borderRadius: '1rem' }}>
                    <h6 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={18} /> AI Assessment Insights
                    </h6>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedAssessment.aiInsights.map((ins, i) => <li key={i}>{ins}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Score Distribution</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'].map((bracket, idx) => {
                        const scoreVal = selectedAssessment.scoreDistribution[idx] || 0;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ width: '60px', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{bracket}</span>
                            <div style={{ flex: 1, background: '#F1F5F9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ background: '#DC2626', height: '100%', width: `${scoreVal}%`, borderRadius: '4px' }}></div>
                            </div>
                            <span style={{ width: '40px', textAlign: 'right', fontSize: '0.8rem', color: '#0F172A', fontWeight: 700 }}>{scoreVal}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {detailTab === 'Results' && selectedAssessment && (
                <div>
                  <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Candidate Performance Logs</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedAssessment.candidates.map((c, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #E5E7EB', background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {c.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
                            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{c.date}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Trust Score</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: c.trustScore && c.trustScore > 85 ? '#10B981' : '#DC2626', fontWeight: 800 }}>
                              <ShieldCheck size={14} /> {c.trustScore}%
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Time</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#0F172A', fontWeight: 800 }}>
                              <Timer size={14} color="#64748B" /> {c.timeSpent}
                            </div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Score</div>
                            <div style={{ color: '#0F172A', fontWeight: 900, fontSize: '1.2rem' }}>{c.score}%</div>
                          </div>

                          <div style={{ width: '80px', textAlign: 'right' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '1rem', background: c.status === 'Passed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: c.status === 'Passed' ? '#10B981' : '#DC2626', textTransform: 'uppercase' }}>
                              {c.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedAssessment.candidates.length === 0 && (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No attempts recorded yet.</div>
                    )}
                  </div>
                </div>
              )}

              {(detailTab === 'Questions' || detailTab === 'Settings') && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
                  <Brain size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <h4 style={{ color: '#0F172A', margin: '0 0 0.5rem 0' }}>Configuration Details</h4>
                  <p style={{ margin: 0 }}>This section has been adapted to match the new Crimson Code aesthetic.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
