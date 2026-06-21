import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Filter, Plus, MoreHorizontal, Video, Calendar, Clock, CheckCircle2, Clock3 } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { useWebSocketContext } from '../../context/WebSocketContext';

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
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  
  const [scheduleCandidateName, setScheduleCandidateName] = useState('');
  const [scheduleContact, setScheduleContact] = useState('');
  const [scheduleRole, setScheduleRole] = useState('Software Engineer');
  const [scheduleCandidateId, setScheduleCandidateId] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  
  const [dayDetailsModalOpen, setDayDetailsModalOpen] = useState(false);
  const [selectedDateInterviews, setSelectedDateInterviews] = useState<any[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleInterviewId, setRescheduleInterviewId] = useState<number | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');

  const handleOpenScheduleModal = () => {
    setScheduleCandidateName('');
    setScheduleContact('');
    setScheduleRole('Software Engineer');
    setScheduleCandidateId(`CAND-${Math.floor(10000 + Math.random() * 90000)}`);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(tomorrow.getTime() - tzOffset)).toISOString().slice(0, 16);
    setScheduleDateTime(localISOTime);
    
    setScheduleModalOpen(true);
  };

  const fetchInterviews = () => {
    adminAPI.getInterviews().then(res => {
      setInterviews(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const { lastMessage } = useWebSocketContext();
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'USER_UPDATED' || lastMessage.type === 'INTERVIEW_SCHEDULED')) {
      showToast(lastMessage.message, 'info');
      fetchInterviews();
    }
  }, [lastMessage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Live': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>Live</span>;
      case 'Upcoming': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', color: '#E11D48', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}><Clock3 size={12} /> Upcoming</span>;
      case 'Completed': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}><CheckCircle2 size={12} /> Completed</span>;
      case 'Cancelled': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#64748B', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'max-content' }}>Cancelled</span>;
      default: return null;
    }
  };

  const toggleStatusFilter = () => {
    const statuses = ['All', 'Completed', 'Live', 'Upcoming', 'Cancelled'];
    setStatusFilter(prev => statuses[(statuses.indexOf(prev) + 1) % statuses.length]);
  };

  const toggleTypeFilter = () => {
    const types = ['All', 'AI Evaluation', 'Human Interview'];
    setTypeFilter(prev => types[(types.indexOf(prev) + 1) % types.length]);
  };

  const filteredInterviews = interviews.filter(i => {
    const searchMatch = (i.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const mappedStatus = i.status === 'in_progress' ? 'Live' : i.status === 'completed' ? 'Completed' : i.status === 'cancelled' ? 'Cancelled' : 'Upcoming';
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

  const handleDelete = async (id: number) => {
    try {
        await adminAPI.deleteInterview(id);
        setInterviews(interviews.filter(i => i.id !== id));
        showToast('Interview deleted.', 'success');
        setActiveMenuId(null);
    } catch (e) {
        showToast('Failed to delete interview.', 'error');
    }
  };

  const handleOpenRescheduleModal = (id: number, currentDateTime: string) => {
    setRescheduleInterviewId(id);
    try {
        const current = new Date(currentDateTime);
        const tzOffset = current.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(current.getTime() - tzOffset)).toISOString().slice(0, 16);
        setRescheduleDateTime(localISOTime);
    } catch {
        setRescheduleDateTime('');
    }
    setRescheduleModalOpen(true);
    setActiveMenuId(null);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleInterviewId || !rescheduleDateTime) return;
    try {
        const res = await adminAPI.rescheduleInterview(rescheduleInterviewId, new Date(rescheduleDateTime).toISOString());
        setInterviews(interviews.map(i => i.id === rescheduleInterviewId ? { ...i, created_at: res.new_time, status: 'upcoming' } : i));
        showToast('Interview rescheduled.', 'success');
        setRescheduleModalOpen(false);
    } catch (e) {
        showToast('Failed to reschedule.', 'error');
    }
  };

  const handleViewReport = async (id: number) => {
    try {
        const res = await adminAPI.getInterviewReport(id);
        if (res && res.report_id) {
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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handleDateClick = (day: number) => {
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayStr = dateObj.toLocaleDateString();
    const scheduledInterviews = filteredInterviews.filter(interview => new Date(interview.created_at).toLocaleDateString() === dayStr);
    
    if (scheduledInterviews.length > 0) {
      setSelectedDateInterviews(scheduledInterviews);
      setSelectedDateStr(dateObj.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' }));
      setDayDetailsModalOpen(true);
    } else {
      showToast(`No interviews scheduled for ${dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`, 'warning');
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Interviews</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Manage upcoming schedules, live sessions, and past interview recordings.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setViewMode(prev => prev === 'list' ? 'calendar' : 'list')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', color: '#E11D48', border: '2px solid #E11D48', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            <Calendar size={16} />
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </button>
          <button onClick={handleOpenScheduleModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
            <Plus size={16} />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #0F172A' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#E11D48" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search candidates, ID, or roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #E11D48', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', outline: 'none' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={toggleStatusFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: statusFilter !== 'All' ? '#E11D48' : '#FFFFFF', color: statusFilter !== 'All' ? '#FFFFFF' : '#0F172A', border: statusFilter !== 'All' ? '2px solid #E11D48' : '2px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800 }}>
            <Filter size={16} />
            Status: {statusFilter}
          </button>
          <button onClick={toggleTypeFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: typeFilter !== 'All' ? '#E11D48' : '#FFFFFF', color: typeFilter !== 'All' ? '#FFFFFF' : '#0F172A', border: typeFilter !== 'All' ? '2px solid #E11D48' : '2px solid #E2E8F0', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800 }}>
            <Filter size={16} />
            Type: {typeFilter}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'calendar' ? (
        <div style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '2px solid #0F172A', padding: '2rem', textAlign: 'center', color: '#0F172A' }}>
          <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontWeight: 800 }}>
            Calendar View: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <p style={{ fontWeight: 800 }}>Displaying schedule for {filteredInterviews.length} interviews this month.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginTop: '2rem' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#1E293B', paddingBottom: '0.5rem' }}>{day}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: '60px', backgroundColor: 'transparent' }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const dayStr = dateObj.toLocaleDateString();
              const scheduledCount = filteredInterviews.filter(interview => new Date(interview.created_at).toLocaleDateString() === dayStr).length;
              return (
              <div 
                key={day} 
                onClick={() => handleDateClick(day)}
                style={{ height: '60px', backgroundColor: '#FAF6EE', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.25rem', transition: 'all 0.2s', cursor: 'pointer' }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAF6EE'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 800 }}>{day}</span>
                  <span style={{ fontSize: '0.65rem', color: '#1E293B', fontWeight: 700 }}>{dateObj.toLocaleDateString('default', { month: 'short' })}</span>
                </div>
                {scheduledCount > 0 && (
                  <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#E11D48', fontWeight: 800, textAlign: 'center', backgroundColor: 'rgba(225, 29, 72, 0.1)', borderRadius: '2px', padding: '1px 0' }}>
                      {scheduledCount} Interview{scheduledCount > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      ) : (
      <div style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '2px solid #0F172A', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#E11D48', color: '#FFFFFF', borderBottom: '2px solid #BE123C' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID / Candidate</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role & Type</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interviewer</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#1E293B' }}>Loading interviews...</td></tr>
            ) : filteredInterviews.map((interview, idx) => (
              <tr key={idx} style={{ borderBottom: idx === filteredInterviews.length - 1 ? 'none' : '1px solid #0F172A', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E11D48', fontSize: '0.85rem', fontWeight: 800 }}>
                      {(interview.candidate_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{interview.candidate_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#1E293B' }}>INT-{interview.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.2rem' }}>{interview.job_role}</div>
                  <div style={{ fontSize: '0.75rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Video size={12} /> {interview.mode || 'AI Evaluation'}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {interview.status === 'cancelled' ? (
                    <div style={{ fontSize: '1rem', color: '#64748B', fontWeight: 800 }}>—</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.85rem', color: '#0F172A', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} color="#1E293B" /> {new Date(interview.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} color="#1E293B" /> {new Date(interview.created_at).toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#1E293B' }}>
                  System AI
                </td>
                <td style={{ padding: '1rem' }}>
                  {getStatusBadge(interview.status === 'in_progress' ? 'Live' : interview.status === 'completed' ? 'Completed' : interview.status === 'cancelled' ? 'Cancelled' : 'Upcoming')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                  {interview.status === 'in_progress' ? (
                    <button onClick={() => showToast(`Monitoring INT-${interview.id}`, 'info')} style={{ backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '0.3rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', marginRight: '0.5rem' }}>
                      Monitor
                    </button>
                  ) : null}
                  <button onClick={() => setActiveMenuId(activeMenuId === interview.id ? null : interview.id)} style={{ background: 'transparent', border: 'none', color: '#1E293B', cursor: 'pointer' }}>
                    <MoreHorizontal size={18} />
                  </button>
                  
                  {activeMenuId === interview.id && (
                    <div style={{ position: 'absolute', right: '2rem', top: '2.5rem', backgroundColor: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                      {interview.status === 'completed' && (
                        <div onClick={() => handleViewReport(interview.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          View Report
                        </div>
                      )}
                      
                      <div onClick={() => handleOpenRescheduleModal(interview.id, interview.created_at)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Reschedule
                      </div>

                      {(interview.status === 'cancelled' || interview.status === 'completed') ? (
                        <div onClick={() => handleDelete(interview.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#EF4444', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          Delete Interview
                        </div>
                      ) : (
                        <div onClick={() => handleCancel(interview.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#EF4444', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          Cancel
                        </div>
                      )}
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
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>AI Evaluation Report</h2>
              <button onClick={() => setReportModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#1E293B', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #E11D48' }}>
                    <div style={{ fontSize: '0.75rem', color: '#E11D48', marginBottom: '0.25rem', fontWeight: 800 }}>Final Score</div>
                    <div style={{ fontSize: '1rem', color: '#10B981', fontWeight: 800 }}>{activeReport.final_interview_score || 0}/100</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #E11D48' }}>
                    <div style={{ fontSize: '0.75rem', color: '#E11D48', marginBottom: '0.25rem', fontWeight: 800 }}>Technical Score</div>
                    <div style={{ fontSize: '1rem', color: '#3B82F6', fontWeight: 800 }}>{activeReport.overall_technical_score || 0}/100</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #E11D48' }}>
                    <div style={{ fontSize: '0.75rem', color: '#E11D48', marginBottom: '0.25rem', fontWeight: 800 }}>HR / Soft Skills</div>
                    <div style={{ fontSize: '1rem', color: '#F59E0B', fontWeight: 800 }}>{activeReport.overall_hr_score || 0}/100</div>
                </div>
            </div>
            
            <h4 style={{ color: '#0F172A', marginBottom: '0.75rem', fontSize: '0.9rem' }}>AI Summary</h4>
            <div style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '1.25rem', borderRadius: '0.5rem', fontSize: '0.85rem', lineHeight: 1.6, border: '2px solid #E11D48' }}>
              {activeReport.ai_summary || "No summary generated for this report."}
            </div>
          </div>
        </div>
      )}
      
      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>Schedule Interview</h2>
              <button onClick={() => setScheduleModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}>Candidate ID (Auto Generated)</label>
                <input 
                  type="text" 
                  value={scheduleCandidateId}
                  readOnly
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #E2E8F0', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.9rem', fontWeight: 800, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}>Candidate Name</label>
                <input 
                  type="text" 
                  value={scheduleCandidateName}
                  onChange={(e) => setScheduleCandidateName(e.target.value)}
                  placeholder="e.g., Harini"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}>Email Address or Phone Number</label>
                <input 
                  type="text" 
                  value={scheduleContact}
                  onChange={(e) => setScheduleContact(e.target.value)}
                  placeholder="harini@example.com / +1234567890"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}>Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}>Selected Role</label>
                <select 
                  value={scheduleRole}
                  onChange={(e) => setScheduleRole(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setScheduleModalOpen(false)} style={{ padding: '0.6rem 1.2rem', backgroundColor: 'transparent', border: '2px solid #0F172A', borderRadius: '0.5rem', color: '#0F172A', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (scheduleCandidateName.trim() && scheduleContact.trim()) {
                  try {
                    const res = await adminAPI.scheduleInterview({
                      candidate_name: scheduleCandidateName,
                      email: scheduleContact.trim(),
                      job_role: scheduleRole,
                      scheduled_time: new Date(scheduleDateTime).toISOString()
                    });
                    showToast(`Interview scheduled for ${res.candidate_name} (${res.job_role})`, 'success');
                    setInterviews([res, ...interviews]);
                    setScheduleModalOpen(false);
                  } catch (e: any) {
                    showToast(e.response?.data?.detail || 'Failed to schedule interview.', 'error');
                  }
                } else {
                  showToast('Please fill in candidate name and contact information.', 'warning');
                }
              }} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#E11D48', border: '2px solid #E11D48', borderRadius: '0.5rem', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Day Details Modal */}
      {dayDetailsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>Schedule for {selectedDateStr}</h2>
              <button onClick={() => setDayDetailsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedDateInterviews.map((iv, idx) => (
                <div key={idx} style={{ padding: '1rem', backgroundColor: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{iv.candidate_name || 'Unknown Candidate'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#1E293B', marginTop: '0.25rem' }}>Role: {iv.job_role || 'Pending'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#E11D48', fontWeight: 800 }}>{new Date(iv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', textTransform: 'capitalize' }}>{iv.status.replace('_', ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '400px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>Reschedule Interview</h2>
              <button onClick={() => setRescheduleModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}>New Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #0F172A', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setRescheduleModalOpen(false)} style={{ padding: '0.6rem 1.2rem', backgroundColor: 'transparent', border: '2px solid #0F172A', borderRadius: '0.5rem', color: '#0F172A', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRescheduleSubmit} style={{ padding: '0.6rem 1.2rem', backgroundColor: '#E11D48', border: '2px solid #E11D48', borderRadius: '0.5rem', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>Update Time</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
