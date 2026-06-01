import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  HelpCircle,
  Award,
  Trash,
  Copy,
  BookOpen,
  Code,
  Briefcase,
  Play,
  FileText,
  Tag,
  Clock,
  Sparkles,
  Edit,
  X,
  Layers,
  Activity,
  AlertTriangle
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

interface QuestionItem {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  category: string;
  department: string;
  usageCount: number;
  avgScore: number;
  passRate: number;
  failRate: number;
  options?: string[];
  correctIndex?: number;
  tags: string[];
  aiCriteria: string;
  assessments: string[];
  referenceAnswer?: string;
  problemStatement?: string;
}

const deriveQuestions = (history: InterviewHistoryItem[]): QuestionItem[] => {
  const questions: QuestionItem[] = [];
  history.forEach((item) => {
    item.qa_list.forEach((qa, idx) => {
      questions.push({
        id: item.interview_id * 100 + idx,
        text: qa.question,
        type: qa.question.toLowerCase().includes('function') || qa.question.toLowerCase().includes('implement') ? 'Coding' : 'Technical',
        difficulty: qa.score >= 8 ? 'Medium' : 'Hard',
        category: qa.question.toLowerCase().includes('team') ? 'Behavioral' : 'Technical Knowledge',
        department: item.job_role || 'Engineering',
        usageCount: 1,
        avgScore: Math.round((qa.score || 0) * 10),
        passRate: qa.score >= 7 ? 100 : 50,
        failRate: qa.score >= 7 ? 0 : 50,
        options: [],
        correctIndex: 0,
        tags: ['Generated', item.job_role || 'Interview'],
        aiCriteria: 'Quality: 50%, Clarity: 30%, Accuracy: 20%',
        assessments: [item.job_role || 'AI Interview'],
        referenceAnswer: qa.answer,
        problemStatement: qa.question
      });
    });
  });
  return questions;
};

