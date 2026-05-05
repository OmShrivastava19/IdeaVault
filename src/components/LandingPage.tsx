import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Shield, Zap, Target, ArrowRight, Lightbulb, Users, BarChart3, Globe, Rocket } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-electric/10 selection:text-electric">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-electric/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-navy/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-navy/5 border border-navy/10 rounded-full text-navy text-xs font-black uppercase tracking-widest mb-8"
            >
              <Sparkles size={14} className="text-electric" />
              The Idea Marketplace for Creators
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl sm:text-7xl lg:text-8xl font-black text-navy leading-[0.9] tracking-tighter mb-8"
            >
              Acquire AI ideas.<br />
              <span className="text-electric italic font-serif">Build the future.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
            >
              The world's first AI-generated innovation marketplace. Discover unique project concepts, acquire exclusive ownership, and unlock expert implementation roadmaps instantly.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-navy text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-[#1a2b4a] transition-all shadow-xl shadow-navy/20 flex items-center justify-center gap-2 group"
              >
                Enter the Marketplace
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-navy rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                How it works
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-4xl lg:text-5xl font-black text-navy mb-8 leading-tight tracking-tight">
                From AI spark to <br /><span className="text-electric italic font-serif">exclusive asset.</span>
              </h2>
              <div className="space-y-12">
                {[
                  { 
                    icon: <Sparkles size={24} />, 
                    title: 'AI-Powered Discovery', 
                    desc: 'Our engine constantly generates high-potential project concepts with deep tech stacks and market angles.' 
                  },
                  { 
                    icon: <Globe size={24} />, 
                    title: 'The Marketplace', 
                    desc: 'Browse the public vault. Use community votes and market scores to find concepts before they disappear.' 
                  },
                  { 
                    icon: <Shield size={24} />, 
                    title: 'Exclusive Ownership', 
                    desc: 'Once you acquire an idea, it is removed from the public marketplace. You get exclusive access to the private roadmap and technical blueprints.' 
                  }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-electric shadow-sm border border-gray-100">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-navy mb-2">{step.title}</h3>
                      <p className="text-slate font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="bg-navy rounded-[2rem] p-4 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-electric/20 to-transparent pointer-events-none" />
                  <div className="bg-[#050505] rounded-[1.5rem] p-8 aspect-square flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="h-4 w-1/3 bg-gray-800 rounded-full" />
                        <div className="h-12 w-full bg-navy/50 border border-white/5 rounded-xl flex items-center px-4 gap-3">
                           <div className="w-2 h-2 rounded-full bg-electric animate-pulse" />
                           <div className="h-2 w-1/2 bg-gray-700 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="h-24 bg-navy/30 border border-white/5 rounded-xl" />
                           <div className="h-24 bg-navy/30 border border-white/5 rounded-xl" />
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                           {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800" />)}
                        </div>
                        <div className="px-4 py-2 bg-electric rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                           Live Market Data
                        </div>
                     </div>
                  </div>
               </div>
               {/* Floating elements */}
               <div className="absolute -top-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 rotate-6 hidden sm:block">
                  <Target className="text-electric mb-2" size={24} />
                  <p className="text-[10px] font-black text-navy uppercase tracking-widest">Market Fit</p>
                  <p className="text-xl font-black text-navy">Verified</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-electric rounded-[3rem] p-12 lg:p-20 text-white text-center relative overflow-hidden shadow-2xl shadow-electric/40">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_white_1px,_transparent_0)] bg-[size:32px_32px] opacity-10" />
             <div className="relative z-10">
                <h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter">Own your next <br /> big project today.</h2>
                <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12 font-medium">Join innovators who are acquiring pre-vetted AI concepts to build faster.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={onLogin}
                    className="w-full sm:w-auto px-10 py-5 bg-white text-navy rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 transition-transform"
                  >
                    Enter the Marketplace
                  </button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="bg-navy p-2 rounded-xl text-white">
                  <Lightbulb size={24} />
               </div>
               <span className="text-2xl font-black text-navy tracking-tight uppercase">IdeaVault</span>
            </div>
            <div className="flex items-center gap-8">
               <button onClick={onLogin} className="text-xs font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Login</button>
               <button onClick={onLogin} className="text-xs font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Privacy</button>
               <button onClick={onLogin} className="text-xs font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Terms</button>
            </div>
            <p className="text-slate text-[10px] font-black uppercase tracking-[0.2em]">© 2026 Om Shrivastava. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
