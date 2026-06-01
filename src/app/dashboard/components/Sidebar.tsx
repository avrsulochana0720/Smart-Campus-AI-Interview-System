'use client';

import {
  GraduationCap,
  Home,
  Video,
  Users,
  BrainCircuit,
  BookOpen,
  LineChart,
  MessageSquare,
  UserCog,
  Settings,
  Link,
  Bot,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'interviews', label: 'Interviews', icon: Video },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'assessments', label: 'AI Assessments', icon: BrainCircuit },
  { id: 'questions', label: 'Questions Bank', icon: BookOpen },
  { id: 'reports', label: 'Reports & Analytics', icon: LineChart },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'users', label: 'Users & Roles', icon: UserCog },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'integrations', label: 'Integrations', icon: Link },
];

function Sidebar({ activeSection, onNavigate, userName, isOpen, onClose }: SidebarProps) {
  const handleNavigate = (section: string) => {
    onNavigate(section);
    onClose();
  };

  const sidebarContent = (
    <div className="w-72 bg-[#0F172A] text-white flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-8 py-8">
        <div className="w-8 h-8 bg-[#DC2626] rounded-lg flex items-center justify-center shadow-sm">
          <GraduationCap className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-white tracking-wide">Smart Campus</h1>
          <p className="text-[11px] text-[#94A3B8] font-medium">AI Interview System</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto space-y-1.5 custom-scrollbar pb-6">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#DC2626] text-white shadow-md'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-[20px] h-[20px] ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom AI Card */}
      <div className="px-4 pb-8 mt-auto pt-4 relative">
        <div className="bg-[#1E293B] rounded-2xl p-6 flex flex-col items-center text-center relative border border-[#334155] shadow-lg">
          <div className="w-12 h-12 bg-[#F59E0B] rounded-full flex items-center justify-center mb-4 mt-2 shadow-sm">
            <Bot className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-white font-bold text-[14px] mb-2 tracking-wide">AI Powered Interviews</h3>
          <p className="text-[#94A3B8] text-[12px] leading-relaxed font-medium">
            Smarter Interviews.<br />Better Decisions.
          </p>
          
          {/* User Avatar Badge */}
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#F8FAFC] rounded-full flex items-center justify-center border-[3px] border-[#0F172A] shadow-md">
            <span className="text-[#0F172A] font-bold text-lg">{userName ? userName.charAt(0).toUpperCase() : 'N'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
