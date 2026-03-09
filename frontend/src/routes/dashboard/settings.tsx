import { createFileRoute } from '@tanstack/react-router';

function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-2 text-gray-400">
        Manage your account and preferences. Future: profile and notification settings.
      </p>
    </div>
  );
}

export const Route = createFileRoute('/dashboard/settings')({
  head: () => ({
    meta: [{ title: 'Settings – CivicRise' }],
  }),
  component: SettingsPage,
});
