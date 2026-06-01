import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Calendar,
  MoreVertical,
  Users,
  UserPlus,
  UserCheck,
  Award,
  X,
  Phone,
  Mail,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Briefcase,
  Clock,
  Sparkles
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

interface CandidateItem {
  id: number;
  name: string;
  department: string;
  appliedDate: string;
  stage: string;
  score: number;
  interviewsCount: number;
  email: string;
  phone: string;
  history: InterviewHistoryItem;
}

interface CandidatesPageProps {
  interviewHistory: InterviewHistoryItem[];
  loading: boolean;
}

const deriveCandidates = (history: InterviewHistoryItem[]): CandidateItem[] => {
  return history.map((item) => {
    const score = Math.round((item.average_score || 0) * 10);
    const stage = score > 0 ? 'Completed' : 'Interview Scheduled';
    return {
      id: item.interview_id,
      name: `${item.company || 'Interview'} - ${item.job_role || 'Candidate'}`,
      department: item.job_role || 'N/A',
      appliedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      stage,
      score,
      interviewsCount: 1,
      email: '',
      phone: '',
      history: item,
    };
  });
};

export default function CandidatesPage({ interviewHistory, loading }: CandidatesPageProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering State
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [scoreRange, setScoreRange] = useState(0);

  const candidates = useMemo(() => deriveCandidates(interviewHistory || []), [interviewHistory]);
  const initialSelectionDone = useRef(false);

  useEffect(() => {
    if (!initialSelectionDone.current && !selectedCandidate && candidates.length) {
      setSelectedCandidate(candidates[0]);
      initialSelectionDone.current = true;
    }
  }, [candidates, selectedCandidate]);

  const totalCandidates = candidates.length;
  const pendingInterviews = candidates.filter(c => c.stage === 'Interview Scheduled').length;
  const strongFits = candidates.filter(c => c.score >= 80).length;
  const completedInterviews = candidates.filter(c => c.stage === 'Completed').length;

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || c.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || c.stage === statusFilter;
    const matchesScore = c.score >= scoreRange;
    return matchesSearch && matchesDept && matchesStatus && matchesScore;
  });

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'Offer Extended': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.2)' };
      case 'Completed': return { bg: 'rgba(15, 23, 42, 0.1)', text: '#0F172A', border: 'rgba(15, 23, 42, 0.2)' };
      case 'Interview Scheduled': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' };
      case 'Shortlisted': return { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626', border: 'rgba(220, 38, 38, 0.2)' };
      case 'Applied': return { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748B', border: 'rgba(100, 116, 139, 0.2)' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748B', border: 'rgba(100, 116, 139, 0.2)' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  return (
    <div className="candidate-dashboard" style={{ padding: '2rem', minHeight: 'calc(100vh - 2rem)', borderRadius: '1rem', overflowY: 'auto' }}>
      
      {/* Header aligned elegantly */}
      <div className="cd-header" style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="cd-title" style={{ fontSize: '2.5rem', color: '#0F172A' }}>Candidates Directory</h1>
          <p className="cd-subtitle" style={{ color: '#64748B' }}>Review, manage, and evaluate your candidate pipeline structurally.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', width: '18px' }} />
            <input 
              type="text" 
              placeholder="Search candidates..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cd-input"
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
          </div>
          <button className="cd-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="cd-stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Candidates', value: `${totalCandidates}`, icon: Users, colorClass: 'navy' },
          { label: 'Completed Interviews', value: `${completedInterviews}`, icon: Award, colorClass: 'amber' },
          { label: 'Strong Fits', value: `${strongFits}`, icon: UserCheck, colorClass: 'red' },
          { label: 'Pending Interviews', value: `${pendingInterviews}`, icon: Clock, colorClass: 'navy' }
        ].map((stat, i) => (
          <div key={i} className="cd-stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`cd-stat-icon ${stat.colorClass}`}>
              <stat.icon />
            </div>
            <div>
              <div className="cd-stat-value" style={{ fontSize: '1.8rem', margin: 0 }}>{stat.value}</div>
              <div className="cd-stat-label" style={{ marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        
        {/* Left Filter Sidebar */}
        <div style={{
          width: isFilterOpen ? '280px' : '0px',
          opacity: isFilterOpen ? 1 : 0,
          flexShrink: 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}>
          <div className="cd-glass-card" style={{ height: '100%', padding: '1.5rem' }}>
            
            {/* Filter Header with Reset Trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Filter size={18} color="#DC2626" /> Filters
              </h2>
              {(deptFilter !== 'All' || statusFilter !== 'All' || scoreRange > 0) && (
                <button 
                  onClick={() => {
                    setDeptFilter('All');
                    setStatusFilter('All');
                    setScoreRange(0);
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s' }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>
            
            {/* Department flex wrap pills */}
            <div style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Briefcase size={13} color="#64748B" /> Department
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['All', 'Computer Science', 'Electronics', 'Mechanical', 'Other'].map(dept => {
                  const isSelected = deptFilter === dept;
                  const displayLabel = dept === 'Computer Science' ? 'CS' : dept;
                  return (
                    <button
                      key={dept}
                      onClick={() => setDeptFilter(dept)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected ? '1px solid #DC2626' : '1px solid #E2E8F0',
                        background: isSelected ? 'rgba(220, 38, 38, 0.05)' : '#F8FAFC',
                        color: isSelected ? '#DC2626' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status flex wrap pills */}
            <div style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Clock size={13} color="#64748B" /> Status
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['All', 'Applied', 'Shortlisted', 'Interview Scheduled', 'Completed', 'Offer Extended'].map(status => {
                  const isSelected = statusFilter === status;
                  const displayLabel = status === 'Interview Scheduled' ? 'Scheduled' : status === 'Offer Extended' ? 'Offer' : status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        border: isSelected ? '1px solid #DC2626' : '1px solid #E2E8F0',
                        background: isSelected ? 'rgba(220, 38, 38, 0.05)' : '#F8FAFC',
                        color: isSelected ? '#DC2626' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min AI Score slider */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={13} color="#F59E0B" /> Min AI Score
                </span>
                <span style={{ color: '#DC2626', fontWeight: 800, background: 'rgba(220, 38, 38, 0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(220, 38, 38, 0.1)' }}>{scoreRange}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={scoreRange}
                onChange={(e) => setScoreRange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#DC2626', cursor: 'pointer' }}
              />
              {scoreRange > 0 && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic', fontWeight: 500 }}>
                  Displaying &ge; {scoreRange}% score
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Main Grid Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="cd-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Filter size={16} /> {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>
              Showing {filteredCandidates.length} candidates
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="cd-glass-card" style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              No candidates match your current structural filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredCandidates.map(c => {
                const stageStyle = getStageColor(c.stage);
                return (
                  <div 
                    key={c.id} 
                    className="cd-glass-card" 
                    onClick={() => setSelectedCandidate(c)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ 
                          width: '45px', height: '45px', borderRadius: '50%', 
                          background: '#DC2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '1.1rem'
                        }}>
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{c.name}</h3>
                          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>{c.department}</p>
                        </div>
                      </div>
                      <MoreVertical size={16} color="#94A3B8" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                        <Calendar size={14} /> {c.appliedDate}
                      </div>
                      <div style={{ 
                        padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                        background: stageStyle.bg, color: stageStyle.text, border: `1px solid ${stageStyle.border}`
                      }}>
                        {c.stage}
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: '1rem', background: '#F8FAFC', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>AI Evaluation Score</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: c.score > 0 ? '#0F172A' : '#94A3B8' }}>
                          {c.score > 0 ? `${c.score}%` : 'N/A'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', width: `${c.score}%`, 
                          background: c.score >= 80 ? '#10B981' : c.score >= 60 ? '#F59E0B' : '#DC2626',
                          transition: 'width 1s ease-in-out'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                        {c.interviewsCount} Interviews
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ padding: '0.4rem', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', borderRadius: '0.4rem', border: 'none', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedCandidate(c); }}>
                          <Eye size={16} />
                        </button>
                        <button style={{ padding: '0.4rem', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', borderRadius: '0.4rem', border: 'none', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                          <Calendar size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Candidate Profile Drawer */}
      {selectedCandidate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setSelectedCandidate(null)} />
          
          <div style={{ 
            position: 'relative', width: '500px', height: '100%', 
            background: '#ffffff',
            borderLeft: '1px solid #E5E7EB', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
            padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            <button 
              onClick={() => setSelectedCandidate(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: '#DC2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '2rem'
              }}>
                {getInitials(selectedCandidate.name)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>{selectedCandidate.name}</h2>
                <p style={{ color: '#DC2626', fontWeight: 600, fontSize: '1rem', margin: '0.2rem 0 0' }}>{selectedCandidate.department}</p>
              </div>
            </div>

            <div className="cd-glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                <Mail size={16} color="#DC2626" /> {selectedCandidate.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontSize: '0.95rem' }}>
                <Phone size={16} color="#DC2626" /> {selectedCandidate.phone}
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Pipeline Progress</h3>
            <div style={{ position: 'relative', marginBottom: '3rem' }}>
              <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: '#E5E7EB' }} />
              {['Applied', 'Shortlisted', 'Interview Scheduled', 'Completed', 'Offer Extended'].map((step, idx) => {
                const stages = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Completed', 'Offer Extended'];
                const currentIdx = stages.indexOf(selectedCandidate.stage);
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                
                return (
                  <div key={step} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 10, marginBottom: '1.5rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: isCompleted ? '#10B981' : isCurrent ? '#ffffff' : '#F8FAFC',
                      border: isCurrent ? '2px solid #DC2626' : '2px solid #E5E7EB',
                      color: 'white'
                    }}>
                      {isCompleted ? <CheckCircle2 size={18} /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isCurrent ? '#DC2626' : 'transparent' }} />}
                    </div>
                    <div style={{ paddingTop: '0.3rem' }}>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: isCompleted || isCurrent ? '#0F172A' : '#94A3B8' }}>{step}</p>
                      {isCurrent && <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>Current Stage</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="#DC2626" /> AI Assessment
            </h3>
            {selectedCandidate.score > 0 ? (
              <div className="cd-glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, color: '#64748B' }}>Overall Score</span>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>{selectedCandidate.score}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ width: `${selectedCandidate.score}%`, height: '100%', background: '#DC2626' }} />
                </div>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  Candidate demonstrates strong problem-solving skills and exceptional cultural fit. Recommended to proceed to the next technical round.
                </p>
              </div>
            ) : (
              <div className="cd-glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', marginBottom: '2rem' }}>
                No assessment data available yet.
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
              <button className="cd-btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Schedule
              </button>
              <button className="cd-btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                Extend Offer <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
