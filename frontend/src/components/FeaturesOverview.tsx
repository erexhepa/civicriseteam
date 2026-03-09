import { MessageCircle, Camera, ListChecks, Bell } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    icon: <MessageCircle className="h-6 w-6 text-civic-icon-blue" />,
    title: 'Ask the AI Assistant',
    description: 'Find city services & programs.',
    iconColor: 'text-civic-icon-blue',
  },
  {
    icon: <Camera className="h-6 w-6 text-civic-icon-purple" />,
    title: 'Report an Issue',
    description: 'Snap a photo & submit.',
    iconColor: 'text-civic-icon-purple',
  },
  {
    icon: <ListChecks className="h-6 w-6 text-civic-icon-green" />,
    title: 'Track Your Requests',
    description: 'See progress in real time.',
    iconColor: 'text-civic-icon-green',
  },
  {
    icon: <Bell className="h-6 w-6 text-civic-icon-pink" />,
    title: 'Neighborhood Alerts',
    description: 'Get updates that matter.',
    iconColor: 'text-civic-icon-pink',
  },
];

export function FeaturesOverview() {
  return (
    <section id="services" className="bg-civic-charcoal px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Key Features</h2>
        <p className="mt-2 text-gray-400">Everything you need to engage with your city.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
              iconColor={f.iconColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
