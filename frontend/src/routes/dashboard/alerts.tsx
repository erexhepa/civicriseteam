import { createFileRoute } from '@tanstack/react-router';

function AlertsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Neighborhood Alerts</h1>
      <p className="mt-2 text-gray-400">
        See important updates affecting your ZIP code. Future: alerts list and filters.
      </p>
    </div>
  );
}

export const Route = createFileRoute('/dashboard/alerts')({
  head: () => ({
    meta: [{ title: 'Neighborhood Alerts – CivicRise' }],
  }),
  component: AlertsPage,
});
