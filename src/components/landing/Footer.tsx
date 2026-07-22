import { Globe, Mail, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import defaultLogoLight from '../../assets/default.png';
import defaultLogoDark from '../../assets/default-dark.png';

export function Footer() {
  return (
    <footer className="border-t border-app-border bg-app-surface py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src={defaultLogoLight} alt="Resumagic" className="h-8 logo-light" />
                <img src={defaultLogoDark} alt="Resumagic" className="h-8 logo-dark" />
            </div>
            <p className="text-sm text-app-text-secondary leading-relaxed mb-6">
              The intelligent productivity platform for modern professionals. Build resumes, cover letters, and PDFs that stand out.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full border border-app-border flex items-center justify-center text-app-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-app-border flex items-center justify-center text-app-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-app-border flex items-center justify-center text-app-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-app-text mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/build" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">AI Resume Writer</Link></li>
              <li><Link to="/editor" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">PDF Canvas Editor</Link></li>
              <li><Link to="/wizard" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">AI Wizard Builder</Link></li>
              <li><Link to="/resources/blog" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">ATS Optimization</Link></li>
              <li><Link to="/dashboard?tab=templates" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Templates Gallery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-app-text mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><Link to="/resources/blog" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Career Blog</Link></li>
              <li><Link to="/resources/interview-guide" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Interview Guide</Link></li>
              <li><Link to="/resources/examples" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Resume Examples</Link></li>
              <li><Link to="/resources/help" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Help Center</Link></li>
              <li><Link to="/status" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">System Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-app-text mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Careers</Link></li>
              <li><Link to="/privacy" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-sm text-app-text-secondary hover:text-brand-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-app-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-app-text-muted">
            &copy; {new Date().getFullYear()} Resumagic. All rights reserved.
          </p>
          <p className="text-sm text-app-text-muted flex items-center gap-1.5">
            Designed with <Heart className="w-4 h-4 text-brand-danger fill-brand-danger" /> for your career
          </p>
        </div>
      </div>
    </footer>
  );
}
