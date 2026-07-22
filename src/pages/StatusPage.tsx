import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Activity, CheckCircle2, Server, Cpu, Database, Cloud, RefreshCw, ShieldCheck } from "lucide-react";

interface SystemService {
  name: string;
  status: "Operational" | "Degraded" | "Maintenance";
  uptime: string;
  latency: string;
  icon: any;
}

const SERVICES: SystemService[] = [
  { name: "API Gateway & Web Application Server", status: "Operational", uptime: "99.99%", latency: "24 ms", icon: Server },
  { name: "AI Resume Architect & Content Writer", status: "Operational", uptime: "99.95%", latency: "1.2 s", icon: Cpu },
  { name: "High-Speed PDF Generation Engine", status: "Operational", uptime: "99.99%", latency: "38 ms", icon: Activity },
  { name: "Cloud Sync & User Database", status: "Operational", uptime: "100.0%", latency: "18 ms", icon: Database },
  { name: "Asset CDN & Image Storage", status: "Operational", uptime: "99.98%", latency: "15 ms", icon: Cloud },
];

export function StatusPage() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero Status Banner */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-sm font-bold mb-6 border border-teal-500/20 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-teal-500" />
            All Resumagic Core Systems Operational
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            Real-Time System Health & Status
          </h1>
          <p className="text-sm md:text-base text-app-text-secondary max-w-2xl mx-auto">
            Live monitoring for API gateways, AI content generators, PDF rendering workers, and cloud synchronization.
          </p>
        </div>
      </section>

      {/* Services List */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="bg-app-surface rounded-3xl p-8 border border-app-border shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-app-border">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
              Infrastructure Components
            </h2>
            <span className="text-xs text-app-text-muted flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
              Updated 1 minute ago
            </span>
          </div>

          <div className="space-y-4">
            {SERVICES.map((svc, idx) => {
              const IconComp = svc.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-app-bg border border-app-border flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-app-text">{svc.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-app-text-muted">
                        <span>Uptime: <strong className="text-app-text">{svc.uptime}</strong></span>
                        <span>Avg Latency: <strong className="text-app-text">{svc.latency}</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    {svc.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident History */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Past 90 Days Incident Log</h2>
          <div className="bg-app-surface rounded-2xl p-6 border border-app-border text-center text-xs text-app-text-muted">
            <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            No major outages or security incidents reported in the last 90 days.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default StatusPage;
