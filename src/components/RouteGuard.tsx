import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '@/types';

interface RouteGuardProps {
  allowed: UserRole[];
  userRole: UserRole | null;
  loading: boolean;
  children: React.ReactNode;
  redirectTo?: string;
}

export function RouteGuard({
  allowed,
  userRole,
  loading,
  children,
  redirectTo = '/portal',
}: RouteGuardProps) {
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center uppercase tracking-widest text-xs">Syncing Portal...</div>;
  }

  if (!userRole || !allowed.includes(userRole)) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
