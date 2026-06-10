import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Filter, Plus, MoreHorizontal, Video, Calendar, Clock, CheckCircle2, Clock3 } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function InterviewsPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<any>(null);

  useEffect(() => {
    adminAPI.getInterviews().then(res => {
      setInterviews(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Live': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>Live</span>;
      case 'Upcoming': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}><Clock3 size={12} /> Upcoming</span>;
      case 'Completed': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}><CheckCircle2 size={12} /> Completed</span>;
      default: return null;
    }
  };

  const toggleStatusFilter = () => {
    const statuses = ['All', 'Completed', 'Live', 'Upcoming'];
    setStatusFilter(prev => statuses[(statuses.indexOf(prev) + 1) % statuses.length]);
  };

  const toggleTypeFilter = () => {
    const types = ['All', 'AI Evaluation', 'Human Interview'];
    setTypeFilter(prev => types[(types.indexOf(prev) + 1) % types.length]);
  };

  const filteredInterviews = interviews.filter(i => {
    const searchMatch = (i.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const mappedStatus = i.status === 'in_progress' ? 'Live' : i.status === 'completed' ? 'Completed' : 'Upcoming';
    const statusMatch = statusFilter === 'All' || mappedStatus === statusFilter;
    const typeMatch = typeFilter === 'All' || (i.mode || 'AI Evaluation') === typeFilter;
    return searchMatch && statusMatch && typeMatch;
  });

  const handleCancel = async (id: number) => {
    try {
        await adminAPI.cancelInterview(id);
        setInterviews(interviews.map(i => i.id === id ? { ...i, status: 'cancelled' } : i));
        showToast('Interview cancelled.', 'success');
        setActiveMenuId(null);
    } catch (e) {
        showToast('Failed to cancel interview.', 'error');
    }
  };

  const handleReschedule = async (id: number) => {
    const input = window.prompt("Enter new date/time (e.g. 2026-06-15T10:00:00):", new Date().toISOString());
    if (!input) return;
    try {
        const res = await adminAPI.rescheduleInterview(id, input);
        setInterviews(interviews.map(i => i.id === id ? { ...i, created_at: res.new_time, status: 'in_progress' } : i));
        showToast('Interview rescheduled.', 'success');
        setActiveMenuId(null);
    } catch (e) {
        showToast('Failed to reschedule.', 'error');
    }
  };

  const handleViewReport = async (id: number) => {
    try {
        const res = await adminAPI.getInterviewReport(id);
        if (res && res.id) {
            setActiveReport(res);
            setReportModalOpen(true);
        } else {
            showToast('Report data not yet generated.', 'warning');
        }
        setActiveMenuId(null);
    } catch (e) {
        showToast('Failed to load report.', 'error');
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Interviews</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Manage upcoming schedules, live sessions, and past interview recordings.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setViewMode(prev => prev === 'list' ? 'calendar' : 'list')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1E293B', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
            <Calendar size={16} />
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </button>
          <button onClick={() => {
            const name = window.prompt("Enter Candidate Name with ID (e.g., Harini - ID 105):");
            if (name) showToast(`Interview scheduling for ${name} initialized.`, 'success');
          }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            <Plus size={16} />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#0D1322', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search candidates, ID, or roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', color: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={toggleStatusFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#111827', color: statusFilter !== 'All' ? '#3B82F6' : '#94A3B8', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <Filter size={16} />
            Status: {statusFilter}
          </button>
          <button onClick={toggleTypeFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#111827', color: typeFilter !== 'All' ? '#3B82F6' : '#94A3B8', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <Filter size={16} />
            Type: {typeFilter}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'calendar' ? (
        <div style={{ backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
          <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#E2E8F0' }}>
            Calendar View: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <p>Displaying schedule for {filteredInterviews.length} interviews this month.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginTop: '2rem' }}>
            {/* Simple mock calendar grid */}
            {[...Array(30)].map((_, i) => (
              <div key={i} style={{ height: '60px', backgroundColor: '#111827', borderRadius: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{i + 1}</span>
                {filteredInterviews.length > 0 && i % 7 === 3 && (
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#3B82F6', borderRadius: '2px', marginTop: 'auto' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div style={{ backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#111827', borderBottom: '1px solid #1E293B' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID / Candidate</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role & Type</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interviewer</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading interviews...</td></tr>
            ) : filteredInterviews.map((interview, idx) => (
              <tr key={idx} style={{ borderBottom: idx === filteredInterviews.length - 1 ? 'none' : '1px solid #1E293B', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111827'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>
                      {(interview.candidate_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#FFFFFF' }}>{interview.candidate_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>INT-{interview.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#E2E8F0', marginBottom: '0.2rem' }}>{interview.job_role}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Video size={12} /> {interview.mode || 'AI Evaluation'}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="#64748B" /> {new Date(interview.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="#64748B" /> {new Date(interview.created_at).toLocaleTimeString()}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#94A3B8' }}>
                  System AI
                </td>
                <td style={{ padding: '1rem' }}>
                  {getStatusBadge(interview.status === 'in_progress' ? 'Live' : interview.status === 'completed' ? 'Completed' : 'Upcoming')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                  {interview.status === 'in_progress' ? (
                    <button onClick={() => showToast(`Monitoring INT-${interview.id}`, 'info')} style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '0.3rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.5rem' }}>
                      Monitor
                    </button>
                  ) : null}
                  <button onClick={() => setActiveMenuId(activeMenuId === interview.id ? null : interview.id)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                    <MoreHorizontal size={18} />
                  </button>
                  
                  {activeMenuId === interview.id && (
                    <div style={{ position: 'absolute', right: '2rem', top: '2.5rem', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                      {interview.status === 'completed' && (
                        <div onClick={() => handleViewReport(interview.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#E2E8F0', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          View Report
                        </div>
                      )}
                      <div onClick={() => handleReschedule(interview.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#E2E8F0', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Reschedule
                      </div>
                      <div onClick={() => handleCancel(interview.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#EF4444', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Cancel
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {/* Report Modal */}
      {reportModalOpen && activeReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: 0 }}>AI Evaluation Report</h2>
              <button onClick={() => setReportModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1E293B' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Candidate ID</div>
                    <div style={{ fontSize: '1rem', color: '#E2E8F0', fontWeight: 600 }}>#{activeReport.user_id}</div>
                </div>
                <div style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1E293B' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>Final Score</div>
                    <div style={{ fontSize: '1rem', color: '#10B981', fontWeight: 600 }}>{activeReport.final_interview_score}/100</div>
                </div>
            </div>
            
            <h4 style={{ color: '#E2E8F0', marginBottom: '0.75rem', fontSize: '0.9rem' }}>AI Summary</h4>
            <div style={{ backgroundColor: '#111827', padding: '1.25rem', borderRadius: '0.5rem', color: '#CBD5E1', fontSize: '0.85rem', lineHeight: 1.6, border: '1px solid #1E293B' }}>
              {activeReport.ai_summary || "No summary generated for this report."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
