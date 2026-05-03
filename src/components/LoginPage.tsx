import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Shield, Zap, Target, Heart, Lightbulb } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { PrivacyPolicy, TermsOfService, Disclaimer, SecurityPolicy } from './LegalPages';

export default function LoginPage() {
  const currentYear = new Date().getFullYear();
  const [activeLegal, setActiveLegal] = useState<string | null>(null);

  if (activeLegal) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AnimatePresence mode="wait">
          {activeLegal === 'privacy' && <PrivacyPolicy onBack={() => setActiveLegal(null)} />}
          {activeLegal === 'terms' && <TermsOfService onBack={() => setActiveLegal(null)} />}
          {activeLegal === 'disclaimer' && <Disclaimer onBack={() => setActiveLegal(null)} />}
          {activeLegal === 'security' && <SecurityPolicy onBack={() => setActiveLegal(null)} />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements - Enhanced */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-orange-600/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-bounce duration-[10s]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 my-auto"
      >
        <div className="relative group">
          {/* Glassmorphic Card Sparkle */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 animate-gradient-x"></div>
          
          <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden">
            {/* Inner highlights */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            <div className="flex flex-col items-center text-center mb-10">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                className="w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/40 cursor-grab active:cursor-grabbing"
              >
                <Sparkles className="text-white" size={40} />
              </motion.div>
              <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">IdeaVault</h1>
              <p className="text-gray-400 text-lg font-medium leading-tight">
                Turn your boldest thoughts into <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">protected achievements.</span>
              </p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: <Shield size={18} />, text: 'Exclusive IP Registry', color: 'text-emerald-400' },
                  { icon: <Zap size={18} />, text: 'Instant Implementation', color: 'text-orange-400' },
                  { icon: <Target size={18} />, text: 'Market Readiness Score', color: 'text-purple-400' }
                ].map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    key={i} 
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-200 text-sm font-semibold hover:bg-white/10 transition-colors group/item"
                  >
                    <span className={item.color}>{item.icon}</span>
                    {item.text}
                    <div className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <ArrowRight size={14} className="text-gray-500" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={signInWithGoogle}
                className="group w-full py-5 px-6 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-orange-50 transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Continue with Google
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">
                Secure your spot in the <br/> future of innovation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Footer Section for Login Page */}
      <footer className="w-full mt-auto py-8 px-4 relative z-10 bg-gradient-to-t from-black to-transparent border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1 rounded-md text-white">
                <Lightbulb size={16} />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">IdeaVault</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10"></div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-none">
              © {currentYear} Om Shrivastava
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <button onClick={() => setActiveLegal('privacy')} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Privacy</button>
            <button onClick={() => setActiveLegal('terms')} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Terms</button>
            <button onClick={() => setActiveLegal('disclaimer')} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Disclaimer</button>
            <button onClick={() => setActiveLegal('security')} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Security</button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            <span>Built with</span>
            <Heart size={10} className="text-rose-500 fill-rose-500" />
            <span>in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


