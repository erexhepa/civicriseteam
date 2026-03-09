import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconColor?: string;
}

export function FeatureCard({ icon, title, description, iconColor = 'text-civic-orange' }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-civic-card p-6 transition hover:border-gray-600">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${iconColor}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  );
}
