import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 transition-colors duration-300 antialiased selection:bg-teal-200 selection:text-teal-900 dark:selection:bg-teal-900/50 dark:selection:text-teal-100">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
