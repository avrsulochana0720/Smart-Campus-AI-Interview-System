import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Filter, Plus, MoreHorizontal, User, Mail, Phone, Download, Building2, BarChart, Star } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { useWebSocketContext } from '../../context/WebSocketContext';

export default function CandidatesPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isExportPressed, setIsExportPressed] = useState(false);
  const [isAddPressed, setIsAddPressed] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [isNameInputFocused, setIsNameInputFocused] = useState(false);
  const [newCandidateEmail, setNewCandidateEmail] = useState('');
  const [isInviteInputFocused, setIsInviteInputFocused] = useState(false);
  const [priorityIds, setPriorityIds] = useState<number[]>([]);

  const handleTogglePriority = (id: number) => {
    if (priorityIds.includes(id)) {
      setPriorityIds(priorityIds.filter(pid => pid !== id));
      showToast('Priority removed.', 'info');
    } else {
      setPriorityIds([...priorityIds, id]);
      showToast('Marked as priority.', 'success');
    }
    setActiveMenuId(null);
  };

  const handleRejectCandidate = async (id: number) => {
    try {
      await adminAPI.deleteStudent(id);
      setCandidates(candidates.filter(c => c.id !== id));
      showToast('Candidate rejected and deleted.', 'success');
      setActiveMenuId(null);
    } catch (e) {
      showToast('Failed to reject candidate.', 'error');
    }
  };

  const handleInviteCandidate = async () => {
    if (!newCandidateEmail || !newCandidateName) {
      showToast("Name and Contact are required", "error");
      return;
    }
    try {
      const newCandidate = await adminAPI.inviteStudent({
        name: newCandidateName,
        email: newCandidateEmail.trim()
      });
      setCandidates([newCandidate, ...candidates]);
      showToast(`Invitation sent to ${newCandidateName}`, 'success');
      setIsAddingCandidate(false);
      setNewCandidateEmail('');
      setNewCandidateName('');
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to invite candidate.', 'error');
    }
  };

  const fetchCandidates = () => {
    adminAPI.getStudents().then(res => {
      setCandidates(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const { lastMessage } = useWebSocketContext();
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'USER_UPDATED' || lastMessage.type === 'INTERVIEW_SCHEDULED')) {
      showToast(lastMessage.message, 'info');
      fetchCandidates();
    }
  }, [lastMessage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(225, 29, 72, 0.1)', color: '#E11D48', fontSize: '0.75rem', fontWeight: 800 }}>Evaluated</span>;
      case 'in_progress': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 800 }}>Under Review</span>;
      case 'failed': return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 800 }}>Failed</span>;
      default: return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#1E293B', fontSize: '0.75rem', fontWeight: 800 }}>Pending</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const downloadUrl = `http://localhost:8000/admin/candidates/export?token=${token}`;
    window.open(downloadUrl, '_blank');
    showToast('Downloading all candidates as CSV...', 'success');
  };
  const dummyPlaceholder = () => {
    if (filteredCandidates.length === 0) return;
    const link = document.createElement('a');
    link.download = `candidates_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('CSV exported successfully.', 'success');
  };

  const toggleDepartmentFilter = () => {
    const depts = ['All', ...Array.from(new Set(candidates.map(c => c.department || 'Unassigned')))];
    setDepartmentFilter(prev => depts[(depts.indexOf(prev) + 1) % depts.length] as string);
  };
  const toggleScoreFilter = () => {
    const scores = ['All', '90+', '70-90', '<70'];
    setScoreFilter(prev => scores[(scores.indexOf(prev) + 1) % scores.length]);
  };
  const toggleStatusFilter = () => {
    const statuses = ['All', 'Evaluated', 'Under Review', 'Pending', 'Failed'];
    setStatusFilter(prev => statuses[(statuses.indexOf(prev) + 1) % statuses.length]);
  };

  const filteredCandidates = candidates.filter(c => {
    const searchMatch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const mappedStatus = c.interview_status === 'completed' ? 'Evaluated' : 
                         c.interview_status === 'in_progress' ? 'Under Review' : 
                         c.interview_status === 'failed' ? 'Failed' : 'Pending';
    const statusMatch = statusFilter === 'All' || mappedStatus === statusFilter;

    let scoreMatch = true;
    const s = c.overall_score || 0;
    if (scoreFilter === '90+') scoreMatch = s >= 90;
    else if (scoreFilter === '70-90') scoreMatch = s >= 70 && s < 90;
    else if (scoreFilter === '<70') scoreMatch = s < 70;

    const deptMatch = departmentFilter === 'All' || (c.department || 'Unassigned') === departmentFilter;

    return searchMatch && statusMatch && scoreMatch && deptMatch;
  }).sort((a, b) => {
    const aPriority = priorityIds.includes(a.id);
    const bPriority = priorityIds.includes(b.id);
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;
    return 0;
  });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Candidates</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Manage applicant pipeline, view AI evaluation scores, and track hiring status.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportCSV} 
            onMouseDown={() => setIsExportPressed(true)}
            onMouseUp={() => setIsExportPressed(false)}
            onMouseLeave={() => setIsExportPressed(false)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: isExportPressed ? '#FAF6EE' : '#FFFFFF', 
              color: '#0F172A', 
              border: '2px solid #0F172A', 
              borderRadius: '0.5rem', 
              padding: '0.5rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              cursor: 'pointer' 
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsAddingCandidate(true)} 
            onMouseDown={() => setIsAddPressed(true)}
            onMouseUp={() => setIsAddPressed(false)}
            onMouseLeave={() => setIsAddPressed(false)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: isAddPressed ? '#FAF6EE' : '#E11D48', 
              color: isAddPressed ? '#0F172A' : '#FFFFFF', 
              border: '2px solid #0F172A', 
              borderRadius: '0.5rem', 
              padding: '0.5rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              cursor: 'pointer', 
              boxShadow: isAddPressed ? 'none' : '3px 3px 0px #0F172A',
              transition: 'all 0.1s'
            }}
          >
            <Plus size={16} />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #0F172A' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#E11D48" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{ width: '100%', backgroundColor: isSearchFocused ? '#FAF6EE' : '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={toggleDepartmentFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: departmentFilter !== 'All' ? '#E11D48' : '#FFFFFF', color: departmentFilter !== 'All' ? '#FFFFFF' : '#0F172A', border: departmentFilter !== 'All' ? '2px solid #E11D48' : '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800 }}>
            <Building2 size={16} />
            Dept: {departmentFilter}
          </button>
          <button onClick={toggleScoreFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: scoreFilter !== 'All' ? '#E11D48' : '#FFFFFF', color: scoreFilter !== 'All' ? '#FFFFFF' : '#0F172A', border: scoreFilter !== 'All' ? '2px solid #E11D48' : '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800 }}>
            <BarChart size={16} />
            Score: {scoreFilter}
          </button>
          <button onClick={toggleStatusFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: statusFilter !== 'All' ? '#E11D48' : '#FFFFFF', color: statusFilter !== 'All' ? '#FFFFFF' : '#0F172A', border: statusFilter !== 'All' ? '2px solid #E11D48' : '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 800 }}>
            <Filter size={16} />
            Status: {statusFilter}
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '2px solid #0F172A', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#E11D48', color: '#FFFFFF', borderBottom: '2px solid #BE123C' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Info</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied Role</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Score</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#1E293B' }}>Loading candidates...</td></tr>
            ) : filteredCandidates.map((candidate, idx) => (
              <tr key={idx} style={{ borderBottom: idx === filteredCandidates.length - 1 ? 'none' : '2px solid #0F172A', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '1rem', fontWeight: 800, flexShrink: 0 }}>
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {candidate.name}
                        {priorityIds.includes(candidate.id) && <Star fill="#EAB308" color="#EAB308" size={14} />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={10} /> {candidate.email}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A', marginBottom: '0.2rem' }}>{candidate.job_role !== 'N/A' ? candidate.job_role : 'General Application'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#1E293B' }}>{candidate.department || 'Unassigned'}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: getScoreColor(candidate.overall_score || 0) }}>
                      {candidate.overall_score !== null ? Math.round(candidate.overall_score) : '-'}
                    </div>
                    <div style={{ width: '80px', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${candidate.overall_score || 0}%`, height: '100%', backgroundColor: getScoreColor(candidate.overall_score || 0), borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {getStatusBadge(candidate.interview_status)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                  <button onClick={() => setSelectedCandidate(candidate)} style={{ backgroundColor: 'transparent', color: '#E11D48', border: '1px solid rgba(225, 29, 72, 0.5)', borderRadius: '0.3rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginRight: '0.5rem' }}>
                    View Profile
                  </button>
                  <button onClick={() => setActiveMenuId(activeMenuId === candidate.id ? null : candidate.id)} style={{ background: 'transparent', border: 'none', color: '#1E293B', cursor: 'pointer' }}>
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenuId === candidate.id && (
                    <div style={{ position: 'absolute', right: '2rem', top: '2.5rem', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
                      <div onClick={() => handleTogglePriority(candidate.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {priorityIds.includes(candidate.id) ? 'Remove Priority' : 'Mark Priority'}
                      </div>
                      <div onClick={() => { showToast('Email sent to candidate.', 'info'); setActiveMenuId(null); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Send Email
                      </div>
                      <div onClick={() => handleRejectCandidate(candidate.id)} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#EF4444', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Reject Candidate
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Profile Modal */}
      {selectedCandidate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>Advanced Candidate Profile</h2>
              <button onClick={() => setSelectedCandidate(null)} style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#0F172A', fontSize: '0.9rem' }}>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Full Name</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.name}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Candidate ID</div>
                  <div style={{ fontWeight: 800 }}>#{selectedCandidate.id}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A', gridColumn: '1 / -1' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Email Address</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.email}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Applied Role</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.job_role || 'General'}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Department</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.department || 'Unassigned'}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>AI Status</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.interview_status}</div>
              </div>
              <div style={{ backgroundColor: '#FAF6EE', color: '#0F172A', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #0F172A' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 700 }}>Overall Score</div>
                  <div style={{ fontWeight: 800, color: getScoreColor(selectedCandidate.overall_score || 0) }}>
                      {selectedCandidate.overall_score || 'Pending'}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Candidate Modal */}
      {isAddingCandidate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Invite New Candidate</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Candidate Name</label>
              <input 
                type="text" 
                value={newCandidateName} 
                onChange={(e) => setNewCandidateName(e.target.value)} 
                placeholder="John Doe"
                onFocus={() => setIsNameInputFocused(true)}
                onBlur={() => setIsNameInputFocused(false)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: isNameInputFocused ? '#FAF6EE' : '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none', marginBottom: '1rem' }} 
              />
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Candidate Email or Phone Number</label>
              <input 
                type="text" 
                value={newCandidateEmail} 
                onChange={(e) => setNewCandidateEmail(e.target.value)} 
                placeholder="candidate@example.com or +1 234 567 8900"
                onFocus={() => setIsInviteInputFocused(true)}
                onBlur={() => setIsInviteInputFocused(false)}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: isInviteInputFocused ? '#FAF6EE' : '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 600, outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setIsAddingCandidate(false); setNewCandidateEmail(''); setNewCandidateName(''); }} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleInviteCandidate} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Send Invitation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
