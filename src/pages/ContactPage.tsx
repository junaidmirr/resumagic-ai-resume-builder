import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Mail, MessageSquare, Phone, MapPin, CheckCircle2, Send, Clock, Sparkles } from "lucide-react";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6">
            <Mail className="w-4 h-4" />
            Get in Touch with Our Team
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            We'd Love to Hear From You
          </h1>
          <p className="text-lg md:text-xl text-app-text-secondary max-w-3xl mx-auto leading-relaxed">
            Have questions about AI Architect 2.0, enterprise licensing, or technical integration? Send us a message.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div>
            <h2 className="text-2xl font-black mb-6">Contact Information</h2>
            <p className="text-sm text-app-text-secondary leading-relaxed mb-8">
              Whether you need technical support or want to learn more about our vector PDF engine, our engineering support team is here to assist.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-app-surface border border-app-border">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-app-text">Email Us</h3>
                  <p className="text-xs text-app-text-secondary mt-0.5">support@resumagic.ai</p>
                  <p className="text-xs text-app-text-muted mt-1">Average response time: &lt; 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-app-surface border border-app-border">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-app-text">Support Hours</h3>
                  <p className="text-xs text-app-text-secondary mt-0.5">Monday – Friday: 24 Hours</p>
                  <p className="text-xs text-app-text-secondary">Saturday – Sunday: 9:00 AM – 6:00 PM EST</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-app-surface border border-app-border">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-app-text">Global Headquarters</h3>
                  <p className="text-xs text-app-text-secondary mt-0.5">500 Howard Street, Suite 400</p>
                  <p className="text-xs text-app-text-secondary">San Francisco, CA 94105, USA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-app-surface rounded-3xl p-8 border border-app-border shadow-xl">
            <h3 className="text-xl font-bold mb-6">Send Us a Message</h3>

            {submitted ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <h4 className="font-bold text-lg mb-1">Message Sent Successfully!</h4>
                <p className="text-xs text-app-text-secondary">Thank you for reaching out. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1">Your Name</label>
                    <input type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-sm" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Email Address</label>
                    <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-sm" required />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Subject</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-sm">
                    <option>Technical Support</option>
                    <option>AI Architect Inquiry</option>
                    <option>Enterprise & Team Billing</option>
                    <option>Feature Request</option>
                    <option>General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Message</label>
                  <textarea rows={5} placeholder="How can we help you?" className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-sm" required />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
