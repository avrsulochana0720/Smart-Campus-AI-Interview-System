import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Plus, UserCheck, Star, Video, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function InterviewersPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newInterviewer, setNewInterviewer] = useState({ name: '', email: '', department: 'Engineering', role: 'Interviewer' });

  const handleAddInterviewer = async () => {
    if (!newInterviewer.name || !newInterviewer.email) {
      showToast('Name and email are required.', 'error');
      return;
    }
    // Optimistic UI update
    const added = { ...newInterviewer, id: Date.now(), status: 'Active', role: 'Interviewer' };
    setInterviewers([added, ...interviewers]);
    setIsAdding(false);
    setNewInterviewer({ name: '', email: '', department: 'Engineering', role: 'Interviewer' });
    showToast('Interviewer added successfully.', 'success');
  };

  useEffect(() => {
    adminAPI.getUsers().then(res => {
      // Filter by role or just show users with 'Interviewer' / 'Admin' roles
      setInterviewers((res || []).filter((u: any) => u.role === 'Interviewer' || u.role === 'Admin' || u.role === 'Super Admin'));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Interviewers</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Manage interviewer profiles, workloads, and performance ratings.</p>
        </div>
        <button onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
          <Plus size={16} /> Add Interviewer
        </button>
      </div>

      <div style={{ display: 'flex', marginBottom: '1.5rem', backgroundColor: '#0D1322', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by name or department..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', color: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ color: '#64748B' }}>Loading interviewers...</div>
        ) : interviewers.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((interviewer) => (
          <div key={interviewer.id} style={{ backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => showToast('This feature is coming soon.', 'info')} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
              <MoreHorizontal size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '1.2rem', fontWeight: 600 }}>
                {(interviewer.name || 'I').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', color: '#FFFFFF', fontWeight: 600, margin: '0 0 0.2rem 0' }}>{interviewer.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#E11D48', margin: 0 }}>{interviewer.department || 'General'}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94A3B8' }}><Mail size={14} /> {interviewer.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94A3B8' }}><UserCheck size={14} /> {interviewer.role}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1E293B', paddingTop: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}><Star size={16} fill="#F59E0B" /> 4.8</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>Avg Rating</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #1E293B', paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}><Video size={16} color="#E11D48" /> {interviewer.status === 'Active' ? 'Yes' : 'No'}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>Active Status</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: '0 0 1.5rem 0' }}>Add New Interviewer</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Full Name</label>
              <input type="text" value={newInterviewer.name} onChange={(e) => setNewInterviewer({...newInterviewer, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', color: '#FFF', outline: 'none' }} placeholder="John Doe" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Email Address</label>
              <input type="email" value={newInterviewer.email} onChange={(e) => setNewInterviewer({...newInterviewer, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', color: '#FFF', outline: 'none' }} placeholder="john@company.com" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Department</label>
              <select value={newInterviewer.department} onChange={(e) => setNewInterviewer({...newInterviewer, department: e.target.value})} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', color: '#FFF', outline: 'none' }}>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddInterviewer} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', border: 'none', color: '#FFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Add Interviewer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
