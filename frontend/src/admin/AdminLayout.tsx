import React from 'react';
import {
  Video, Users, UserCheck, Building2, BookOpen, Layers,
  BrainCircuit, BarChart2, FileText, MessageSquare, Target,
  Settings, Plug, FileCode, Activity, Search, Bell, Calendar,
  Moon, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function AdminLayout({ children, activeTab = 'Dashboard' }: AdminLayoutProps) {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Interviews', icon: Video, active: false },
        { name: 'Candidates', icon: Users, active: false },
        { name: 'Interviewers', icon: UserCheck, active: false },
        { name: 'Departments', icon: Building2, active: false },
        { name: 'Courses', icon: BookOpen, active: false },
        { name: 'Batch Management', icon: Layers, active: false },
      ]
    },
    {
      title: 'AI & ANALYTICS',
      items: [
        { name: 'AI Evaluations', icon: BrainCircuit, active: false },
        { name: 'Analytics', icon: BarChart2, active: false },
        { name: 'Reports', icon: FileText, active: false },
        { name: 'Feedback Insights', icon: MessageSquare, active: false },
        { name: 'Skill Insights', icon: Target, active: false },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Users & Roles', icon: Users, active: false },
        { name: 'Settings', icon: Settings, active: false },
        { name: 'Integrations', icon: Plug, active: false },
        { name: 'Audit Logs', icon: FileCode, active: false },
        { name: 'System Monitoring', icon: Activity, active: false },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0F1C', color: '#FFFFFF', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0D1322', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>AI</div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, letterSpacing: '0.02em' }}>Smart Campus</h1>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>AI Interview System</p>
          </div>
        </div>

        <div style={{ padding: '0 1rem', flex: 1, overflowY: 'auto' }} className="scrollbar-hide">
          <div 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              backgroundColor: '#1E293B', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem',
              color: '#3B82F6', fontWeight: 500, fontSize: '0.9rem'
            }}
          >
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.3rem', borderRadius: '0.3rem' }}>
              <span style={{ fontSize: '1.1rem' }}>✦</span>
            </div>
            Dashboard
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <item.icon size={16} strokeWidth={2} />
                      {item.name}
                    </div>
                    {item.name === 'Interviews' || item.name === 'AI Evaluations' || item.name === 'Analytics' || item.name === 'Reports' || item.name === 'Users & Roles' ? (
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>›</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Card */}
        <div style={{ padding: '1rem' }}>
          <div style={{ background: '#111827', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #1E293B' }}>
            <div style={{ height: '80px', background: 'url(https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80) center/cover' }}></div>
            <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Greenfield University</h4>
                <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>Spring Semester 2024</p>
              </div>
              <span style={{ color: '#64748B' }}>˅</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* TOPBAR */}
        <header style={{ height: '72px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', flexShrink: 0, backgroundColor: '#0D1322' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Menu size={20} color="#94A3B8" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                style={{ 
                  width: '100%', backgroundColor: '#111827', border: '1px solid #1E293B', 
                  borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.5rem', 
                  color: '#FFFFFF', fontSize: '0.85rem', outline: 'none'
                }} 
              />
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#1E293B', color: '#64748B', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>⌘K</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94A3B8' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <Bell size={20} />
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#EF4444', color: '#FFF', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0D1322' }}>12</div>
              </div>
              <Calendar size={20} style={{ cursor: 'pointer' }} />
              <Moon size={20} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', paddingLeft: '1rem', borderLeft: '1px solid #1E293B' }}>
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=3B82F6&color=fff" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>Admin User</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Super Admin</span>
              </div>
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
