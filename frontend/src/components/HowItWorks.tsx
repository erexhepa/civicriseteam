import { UserPlus, MessageSquare, Bell } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up with your email and ZIP code.',
  },
  {
    icon: MessageSquare,
    title: 'Ask or Report',
    description: 'Use the AI assistant or submit an issue with a photo.',
  },
  {
    icon: Bell,
    title: 'Track & Receive Alerts',
    description: 'Follow progress and get neighborhood updates.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-civic-navy px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">How It Works</h2>
        <p className="mt-2 text-gray-400">Three simple steps to get started.</p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-civic-orange bg-civic-card text-civic-orange">
                <step.icon className="h-7 w-7" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-civic-orange">Step {i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute top-7 left-[60%] hidden h-0.5 w-[80%] bg-gray-600 sm:block" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
