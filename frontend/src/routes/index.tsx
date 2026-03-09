import { createFileRoute } from '@tanstack/react-router';
import { Navbar, HeroSection, FeaturesOverview, HowItWorks, Footer } from '../components';

function LandingPage() {
  return (
    <div className="min-h-screen bg-civic-navy">
      <Navbar />
      <main id="main-content" aria-label="Main content">
        <HeroSection />
        <FeaturesOverview />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'CivicRise – AI Copilot for Montgomery Citizens' }],
  }),
  component: LandingPage,
});