export default function QuestionBankPage({ interviewHistory, loading }: { interviewHistory: InterviewHistoryItem[]; loading: boolean }) {
  const [questions, setQuestions] = useState<QuestionItem[]>(() => deriveQuestions(interviewHistory || []));
  const [selectedId, setSelectedId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    setQuestions(deriveQuestions(interviewHistory || []));
  }, [interviewHistory]);

  useEffect(() => {
    if (questions.length && !questions.some((q) => q.id === selectedId)) {
      setSelectedId(questions[0].id);
    }
  }, [questions, selectedId]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'MCQ',
    category: 'Technical Knowledge',
    department: 'Computer Science',
    difficulty: 'Medium',
    tags: '',
    aiCriteria: 'Logical Flow: 40%, Accuracy: 40%, Communication: 20%'
  });

  // Calculate filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || q.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
      const matchesType = typeFilter === 'All' || q.type === typeFilter;
      return matchesSearch && matchesCategory && matchesDifficulty && matchesType;
    });
  }, [questions, searchQuery, categoryFilter, difficultyFilter, typeFilter]);

  // Selected question details
  const selectedQuestion = useMemo(() => {
    return questions.find(q => q.id === selectedId) || questions[0];
  }, [questions, selectedId]);

  // Duplicate a question
  const handleDuplicate = (id: number) => {
    const original = questions.find(q => q.id === id);
    if (!original) return;
    const duplicated = {
      ...original,
      id: Date.now(),
      text: `${original.text} (Copy)`,
      usageCount: 0,
      avgScore: 0,
      passRate: 0,
      failRate: 0,
      assessments: []
    };
    setQuestions(prev => [duplicated, ...prev]);
  };

  // Delete a question
  const handleDelete = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedId === id) {
      const remaining = questions.filter(q => q.id !== id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }
  };

  const handleAddSubmit = () => {
    if (!newQuestion.text.trim()) return;
    const formattedTags = newQuestion.tags.split(',').map(t => t.trim()).filter(t => t);
    
    const created: any = {
      id: Date.now(),
      text: newQuestion.text,
      type: newQuestion.type,
      difficulty: newQuestion.difficulty,
      category: newQuestion.category,
      department: newQuestion.department,
      usageCount: 0,
      avgScore: 0,
      passRate: 0,
      failRate: 0,
      tags: formattedTags.length > 0 ? formattedTags : ['General'],
      aiCriteria: newQuestion.aiCriteria,
      assessments: [],
    };

    setQuestions(prev => [created, ...prev]);
    setSelectedId(created.id);
    setIsAddModalOpen(false);
    setNewQuestion({
      text: '', type: 'MCQ', category: 'Technical Knowledge', department: 'Computer Science',
      difficulty: 'Medium', tags: '', aiCriteria: 'Logical Flow: 40%, Accuracy: 40%, Communication: 20%'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MCQ': return <FileText size={12} />;
      case 'Coding': return <Code size={12} />;
      case 'Descriptive': return <BookOpen size={12} />;
      case 'Case Study': return <Briefcase size={12} />;
      default: return <HelpCircle size={12} />;
    }
  };

  return (
    <div className="cd-container">
      <div className="cd-header">
        <h1 className="cd-title">Question Bank</h1>
        <p className="cd-subtitle">Curate, edit, and analyze the performance of interview questions across all departments.</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="cd-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Add New Question
          </button>
        </div>
      </div>

      <div className="cd-stats-grid">
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon amber"><BookOpen size={24} /></div>
          <div>
            <div className="cd-stat-value">{questions.length}</div>
            <div className="cd-stat-label">Total Questions</div>
          </div>
        </div>
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon red"><Code size={24} /></div>
          <div>
            <div className="cd-stat-value">{questions.filter(q => q.type === 'Coding').length}</div>
            <div className="cd-stat-label">Coding Challenges</div>
          </div>
        </div>
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon navy"><Briefcase size={24} /></div>
          <div>
            <div className="cd-stat-value">{questions.filter(q => q.category === 'Behavioral').length}</div>
            <div className="cd-stat-label">Behavioral Qs</div>
          </div>
        </div>
        <div className="cd-stat-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
          <div className="cd-stat-icon red"><AlertTriangle size={24} /></div>
          <div>
            <div className="cd-stat-value">{questions.filter(q => q.difficulty === 'Expert').length}</div>
            <div className="cd-stat-label">Expert Difficulty</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Left Side: Professional List View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="cd-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search prompt text or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cd-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="cd-input"
                style={{ appearance: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.5rem' }}
              >
                <option value="All">All Categories</option>
                <option value="Technical Knowledge">Technical</option>
                <option value="Problem Solving">Problem Solving</option>
                <option value="Coding">Coding</option>
                <option value="Behavioral">Behavioral</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value)}
                className="cd-input"
                style={{ appearance: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.5rem' }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="cd-input"
                style={{ appearance: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0.5rem' }}
              >
                <option value="All">All Types</option>
                <option value="MCQ">MCQ</option>
                <option value="Coding">Coding</option>
                <option value="Descriptive">Descriptive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredQuestions.map(item => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="cd-glass-card"
                  style={{
                    padding: '1.25rem', cursor: 'pointer',
                    border: isSelected ? '1px solid #DC2626' : '1px solid #E5E7EB',
                    boxShadow: isSelected ? '0 4px 15px rgba(220, 38, 38, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {getTypeIcon(item.type)} {item.type}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: item.difficulty === 'Expert' ? 'rgba(220, 38, 38, 0.1)' : item.difficulty === 'Hard' ? 'rgba(245, 158, 11, 0.1)' : item.difficulty === 'Medium' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: item.difficulty === 'Expert' ? '#DC2626' : item.difficulty === 'Hard' ? '#F59E0B' : item.difficulty === 'Medium' ? '#0F172A' : '#10B981', textTransform: 'uppercase' }}>
                      {item.difficulty}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.text}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '1rem' }}>
                      <span title="Number of assessments using this">Uses: <strong style={{ color: '#0F172A' }}>{item.usageCount}</strong></span>
                      <span title="Average candidate score">Avg: <strong style={{ color: '#DC2626' }}>{item.avgScore}%</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDuplicate(item.id); }} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.25rem' }}><Copy size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.25rem' }}><Trash size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1rem' }}>No Questions Found</h5>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Adjust your search or filters to see results.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Professional Question Details & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {selectedQuestion?.category}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Tag size={12} /> {selectedQuestion?.tags.join(', ')}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A', fontWeight: 700, lineHeight: 1.5 }}>
                {selectedQuestion?.text}
              </h3>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Specialized Content Rendering */}
              {selectedQuestion?.type === 'MCQ' && selectedQuestion.options && (
                <div>
                  <h6 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Options</h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedQuestion.options.map((opt, i) => {
                      const isCorrect = i === selectedQuestion.correctIndex;
                      return (
                        <div key={i} style={{ padding: '0.75rem 1rem', background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : '#F8FAFC', border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E5E7EB', borderRadius: '0.5rem', color: isCorrect ? '#10B981' : '#0F172A', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: isCorrect ? 600 : 400 }}>
                          {opt}
                          {isCorrect && <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Correct Option</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedQuestion?.type === 'Coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h6 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Problem Statement</h6>
                    <pre style={{ margin: 0, padding: '1rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#334155', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{selectedQuestion.problemStatement}</pre>
                  </div>
                  <div>
                    <h6 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Expected Output</h6>
                    <pre style={{ margin: 0, padding: '1rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#DC2626', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{selectedQuestion.expectedOutput}</pre>
                  </div>
                </div>
              )}

              {(selectedQuestion?.type === 'Descriptive' || selectedQuestion?.type === 'Case Study') && (
                <div>
                  <h6 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Evaluation Reference</h6>
                  <p style={{ margin: 0, padding: '1rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#334155', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {selectedQuestion.referenceAnswer || selectedQuestion.problemStatement}
                  </p>
                </div>
              )}

              {/* Professional Aggregated Analytics */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                <h6 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={14} color="#DC2626" /> Candidate Performance Analytics
                </h6>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Avg Score</span>
                    <strong style={{ fontSize: '1.25rem', color: '#0F172A', fontWeight: 800 }}>{selectedQuestion?.avgScore}%</strong>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Pass Rate</span>
                    <strong style={{ fontSize: '1.25rem', color: '#10B981', fontWeight: 800 }}>{selectedQuestion?.passRate}%</strong>
                  </div>
                  <div style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: '#DC2626', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Fail Rate</span>
                    <strong style={{ fontSize: '1.25rem', color: '#DC2626', fontWeight: 800 }}>{selectedQuestion?.failRate}%</strong>
                  </div>
                </div>
              </div>

              {/* AI Criteria */}
              <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '0.75rem' }}>
                <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={14} /> AI Evaluation Criteria
                </h6>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>{selectedQuestion?.aiCriteria}</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- ADD QUESTION MODAL --- */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="cd-glass-card" style={{ width: '100%', maxWidth: '600px', border: '1px solid #E5E7EB', padding: 0 }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A', fontWeight: 700 }}>Add New Question</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Create a new evaluation prompt for your central bank.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#0F172A', fontWeight: 600, marginBottom: '0.5rem' }}>Question Prompt</label>
                <textarea
                  rows={3}
                  value={newQuestion.text}
                  onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="cd-input"
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#0F172A', fontWeight: 600, marginBottom: '0.5rem' }}>Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value })}
                    className="cd-input"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="Coding">Coding</option>
                    <option value="Descriptive">Descriptive</option>
                    <option value="Case Study">Case Study</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#0F172A', fontWeight: 600, marginBottom: '0.5rem' }}>Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className="cd-input"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setIsAddModalOpen(false)} className="cd-btn-secondary">Cancel</button>
              <button onClick={handleAddSubmit} className="cd-btn-primary">Add Question</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
