import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Settings,
  Trash,
  Edit,
  Copy,
  ChevronDown,
  CheckCircle,
  Clock,
  Award,
  AlertTriangle,
  Users,
  Send,
  UserCheck,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Lock,
  Check,
  X,
  Mail,
  Building,
  UserPlus,
  Terminal,
  Activity
} from 'lucide-react';

import '../../../styles/CandidateDashboard.css';

// --- MOCK USERS DATA ---
const INITIAL_USERS = [
  { id: 1, name: 'Arjun Mehta', email: 'arjun.mehta@smartcampus.ai', role: 'Admin', department: 'Engineering', lastActive: '2 mins ago', isActive: true, initials: 'AM', color: '#DC2626' },
  { id: 2, name: 'Sarah Chen', email: 'sarah.chen@smartcampus.ai', role: 'Interviewer', department: 'Engineering', lastActive: '1 hour ago', isActive: true, initials: 'SC', color: '#EF4444' },
  { id: 3, name: 'Mike Johnson', email: 'mike.johnson@smartcampus.ai', role: 'Interviewer', department: 'Product', lastActive: 'Yesterday', isActive: true, initials: 'MJ', color: '#EF4444' },
  { id: 4, name: 'Emma Watson', email: 'emma.watson@smartcampus.ai', role: 'HR Manager', department: 'Management', lastActive: '3 days ago', isActive: true, initials: 'EW', color: '#10B981' },
  { id: 5, name: 'Rohan Verma', email: 'rohan.verma@smartcampus.ai', role: 'Interviewer', department: 'Engineering', lastActive: '5 days ago', isActive: true, initials: 'RV', color: '#EF4444' },
  { id: 6, name: 'Sneha Iyer', email: 'sneha.iyer@smartcampus.ai', role: 'HR Manager', department: 'Management', lastActive: '1 week ago', isActive: false, initials: 'SI', color: '#10B981' },
  { id: 7, name: 'Karan Singh', email: 'karan.singh@smartcampus.ai', role: 'Pending Invite', department: 'Electronics', lastActive: 'Invited 1 day ago', isActive: false, initials: 'KS', color: '#F59E0B' },
  { id: 8, name: 'Ananya Rao', email: 'ananya.rao@smartcampus.ai', role: 'Pending Invite', department: 'Design', lastActive: 'Invited 3 days ago', isActive: false, initials: 'AR', color: '#F59E0B' }
];

// --- FEATURE PERMISSION MATRIX DATA ---
const INITIAL_FEATURES = [
  { key: 'dashboard', name: 'Dashboard Access', SuperAdmin: true, Admin: true, Interviewer: true, HRManager: true },
  { key: 'interviews', name: 'Conduct Interviews', SuperAdmin: true, Admin: true, Interviewer: true, HRManager: false },
  { key: 'candidates', name: 'Manage Candidates', SuperAdmin: true, Admin: true, Interviewer: true, HRManager: true },
  { key: 'assessments', name: 'Configure AI Assessments', SuperAdmin: true, Admin: true, Interviewer: false, HRManager: false },
  { key: 'questions', name: 'Question Bank Edit', SuperAdmin: true, Admin: true, Interviewer: true, HRManager: false },
  { key: 'reports', name: 'View Analytics Reports', SuperAdmin: true, Admin: true, Interviewer: false, HRManager: true },
  { key: 'feedback', name: 'Manage Feedback Loops', SuperAdmin: true, Admin: true, Interviewer: true, HRManager: true },
  { key: 'users', name: 'Manage Users & Roles', SuperAdmin: true, Admin: false, Interviewer: false, HRManager: false },
  { key: 'settings', name: 'Configure System Settings', SuperAdmin: true, Admin: false, Interviewer: false, HRManager: false },
  { key: 'integrations', name: 'API & Webhook Integrations', SuperAdmin: true, Admin: false, Interviewer: false, HRManager: false }
];

