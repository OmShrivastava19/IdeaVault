import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Zap, History, ChevronRight, Award, Box } from 'lucide-react';
import { Idea, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { signInWithGoogle } from '../lib/firebase';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  purchasedIdeas: Idea[];
  activities: any[];
  onIdeaClick: (idea: Idea) => void;
}

export default function ProfileView({ userProfile, purchasedIdeas, activities, onIdeaClick }: ProfileViewProps) {
  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Login to view your profile</h2>
        <button 
          onClick={signInWithGoogle}
          className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-orange-600 transition-all"
        >
          Login with Google
        </button>
      </div>
    );
  }

  const daysActive = userProfile.createdAt 
    ? Math.max(1, Math.ceil((Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalVotes = Object.values(userProfile.votedIdeas || {}).length;
  const totalImpact = (totalVotes * 10) + (purchasedIdeas.length * 150);
  
  let level = 'Newbie';
  if (totalImpact > 1000) level = 'Visionary';
  else if (totalImpact > 500) level = 'Expert';
  else if (totalImpact > 100) level = 'Innovator';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-rose-400" />
        <div className="px-8 pb-8">
          <div className="relative -mt-12 flex items-end justify-between mb-6">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg overflow-hidden">
              <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield size={14} /> Certified Innovator
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900">{userProfile.name}</h2>
            <p className="text-gray-500 font-medium font-mono text-xs mt-1">ID: {userProfile.id}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <StatCard icon={<Award size={18} />} label="Level" value={level} color="bg-purple-50 text-purple-600" />
            <StatCard icon={<Zap size={18} />} label="Impact" value={totalImpact.toString()} color="bg-orange-50 text-orange-600" />
            <StatCard icon={<Box size={18} />} label="Vault" value={purchasedIdeas.length.toString()} color="bg-blue-50 text-blue-600" />
            <StatCard icon={<History size={18} />} label="Days" value={daysActive.toString()} color="bg-emerald-50 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Box className="text-orange-500" size={20} />
              Your Private Vault
            </h3>
            {purchasedIdeas && purchasedIdeas.length > 0 ? (
              <div className="space-y-3">
                {purchasedIdeas.map(idea => (
                  <motion.div
                    key={idea.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onIdeaClick(idea)}
                    className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{idea.title}</h4>
                        <p className="text-xs text-gray-500">{idea.category} • Private</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                <div className="mb-4 text-gray-300 flex justify-center"><Box size={48} /></div>
                <p className="text-gray-400 font-medium">Your vault is empty. Start exploring!</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="text-orange-500" size={20} />
              Global Pulse
            </h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-gray-100">
               {activities && activities.length > 0 ? activities.slice(0, 8).map((act, i) => (
                 <ActivityItem 
                   key={act.id || i} 
                   text={act.text} 
                   time={act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'} 
                   type={act.type} 
                 />
               )) : (
                 <p className="text-xs text-gray-400 italic pl-8">Observing the market...</p>
               )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className={cn("p-4 rounded-2xl border border-transparent transition-all hover:shadow-md", color)}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-2xl font-black">{value}</span>
    </div>
  );
}

function ActivityItem({ text, time, type }: { text: string, time: string, type: string }) {
  return (
    <div className="pl-8 relative flex flex-col gap-1">
      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-orange-500 ring-4 ring-orange-50" />
      <p className="text-sm font-medium text-gray-700 leading-tight">{text}</p>
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{time}</span>
    </div>
  );
}
