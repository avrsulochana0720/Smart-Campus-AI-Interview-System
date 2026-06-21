import React, { useState, useEffect } from 'react';
import {
  Video, Users, UserCheck, Building2, BookOpen, Layers,
  BrainCircuit, BarChart2, FileText, MessageSquare, Target,
  Settings, Plug, FileCode, Activity, Search, Bell, Calendar,
  Moon, Menu, Sun, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../utils/api';
import { useToast } from './ToastContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabName: string) => void;
}

export default function AdminLayout({ children, activeTab = 'Dashboard', onTabChange }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [showNotifDrop, setShowNotifDrop] = useState(false);
  const [showCalendarDrop, setShowCalendarDrop] = useState(false);
  const [showProfileDrop, setShowProfileDrop] = useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isTopbarSearchFocused, setIsTopbarSearchFocused] = useState(false);

  useEffect(() => {
    adminAPI.getSettings().then(res => setProfile(res || {})).catch(() => {});
    adminAPI.getSystemMonitoring().then(res => setAlerts(res?.alerts || [])).catch(() => {});
    adminAPI.getUsers().then(res => setUsers(res || [])).catch(() => {});
    adminAPI.getInterviews().then(res => setInterviews(res?.slice(0, 3) || [])).catch(() => {});
  }, []);

  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Interviews', icon: Video, active: activeTab === 'Interviews' },
        { name: 'Candidates', icon: Users, active: activeTab === 'Candidates' },
        { name: 'Interviewers', icon: UserCheck, active: activeTab === 'Interviewers' },
        { name: 'Departments', icon: Building2, active: activeTab === 'Departments' },
        { name: 'Courses', icon: BookOpen, active: activeTab === 'Courses' },
        { name: 'Batch Management', icon: Layers, active: activeTab === 'Batch Management' },
      ]
    },
    {
      title: 'AI & ANALYTICS',
      items: [
        { name: 'AI Evaluations', icon: BrainCircuit, active: activeTab === 'AI Evaluations' },
        { name: 'Analytics', icon: BarChart2, active: activeTab === 'Analytics' },
        { name: 'Reports', icon: FileText, active: activeTab === 'Reports' },
        { name: 'Feedback Insights', icon: MessageSquare, active: activeTab === 'Feedback Insights' },
        { name: 'Skill Insights', icon: Target, active: activeTab === 'Skill Insights' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Users & Roles', icon: Users, active: activeTab === 'Users & Roles' },
        { name: 'Settings', icon: Settings, active: activeTab === 'Settings' },
        { name: 'Integrations', icon: Plug, active: activeTab === 'Integrations' },
        { name: 'Audit Logs', icon: FileCode, active: activeTab === 'Audit Logs' },
        { name: 'System Monitoring', icon: Activity, active: activeTab === 'System Monitoring' },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAF6EE', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: sidebarCollapsed ? '80px' : '280px', backgroundColor: '#FAF6EE', borderRight: '2px solid #0F172A', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, transition: 'width 0.3s' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#E11D48', border: '2px solid #0F172A', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0, color: '#FFFFFF' }}>AI</div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#E11D48', margin: 0, letterSpacing: '0.02em' }}>Smart Campus</h1>
              <p style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 600, margin: 0 }}>AI Interview System</p>
            </div>
          )}
        </div>

        <div style={{ padding: '0 1rem', flex: 1, overflowY: 'auto' }} className="scrollbar-hide">
          <div 
            onClick={() => onTabChange && onTabChange('Dashboard')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              backgroundColor: activeTab === 'Dashboard' ? '#E11D48' : 'transparent', 
              borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem',
              color: activeTab === 'Dashboard' ? '#FFFFFF' : '#0F172A', 
              fontWeight: 800, fontSize: '0.9rem',
              border: activeTab === 'Dashboard' ? '2px solid #0F172A' : '2px solid transparent',
              boxShadow: activeTab === 'Dashboard' ? '3px 3px 0px #0F172A' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ background: activeTab === 'Dashboard' ? 'rgba(255, 255, 255, 0.2)' : 'transparent', padding: '0.3rem', borderRadius: '0.3rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.1rem', color: activeTab === 'Dashboard' ? '#FFFFFF' : '#E11D48' }}>✦</span>
            </div>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>

          {menuSections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map((item, i) => (
                  <div 
                    key={i}
                    onClick={() => onTabChange && onTabChange(item.name)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                      color: item.active ? '#FFFFFF' : '#0F172A',
                      backgroundColor: item.active ? '#E11D48' : 'transparent',
                      border: item.active ? '2px solid #0F172A' : '2px solid transparent',
                      boxShadow: item.active ? '3px 3px 0px #0F172A' : 'none',
                      fontSize: '0.85rem', fontWeight: 800, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.active) {
                        e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)';
                        e.currentTarget.style.borderColor = '#0F172A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <item.icon size={16} strokeWidth={2.5} color={item.active ? '#FFFFFF' : '#E11D48'} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!sidebarCollapsed && (item.name === 'Interviews' || item.name === 'AI Evaluations' || item.name === 'Analytics' || item.name === 'Reports' || item.name === 'Users & Roles') ? (
                      <span style={{ fontSize: '0.8rem', color: item.active ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}>›</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Card */}
        {!sidebarCollapsed && (
          <div style={{ padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '0.75rem', overflow: 'hidden', border: '2px solid #0F172A' }}>
              <div style={{ height: '80px', background: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80) center/cover' }}></div>
              <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Greenfield University</h4>
                  <p style={{ fontSize: '0.7rem', color: '#1E293B', fontWeight: 600, margin: 0 }}>Spring Semester 2024</p>
                </div>
                <span style={{ color: '#0F172A', fontWeight: 800 }}>˅</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* TOPBAR */}
        <header style={{ height: '72px', borderBottom: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0, backgroundColor: '#FAF6EE', transition: 'background-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Menu size={20} color="#E11D48" style={{ cursor: 'pointer' }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#E11D48" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search candidates, users..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDrop(e.target.value.length > 0); }}
                onFocus={() => { setIsTopbarSearchFocused(true); if (searchQuery.length > 0) setShowSearchDrop(true); }}
                onBlur={() => { setIsTopbarSearchFocused(false); setTimeout(() => setShowSearchDrop(false), 200); }}
                style={{ 
                  width: '100%', backgroundColor: isTopbarSearchFocused ? '#FAF6EE' : '#FFFFFF', border: '2px solid #0F172A', 
                  borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.5rem', 
                  color: '#0F172A', fontSize: '0.85rem', fontWeight: 600, outline: 'none'
                }} 
              />
              {showSearchDrop && (
                <div style={{ position: 'absolute', top: '120%', left: 0, right: 0, backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 50, maxHeight: '300px', overflowY: 'auto' }}>
                  {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(u => (
                    <div key={u.id} style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #0F172A', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => { onTabChange && onTabChange('Users & Roles'); setSearchQuery(''); }}>
                      <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 800 }}>{u.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#E11D48', fontWeight: 700 }}>{u.role}</span>
                    </div>
                  ))}
                  {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', color: '#0F172A', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center' }}>No users found</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#0F172A' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { setShowNotifDrop(!showNotifDrop); setShowCalendarDrop(false); setShowProfileDrop(false); }}>
                <Bell size={20} strokeWidth={2.5} />
                {alerts.length > 0 && <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#E11D48', color: '#FFFFFF', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #0F172A' }}>{alerts.length}</div>}
                
                {showNotifDrop && (
                  <div style={{ position: 'absolute', top: '150%', right: '-10px', width: '300px', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', zIndex: 50, padding: '1rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800 }}>System Alerts</h4>
                    {alerts.length > 0 ? alerts.map((a, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: i === alerts.length - 1 ? 'none' : '2px solid #0F172A', marginBottom: '0.5rem' }}>
                        <div style={{ color: a.level === 'error' ? '#EF4444' : '#F59E0B', fontWeight: 800 }}>{a.title}</div>
                        <div style={{ color: '#1E293B', fontWeight: 600, marginTop: '0.2rem' }}>{a.desc}</div>
                      </div>
                    )) : <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>No new alerts. System is healthy.</div>}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { setShowCalendarDrop(!showCalendarDrop); setShowNotifDrop(false); setShowProfileDrop(false); }}>
                <Calendar size={20} strokeWidth={2.5} />
                {showCalendarDrop && (
                  <div style={{ position: 'absolute', top: '150%', right: '-10px', width: '280px', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', zIndex: 50, padding: '1rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0F172A', fontSize: '0.9rem', fontWeight: 800 }}>Upcoming Interviews</h4>
                    {interviews.length > 0 ? interviews.map((iv, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: i === interviews.length - 1 ? 'none' : '2px solid #0F172A', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#0F172A', fontWeight: 800 }}>{iv.candidateName}</div>
                          <div style={{ color: '#1E293B', fontWeight: 600, marginTop: '0.2rem' }}>{iv.role}</div>
                        </div>
                        <div style={{ color: '#E11D48', fontWeight: 800 }}>{new Date(iv.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    )) : <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>No upcoming interviews scheduled today.</div>}
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', paddingLeft: '1rem', borderLeft: '2px solid #0F172A' }} onClick={() => { setShowProfileDrop(!showProfileDrop); setShowNotifDrop(false); setShowCalendarDrop(false); }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E11D48', border: '2px solid #0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {(profile.first_name?.[0] || 'A')}{(profile.last_name?.[0] || 'U')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{profile.first_name || 'Admin'} {profile.last_name || 'User'}</span>
                <span style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 600 }}>{profile.email || 'Super Admin'}</span>
              </div>
              
              {showProfileDrop && (
                <div style={{ position: 'absolute', top: '120%', right: 0, width: '200px', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#0F172A', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFFFFF'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onTabChange && onTabChange('Settings')}>
                    <Settings size={16} color="#E11D48" /> <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Account Settings</span>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#EF4444', transition: 'background-color 0.2s', borderTop: '2px solid #0F172A' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={async () => { 
                    try {
                      const { supabase } = await import('../lib/supabase');
                      await supabase.auth.signOut();
                    } catch (e) {}
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRole');
                    localStorage.removeItem('token');
                    showToast('Logged out successfully', 'success');
                    navigate('/admin');
                  }}>
                    <LogOut size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