export default function UsersRolesPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<'All' | 'Admin' | 'Interviewer' | 'HR' | 'Pending'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection rows for bulk actions
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Feature Permissions state
  const [featureMatrix, setFeatureMatrix] = useState(INITIAL_FEATURES);

  // Invite User form state
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Interviewer',
    department: 'Engineering',
    message: 'Welcome to the Smart Campus AI Interview System! We would love for you to join our panel of evaluators.'
  });

  // Calculate filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Admin') matchesTab = u.role === 'Admin';
      if (activeTab === 'Interviewer') matchesTab = u.role === 'Interviewer';
      if (activeTab === 'HR') matchesTab = u.role === 'HR Manager';
      if (activeTab === 'Pending') matchesTab = u.role === 'Pending Invite';
      
      return matchesSearch && matchesTab;
    });
  }, [users, searchQuery, activeTab]);

  // Toggle user active status
  const toggleUserStatus = (id: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    }));
  };

  // Row selection toggle
  const toggleSelectRow = (id: number) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      }
      return [...prev, id];
    });
  };

  // Select all rows currently displayed
  const toggleSelectAll = () => {
    if (selectedRows.length === filteredUsers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredUsers.map(u => u.id));
    }
  };

  // Delete/Remove user
  const handleDeleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setSelectedRows(prev => prev.filter(rowId => rowId !== id));
  };

  // Bulk actions
  const handleBulkDeactivate = () => {
    setUsers(prev => prev.map(u => {
      if (selectedRows.includes(u.id)) {
        return { ...u, isActive: false };
      }
      return u;
    }));
    setSelectedRows([]);
  };

  const handleBulkRoleChange = (role: string) => {
    setUsers(prev => prev.map(u => {
      if (selectedRows.includes(u.id)) {
        return { ...u, role };
      }
      return u;
    }));
    setSelectedRows([]);
  };

  // Handle invitation sending
  const handleSendInvite = () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;

    const initials = inviteForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    // Assign color based on role
    let roleColor = '#EF4444';
    if (inviteForm.role === 'Admin') roleColor = '#DC2626';
    if (inviteForm.role === 'HR Manager') roleColor = '#10B981';

    const created: any = {
      id: Date.now(),
      name: inviteForm.name,
      email: inviteForm.email,
      role: 'Pending Invite',
      department: inviteForm.department,
      lastActive: 'Invited Just Now',
      isActive: false,
      initials,
      color: '#F59E0B'
    };

    setUsers(prev => [created, ...prev]);
    setIsInviteModalOpen(false);
    
    // Reset Form
    setInviteForm({
      name: '',
      email: '',
      role: 'Interviewer',
      department: 'Engineering',
      message: 'Welcome to the Smart Campus AI Interview System! We would love for you to join our panel of evaluators.'
    });
  };

  // Toggle dynamic permission matrix cell
  const handleMatrixCellToggle = (featKey: string, roleKey: 'SuperAdmin' | 'Admin' | 'Interviewer' | 'HRManager') => {
    setFeatureMatrix(prev => prev.map(f => {
      if (f.key === featKey) {
        return { ...f, [roleKey]: !f[roleKey] };
      }
      return f;
    }));
  };

  return (
    <div className="cd-container">

      {/* 1. Page Header */}
      <div className="cd-header" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
        <div>
          <h1 className="cd-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 0.5rem 0' }}>
            Users & Roles
            <span style={{ fontSize: '0.8rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#DC2626', padding: '0.3rem 0.75rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '1px' }}>
              {users.length} Platform Users
            </span>
          </h1>
          <p className="cd-subtitle" style={{ margin: 0, textAlign: 'left' }}>Manage system access, define permission structures, and send invites to new platform evaluators.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsMatrixModalOpen(true)}
            className="cd-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Settings size={18} color="#64748B" />
            Manage Roles
          </button>
          
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="cd-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} />
            Invite User
          </button>
        </div>
      </div>

      {/* 2. Top Stats Row (4 Cards) */}
      <div className="cd-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: users.length.toString(), desc: '+4 this month', icon: Users, colorClass: 'red' },
          { label: 'Active Admins', value: users.filter(u => u.role === 'Admin').length.toString(), desc: 'Secure cores', icon: ShieldCheck, colorClass: 'amber' },
          { label: 'Interviewers', value: users.filter(u => u.role === 'Interviewer').length.toString(), desc: 'Screening loop', icon: UserCheck, colorClass: 'red' },
          { label: 'Pending Invites', value: users.filter(u => u.role === 'Pending Invite').length.toString(), desc: 'Requires response', icon: Mail, colorClass: 'amber' }
        ].map((stat, i) => (
          <div key={i} className="cd-stat-card">
            <div className={`cd-stat-icon ${stat.colorClass}`}><stat.icon size={24} /></div>
            <div className="cd-stat-value" style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>{stat.value}</div>
            <div className="cd-stat-label">{stat.label}</div>
            <div className="trend trend-up" style={{ color: '#64748B' }}>{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="cd-main-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: User Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Controls Bar */}
          <div className="cd-glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            
            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {['All Users', 'Admins', 'Interviewers', 'HR Managers', 'Pending Invites'].map(tab => {
                const tabKey = tab.split(' ')[0] as any;
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tabKey); setSelectedRows([]); }}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700,
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

            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search name, emails..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cd-input"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="cd-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#64748B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '1rem 1.5rem', width: '50px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', accentColor: '#DC2626' }}
                      />
                    </th>
                    <th style={{ padding: '1rem', fontWeight: 800 }}>User Details</th>
                    <th style={{ padding: '1rem', fontWeight: 800 }}>Role</th>
                    <th style={{ padding: '1rem', fontWeight: 800 }}>Department</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 800 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(item => {
                    const isChecked = selectedRows.includes(item.id);
                    
                    let roleColor = { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.2)', text: '#DC2626' };
                    if (item.role === 'Interviewer') roleColor = { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#EF4444' };
                    if (item.role === 'HR Manager') roleColor = { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#10B981' };
                    if (item.role === 'Pending Invite') roleColor = { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B' };

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s', background: isChecked ? 'rgba(220, 38, 38, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(item.id)}
                            style={{ cursor: 'pointer', accentColor: '#DC2626' }}
                          />
                        </td>
                        
                        {/* User Details */}
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, border: '2px solid #ffffff', boxShadow: `0 2px 5px rgba(0,0,0,0.1)` }}>
                              {item.initials}
                            </div>
                            <div>
                              <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</div>
                              <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>{item.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <span style={{ 
                            display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                            background: roleColor.bg, border: `1px solid ${roleColor.border}`, color: roleColor.text
                          }}>
                            {item.role}
                          </span>
                        </td>

                        {/* Department & Last Active */}
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <div style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>{item.department}</div>
                          <div style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 600 }}>Last active: {item.lastActive}</div>
                        </td>
                        
                        {/* Status Switch */}
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                          <div 
                            onClick={() => toggleUserStatus(item.id)}
                            style={{ 
                              width: '40px', height: '22px', borderRadius: '11px', 
                              background: item.isActive ? 'rgba(16, 185, 129, 0.2)' : '#E2E8F0',
                              border: item.isActive ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid #CBD5E1',
                              position: 'relative', cursor: 'pointer', margin: '0 auto', transition: 'all 0.3s'
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: '2px', left: item.isActive ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%',
                              background: item.isActive ? '#10B981' : '#94A3B8', transition: 'all 0.3s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}></div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(item.id)}
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '0.4rem', borderRadius: '0.25rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                        <Users size={48} color="#E2E8F0" style={{ margin: '0 auto 1rem' }} />
                        No platform users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Role Management Panel */}
        <div className="cd-glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>Roles & System Permissions</h4>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Manage permission matrix models for platform roles</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Super Admin Card */}
            <div style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#DC2626' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={14} color="#DC2626" /> Super Admin
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{users.filter(u => u.role === 'Admin').length || 1} active user</span>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>FULL ACCESS</span>
              </div>
              <button 
                onClick={() => setIsMatrixModalOpen(true)}
                style={{ width: '100%', padding: '0.5rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              >
                <Settings size={14} /> System Configuration
              </button>
            </div>

            {/* Admin Card */}
            <div style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#F59E0B' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={14} color="#F59E0B" /> Admin
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>5 active users</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {['View Reports ✓', 'Manage Users ✓', 'Configure AI ✓', 'Delete Data ✗'].map((p, idx) => {
                  const isCheck = p.endsWith('✓');
                  return (
                    <span key={idx} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: isCheck ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: isCheck ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', color: isCheck ? '#10B981' : '#EF4444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {p.slice(0, -2)}
                    </span>
                  );
                })}
              </div>
              <button 
                onClick={() => setIsMatrixModalOpen(true)}
                style={{ width: '100%', padding: '0.5rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              >
                Configure Permissions
              </button>
            </div>

            {/* Interviewer Card */}
            <div style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#F59E0B' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={14} color="#F59E0B" /> Interviewer
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>18 active users</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {['Conduct Interviews ✓', 'View Candidates ✓', 'Add Questions ✓', 'View Reports ✗'].map((p, idx) => {
                  const isCheck = p.endsWith('✓');
                  return (
                    <span key={idx} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: isCheck ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: isCheck ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', color: isCheck ? '#10B981' : '#EF4444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {p.slice(0, -2)}
                    </span>
                  );
                })}
              </div>
              <button 
                onClick={() => setIsMatrixModalOpen(true)}
                style={{ width: '100%', padding: '0.5rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              >
                Configure Permissions
              </button>
            </div>

            {/* HR Manager Card */}
            <div style={{ padding: '1.25rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '0.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10B981' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={14} color="#10B981" /> HR Manager
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>6 active users</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {['View Candidates ✓', 'Manage Offers ✓', 'View Reports ✓', 'Manage Users ✗'].map((p, idx) => {
                  const isCheck = p.endsWith('✓');
                  return (
                    <span key={idx} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: isCheck ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: isCheck ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', color: isCheck ? '#10B981' : '#EF4444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {p.slice(0, -2)}
                    </span>
                  );
                })}
              </div>
              <button 
                onClick={() => setIsMatrixModalOpen(true)}
                style={{ width: '100%', padding: '0.5rem', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '0.5rem', color: '#334155', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              >
                Configure Permissions
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* --- DYNAMIC BULK ACTION BAR --- */}
      {selectedRows.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: '#ffffff', border: '1px solid #E5E7EB',
          padding: '1rem 2rem', borderRadius: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 100
        }}>
          <span style={{ color: '#0F172A', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="#DC2626" /> {selectedRows.length} Users Selected
          </span>
          
          <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select
              onChange={e => handleBulkRoleChange(e.target.value)}
              className="cd-input"
              style={{ borderRadius: '2rem', padding: '0.5rem 1rem' }}
            >
              <option value="">Change role to...</option>
              <option value="Admin">Admin</option>
              <option value="Interviewer">Interviewer</option>
              <option value="HR Manager">HR Manager</option>
            </select>

            <button
              onClick={handleBulkDeactivate}
              style={{ background: '#EF4444', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Deactivate Selected
            </button>
          </div>

          <button
            onClick={() => setSelectedRows([])}
            style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#64748B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* --- INVITE USER MODAL OVERLAY --- */}
      {isInviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1.5rem', width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
            
            {/* Modal Form */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRight: '1px solid #E5E7EB' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.25rem', fontWeight: 700 }}>Invite Platform Evaluator</h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Send a secure token screening loop invite.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>User Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Priya Patel"
                    value={inviteForm.name}
                    onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                    className="cd-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. priya.patel@company.com"
                    value={inviteForm.email}
                    onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="cd-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigned Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                      className="cd-input"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Interviewer">Interviewer</option>
                      <option value="HR Manager">HR Manager</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Department</label>
                    <select
                      value={inviteForm.department}
                      onChange={e => setInviteForm(prev => ({ ...prev, department: e.target.value }))}
                      className="cd-input"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Design">Design</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Personalized Message</label>
                  <textarea
                    rows={3}
                    value={inviteForm.message}
                    onChange={e => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    className="cd-input"
                    style={{ resize: 'none' }}
                  ></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="cd-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  className="cd-btn-primary"
                  style={{ flex: 1 }}
                >
                  Send Token Invite
                </button>
              </div>
            </div>

            {/* Email Terminal Preview Box */}
            <div style={{ padding: '2rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Terminal size={18} color="#DC2626" />
                <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Email Broadcast Terminal</span>
              </div>
              
              {/* Terminal Window */}
              <div style={{ flex: 1, background: '#0F172A', borderRadius: '0.5rem', border: '1px solid #1E293B', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
                {/* Terminal Header */}
                <div style={{ background: '#1E293B', padding: '0.5rem 1rem', borderBottom: '1px solid #334155', display: 'flex', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
                </div>
                {/* Terminal Content */}
                <div style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.6 }}>
                  <div style={{ color: '#10B981', marginBottom: '1rem' }}>$ compiling.invite_template...</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#DC2626' }}>TO:</span>
                    <span style={{ color: '#F8FAFC' }}>{inviteForm.email || '<evaluator@address.com>'}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{ color: '#DC2626' }}>SUBJ:</span>
                    <span style={{ color: '#F8FAFC' }}>Secure Platform access: Smart Campus Panel</span>
                  </div>
                  
                  <div style={{ color: '#F8FAFC', marginBottom: '1rem' }}>Hello {inviteForm.name || 'Evaluator'},</div>
                  <div style={{ color: '#94A3B8', marginBottom: '2rem' }}>{inviteForm.message}</div>
                  
                  {/* Fake Button inside email */}
                  <div style={{ background: 'transparent', border: '1px dashed #DC2626', color: '#DC2626', padding: '0.75rem', textAlign: 'center', borderRadius: '0.25rem', fontWeight: 700, letterSpacing: '1px' }}>
                    [ ACCEPT_TOKEN_INVITE ]
                  </div>

                  <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={12} /> SSL ENCRYPTED TRANSMISSION
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- SYSTEM PERMISSIONS MATRIX MODAL --- */}
      {isMatrixModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1.5rem', width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#0F172A', fontSize: '1.25rem', fontWeight: 700 }}>Platform Permissions Configuration</h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Toggle and align access modules across platform user groups.</p>
              </div>
              <button
                onClick={() => setIsMatrixModalOpen(false)}
                style={{ background: '#ffffff', border: '1px solid #E5E7EB', color: '#64748B', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Matrix Table Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', color: '#64748B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '1.25rem 1.5rem', fontWeight: 800 }}>Core Feature Module</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, color: '#DC2626' }}>Super Admin</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, color: '#EF4444' }}>Admin</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, color: '#F59E0B' }}>Interviewer</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center', fontWeight: 800, color: '#10B981' }}>HR Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureMatrix.map((feat, idx) => (
                      <tr key={feat.key} style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s', background: idx % 2 === 0 ? 'transparent' : '#F8FAFC' }}>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#0F172A', fontWeight: 700, fontSize: '0.9rem' }}>{feat.name}</td>
                        
                        {(['SuperAdmin', 'Admin', 'Interviewer', 'HRManager'] as const).map(role => {
                          const isActive = feat[role];
                          let accent = '#DC2626';
                          if (role === 'Admin') accent = '#EF4444';
                          if (role === 'Interviewer') accent = '#F59E0B';
                          if (role === 'HRManager') accent = '#10B981';

                          return (
                            <td key={role} style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                              <div 
                                onClick={() => handleMatrixCellToggle(feat.key, role)}
                                style={{
                                  width: '24px', height: '24px', margin: '0 auto', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                  background: isActive ? `rgba(${accent === '#DC2626' ? '220,38,38' : accent === '#EF4444' ? '239,68,68' : accent === '#F59E0B' ? '245,158,11' : '16,185,129'}, 0.1)` : '#F1F5F9',
                                  border: isActive ? `1px solid ${accent}` : '1px solid #E2E8F0'
                                }}
                              >
                                {isActive && <Check size={14} color={accent} />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={14} color="#DC2626" /> Changes apply immediately to active session JWT tokens.
              </span>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setIsMatrixModalOpen(false)}
                  className="cd-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsMatrixModalOpen(false)}
                  className="cd-btn-primary"
                >
                  Save Platform Permissions
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
