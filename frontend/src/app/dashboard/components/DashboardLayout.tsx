'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
  userProfile: UserProfile | null;
}

function DashboardLayout({ children, activeSection, onNavigate, userProfile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        userName={userProfile?.name || 'User'}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64 min-h-screen bg-[#F8FAFC]">
        <TopBar
          userProfile={userProfile}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
