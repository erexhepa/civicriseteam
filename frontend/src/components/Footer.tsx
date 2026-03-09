import { Link } from '@tanstack/react-router';

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-civic-navy px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-between gap-8">
          <div>
            <h3 className="text-sm font-semibold text-white">About</h3>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
              CivicRise helps Montgomery citizens access city services, report issues, and stay informed.
            </p>
          </div>
          <div className="flex flex-wrap gap-8">
            <div>
              <h3 className="text-sm font-semibold text-white">Links</h3>
              <ul className="mt-2 space-y-2">
                <li>
                  <Link to="/#about" className="text-sm text-gray-400 hover:text-white">About</Link>
                </li>
                <li>
                  <Link to="/#contact" className="text-sm text-gray-400 hover:text-white">Contact</Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">Privacy</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">City data</h3>
              <p className="mt-2 text-sm text-gray-400">Data from Montgomery city services.</p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} CivicRise. For Montgomery citizens.
        </div>
      </div>
    </footer>
  );
}
