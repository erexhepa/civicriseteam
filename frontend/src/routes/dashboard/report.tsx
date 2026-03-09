import { createFileRoute } from '@tanstack/react-router';

function ReportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
      <p className="mt-2 text-gray-400">
        Submit problems like potholes, trash, or streetlight outages. Future: photo upload and form.
      </p>
    </div>
  );
}

export const Route = createFileRoute('/dashboard/report')({
  head: () => ({
    meta: [{ title: 'Report Issue – CivicRise' }],
  }),
  component: ReportPage,
});
