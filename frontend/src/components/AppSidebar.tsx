import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  MessageCircle,
  Camera,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/assistant', icon: MessageCircle, label: 'AI Assistant' },
  { to: '/dashboard/report', icon: Camera, label: 'Report Issue' },
  { to: '/dashboard/my-reports', icon: FileText, label: 'My Reports' },
  { to: '/dashboard/alerts', icon: Bell, label: 'Neighborhood Alerts' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface AppSidebarProps {
  onClose?: () => void;
  mobile?: boolean;
}

export function AppSidebar({ onClose, mobile }: AppSidebarProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <aside
      className={`flex flex-col bg-civic-navy border-r border-gray-800 ${
        mobile ? 'w-64 fixed inset-y-0 left-0 z-40' : 'w-56 min-h-screen'
      }`}
      aria-label="Dashboard navigation"
    >
      <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-4">
        <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="text-civic-orange">CIVIC</span>
          <span className="text-gray-300">RISE</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Main navigation">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-civic-navy-light text-civic-orange'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
