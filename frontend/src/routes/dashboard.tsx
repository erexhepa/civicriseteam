import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { TopNavBar } from '../components/TopNavBar';
import { useOptionalAuth } from '../contexts/AuthContext';

function DashboardLayout() {
  const auth = useOptionalAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (auth === null) return;
    if (!auth.isLoading && !auth.user) {
      navigate({ to: '/signin' });
    }
  }, [auth?.user, auth?.isLoading, navigate]);

  if (auth?.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-civic-navy" role="status" aria-live="polite">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }
  if (!auth?.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-civic-charcoal">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div className={`lg:hidden ${sidebarOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden'}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} mobile />
      </div>
      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNavBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-1">
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: 'Dashboard – CivicRise' }],
  }),
  component: DashboardLayout,
});
