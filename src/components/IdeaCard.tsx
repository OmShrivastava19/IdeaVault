import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, ArrowBigUp, ArrowBigDown, Lock, ShieldCheck, Sparkles, TrendingUp, ArrowRight, X } from 'lucide-react';
import { Idea } from '../types';
import { cn } from '../lib/utils';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
  onVote: (vote: number) => void;
  onDelete?: () => void;
  userVote?: number;
  isPurchased?: boolean;
  className?: string;
}

export default function IdeaCard({ idea, onClick, onVote, onDelete, userVote, isPurchased, className }: IdeaCardProps) {
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("relative group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full hover:border-electric transition-colors", className)}
      onClick={onClick}
    >
      {/* Visual Header */}
      <div className={cn("h-40 relative flex items-center justify-center overflow-hidden bg-gray-50 transition-all duration-500", style.bg)}>
        <div className="absolute inset-0 bg-navy opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-electric/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
          <div className="flex gap-2">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white">
              {idea.category}
            </span>
            {idea.isTrending && (
               <span className="bg-electric text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-electric/20">
                <TrendingUp size={10} /> Hot
              </span>
            )}
          </div>
          
          {idea.status === 'private' ? (
             <span className="bg-white/10 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1">
              <Lock size={10} /> Exclusive
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <span className="bg-white text-navy px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1">
                ₹{idea.price}
              </span>
            </div>
          )}
        </div>

        <div className="text-white text-center p-6 relative z-10 w-full">
          <h3 className="font-black text-xl leading-tight line-clamp-2 tracking-tight">
            {idea.title}
          </h3>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center p-6 translate-y-4 group-hover:translate-y-0 z-30">
            <button className="w-full bg-electric text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl shadow-electric/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
              {isPurchased || idea.status === 'private' ? 'Open Vault' : 'Secure Concept'}
              <ArrowRight size={14} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-electric mb-2">
          {idea.tagline}
        </p>
        <p className="text-slate text-xs line-clamp-3 mb-6 leading-relaxed font-medium">
          {idea.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg">
            <button
              onClick={(e) => { e.stopPropagation(); onVote(1); }}
              className={cn("p-1 rounded transition-all", userVote === 1 ? 'bg-white text-electric shadow-sm' : 'text-slate hover:text-navy hover:bg-white')}
            >
              <ArrowBigUp size={20} fill={userVote === 1 ? "currentColor" : "none"} />
            </button>
            <span className="text-[10px] font-black text-navy min-w-[2ch] px-1 text-center">{idea.votes}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onVote(-1); }}
              className={cn("p-1 rounded transition-all", userVote === -1 ? 'bg-white text-red-500 shadow-sm' : 'text-slate hover:text-red-500 hover:bg-white')}
            >
              <ArrowBigDown size={20} fill={userVote === -1 ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="flex gap-1.5">
              {(idea.techStack || []).slice(0, 2).map((tech) => (
                <span key={tech} className="text-slate text-[9px] font-bold uppercase tracking-tight">
                  #{(tech || "").toLowerCase()}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Admin Delete Action */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (window.confirm('⚠️ WARNING: This will permanently remove this concept from the vault. Proceed?')) {
              onDelete();
            }
          }}
          className="absolute top-2 right-2 z-[9999] p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 shadow-2xl hover:scale-110 active:scale-95 flex items-center justify-center pointer-events-auto"
          title="Delete Concept"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
