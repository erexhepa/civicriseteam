import { createFileRoute } from '@tanstack/react-router';

function MyReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">My Reports</h1>
      <p className="mt-2 text-gray-400">
        Track service requests you submitted. Future: ticket list and status.
      </p>
    </div>
  );
}

export const Route = createFileRoute('/dashboard/my-reports')({
  head: () => ({
    meta: [{ title: 'My Reports – CivicRise' }],
  }),
  component: MyReportsPage,
});
