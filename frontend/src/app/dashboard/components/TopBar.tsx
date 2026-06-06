'use client';

import { Menu, Search, Calendar, Bell, ChevronDown, User } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface TopBarProps {
  userProfile: UserProfile | null;
  onMenuToggle: () => void;
}

function TopBar({ userProfile, onMenuToggle }: TopBarProps) {
  const name = userProfile?.name || 'User';
  const email = userProfile?.email || 'user';

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">
            Welcome back, {name} 👋
          </h1>
          <p className="text-xs text-[#6B7280]">
            Here&apos;s what&apos;s happening with your campus interviews today.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent text-sm outline-none w-40 text-[#111827] placeholder-[#6B7280]"
          />
        </div>

        {/* Date Range */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#6B7280] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4" />
          <span>May 12 – May 18, 2024</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-[#6B7280]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-[#E5E7EB] flex items-center justify-center text-[#DC2626] shadow-inner">
            <User className="w-4 h-4 text-[#DC2626]" strokeWidth={2.5} />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[#111827]">{name}</p>
            <p className="text-[10px] text-[#6B7280]">Admin</p>
          </div>
          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
