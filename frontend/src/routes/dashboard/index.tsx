import { createFileRoute, Link } from '@tanstack/react-router';
import { MessageCircle, Camera, FileText, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const featureCards = [
  {
    to: '/dashboard/assistant',
    icon: MessageCircle,
    title: 'AI Assistant',
    description: 'Ask questions about city services.',
    button: 'Open Chat',
    iconColor: 'text-civic-icon-blue',
  },
  {
    to: '/dashboard/report',
    icon: Camera,
    title: 'Report an Issue',
    description: 'Take a photo & submit.',
    button: 'Report Now',
    iconColor: 'text-civic-icon-purple',
  },
  {
    to: '/dashboard/my-reports',
    icon: FileText,
    title: 'My Reports',
    description: 'Track your requests.',
    button: 'View All',
    iconColor: 'text-civic-icon-green',
  },
  {
    to: '/dashboard/alerts',
    icon: Bell,
    title: 'Alerts',
    description: 'Updates in your area.',
    button: 'View Alerts',
    iconColor: 'text-civic-icon-yellow',
  },
];

function DashboardHome() {
  const { user } = useAuth();
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-gray-400">
          {greeting()}, {user?.name ?? 'User'} 👋
        </p>
        <p className="mt-1 text-gray-500">How can we help you today?</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featureCards.map(({ to, icon: Icon, title, description, button, iconColor }) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border border-gray-700 bg-civic-card p-6 transition hover:border-gray-600"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${iconColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm text-gray-400">{description}</p>
            <span className="mt-4 inline-block text-sm font-medium text-civic-orange hover:underline">
              {button} →
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-700 bg-civic-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Tickets</h2>
            <Link to="/dashboard/my-reports" className="text-sm text-civic-orange hover:underline">
              View All
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="pb-2 font-medium">Ticket ID</th>
                  <th className="pb-2 font-medium">Issue</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-3">#14238</td>
                  <td className="py-3">Pothole on Main St</td>
                  <td className="py-3">
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400">
                      In Progress
                    </span>
                  </td>
                  <td className="py-3">2 hrs ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-xl border border-gray-700 bg-civic-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Neighborhood Updates</h2>
            <Link to="/dashboard/alerts" className="text-sm text-civic-orange hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center gap-3 rounded-lg border border-gray-700 p-3">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
              <span className="flex-1 text-sm text-gray-300">
                Sanitation delay tomorrow (ZIP {user?.zipCode ?? '36104'})
              </span>
              <span className="rounded bg-civic-orange/20 px-2 py-0.5 text-xs text-civic-orange">
                New
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/dashboard/')({
  head: () => ({
    meta: [{ title: 'Dashboard – CivicRise' }],
  }),
  component: DashboardHome,
});
