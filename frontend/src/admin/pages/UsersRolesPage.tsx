import React, { useState, useEffect } from 'react';
import { useToast } from '../ToastContext';
import { Search, Plus, User, Shield, Lock, MoreHorizontal, Check, X } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function UsersRolesPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

  // Form States
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Admin', department: 'General' });

  useEffect(() => {
    adminAPI.getUsers().then(res => {
      setUsers(res || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin': return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(139, 92, 246, 0.2)' }}>{role}</span>;
      case 'Admin': return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.2)' }}>{role}</span>;
      case 'TPO': return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.2)' }}>{role}</span>;
      default: return <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.3rem', backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(148, 163, 184, 0.2)' }}>{role}</span>;
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Users & Roles</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>Manage system access, assign roles, and configure permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowInviteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            <Plus size={16} />
            Invite User
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        
        {/* Main Content - User List */}
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#0D1322', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', color: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ backgroundColor: '#111827', color: '#94A3B8', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', outline: 'none' }}
              >
                <option>All Roles</option>
                <option>Super Admin</option>
                <option>Admin</option>
                <option>Interviewer</option>
                <option>Student</option>
                <option>TPO</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div style={{ backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#111827', borderBottom: '1px solid #1E293B' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading users...</td></tr>
                ) : users.filter(u => 
                      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
                      (selectedRole === 'All Roles' || u.role === selectedRole)
                    ).map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: idx === users.length - 1 ? 'none' : '1px solid #1E293B', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600 }}>
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#FFFFFF' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getRoleBadge(user.role)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: user.status === 'Active' ? '#22C55E' : '#64748B' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: user.status === 'Active' ? '#22C55E' : '#64748B' }}></span>
                        {user.status}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.3rem', transition: 'background-color 0.2s' }} 
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'} 
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {actionMenuOpen === user.id && (
                        <div style={{ position: 'absolute', right: '3rem', top: '1rem', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                          <button onClick={() => { showToast('Edit User feature triggered', 'info'); setActionMenuOpen(null); }} style={{ textAlign: 'left', padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#E2E8F0', cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Edit Role</button>
                          <button onClick={() => { showToast('Permissions updated', 'success'); setActionMenuOpen(null); }} style={{ textAlign: 'left', padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#E2E8F0', cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E293B'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Permissions</button>
                          <button onClick={() => { showToast('User deactivated', 'success'); setActionMenuOpen(null); }} style={{ textAlign: 'left', padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Deactivate</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar - Roles & Permissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: '#0D1322', borderRadius: '0.75rem', border: '1px solid #1E293B', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield size={18} color="#3B82F6" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Permissions Overview</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { module: 'Interview Management', admin: true, tpo: true, interviewer: true },
                { module: 'Candidate Data', admin: true, tpo: true, interviewer: false },
                { module: 'System Settings', admin: true, tpo: false, interviewer: false },
              ].map((perm, i) => (
                <div key={i} style={{ borderBottom: i === 2 ? 'none' : '1px solid #1E293B', paddingBottom: i === 2 ? 0 : '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '0.5rem', fontWeight: 500 }}>{perm.module}</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Admin: {perm.admin ? <Check size={12} color="#22C55E"/> : <X size={12} color="#EF4444"/>}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>TPO: {perm.tpo ? <Check size={12} color="#22C55E"/> : <X size={12} color="#EF4444"/>}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowPermissionsModal(true)} style={{ width: '100%', marginTop: '1.5rem', backgroundColor: 'transparent', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
              Manage Permissions
            </button>
          </div>

        </div>

      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: '0 0 1.5rem 0' }}>Invite New User</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Name</label>
              <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.75rem', color: '#FFF', outline: 'none' }} placeholder="John Doe" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Email Address</label>
              <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.75rem', color: '#FFF', outline: 'none' }} placeholder="john@example.com" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Role</label>
              <select value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})} style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '0.5rem', padding: '0.75rem', color: '#FFF', outline: 'none' }}>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Interviewer">Interviewer</option>
                <option value="TPO">TPO</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`Invitation sent to ${inviteForm.email}!`, 'success');
                setShowInviteModal(false);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3B82F6', border: 'none', color: '#FFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0D1322', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #1E293B', width: '600px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#FFF', margin: '0 0 1.5rem 0' }}>Manage Global Permissions</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '2rem' }}>Adjust default access levels for each system role across major modules.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '2rem' }}>
              <thead style={{ backgroundColor: '#111827', borderBottom: '1px solid #1E293B' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>Module</th>
                  <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>Admin</th>
                  <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>Interviewer</th>
                  <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>TPO</th>
                </tr>
              </thead>
              <tbody>
                {['Interview Management', 'Candidate Data', 'System Settings', 'Billing & Plans'].map((mod, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '1rem', textAlign: 'left', color: '#E2E8F0', fontSize: '0.85rem' }}>{mod}</td>
                    <td style={{ padding: '1rem' }}><input type="checkbox" defaultChecked={true} style={{ cursor: 'pointer' }} /></td>
                    <td style={{ padding: '1rem' }}><input type="checkbox" defaultChecked={idx === 0} style={{ cursor: 'pointer' }} /></td>
                    <td style={{ padding: '1rem' }}><input type="checkbox" defaultChecked={idx !== 2 && idx !== 3} style={{ cursor: 'pointer' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowPermissionsModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`Global permissions updated successfully!`, 'success');
                setShowPermissionsModal(false);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#3B82F6', border: 'none', color: '#FFF', borderRadius: '0.5rem', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
