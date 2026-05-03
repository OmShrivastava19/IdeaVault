import React from 'react';
import { Lightbulb, Bookmark, User, Bell, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { LogIn, LogOut } from 'lucide-react';
import { auth, signInWithGoogle } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface NavbarProps {
  onSearch: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ onSearch, activeTab, setActiveTab }: NavbarProps) {
  const [user] = useAuthState(auth);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="bg-orange-500 p-1.5 rounded-lg text-white"
            >
              <Lightbulb size={24} />
            </motion.div>
            <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">IdeaVault</span>
          </div>

          <div className="flex-1 max-w-md mx-8 group relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search concepts, tech, categories..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-4 font-medium text-sm text-gray-600">
             <NavButton
              active={activeTab === 'explore'}
              onClick={() => setActiveTab('explore')}
              icon={<Search size={20} />}
              label="Explore"
            />
            {user && (
              <>
                <NavButton
                  active={activeTab === 'saved'}
                  onClick={() => setActiveTab('saved')}
                  icon={<Bookmark size={20} />}
                  label="Saved"
                />
                <NavButton
                  active={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  icon={<User size={20} />}
                  label="Profile"
                />
              </>
            )}
            
            <div className="relative">
              <button
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  "p-2 rounded-full transition-all relative",
                  activeTab === 'notifications' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-orange-500'
                )}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
              </button>
            </div>

            {user ? (
              <button
                onClick={() => auth.signOut()}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-sm transition-all text-sm"
              >
                <LogIn size={18} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
        active
          ? 'bg-orange-50 text-orange-600'
          : 'hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}
