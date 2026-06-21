import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute — Guards student/candidate routes.
 * Checks for a valid JWT token in localStorage.
 * If absent, redirects to /login preserving the intended destination.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login, encoding the current path so we can return after auth
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Basic JWT expiry check — decode payload and compare `exp` claim
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token expired — clear and redirect
      localStorage.removeItem('token');
      return <Navigate to="/login" state={{ from: location.pathname, expired: true }} replace />;
    }
  } catch {
    // Malformed token — clear and redirect
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
