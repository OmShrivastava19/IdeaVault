import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, ArrowBigUp, ArrowBigDown, Lock, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Idea } from '../types';
import { cn } from '../lib/utils';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
  onVote: (vote: number) => void;
  userVote?: number;
  isPurchased?: boolean;
}

export default function IdeaCard({ idea, onClick, onVote, userVote, isPurchased }: IdeaCardProps) {
  // Generate a sophisticated background based on category
  const getAccentStyle = (cat: string) => {
    const styles: Record<string, { bg: string, text: string, decoration: string }> = {
      'SaaS': { bg: 'from-blue-600 to-indigo-700', text: 'text-blue-100', decoration: 'bg-blue-400/20' },
      'AI': { bg: 'from-purple-600 to-fuchsia-700', text: 'text-purple-100', decoration: 'bg-purple-400/20' },
      'E-commerce': { bg: 'from-pink-600 to-rose-700', text: 'text-pink-100', decoration: 'bg-pink-400/20' },
      'Fintech': { bg: 'from-emerald-600 to-teal-700', text: 'text-emerald-100', decoration: 'bg-emerald-400/20' },
      'Health': { bg: 'from-red-600 to-orange-700', text: 'text-red-100', decoration: 'bg-red-400/20' },
      'Web3': { bg: 'from-indigo-600 to-violet-700', text: 'text-indigo-100', decoration: 'bg-indigo-400/20' },
      'B2B': { bg: 'from-slate-700 to-slate-900', text: 'text-slate-100', decoration: 'bg-slate-400/10' },
      'Marketing': { bg: 'from-orange-500 to-amber-600', text: 'text-orange-100', decoration: 'bg-orange-400/20' },
      'Default': { bg: 'from-orange-600 to-red-600', text: 'text-orange-100', decoration: 'bg-orange-400/20' }
    };
    return styles[cat] || styles['Default'];
  };

  const style = getAccentStyle(idea.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative group bg-white rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      {/* Visual Header / Pin Thumbnail */}
      <div className={cn("h-44 relative flex items-center justify-center overflow-hidden bg-gradient-to-br transition-all duration-500 group-hover:scale-105", style.bg)}>
        {/* Animated Background Decoration */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className={cn("absolute -right-10 -top-10 w-40 h-40 rounded-[2rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity", style.decoration)}
        />
        
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex gap-2">
            <span className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
              {idea.category}
            </span>
            {idea.isTrending && (
               <span className="bg-yellow-400 text-yellow-950 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                <TrendingUp size={10} /> Trending
              </span>
            )}
          </div>
          
          {idea.status === 'private' ? (
             <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm flex items-center gap-1">
              <Lock size={10} /> Exclusive
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1">
                <Sparkles size={10} className="text-orange-500" /> ₹{idea.price}
              </span>
              {idea.anchorPrice && (
                 <span className="text-[10px] font-bold text-white/60 line-through mr-1">₹{idea.anchorPrice}</span>
              )}
            </div>
          )}
        </div>

        <div className="text-white text-center p-8 relative z-10">
          <h3 className="font-black text-2xl leading-[1.1] line-clamp-2 drop-shadow-2xl tracking-tight transition-transform group-hover:scale-105 duration-300">
            {idea.title}
          </h3>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-end justify-center p-8 translate-y-4 group-hover:translate-y-0">
            <button className="w-full bg-white text-gray-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:bg-orange-50 active:scale-95 transition-all">
              {isPurchased || idea.status === 'private' ? 'Open Vault' : 'Secure Access'}
              <Sparkles size={14} className="text-orange-500" />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60", style.bg.split(' ')[0].replace('from-', 'text-'))}>
          {idea.tagline}
        </p>
        <p className="text-gray-600 text-sm line-clamp-3 mb-6 leading-relaxed font-medium">
          {idea.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-2xl">
            <button
              onClick={(e) => { e.stopPropagation(); onVote(1); }}
              className={cn("p-1.5 rounded-xl transition-all", userVote === 1 ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-orange-500 hover:bg-white')}
            >
              <ArrowBigUp size={22} fill={userVote === 1 ? "currentColor" : "none"} />
            </button>
            <span className="text-sm font-black text-gray-800 min-w-[2ch] px-1 text-center">{idea.votes}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onVote(-1); }}
              className={cn("p-1.5 rounded-xl transition-all", userVote === -1 ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-white')}
            >
              <ArrowBigDown size={22} fill={userVote === -1 ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="flex gap-2">
             {idea.techStack.slice(0, 2).map((tech) => (
                <span key={tech} className="bg-gray-50 border border-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg">
                  {tech}
                </span>
             ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
