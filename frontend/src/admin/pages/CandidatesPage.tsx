import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Filter, Plus, MoreHorizontal, User, Mail, Phone, Download, Building2, BarChart } from 'lucide-react';
import { adminAPI } from '../../utils/api';

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

  useEffect(() => {
    adminAPI.getStudents().then(res => {
      setCandidates(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

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
    if (filteredCandidates.length === 0) return showToast('No data to export', 'warning');
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Score', 'Status'];
    const rows = filteredCandidates.map(c => [
        c.id,
        `"${c.name || ''}"`,
        `"${c.email || ''}"`,
        `"${c.job_role || 'General'}"`,
        `"${c.department || 'Unassigned'}"`,
        c.overall_score || 0,
        c.interview_status || 'pending'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
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
          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#334155', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={() => {
            const email = window.prompt("Enter candidate email to invite:");
            if (email) showToast(`Invitation sent to ${email}`, 'success');
          }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
            <Plus size={16} />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #0F172A' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #BE123C', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', outline: 'none' }} 
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
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate Info</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied Role</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Score</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#1E293B' }}>Loading candidates...</td></tr>
            ) : filteredCandidates.map((candidate, idx) => (
              <tr key={idx} style={{ borderBottom: idx === filteredCandidates.length - 1 ? 'none' : '2px solid #0F172A', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F172A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E293B', fontSize: '1rem', fontWeight: 800, flexShrink: 0 }}>
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.2rem' }}>{candidate.name}</div>
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
                    <div style={{ position: 'absolute', right: '2rem', top: '2.5rem', backgroundColor: '#334155', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                      <div onClick={() => { showToast('Profile marked as priority.', 'success'); setActiveMenuId(null); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Mark Priority
                      </div>
                      <div onClick={() => { showToast('Email sent to candidate.', 'info'); setActiveMenuId(null); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Send Email
                      </div>
                      <div onClick={() => { showToast('Candidate rejected and removed.', 'warning'); setActiveMenuId(null); setCandidates(candidates.filter(c => c.id !== candidate.id)); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#EF4444', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
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
              <button onClick={() => setSelectedCandidate(null)} style={{ background: 'transparent', border: 'none', color: '#1E293B', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#0F172A', fontSize: '0.9rem' }}>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Full Name</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.name}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Candidate ID</div>
                  <div style={{ fontWeight: 800 }}>#{selectedCandidate.id}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C', gridColumn: '1 / -1' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Email Address</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.email}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Applied Role</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.job_role || 'General'}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Department</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.department || 'Unassigned'}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>AI Status</div>
                  <div style={{ fontWeight: 800 }}>{selectedCandidate.interview_status}</div>
              </div>
              <div style={{ backgroundColor: '#E11D48', color: '#FFFFFF', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #BE123C' }}>
                  <div style={{ color: '#1E293B', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Overall Score</div>
                  <div style={{ fontWeight: 800, color: getScoreColor(selectedCandidate.overall_score || 0) }}>
                      {selectedCandidate.overall_score || 'Pending'}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
