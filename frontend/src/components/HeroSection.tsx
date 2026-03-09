import { Link } from '@tanstack/react-router';
import { Smartphone, MapPin, MessageCircle } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-civic-navy px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              AI Copilot for{' '}
              <span className="text-civic-orange">Montgomery Citizens</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 sm:text-xl">
              Access city services, report issues, and stay informed with AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex rounded-lg bg-civic-orange px-6 py-3 text-base font-medium text-white hover:bg-civic-orange-hover"
              >
                Get Started
              </Link>
              <Link
                to="/#how-it-works"
                className="inline-flex rounded-lg border border-gray-600 bg-transparent px-6 py-3 text-base font-medium text-white hover:bg-gray-800"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="flex gap-4">
              <div className="flex h-48 w-32 flex-col items-center justify-center rounded-2xl border border-gray-700 bg-civic-card p-4 shadow-xl sm:h-56 sm:w-36">
                <MapPin className="mb-2 h-8 w-8 text-civic-icon-blue" />
                <div className="h-2 w-2 rounded-full bg-civic-orange" />
                <div className="mt-2 h-2 w-2 rounded-full bg-gray-500" />
                <div className="mt-1 h-2 w-2 rounded-full bg-gray-500" />
                <span className="mt-2 text-xs text-gray-400">Map</span>
              </div>
              <div className="flex h-48 w-32 flex-col items-center justify-center rounded-2xl border border-gray-700 bg-civic-card p-4 shadow-xl sm:h-56 sm:w-36">
                <MessageCircle className="mb-2 h-8 w-8 text-civic-orange" />
                <div className="w-full rounded bg-gray-700 p-1 text-[10px] text-gray-400">Chat</div>
                <div className="mt-1 w-full rounded bg-gray-700 p-1 text-[10px] text-gray-400">...</div>
                <span className="mt-2 text-xs text-gray-400">AI</span>
              </div>
            </div>
            <Smartphone className="absolute -bottom-4 -right-4 h-24 w-24 text-gray-600/30 sm:h-32 sm:w-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
