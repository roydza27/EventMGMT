'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { OrganizerDashboard } from '@/components/dashboard/organizer-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        <p className="text-xs font-mono text-muted uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  if (user.role === 'ORGANIZER') {
    return <OrganizerDashboard user={user} />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} />;
  }

  return <StudentDashboard user={user} />;
}
