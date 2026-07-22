import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Testimonials } from '../components/landing/Testimonials';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
