import { Link } from '@tanstack/react-router';
import { Flame } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-civic-navy-light bg-civic-navy/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-orange text-white">
            <Flame className="h-5 w-5" />
          </span>
          <span className="text-civic-navy-light md:inline">CIVIC</span>
          <span className="text-civic-orange">RISE</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/#about" className="text-sm text-gray-300 hover:text-white">About</Link>
          <Link to="/#how-it-works" className="text-sm text-gray-300 hover:text-white">How It Works</Link>
          <Link to="/#services" className="text-sm text-gray-300 hover:text-white">Services</Link>
          <Link to="/#contact" className="text-sm text-gray-300 hover:text-white">Contact</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="rounded-lg border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-civic-orange hover:bg-gray-800"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-civic-orange px-4 py-2 text-sm font-medium text-white hover:bg-civic-orange-hover"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}
