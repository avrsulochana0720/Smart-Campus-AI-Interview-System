import React, { useState } from 'react';
import AdminLayout from './admin/AdminLayout';
import { ToastProvider } from './admin/ToastContext';
import AdminOverview from './admin/AdminOverview';
import InterviewsPage from './admin/pages/InterviewsPage';
import CandidatesPage from './admin/pages/CandidatesPage';
import AnalyticsPage from './admin/pages/AnalyticsPage';
import SettingsPage from './admin/pages/SettingsPage';
import UsersRolesPage from './admin/pages/UsersRolesPage';
import InterviewersPage from './admin/pages/InterviewersPage';
import DepartmentsPage from './admin/pages/DepartmentsPage';
import CoursesPage from './admin/pages/CoursesPage';
import BatchManagementPage from './admin/pages/BatchManagementPage';
import AIEvaluationsPage from './admin/pages/AIEvaluationsPage';
import ReportsPage from './admin/pages/ReportsPage';
import FeedbackInsightsPage from './admin/pages/FeedbackInsightsPage';
import SkillInsightsPage from './admin/pages/SkillInsightsPage';
import IntegrationsPage from './admin/pages/IntegrationsPage';
import AuditLogsPage from './admin/pages/AuditLogsPage';
import SystemMonitoringPage from './admin/pages/SystemMonitoringPage';
import PlaceholderPage from './admin/pages/PlaceholderPage';
import ForbiddenPage from './admin/pages/ForbiddenPage';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderContent = () => {
    const adminRole = localStorage.getItem('adminRole') || '';
    const restrictedTabsForTPO = ['Users & Roles', 'Integrations', 'Audit Logs', 'System Monitoring'];
    if (adminRole === 'tpo' && restrictedTabsForTPO.includes(activeTab)) {
      return <ForbiddenPage title={activeTab} />;
    }

    switch (activeTab) {
      case 'Dashboard': return <AdminOverview setActiveTab={setActiveTab} />;
      case 'Interviews': return <InterviewsPage />;
      case 'Candidates': return <CandidatesPage />;
      case 'Analytics': return <AnalyticsPage />;
      case 'Settings': return <SettingsPage />;
      case 'Users & Roles': return <UsersRolesPage />;
      case 'Interviewers': return <InterviewersPage />;
      case 'Departments': return <DepartmentsPage />;
      case 'Courses': return <CoursesPage />;
      case 'Batch Management': return <BatchManagementPage />;
      case 'AI Evaluations': return <AIEvaluationsPage />;
      case 'Reports': return <ReportsPage />;
      case 'Feedback Insights': return <FeedbackInsightsPage />;
      case 'Skill Insights': return <SkillInsightsPage />;
      case 'Integrations': return <IntegrationsPage />;
      case 'Audit Logs': return <AuditLogsPage />;
      case 'System Monitoring': return <SystemMonitoringPage />;
      default: return <PlaceholderPage title={activeTab} />;
    }
  };

  return (
    <ToastProvider>
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </AdminLayout>
    </ToastProvider>
  );
}
