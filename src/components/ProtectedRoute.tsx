'use client';

import { redirect } from 'next/navigation';
import { useAuth, useRole } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Protected route component that checks authentication and authorization
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const hasRole = useRole();

  if (loading) {
    return fallback || <div>Loading...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    redirect('/auth/login');
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return fallback || <div>Unauthorized - You do not have access to this page</div>;
  }

  return <>{children}</>;
}
