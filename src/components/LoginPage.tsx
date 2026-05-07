import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Shield, Zap, Target, Heart, Lightbulb, Mail, Lock, User, Loader2 } from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  auth
} from '../lib/firebase';
import { PrivacyPolicy, TermsOfService, Disclaimer, SecurityPolicy } from './LegalPages';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const currentYear = new Date().getFullYear();
  const [activeLegal, setActiveLegal] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console. Please enable it in the "Sign-in method" tab.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset link sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  if (activeLegal) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-electric/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-navy/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-10 shadow-xl shadow-gray-200/50">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-navy/20">
              <Lightbulb className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-black text-navy mb-2 tracking-tight">IdeaVault</h1>
            <p className="text-slate font-medium">
              {isSignUp ? 'Create your creator account' : 'Welcome back to IdeaVault'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-6">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-lg text-navy font-bold hover:bg-gray-50 transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale" alt="Google" />
              Continue with Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate ml-1" htmlFor="email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric/20 focus:border-electric transition-all font-medium text-navy placeholder:text-gray-400"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate" htmlFor="password">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs font-bold text-electric hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric/20 focus:border-electric transition-all font-medium text-navy placeholder:text-gray-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-navy text-white rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#1a2b4a] transition-all duration-300 shadow-lg shadow-navy/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'Create Account' : 'Sign In')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-bold text-slate hover:text-navy transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>

        {/* Messaging points */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-electric">
                <Shield size={18} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-navy mb-1">Exclusive</h3>
              <p className="text-[10px] text-slate font-medium">Own your private copy</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-electric">
                <Target size={18} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-navy mb-1">Discovery</h3>
              <p className="text-[10px] text-slate font-medium">Find your next build</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-electric">
                <Zap size={18} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-navy mb-1">Scale</h3>
              <p className="text-[10px] text-slate font-medium">Turn ideas into assets</p>
            </div>
        </div>
      </motion.div>
      
      {/* Footer */}
      <footer className="w-full mt-auto py-8 px-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-navy p-1 rounded-md text-white">
                <Lightbulb size={14} />
              </div>
              <span className="text-navy font-bold text-sm tracking-tight">IdeaVault</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200"></div>
            <p className="text-slate text-[10px] font-bold uppercase tracking-widest leading-none">
              © 2026 Om Shrivastava. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <button onClick={() => setActiveLegal('privacy')} className="text-[10px] font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Privacy</button>
            <button onClick={() => setActiveLegal('terms')} className="text-[10px] font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Terms</button>
            <button onClick={() => setActiveLegal('disclaimer')} className="text-[10px] font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Disclaimer</button>
            <button onClick={() => setActiveLegal('security')} className="text-[10px] font-bold uppercase tracking-widest text-slate hover:text-navy transition-colors">Security</button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate font-bold uppercase tracking-widest">
            <span>Built for Builders</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


