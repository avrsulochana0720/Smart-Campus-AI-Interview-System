import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute — Guards admin-only routes.
 * Checks for a valid admin JWT token and a recognized admin role.
 * If missing or invalid, redirects to /admin (admin login page).
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const adminToken = localStorage.getItem('adminToken');
  const adminRole = localStorage.getItem('adminRole');

  // Must have both token and a recognized admin role
  const validRoles = ['admin', 'tpo', 'super_admin'];
  if (!adminToken || !adminRole || !validRoles.includes(adminRole)) {
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />;
  }

  // Basic JWT expiry check
  try {
    const payload = JSON.parse(atob(adminToken.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRole');
      return <Navigate to="/admin" state={{ from: location.pathname, expired: true }} replace />;
    }
  } catch {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
