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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: darkMode ? '#0A0F1C' : '#F1F5F9', color: darkMode ? '#FFFFFF' : '#0F172A', fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.3s' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: sidebarCollapsed ? '80px' : '280px', backgroundColor: darkMode ? '#0D1322' : '#FFFFFF', borderRight: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, transition: 'width 0.3s' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #BE123C 0%, #E11D48 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0, color: '#FFF' }}>AI</div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, letterSpacing: '0.02em', color: darkMode ? '#FFF' : '#0F172A' }}>Smart Campus</h1>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>AI Interview System</p>
            </div>
          )}
        </div>

        <div style={{ padding: '0 1rem', flex: 1, overflowY: 'auto' }} className="scrollbar-hide">
          <div 
            onClick={() => onTabChange && onTabChange('Dashboard')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              backgroundColor: activeTab === 'Dashboard' ? '#1E293B' : 'transparent', 
              borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem',
              color: activeTab === 'Dashboard' ? '#E11D48' : '#94A3B8', fontWeight: 500, fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ background: activeTab === 'Dashboard' ? 'rgba(225, 29, 72, 0.2)' : 'transparent', padding: '0.3rem', borderRadius: '0.3rem', flexShrink: 0 }}>
              <span style={{ fontSize: '1.1rem' }}>✦</span>
            </div>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>

          {menuSections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
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
                      color: item.active ? '#FFFFFF' : '#94A3B8',
                      backgroundColor: item.active ? 'rgba(255,255,255,0.05)' : 'transparent',
                      fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = item.active ? '#FFFFFF' : '#94A3B8'; e.currentTarget.style.backgroundColor = item.active ? 'rgba(255,255,255,0.05)' : 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <item.icon size={16} strokeWidth={2} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!sidebarCollapsed && (item.name === 'Interviews' || item.name === 'AI Evaluations' || item.name === 'Analytics' || item.name === 'Reports' || item.name === 'Users & Roles') ? (
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>›</span>
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
            <div style={{ background: darkMode ? '#111827' : '#F8FAFC', borderRadius: '0.75rem', overflow: 'hidden', border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}` }}>
              <div style={{ height: '80px', background: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80) center/cover' }}></div>
              <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: darkMode ? '#FFFFFF' : '#0F172A', margin: 0 }}>Greenfield University</h4>
                  <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>Spring Semester 2024</p>
                </div>
                <span style={{ color: '#64748B' }}>˅</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* TOPBAR */}
        <header style={{ height: '72px', borderBottom: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0, backgroundColor: darkMode ? '#0D1322' : '#FFFFFF', transition: 'background-color 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Menu size={20} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search candidates, users..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDrop(e.target.value.length > 0); }}
                onFocus={() => { if (searchQuery.length > 0) setShowSearchDrop(true); }}
                onBlur={() => setTimeout(() => setShowSearchDrop(false), 200)}
                style={{ 
                  width: '100%', backgroundColor: darkMode ? '#111827' : '#F1F5F9', border: `1px solid ${darkMode ? '#1E293B' : '#CBD5E1'}`, 
                  borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.5rem', 
                  color: darkMode ? '#FFFFFF' : '#0F172A', fontSize: '0.85rem', outline: 'none'
                }} 
              />
              {showSearchDrop && (
                <div style={{ position: 'absolute', top: '120%', left: 0, right: 0, backgroundColor: darkMode ? '#111827' : '#FFFFFF', border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`, borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 50, maxHeight: '300px', overflowY: 'auto' }}>
                  {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(u => (
                    <div key={u.id} style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${darkMode ? '#1E293B' : '#F1F5F9'}`, display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => { onTabChange && onTabChange('Users & Roles'); setSearchQuery(''); }}>
                      <span style={{ fontSize: '0.85rem', color: darkMode ? '#E2E8F0' : '#0F172A' }}>{u.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.role}</span>
                    </div>
                  ))}
                  {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', color: '#64748B', fontSize: '0.85rem', textAlign: 'center' }}>No users found</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94A3B8' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { setShowNotifDrop(!showNotifDrop); setShowCalendarDrop(false); setShowProfileDrop(false); }}>
                <Bell size={20} />
                {alerts.length > 0 && <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#EF4444', color: '#FFF', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${darkMode ? '#0D1322' : '#FFF'}` }}>{alerts.length}</div>}
                
                {showNotifDrop && (
                  <div style={{ position: 'absolute', top: '150%', right: '-10px', width: '300px', backgroundColor: darkMode ? '#111827' : '#FFFFFF', border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`, borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', zIndex: 50, padding: '1rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#FFF' : '#0F172A', fontSize: '0.9rem' }}>System Alerts</h4>
                    {alerts.length > 0 ? alerts.map((a, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${darkMode ? '#1E293B' : '#F1F5F9'}`, marginBottom: '0.5rem' }}>
                        <div style={{ color: a.level === 'error' ? '#EF4444' : '#F59E0B', fontWeight: 600 }}>{a.title}</div>
                        <div style={{ color: '#64748B', marginTop: '0.2rem' }}>{a.desc}</div>
                      </div>
                    )) : <div style={{ fontSize: '0.8rem', color: '#64748B' }}>No new alerts. System is healthy.</div>}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { setShowCalendarDrop(!showCalendarDrop); setShowNotifDrop(false); setShowProfileDrop(false); }}>
                <Calendar size={20} />
                {showCalendarDrop && (
                  <div style={{ position: 'absolute', top: '150%', right: '-10px', width: '280px', backgroundColor: darkMode ? '#111827' : '#FFFFFF', border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`, borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', zIndex: 50, padding: '1rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#FFF' : '#0F172A', fontSize: '0.9rem' }}>Upcoming Interviews</h4>
                    {interviews.length > 0 ? interviews.map((iv, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${darkMode ? '#1E293B' : '#F1F5F9'}`, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ color: darkMode ? '#E2E8F0' : '#0F172A', fontWeight: 500 }}>{iv.candidateName}</div>
                          <div style={{ color: '#64748B', marginTop: '0.2rem' }}>{iv.role}</div>
                        </div>
                        <div style={{ color: '#E11D48' }}>{new Date(iv.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    )) : <div style={{ fontSize: '0.8rem', color: '#64748B' }}>No upcoming interviews scheduled today.</div>}
                  </div>
                )}
              </div>

              <div style={{ cursor: 'pointer' }} onClick={() => { setDarkMode(!darkMode); showToast(`${!darkMode ? 'Dark' : 'Light'} mode enabled!`, 'success'); }}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', paddingLeft: '1rem', borderLeft: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}` }} onClick={() => { setShowProfileDrop(!showProfileDrop); setShowNotifDrop(false); setShowCalendarDrop(false); }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E11D48', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {(profile.first_name?.[0] || 'A')}{(profile.last_name?.[0] || 'U')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: darkMode ? '#FFFFFF' : '#0F172A', lineHeight: 1.2 }}>{profile.first_name || 'Admin'} {profile.last_name || 'User'}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{profile.email || 'Super Admin'}</span>
              </div>
              
              {showProfileDrop && (
                <div style={{ position: 'absolute', top: '120%', right: 0, width: '200px', backgroundColor: darkMode ? '#111827' : '#FFFFFF', border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`, borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: darkMode ? '#E2E8F0' : '#0F172A', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? '#1E293B' : '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => onTabChange && onTabChange('Settings')}>
                    <Settings size={16} /> <span style={{ fontSize: '0.85rem' }}>Account Settings</span>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#EF4444', transition: 'background-color 0.2s', borderTop: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}` }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => showToast('Logged out successfully', 'success')}>
                    <LogOut size={16} /> <span style={{ fontSize: '0.85rem' }}>Sign Out</span>
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
