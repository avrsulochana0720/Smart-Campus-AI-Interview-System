import React, { useState } from 'react';
import AdminLayout from './admin/AdminLayout';
import AdminOverview from './admin/AdminOverview';

// Optionally keep the older modules if needed, but for now
// we are replacing the default view with AdminOverview

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <AdminLayout activeTab={activeTab}>
      {activeTab === 'Dashboard' && <AdminOverview />}
    </AdminLayout>
  );
}
