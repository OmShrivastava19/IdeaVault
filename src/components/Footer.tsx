import React from 'react';
import { Github, Twitter, Linkedin, Heart, Lightbulb } from 'lucide-react';

interface FooterProps {
  onNavigate?: (view: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand and Copyright */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-navy p-1.5 rounded-lg text-white">
                <Lightbulb size={20} />
              </div>
              <span className="text-xl font-black tracking-tighter text-navy uppercase">IdeaVault</span>
            </div>
            <p className="text-slate text-sm max-w-sm mb-6 font-medium leading-relaxed">
              The professional marketplace for creators to secure, evolve, and execute high-potential project concepts.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/OmShrivastava19/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-lg text-slate hover:text-electric transition-all">
                <Github size={18} />
              </a>
              <a href="https://www.linkedin.com/in/omshrivastava/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-lg text-slate hover:text-electric transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Policy Links */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onNavigate?.('legal-privacy')} className="text-xs font-bold text-slate hover:text-navy transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate?.('legal-terms')} className="text-xs font-bold text-slate hover:text-navy transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigate?.('legal-disclaimer')} className="text-xs font-bold text-slate hover:text-navy transition-colors">Disclaimer</button></li>
              <li><button onClick={() => onNavigate?.('legal-security')} className="text-xs font-bold text-slate hover:text-navy transition-colors">Data Security</button></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy mb-6">Connect</h4>
            <ul className="space-y-4">
              <li><a href="https://www.linkedin.com/in/omshrivastava/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate hover:text-navy transition-colors">Follow on LinkedIn</a></li>
              <li><a href="https://github.com/OmShrivastava19/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate hover:text-navy transition-colors">Source Code</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-gray-400">
            © {currentYear} Om Shrivastava. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <span>Built with</span>
            <Heart size={12} className="text-rose-500 fill-rose-500" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

