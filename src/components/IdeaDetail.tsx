import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import LZString from 'lz-string';
import { 
  X, Lock, Unlock, CreditCard, ChevronRight, CheckCircle2, Bookmark, Github, 
  ExternalLink, ShieldCheck, Zap, Info, RefreshCw, TrendingUp, Clock, 
  AlertCircle, ShoppingBag, Loader2, Calendar, Code, FileText, Sparkles,
  Trophy, Download, Share2, Medal, UserCheck, Star, AppWindow, Database, Server,
  Network, Compass, BarChart3, Rocket, Settings, FolderTree, Terminal
} from 'lucide-react';
import { Idea, UserProfile } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

import { db, auth } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, setDoc, collection } from 'firebase/firestore';

interface IdeaDetailProps {
  idea: Idea;
  onClose: () => void;
  onPurchase: (id: string) => void;
  onRemix: (baseIdea: Idea, params?: { targetMarket: string; directive: string }) => void;
  isPurchased: boolean;
  userProfile: UserProfile | null;
  onFavorite: (id: string) => void;
  onViewIncrease?: (id: string) => void;
  onStartBooster: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BOILERPLATE_MAP: Record<string, string> = {
  'React': 'https://github.com/facebook/create-react-app',
  'Next.js': 'https://github.com/vercel/next.js/tree/canary/examples/hello-world',
  'Tailwind': 'https://github.com/tailwindlabs/tailwindcss-setup-examples',
  'Node.js': 'https://github.com/nodejs/node',
  'Python': 'https://github.com/realpython/python-guide',
  'TypeScript': 'https://github.com/microsoft/TypeScript',
  'Firebase': 'https://github.com/firebase/quickstart-js',
  'AI': 'https://github.com/google-gemini/cookbook',
  'Blockchain': 'https://github.com/ethereum/solidity'
};

export default function IdeaDetail({ idea, onClose, onPurchase, onRemix, isPurchased, userProfile, onFavorite, onViewIncrease, onStartBooster }: IdeaDetailProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'roadmap' | 'boilerplate' | 'certificate'>('blueprint');
  const [roadmap, setRoadmap] = useState<string | null>(idea.roadmap || null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [purchasedJustNow, setPurchasedJustNow] = useState(false);

  useEffect(() => {
    if (isPurchased && !purchasedJustNow) {
       setActiveTab('blueprint');
    }
  }, [isPurchased]);

  const celebrate = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f97316', '#fbbf24', '#ffffff']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#fbbf24', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const [remixParams, setRemixParams] = useState({ targetMarket: '', directive: '' });
  const [showRemixInput, setShowRemixInput] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportCertificate = async () => {
    if (!certificateRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(certificateRef.current, { cacheBust: true, quality: 1, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `IdeaVault-Certificate-${idea.title.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const shareAchievement = async () => {
    const shareData = {
      title: 'IdeaVault Achievement',
      text: `I just secured exclusive rights to "${idea.title}" on IdeaVault! Check out this concept.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handlePurchaseClick = () => {
    if (!userProfile) {
      alert("Please login to purchase.");
      return;
    }
    setShowConfirm(true);
  };

  const handleRemixClick = () => {
    if (!userProfile) {
      alert("Please login to remix.");
      return;
    }
    setShowRemixInput(true);
  };

  const submitRemix = () => {
    onRemix(idea, remixParams);
    setShowRemixInput(false);
  };

  const isFavorite = userProfile?.favorites.includes(idea.id) || false;

  useEffect(() => {
    if (onViewIncrease) {
      onViewIncrease(idea.id);
    }
  }, [idea.id]);

  const generateRoadmap = async () => {
    if (roadmap || generatingRoadmap) return;
    setGeneratingRoadmap(true);
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Create a highly tactical 30-day execution roadmap for the startup idea: "${idea.title}".
      Tech Stack: ${idea.techStack.join(', ')}.
      Format as a clear day-by-day markdown list (Day 1-30). 
      Break it into phases: Week 1 (MVP Setup), Week 2 (Core Build), Week 3 (Beta Testing), Week 4 (Feedback & Launch Prep).
      Be extremely practical about Indian market entry if applicable.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });

      const generated = result.text || "Failed to generate roadmap.";
      setRoadmap(generated);
      setRoadmapError(null);
      
      // Save to Firestore
      const ideaRef = doc(db, 'ideas', idea.id);
      await updateDoc(ideaRef, { roadmap: generated });
    } catch (err: any) {
      console.error("Roadmap generation failed:", err);
      if (err?.message?.includes('RESOURCE_EXHAUSTED')) {
        setRoadmapError("The AI engine has reached its monthly quota. Please try again later or check our static resources.");
      } else {
        setRoadmapError("Brainstorming session failed. Our neural link is slightly unstable. Please try again.");
      }
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleOpenReplit = () => {
    const basePrompt = `Design and build a professional, full-stack web application titled "${idea.title}".
Context: ${idea.tagline}.
Category: ${idea.category}.
Tech Stack Requirements: ${idea.techStack.join(", ")}.
Key Features to Implement:
${idea.features.map(f => `- ${f}`).join('\n')}

Architectural Direction: Use a modern modular structure with a separation of concerns (src/components, src/hooks, src/services, etc.). Ensure mobile responsiveness and a polished UI using Tailwind CSS. 
The application should include essential boilerplate like environment config (.env), standard .gitignore, and a detailed README.md explaining the setup and features.
Make it production-ready.`;

    const compressedPrompt = LZString.compressToEncodedURIComponent(basePrompt);
    const replitUrl = `https://replit.com/?stack=Build&prompt=${compressedPrompt}`;
    window.open(replitUrl, '_blank');
  };

  const getBoilerplates = () => {
    return idea.techStack
      .map(tech => ({ tech, url: BOILERPLATE_MAP[tech] }))
      .filter(b => b.url);
  };

  const triggerPurchase = async () => {
    if (!userProfile) {
      alert("Please login to purchase.");
      return;
    }
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded. Please check your internet connection.");
      return;
    }

    setShowConfirm(false);
    setPurchasing(true);
    try {
      // Handle Free Ideas
      if (idea.price === 0) {
        const ideaRef = doc(db, 'ideas', idea.id);
        const userRef = doc(db, 'users', userProfile.id);

        await updateDoc(ideaRef, {
          status: 'private',
          acquiredBy: userProfile.id
        });

        await updateDoc(userRef, {
          purchasedIdeas: arrayUnion(idea.id)
        });

        // Log Activity
        const activityRef = doc(collection(db, 'activities'));
        await setDoc(activityRef, {
          id: activityRef.id,
          type: "purchase",
          text: `🔐 ${userProfile.name} just secured exclusive rights: ${idea.title}`,
          timestamp: new Date().toISOString()
        });

        setPurchasing(false);
        setPurchasedJustNow(true);
        setActiveTab('certificate');
        onPurchase(idea.id);
        celebrate();
        return;
      }

      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded. Please check your internet connection.");
        setPurchasing(false);
        return;
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id })
      });
      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "IdeaVault",
        description: `Acquire exclusive rights to ${idea.title}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                ideaId: idea.id,
                userId: userProfile.id
              })
            });

            if (verifyRes.ok) {
              // Now update Firestore - Secure because rule checks acquiredBy == auth.uid
              const ideaRef = doc(db, 'ideas', idea.id);
              const userRef = doc(db, 'users', userProfile.id);

              await updateDoc(ideaRef, {
                status: 'private',
                acquiredBy: userProfile.id
              });

              await updateDoc(userRef, {
                purchasedIdeas: arrayUnion(idea.id)
              });

              // Log Activity
              const activityRef = doc(collection(db, 'activities'));
              await setDoc(activityRef, {
                id: activityRef.id,
                type: "purchase",
                text: `💎 Premium concept vaulted by ${userProfile.name}: ${idea.title}`,
                timestamp: new Date().toISOString()
              });

              setPurchasedJustNow(true);
              setActiveTab('certificate');
              onPurchase(idea.id);
              celebrate();
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
          } finally {
            setPurchasing(false);
          }
        },
        prefill: {
          name: userProfile.name,
          email: userProfile.email,
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: function() {
            setPurchasing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      setPurchasing(false);
    }
  };

  const downloadArchitectureSVG = () => {
    const svgContent = `
<svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="800" height="600" rx="40" fill="#F9FAFB"/>
<rect x="50" y="50" width="700" height="500" rx="30" fill="white" stroke="#E5E7EB" stroke-width="2"/>

<!-- Cloud / Edge -->
<rect x="100" y="100" width="150" height="80" rx="12" fill="#FFF7ED" stroke="#FB923C" stroke-width="2"/>
<text x="175" y="145" text-anchor="middle" fill="#9A3412" font-family="sans-serif" font-weight="bold" font-size="14">Edge Nodes</text>

<!-- API Gateway -->
<rect x="325" y="100" width="150" height="80" rx="12" fill="#F5F3FF" stroke="#A78BFA" stroke-width="2"/>
<text x="400" y="145" text-anchor="middle" fill="#5B21B6" font-family="sans-serif" font-weight="bold" font-size="14">API Gateway</text>

<!-- Services -->
<rect x="100" y="250" width="150" height="100" rx="12" fill="#ECFDF5" stroke="#34D399" stroke-width="2"/>
<text x="175" y="305" text-anchor="middle" fill="#065F46" font-family="sans-serif" font-weight="bold" font-size="14">Core Engine</text>

<rect x="325" y="250" width="150" height="100" rx="12" fill="#ECFDF5" stroke="#34D399" stroke-width="2"/>
<text x="400" y="305" text-anchor="middle" fill="#065F46" font-family="sans-serif" font-weight="bold" font-size="14">Auth Service</text>

<rect x="550" y="250" width="150" height="100" rx="12" fill="#ECFDF5" stroke="#34D399" stroke-width="2"/>
<text x="625" y="305" text-anchor="middle" fill="#065F46" font-family="sans-serif" font-weight="bold" font-size="14">Data Pipeline</text>

<!-- Database -->
<path d="M325 450 C325 430 475 430 475 450 L475 510 C475 530 325 530 325 510 Z" fill="#EFF6FF" stroke="#60A5FA" stroke-width="2"/>
<ellipse cx="400" cy="450" rx="75" ry="20" fill="#DBEAFE" stroke="#60A5FA" stroke-width="2"/>
<text x="400" y="495" text-anchor="middle" fill="#1E40AF" font-family="sans-serif" font-weight="bold" font-size="14">Firestore DB</text>

<!-- Connections -->
<path d="M250 140 L325 140" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4 4"/>
<path d="M400 180 L400 250" stroke="#CBD5E1" stroke-width="2"/>
<path d="M175 180 L175 250" stroke="#CBD5E1" stroke-width="2"/>
<path d="M400 350 L400 430" stroke="#CBD5E1" stroke-width="2"/>

<text x="400" y="570" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="12" font-style="italic">Generated for: ${idea.title}</text>
</svg>
    `.trim();

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${idea.title.replace(/\s+/g, '-').toLowerCase()}-architecture.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 z-10 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="relative h-64 bg-navy overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-electric to-navy" />
             <div className="relative text-center px-8">
                <span className="inline-block bg-white/10 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-white/20">
                  {idea.category}
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-2 drop-shadow-xl tracking-tight">
                  {idea.title}
                </h1>
                <p className="text-sm sm:text-lg text-white/70 font-medium italic">"{idea.tagline}"</p>
             </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Compass className="text-electric" size={20} />
                    Market Angles
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(idea.marketAngles || [
                      "Position as a productivity tool for remote managers.",
                      "Target early-stage startups needing rapid prototyping.",
                      "Market as a secondary asset for established SaaS companies."
                    ]).map((angle, i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                         <div className="w-5 h-5 rounded-full bg-electric/10 text-electric flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-black">{i + 1}</span>
                         </div>
                         <p className="text-xs font-medium text-slate">{angle}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-navy">
                    <BarChart3 className="text-electric" size={20} />
                    The Opportunity
                  </h2>
                  <p className="text-slate text-sm font-medium leading-relaxed">
                    This concept bridges a critical gap in the {idea.category} market by leveraging {idea.techStack.join(', ')}. The primary value proposition lies in its ability to {idea.tagline.toLowerCase()}.
                  </p>
                </section>

                {isPurchased ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {isPurchased && (
                       <div className="bg-navy rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
                          <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck size={20} className="text-electric" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-electric">Vault Owner Access</span>
                             </div>
                             <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Access Granted.</h2>
                             <p className="text-gray-400 text-xs sm:text-sm font-medium">You now possess the complete architecture, execution roadmap, and implementation templates for this concept.</p>
                          </div>
                          <Sparkles className="absolute top-6 right-6 text-white/5" size={48} />
                       </div>
                    )}
                    <section className="bg-gray-50 rounded-xl p-1 border border-gray-100 mb-8">
                       <div className="flex p-1 gap-1">
                          {(['certificate', 'blueprint', 'roadmap', 'boilerplate'] as const).map((tab) => (
                             <button
                                key={tab}
                                onClick={() => {
                                   setActiveTab(tab);
                                   if (tab === 'roadmap') generateRoadmap();
                                }}
                                className={cn(
                                   "flex-1 py-3 px-2 sm:px-4 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                   activeTab === tab 
                                    ? "bg-white text-navy shadow-sm border border-gray-100" 
                                    : "text-slate hover:text-navy"
                                )}
                             >
                                {tab === 'certificate' && <Medal size={14} />}
                                {tab === 'blueprint' && <FileText size={14} />}
                                {tab === 'roadmap' && <Calendar size={14} />}
                                {tab === 'boilerplate' && <Code size={14} />}
                                {tab}
                             </button>
                          ))}
                       </div>
                    </section>

                   {activeTab === 'certificate' && (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="relative"
                       >
                         {/* Certificate Visual */}
                         <div ref={certificateRef} className="relative bg-white border-[12px] border-gray-50 rounded-2xl p-8 sm:p-12 shadow-2xl overflow-hidden">
                           {/* Decorative background elements */}
                           <div className="absolute top-0 right-0 w-64 h-64 bg-electric/5 rounded-full blur-3xl -mr-32 -mt-32" />
                           <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy/5 rounded-full blur-3xl -ml-32 -mb-32" />
                           
                           {/* Seal */}
                           <div className="absolute top-8 right-8 w-24 h-24 bg-navy rounded-full flex items-center justify-center border-4 border-white shadow-xl rotate-12">
                              <Medal className="text-white" size={48} />
                              <div className="absolute inset-0 border-2 border-white/20 rounded-full scale-90 border-dashed" />
                           </div>

                           <div className="relative z-10 text-center">
                              <div className="flex items-center justify-center gap-2 mb-8">
                                 <div className="h-px w-12 bg-gray-200" />
                                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-navy">Professional Certificate of Ownership</h4>
                                 <div className="h-px w-12 bg-gray-200" />
                              </div>

                              <h2 className="text-3xl sm:text-4xl font-black text-navy mb-4 leading-tight tracking-tight">
                                {idea.title}
                              </h2>
                              
                              <p className="text-slate font-medium italic mb-10 max-w-md mx-auto text-sm">
                                "This document certifies that exclusive execution rights for this concept have been successfully reserved and vaulted."
                              </p>

                              <div className="grid grid-cols-2 gap-8 mb-12 text-left">
                                 <div>
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate mb-1">Authenticated For</h5>
                                    <p className="font-bold text-navy flex items-center gap-2">
                                       <UserCheck size={16} className="text-electric" />
                                       {userProfile?.name}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate mb-1">Vault Registry Date</h5>
                                    <p className="font-bold text-navy">
                                       {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                 </div>
                              </div>

                              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                       <ShieldCheck size={24} className="text-electric" />
                                    </div>
                                    <div className="text-left">
                                       <h6 className="text-[9px] font-black uppercase tracking-widest text-slate">Security Status</h6>
                                       <p className="text-xs font-bold text-navy">Vault Secured • Single Copy Issued</p>
                                    </div>
                                 </div>
                                 <div className="text-right sr-only sm:not-sr-only">
                                    <p className="text-[8px] font-mono text-slate uppercase tracking-tighter">ID: {idea.id.slice(0, 16)}</p>
                                 </div>
                              </div>
                           </div>
                         </div>

                         {/* Actions */}
                         <div className="flex gap-4 mt-8">
                            <button 
                              onClick={exportCertificate}
                              disabled={exporting}
                              className="flex-1 bg-white border border-gray-200 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-navy flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                               {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                               Export PDF
                            </button>
                            <button 
                              onClick={shareAchievement}
                              className="flex-1 bg-white border border-gray-200 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-navy flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                            >
                               <Share2 size={16} />
                               Share Achievement
                            </button>
                         </div>
                       </motion.div>
                    )}

                    {activeTab === 'blueprint' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary & Scope */}
                        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                            <div>
                              <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-navy">
                                <FileText className="text-electric" size={24} />
                                Comprehensive Project Blueprint
                              </h2>
                              <p className="text-slate font-medium text-sm max-w-xl">
                                This standardized guide ensures all stakeholders align on scope, objectives, and technical requirements for successful execution of <strong>{idea.title}</strong>.
                              </p>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 shrink-0">
                               <div className="text-center">
                                  <span className="block text-[10px] font-black uppercase text-slate tracking-widest leading-none mb-1">Status</span>
                                  <span className="text-xs font-bold text-emerald-600">Standardized</span>
                               </div>
                               <div className="w-px h-8 bg-gray-200" />
                               <div className="text-center">
                                  <span className="block text-[10px] font-black uppercase text-slate tracking-widest leading-none mb-1">Version</span>
                                  <span className="text-xs font-bold text-navy">v1.2.0</span>
                               </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-navy mb-4 flex items-center gap-2">
                                  <Compass size={14} className="text-electric" />
                                  Strategic Objectives
                                </h3>
                                <ul className="space-y-3">
                                  {[
                                    `Establish a scalable foundation for the ${idea.category} market within 30 days.`,
                                    `Implement core proprietary logic using ${idea.techStack[0]} as the primary engine.`,
                                    `Target $10k+ MRR by automating ${idea.features[0].toLowerCase()} for early adopters.`,
                                    `Acquire initial segment of the Indian tech-enabled market through localized strategies.`
                                  ].map((goal, i) => (
                                    <li key={i} className="text-xs font-semibold text-slate flex gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-electric mt-1.5 shrink-0" />
                                      {goal}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-navy mb-4 flex items-center gap-2">
                                  <AlertCircle size={14} className="text-orange-500" />
                                  Risk Management Strategy
                                </h3>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-[11px]">
                                     <span className="font-bold text-slate">Market Satiety</span>
                                     <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-black uppercase">Medium</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px]">
                                     <span className="font-bold text-slate">Tech Scalability</span>
                                     <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black uppercase">Low</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px]">
                                     <span className="font-bold text-slate">Regulatory Compliance</span>
                                     <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-black uppercase">High</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-navy p-6 rounded-3xl text-white relative overflow-hidden group">
                               <div className="relative z-10">
                                  <h3 className="text-xs font-black uppercase tracking-widest text-electric mb-6 flex items-center gap-2">
                                    <TrendingUp size={14} />
                                    Execution Timeline (WBS)
                                  </h3>
                                  <div className="space-y-6">
                                     {[
                                       { week: "01", task: "Foundation & Infra Setup", desc: "Environment provisioning, repo setup, and auth layer." },
                                       { week: "02", task: "Prototyping Core Module", desc: `Building ${idea.features[0]}.` },
                                       { week: "03", task: "Business Logic Integration", desc: "Connecting backend services and state management." },
                                       { week: "04", task: "Refinement & Soft Launch", desc: "Final UI polish and segment-specific landing pages." }
                                     ].map((item, i) => (
                                       <div key={i} className="flex gap-4 group/item">
                                          <div className="flex flex-col items-center">
                                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black group-hover/item:bg-electric transition-colors">
                                                {item.week}
                                             </div>
                                             {i < 3 && <div className="w-px flex-1 bg-white/10 my-1" />}
                                          </div>
                                          <div>
                                             <h4 className="text-xs font-bold mb-0.5">{item.task}</h4>
                                             <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                               <Zap className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-electric/10 transition-colors duration-700" size={200} />
                            </div>
                          </div>
                        </section>

                        {/* Technical Resources Layer */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-full">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                              <Network className="text-electric" size={20} />
                              Architecture Topology
                            </h3>
                            
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center mb-6">
                               <svg width="100%" height="200" viewBox="0 0 600 200" className="max-w-md">
                                  <rect x="50" y="60" width="120" height="80" rx="16" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                                  <AppWindow x="95" y="80" size={30} className="text-blue-600" />
                                  <text x="110" y="130" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">Client Interface</text>

                                  <path d="M170 100 L230 100" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead-blue)" />
                                  
                                  <rect x="240" y="60" width="120" height="80" rx="16" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                                  <Server x="285" y="80" size={30} className="text-blue-600" />
                                  <text x="300" y="130" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">Service Layer</text>

                                  <path d="M360 100 L420 100" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead-blue)" />

                                  <rect x="430" y="60" width="120" height="80" rx="16" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                                  <Database x="475" y="80" size={30} className="text-blue-600" />
                                  <text x="490" y="130" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">Data Vault</text>

                                  <defs>
                                     <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                                     </marker>
                                  </defs>
                               </svg>
                               <p className="mt-4 text-[10px] text-slate font-semibold text-center italic">
                                  System-generated for: {idea.title} [v1.2]
                               </p>
                            </div>
                            
                            <button 
                               onClick={downloadArchitectureSVG}
                               className="w-full flex items-center justify-center gap-3 py-4 bg-gray-50 border border-gray-100 text-xs font-black uppercase tracking-widest text-navy rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                            >
                               <Download size={16} />
                               Architecture Diagram (SVG)
                            </button>
                          </section>

                          <div className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                               <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                     <FileText size={20} />
                                  </div>
                                  <h4 className="font-bold text-navy">Documentation Blueprint</h4>
                               </div>
                               <p className="text-xs text-slate font-medium mb-6 leading-relaxed">
                                  Comprehensive guide detailing scope, objectives, risks, timelines, and technical requirements.
                                </p>
                                <a 
                                  href={`https://v0.dev/chat/compile?p=${encodeURIComponent(`Create a comprehensive project blueprint for "${idea.title}". 
                                  Context: ${idea.tagline}.
                                  Structure it with: Executive Summary, Market Analysis, Technical Architecture, Risk Management Strategy, and Roadmap.
                                  Target Market: Indian Tech Startups.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-between py-3 px-5 bg-orange-50 text-orange-700 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-orange-100 transition-all"
                                >
                                   Generate Blueprint
                                   <ExternalLink size={14} />
                                </a>
                            </div>
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                               <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                     <Sparkles size={20} />
                                  </div>
                                  <h4 className="font-bold text-navy">Component Library</h4>
                               </div>
                               <p className="text-xs text-slate font-medium mb-6 leading-relaxed">
                                  Pre-defined UI patterns and standardized coding styles for {idea.category} applications.
                                </p>
                                <a 
                                  href="https://ui.shadcn.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-between py-3 px-5 bg-purple-50 text-purple-700 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-purple-100 transition-all"
                                >
                                   Access Component Library
                                   <ExternalLink size={14} />
                                </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'roadmap' && (
                       <section className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100 min-h-[400px]">
                          <div className="flex items-center justify-between mb-6">
                             <h2 className="text-xl font-bold flex items-center gap-2 text-blue-900">
                               <Calendar className="text-blue-500" size={20} />
                               30-Day Execution Roadmap
                             </h2>
                             {generatingRoadmap && <Loader2 className="animate-spin text-blue-500" size={20} />}
                          </div>
                          
                          {generatingRoadmap ? (
                             <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Sparkles className="text-blue-300 animate-pulse mb-4" size={48} />
                                <h3 className="font-bold text-blue-900">AI is architecting your launch strategy...</h3>
                                <p className="text-sm text-blue-600 opacity-70">Calculating market entry, tech milestones, and feedback loops.</p>
                             </div>
                          ) : roadmap ? (
                             <div className="prose prose-blue max-w-none prose-sm">
                                <ReactMarkdown>{roadmap}</ReactMarkdown>
                             </div>
                          ) : roadmapError ? (
                             <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100 p-8">
                                <AlertCircle className="text-red-500 mx-auto mb-4" size={32} />
                                <h3 className="font-bold text-red-900 mb-2">Generation Interrupted</h3>
                                <p className="text-sm text-red-600 mb-6">{roadmapError.includes('monthly quota') 
                                     ? "AI Synthesis Quota reached. We currently leverage high-quality free-tier models; please check back shortly or explore our existing static blueprints below."
                                     : roadmapError}</p>
                                <button 
                                  onClick={() => {
                                    setRoadmapError(null);
                                    generateRoadmap();
                                  }}
                                  className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
                                >
                                  Retry Extraction
                                </button>
                             </div>
                          ) : (
                             <div className="text-center py-20 text-gray-400 font-medium">Failed to generate roadmap. Try again.</div>
                          )}
                       </section>
                    )}

                    {activeTab === 'boilerplate' && (
                       <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          {/* Replit Hero Button */}
                          <section className="bg-gradient-to-br from-navy to-navy/95 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                             <div className="absolute top-0 right-0 w-96 h-96 bg-electric/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
                             
                             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div className="max-w-md">
                                   <div className="inline-flex items-center gap-2 bg-electric/20 backdrop-blur px-4 py-2 rounded-full border border-electric/30 mb-6 font-black uppercase tracking-[0.2em] text-[10px]">
                                      <Zap size={14} />
                                      Deployment Engine
                                   </div>
                                   <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight leading-tight">
                                      Deploy & Build instantly with Replit.
                                   </h2>
                                   <p className="text-gray-300 font-medium text-sm leading-relaxed mb-8">
                                      One-click deployment to Replit's Agent Mode. We've pre-configured the perfect prompt to help the AI Agent build your entire MVP in minutes.
                                   </p>
                                   <button 
                                      onClick={handleOpenReplit}
                                      className="flex items-center gap-4 bg-white text-navy px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-electric hover:text-white transition-all shadow-xl shadow-electric/20 active:scale-95 group/btn"
                                   >
                                      Launch on Replit
                                      <Rocket className="group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" size={20} />
                                   </button>
                                </div>
                                <div className="hidden md:block relative">
                                   <div className="w-64 h-64 bg-white/5 rounded-3xl border border-white/10 backdrop-blur p-6 flex flex-col items-center justify-center text-center">
                                      <Terminal size={48} className="text-electric mb-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Agent Handshake</span>
                                      <p className="text-xs text-white font-bold">Standardized Boilerplate Handover Pattern Detected</p>
                                   </div>
                                   <div className="absolute -top-4 -right-4 w-12 h-12 bg-electric rounded-full flex items-center justify-center animate-bounce">
                                      <Sparkles size={20} className="text-white" />
                                   </div>
                                </div>
                             </div>
                          </section>

                          {/* Boilerplate Structure */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <section className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                   <FolderTree className="text-electric" size={24} />
                                   Standardized Project Scaffolding
                                </h3>
                                <div className="bg-gray-900 rounded-2xl p-6 font-mono text-[11px] text-gray-300 leading-relaxed overflow-x-auto shadow-inner">
                                   <div className="flex items-center gap-2 mb-4 text-gray-500 border-b border-gray-800 pb-2">
                                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                      <span className="ml-2">Project Root Structure</span>
                                   </div>
                                   {[
                                      "├── .env.example",
                                      "├── .gitignore",
                                      "├── package.json",
                                      "├── tsconfig.json",
                                      "├── src/",
                                      "│   ├── assets/",
                                      "│   ├── components/",
                                      "│   │   ├── forms/",
                                      "│   │   └── ui/",
                                      "│   ├── hooks/",
                                      "│   ├── services/",
                                      "│   ├── types.ts",
                                      "│   ├── utils.ts",
                                      "│   └── main.tsx",
                                      "├── public/",
                                      "└── README.md"
                                   ].map((line, i) => (
                                      <div key={i} className="hover:text-white transition-colors py-0.5">
                                         {line}
                                      </div>
                                   ))}
                                </div>
                             </section>

                             <section className="space-y-6">
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                   <h4 className="text-xs font-black uppercase tracking-widest text-navy mb-4 flex items-center gap-2">
                                      <Settings size={14} className="text-electric" />
                                      Pre-configured Configs
                                   </h4>
                                   <ul className="space-y-4">
                                      {[
                                         { title: '.env', desc: 'Secure environment template' },
                                         { title: '.eslintrc', desc: 'Strict coding standards' },
                                         { title: 'README.md', desc: 'Setup & Deployment guide' }
                                      ].map((cfg, i) => (
                                         <li key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="p-1.5 bg-white rounded-lg shadow-xs text-navy">
                                               <FileText size={12} />
                                            </div>
                                            <div>
                                               <p className="text-[10px] font-black text-navy">{cfg.title}</p>
                                               <p className="text-[9px] text-slate font-medium">{cfg.desc}</p>
                                            </div>
                                         </li>
                                      ))}
                                   </ul>
                                </div>
                                <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
                                   <div className="relative z-10">
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-3">Starter Repos</h4>
                                      <p className="text-xs font-bold leading-relaxed mb-6">
                                         Official GitHub starters matched to your stack.
                                      </p>
                                      <div className="space-y-2">
                                         {getBoilerplates().map((b, i) => (
                                            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all text-[10px] font-black uppercase tracking-tight">
                                               {b.tech}
                                               <Github size={14} />
                                            </a>
                                         ))}
                                      </div>
                                   </div>
                                   <Rocket className="absolute -right-4 -top-4 text-white/10 rotate-45" size={80} />
                                </div>
                             </section>
                          </div>
                       </div>
                    )}

                    <section className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                       <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                          <Trophy className="text-yellow-400" size={20} />
                          Owner's Success Playbook
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                          {[
                             { title: "First 24 Hours", text: "Validate the core feature with at least 5 potential users using the blueprint.", icon: <Clock size={16} /> },
                             { title: "Technical Setup", text: "Use the boilerplate to deploy a 'Coming Soon' page within 48 hours.", icon: <Code size={16} /> },
                             { title: "Market Wedge", text: "Identify one specific niche in the Indian market to capture early traction.", icon: <TrendingUp size={16} /> },
                             { title: "Community Access", text: "You now have priority support for any implementation blockers via the vault.", icon: <Info size={16} /> }
                          ].map((item, i) => (
                             <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-yellow-400">
                                   {item.icon}
                                   <h4 className="text-[10px] font-black uppercase tracking-widest">{item.title}</h4>
                                </div>
                                <p className="text-sm text-gray-400">{item.text}</p>
                             </div>
                          ))}
                       </div>
                       <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                          <Medal size={160} />
                       </div>
                    </section>

                    <section>
                       <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Compass className="text-navy" size={20} />
                        Resources & Getting Started
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {idea.resources.map((res, i) => (
                          <a
                            key={i}
                            href={`https://www.google.com/search?q=${encodeURIComponent(res + " implementation " + idea.techStack.join(" "))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-electric hover:bg-blue-50/50 transition-all group"
                          >
                             <span className="text-sm font-medium text-gray-700">{res}</span>
                             <ExternalLink size={14} className="text-gray-400 group-hover:text-electric" />
                          </a>
                        ))}
                      </div>
                    </section>
                  </motion.div>
                ) : (
                  <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative">
                      <div className="bg-white w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-gray-400 group-hover:text-orange-500 transition-colors" size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Unlock the Full Blueprint</h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
                        Get exclusive access to the tech stack, implementation features, and step-by-step resources for this concept.
                      </p>
                      <ul className="flex flex-wrap justify-center gap-4 text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest">
                        <li className="flex items-center gap-1.5"><ShieldCheck size={14} /> Full Tech Stack</li>
                        <li className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Key Features</li>
                        <li className="flex items-center gap-1.5"><Github size={14} /> Source Resources</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 {/* Meta Info */}
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Metadata</h3>
                            <div className="space-y-4">
                               <MetaItem label="Created" value={new Date(idea.createdAt).toLocaleDateString()} />
                               <MetaItem label="Complexity" value={idea.estimatedComplexity} variant="highlight" />
                               <MetaItem label="Timeline" value={idea.estimatedDuration} />
                               <MetaItem label="Market Readiness" value="High" />
                            </div>
                         </div>

                         {idea.status === 'public' && !isPurchased && (
                            <div className="space-y-4">
                              {/* Pricing Block */}
                              <div className="bg-white rounded-2xl p-6 border-2 border-orange-500 shadow-xl shadow-orange-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-tighter">
                                  Best Value
                                </div>
                                
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    {idea.anchorPrice && (
                                      <span className="text-gray-400 line-through text-sm font-medium">₹{idea.anchorPrice}</span>
                                    )}
                                    <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Saving 80%+</span>
                                  </div>
                                  <div className="flex items-end gap-1">
                                    <span className="text-4xl font-black text-gray-900 tracking-tight">₹{idea.price}</span>
                                    <span className="text-gray-400 text-sm font-bold mb-1.5 uppercase tracking-widest">/ exclusive</span>
                                  </div>
                                </div>

                                <ul className="space-y-2 mb-6">
                                   {[
                                     { icon: <TrendingUp size={14} />, text: 'Save 40+ hrs on research' },
                                     { icon: <ShieldCheck size={14} />, text: 'Full Intellectual Rights' },
                                     { icon: <CheckCircle2 size={14} />, text: 'Ready-to-build blueprint' }
                                   ].map((item, i) => (
                                     <li key={i} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                       <span className="text-orange-500">{item.icon}</span>
                                       {item.text}
                                     </li>
                                   ))}
                                </ul>

                                <button
                                  onClick={handlePurchaseClick}
                                  disabled={purchasing}
                                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                                >
                                  {purchasing ? (
                                    <LoaderIcon className="animate-spin" size={24} />
                                  ) : (
                                    <>
                                      Acquire Now
                                      <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Bundle Nudge */}
                              <div 
                                onClick={onStartBooster}
                                className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-purple-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-purple-200 flex items-center justify-center text-purple-700">
                                    <ShoppingBag size={20} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-purple-900 uppercase tracking-tight">Unlock the Vault Booster</p>
                                    <p className="text-[10px] text-purple-600 font-medium">Get 3 more verified ideas for just ₹299</p>
                                  </div>
                                </div>
                                <ChevronRight className="text-purple-400 group-hover:translate-x-1 transition-transform" size={18} />
                              </div>
                            </div>
                         )}

                 {isPurchased && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl">
                       <div className="flex items-center gap-3 mb-2">
                          <Unlock size={20} />
                          <span className="font-bold">Exclusive Ownership</span>
                       </div>
                       <p className="text-xs leading-relaxed opacity-80">
                         This concept is now private to your account. You have full access to the execution blueprint.
                       </p>
                    </div>
                 )}

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <RefreshCw className="text-orange-500" size={20} />
                          Collaborative Remix
                        </h2>
                      </div>

                      <AnimatePresence>
                        {showRemixInput ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-orange-50 rounded-2xl p-6 border border-orange-200 overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-orange-800 mb-2">Target Market</label>
                                  <input 
                                    value={remixParams.targetMarket}
                                    onChange={(e) => setRemixParams({ ...remixParams, targetMarket: e.target.value })}
                                    placeholder="e.g. Small Businesses in India"
                                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                                  />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black uppercase tracking-widest text-orange-800 mb-2">Strategic Directive</label>
                                  <input 
                                    value={remixParams.directive}
                                    onChange={(e) => setRemixParams({ ...remixParams, directive: e.target.value })}
                                    placeholder="e.g. Pivot to B2B subscription"
                                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                                  />
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button
                                 onClick={submitRemix}
                                 className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                               >
                                  <Sparkles size={14} />
                                  Start Neural Evolution
                               </button>
                               <button
                                 onClick={() => setShowRemixInput(false)}
                                 className="px-4 py-3 bg-white text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest border border-orange-200 hover:bg-orange-100 transition-all"
                               >
                                  Cancel
                               </button>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="bg-orange-50/30 rounded-2xl p-6 border border-dashed border-orange-200">
                            <p className="text-xs font-medium text-gray-400 mb-4 leading-relaxed">
                              Take this atomic idea and evolve it using our AI lattice. Remixing creates a specialized derivation tailored to your specific market needs.
                            </p>
                            <button
                              onClick={handleRemixClick}
                              disabled={remixing}
                              className="w-full bg-white text-orange-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-orange-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                            >
                              {remixing ? <LoaderIcon className="animate-spin" size={14} /> : <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />}
                              Initialize Evolution
                            </button>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                 <button
                   onClick={() => onFavorite(idea.id)}
                   className={cn(
                     "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold border transition-all",
                     isFavorite
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                   )}
                 >
                   <Bookmark size={20} fill={isFavorite ? "currentColor" : "none"} />
                   {isFavorite ? 'Saved to Vault' : 'Save for Later'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Purchase Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                 <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mb-6">
                   <ShieldCheck size={40} />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-2">Secure the Vault?</h3>
                <p className="text-gray-500 mb-8 font-medium">You are about to purchase exclusive access to the full blueprint, tech stack, and roadmap for:</p>
                
                <div className="w-full bg-gray-50 rounded-3xl p-6 mb-8 text-left border border-gray-100">
                   <h4 className="font-black text-gray-900 text-lg leading-tight mb-2">{idea.title}</h4>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                         {idea.category}
                      </span>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Total Investment</span>
                      <div className="text-right">
                         <span className="text-2xl font-black text-gray-900">₹{idea.price}</span>
                         {idea.anchorPrice && (
                            <p className="text-xs font-bold text-gray-400 line-through">₹{idea.anchorPrice}</p>
                         )}
                      </div>
                   </div>
                </div>

                <div className="w-full flex flex-col gap-3">
                   <button
                     onClick={triggerPurchase}
                     className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                      Confirm & Pay Securely
                      <CreditCard size={18} className="text-orange-400" />
                   </button>
                   <button
                     onClick={() => setShowConfirm(false)}
                     className="w-full text-gray-400 py-3 font-bold text-sm tracking-widest uppercase hover:text-gray-600 transition-colors"
                   >
                      Maybe Later
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetaItem({ label, value, variant }: { label: string, value: string, variant?: 'highlight' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
      <span className={cn(
        "text-sm font-bold",
        variant === 'highlight' ? 'text-orange-600 bg-orange-100 px-2 py-0.5 rounded' : 'text-gray-900'
      )}>{value}</span>
    </div>
  );
}

function LoaderIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
