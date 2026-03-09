import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, Bell, HelpCircle, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopNavBarProps {
  onMenuClick?: () => void;
}

export function TopNavBar({ onMenuClick }: TopNavBarProps) {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut();
    setDropdownOpen(false);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-800 bg-civic-charcoal px-4">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <Link to="/dashboard" className="text-lg font-semibold text-white">
        <span className="text-civic-orange">CIVIC</span>
        <span className="text-gray-300">RISE</span>
      </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              placeholder="Search services, alerts, tickets..."
              className="w-full rounded-lg border border-gray-700 bg-civic-navy py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-civic-orange focus:outline-none focus:ring-1 focus:ring-civic-orange"
              readOnly
              aria-label="Search"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-300 hover:bg-gray-800"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-civic-orange/20 text-civic-orange">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden text-sm sm:inline">{user?.name ?? 'User'}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-700 bg-civic-card py-1 shadow-lg"
            >
              <div className="border-b border-gray-700 px-4 py-2">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
