import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Filter, LayoutGrid, List, SlidersHorizontal, Loader2, LogOut, CheckCircle2, X, Search, LogIn, User as UserIcon, Zap, AlertCircle, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  or,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  increment, 
  arrayUnion, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import Navbar from './components/Navbar';
import IdeaCard from './components/IdeaCard';
import IdeaDetail from './components/IdeaDetail';
import ProfileView from './components/ProfileView';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import Footer from './components/Footer';
import { PrivacyPolicy, TermsOfService, Disclaimer, SecurityPolicy } from './components/LegalPages';
import { Idea, UserProfile, OperationType } from './types';
import { cn } from './lib/utils';
import { handleFirestoreError } from './lib/firestoreUtils';
import { generateAIResponse, getAIErrorMessage, isAIQuotaError } from './lib/openrouter';

// Global styles for Masonry-like grid
const masonryStyles = `
.masonry-grid {
  column-count: 1;
  column-gap: 1.5rem;
}
@media (min-width: 640px) { .masonry-grid { column-count: 2; } }
@media (min-width: 1024px) { .masonry-grid { column-count: 3; } }
@media (min-width: 1280px) { .masonry-grid { column-count: 4; } }
.masonry-item {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}
`;

export default function App() {
  const [user, authLoading] = useAuthState(auth);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [boosterSelection, setBoosterSelection] = useState<string[]>([]);
  const [isBoosterMode, setIsBoosterMode] = useState(false);

  const isAdmin = user?.email === 'omshrivastava01927@gmail.com';

  // Sync Activity Feed
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => d.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // Sync Ideas from Firestore
  useEffect(() => {
    if (authLoading) return;

    // Use OR query to get public ideas AND ideas owned by the current user
    // This allows the user to see their purchased ideas that are marked as 'private'
    const q = user 
      ? query(
          collection(db, 'ideas'), 
          or(where('status', '==', 'public'), where('acquiredBy', '==', user.uid))
        )
      : query(
          collection(db, 'ideas'), 
          where('status', '==', 'public')
        );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Idea));
      // Sort in memory since multi-field OR queries have orderBy limitations without specific composite indexes
      const sortedIdeas = ideasData.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setIdeas(sortedIdeas);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ideas');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Sync User Profile
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      if (snap.exists()) {
        setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
      } else {
        const newProfile = {
          id: user.uid,
          name: user.displayName || 'Guest Innovator',
          email: user.email || '',
          avatar: user.photoURL || '',
          purchasedIdeas: [],
          votedIdeas: {},
          favorites: [],
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile as UserProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async (isAuto = false) => {
    if (!user && !isAuto) {
      signInWithGoogle();
      return;
    }
    
    if (generating || quotaExhausted) return;
    setGenerating(true);
    
    try {
      const existingTitles = (ideas || []).slice(0, 20).map(i => i.title).join(", ");
      
      // Determine target category based on selection or random if on 'All'
      const categories = ['SaaS', 'AI', 'Fintech', 'Health', 'Blockchain'];
      const targetCategory = selectedCategory !== 'All' ? selectedCategory : categories[Math.floor(Math.random() * categories.length)];

      const prompt = `Generate a high-quality, unique startup/project idea specifically for the ${targetCategory} sector.
      CRITICAL: Do NOT generate ideas similar to these existing ones: ${existingTitles}. 
      Ensure the core value proposition is distinct from LegalTech, AI contract analysis, or any of the above.
      The idea should be specifically tailored to exploit gaps in the ${targetCategory} market with an innovative "hook".
      
      Output in JSON format with fields: title, tagline, description (markdown), category (strictly: ${targetCategory}), techStack (array), features (array), resources (array), estimatedComplexity (Easy/Medium/Hard), estimatedDuration,
      marketAngles: string[] (3 unique hooks),
      marketAngleAnalysis: {
        marketSizing: string,
        competitiveLandscape: string,
        targetAudience: string,
        feasibility: string,
        strategy: string,
        summaryTable: {
          product: string,
          audience: string,
          competition: string,
          demand: string,
          resources: string,
          strategy: string
        }
      },
      metrics: {
        timeSavedHours: number,
        potentialMarketValueINR: number,
        demandLevel: number (0.8 to 1.2)
      }`;

      const responseText = await generateAIResponse(prompt);
      const data = JSON.parse(responseText || "{}");
      
      // Calculate Pricing Strategy (improved for Indian Market - Median ~129)
      // Perceived value is lowered to reflect a more accessible starting point
      const baseValue = (data.metrics?.timeSavedHours * 8 || 100) + (data.metrics?.potentialMarketValueINR / 2000 || 50);
      const urgencyFactor = 0.8 + (Math.random() * 0.4);
      const demandFactor = data.metrics?.demandLevel || 1.0;
      // Heavier discount for the Indian market
      const marketDiscount = 0.2 + (Math.random() * 0.3);
      
      let rawPrice = baseValue * marketDiscount * demandFactor * urgencyFactor;
      
      // Tiers focused around 129
      const tiers = [49, 79, 99, 129, 149, 199, 249, 299, 349, 399, 449, 499];
      const finalPrice = tiers.reduce((prev, curr) => 
        Math.abs(curr - rawPrice) < Math.abs(prev - rawPrice) ? curr : prev
      );

      const ideaRef = doc(collection(db, 'ideas'));
      const idea = {
        ...data,
        id: ideaRef.id,
        status: "public",
        votes: 0,
        views: 0,
        price: Math.round(finalPrice),
        anchorPrice: Math.round(finalPrice * (2 + Math.random())),
        limitedStock: Math.floor(Math.random() * 5) + 1,
        createdAt: new Date().toISOString(),
        acquiredBy: "",
        isTrending: Math.random() > 0.8 // Rough initial flag, improved below
      };
      
      try {
        await setDoc(ideaRef, idea);
        
        // Log activity
        const activityRef = doc(collection(db, 'activities'));
        await setDoc(activityRef, {
          id: activityRef.id,
          type: "new_idea",
          text: `🚀 Fresh concept spawned: ${idea.title}`,
          timestamp: new Date().toISOString()
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.CREATE, ideaRef.path);
      }

    } catch (err: any) {
      console.error("Client generation failed:", err);
      let errorMsg = getAIErrorMessage(err, "The idea vault seems locked. Please try again later.");
      const errorStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      
      if (isAIQuotaError(err)) {
        if (errorStr.includes('spending cap')) {
          errorMsg = "AI Budget Exhausted: The monthly spending cap has been reached. Please contact the project owner.";
        } else {
          errorMsg = "AI Quota reached for the month. We use high-quality free-tier models to keep this service accessible.";
        }
        setQuotaExhausted(true);
      }
      setNotifications(prev => [{ id: Date.now().toString(), text: errorMsg }, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  // Automated Pool Maintenance
  useEffect(() => {
    if (!loading && activeTab === 'explore') {
      const publicIdeas = ideas.filter(i => i.status === 'public');
      if (publicIdeas.length < 5) {
        handleGenerate(true);
      }
    }
  }, [loading, ideas.length, activeTab]);

  const handleSeedTrial = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setGenerating(true);
    try {
      const ideaRef = doc(collection(db, 'ideas'));
      const trialIdea = {
        id: ideaRef.id,
        title: "Experimental Neural Mirror (TRIAL)",
        tagline: "Experience the Vault's depth without spending a rupee.",
        description: "### The Vision\nA cutting-edge experimental concept designed to showcase how IdeaVault blueprints work. This idea is completely free for testing purposes.\n\n### Execution Strategy\nFocus on low-latency data streaming and edge computation to minimize overhead while maximizing user feedback loops.",
        category: "AI",
        techStack: ["Next.js", "Redis", "WebSockets", "TensorFlow.js"],
        features: [
          "End-to-end encryption for trial data",
          "Real-time feedback visualization",
          "Automated scalability testing",
          "One-click deployment templates"
        ],
        resources: [
          "Documentation Blueprint",
          "Component Library Access",
          "Architecture Diagram (SVG)"
        ],
        estimatedComplexity: "Medium",
        estimatedDuration: "2 Weeks",
        status: "public",
        votes: 12,
        views: 45,
        price: 0,
        anchorPrice: 999,
        limitedStock: 99,
        createdAt: new Date().toISOString(),
        acquiredBy: "",
        isTrending: true,
        marketAngles: [
          "Disrupt the trial ecosystem with zero-cost exploration.",
          "Showcase platform capabilities through high-fidelity prototypes.",
          "Onboard users via frictionless architectural transparency."
        ],
        marketAngleAnalysis: {
          marketSizing: "Targeting 1M+ aspiring entrepreneurs in the emerging tech ecosystem.",
          competitiveLandscape: "IdeaVault stands alone by bridging the gap between pure inspiration and actionable blueprints.",
          targetAudience: "Indie hackers, startup founders, and corporate innovation labs.",
          feasibility: "Highly feasible using existing cloud-agnostic architectures and serverless primitives.",
          strategy: "Freemium model with high-value conversion points and exclusive vault access.",
          summaryTable: {
            product: "Curated, actionable startup blueprints.",
            audience: "Early-stage entrepreneurs & hackers.",
            competition: "Low - High specialization & execution focus.",
            demand: "Rising - High need for validated concepts.",
            resources: "Minimal - Digital delivery & AI-powered scaling.",
            strategy: "Digital scarcity & exclusive ownership."
          }
        }
      };

      await setDoc(ideaRef, trialIdea);
      setNotifications(prev => [{ id: Date.now().toString(), text: "Trial Idea seeded! Click it to test the 0-rupee checkout." }, ...prev]);
    } catch (err) {
       console.error("Seed failed:", err);
    } finally {
       setGenerating(false);
    }
  };

  const handleClearTrials = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const q = query(collection(db, 'ideas'), where('category', '==', 'Test Drive'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'ideas', d.id)));
      await Promise.all(deletePromises);
      setNotifications(prev => [{ id: Date.now().toString(), text: "All Trial Concepts cleared from the marketplace." }, ...prev]);
    } catch (err) {
      console.error("Clear trials failed:", err);
      handleFirestoreError(err, OperationType.DELETE, 'ideas');
    } finally {
      setGenerating(false);
    }
  };

  // Admin: Re-price existing ideas
  const optimizePricing = async () => {
    if (user?.email !== 'omshrivastava01927@gmail.com') return;
    setGenerating(true);
    try {
      const tiers = [49, 79, 99, 129, 149, 199, 249, 299, 349, 399, 449, 499];
      for (const idea of ideas) {
        if (idea.status !== 'public') continue;
        let p = idea.price;
        if (p >= 300) {
           // Shift high prices towards the new median
           const newPrice = tiers[Math.floor(Math.random() * 6)]; // 49 to 199
           await updateDoc(doc(db, 'ideas', idea.id), { 
             price: newPrice,
             anchorPrice: Math.round(newPrice * (2 + Math.random()))
           });
        }
      }
      setNotifications(prev => [{ id: Date.now().toString(), text: "Admin: Pricing architecture optimized for volume." }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRemix = async (baseIdea: Idea, params?: { targetMarket: string; directive: string }) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    if (generating || quotaExhausted) return;
    setGenerating(true);
    try {
      const marketContext = params?.targetMarket ? `Specifically target the following market: ${params.targetMarket}.` : "";
      const directiveContext = params?.directive ? `Strategic Directive: ${params.directive}.` : "Focus on high-growth scalability and unique market differentiation.";

      const prompt = `Based on this innovative project concept: "${baseIdea.title} - ${baseIdea.tagline}", generate a highly specialized "Version 2.0" evolution.
      
      CONTEXTUAL GUIDANCE:
      - ${marketContext || "Global distribution with focus on emerging markets."}
      - ${directiveContext}
      
      The evolution should build deeply upon the base concept but offer a tactical pivot or expansion. 
      Update the tech stack if necessary to match the new market or directive. 
      Focus on specialized features that solve problems for the specified targets.
      
      Output in JSON format with fields: title, tagline, description (markdown), category, techStack (array), features (array), resources (array), estimatedComplexity (Easy/Medium/Hard), estimatedDuration.`;
      
      const responseText = await generateAIResponse(prompt);
      const remixedData = JSON.parse(responseText || "{}");
      
      // Fixed pricing for remix logic
      const rawPrice = (baseIdea.price * 1.5); // Evolution is more valuable
      const finalPrice = Math.min(600, Math.round(rawPrice / 10) * 10 - 1); 

      const newIdeaRef = doc(collection(db, 'ideas'));
      const newIdea = {
        ...remixedData,
        id: newIdeaRef.id,
        status: 'public',
        votes: 0,
        views: 0,
        price: finalPrice,
        anchorPrice: Math.round(finalPrice * 1.8),
        limitedStock: 3,
        createdAt: new Date().toISOString(),
        acquiredBy: "",
        isTrending: true
      };
      
      try {
        await setDoc(newIdeaRef, newIdea);
        setSelectedIdea(null);
        setNotifications(prev => [{ id: Date.now().toString(), text: `Successful Evolution: ${newIdea.title} is now available in the vault!` }, ...prev]);
        
        const activityRef = doc(collection(db, 'activities'));
        await setDoc(activityRef, {
          id: activityRef.id,
          type: "remix",
          text: `✨ '${baseIdea.title}' was evolved into '${newIdea.title}' for ${params?.targetMarket || 'New Frontier'}`,
          timestamp: new Date().toISOString()
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.CREATE, newIdeaRef.path);
      }
    } catch (err: any) {
      console.error("Remix failed:", err);
      let errorMsg = getAIErrorMessage(err, "Neural Evolution failed. The market is too volatile right now.");
      const errorStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));

      if (isAIQuotaError(err)) {
        if (errorStr.includes('spending cap')) {
          errorMsg = "Neural Matrix locked: Monthly budget reached. Evolution suspended.";
        } else {
          errorMsg = "Neural mesh saturated. AI quota reached for this month. Try again later.";
        }
        setQuotaExhausted(true);
      }
      setNotifications(prev => [{ id: Date.now().toString(), text: errorMsg }, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const handleVote = async (id: string, dir: number) => {
    if (isBoosterMode) return; // Disable voting in booster mode
    if (!user || !userProfile) {
      signInWithGoogle();
      return;
    }

    const currentVote = userProfile.votedIdeas[id] || 0;
    if (currentVote === dir) return;

    try {
      const ideaRef = doc(db, 'ideas', id);
      const userRef = doc(db, 'users', user.uid);

      await updateDoc(ideaRef, {
        votes: increment(dir - currentVote)
      });

      await updateDoc(userRef, {
        [`votedIdeas.${id}`]: dir
      });
      
      const activityRef = doc(collection(db, 'activities'));
      await setDoc(activityRef, {
        id: activityRef.id,
        type: "vote",
        text: `👍 Upvoted high-potential concept: ${id.substring(0, 8)}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `ideas/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !isAdmin) return;
    try {
      console.log("Attempting to delete concept:", id);
      const ideaRef = doc(db, 'ideas', id);
      await deleteDoc(ideaRef);
      setNotifications(prev => [{ id: Date.now().toString(), text: "Concept permanently removed from the vault." }, ...prev]);
    } catch (err) {
      console.error("Delete operation failed:", err);
      handleFirestoreError(err, OperationType.DELETE, `ideas/${id}`);
    }
  };

  const recommendations = useMemo(() => {
    if (!userProfile?.purchasedIdeas || userProfile.purchasedIdeas.length === 0 || !ideas) return [];
    const purchased = ideas.filter(i => (userProfile.purchasedIdeas || []).includes(i.id));
    const favCategories = Array.from(new Set(purchased.map(p => p.category)));
    const purchasedIds = userProfile.purchasedIdeas || [];
    return ideas.filter(i => favCategories.includes(i.category) && !purchasedIds.includes(i.id)).slice(0, 3);
  }, [ideas, userProfile]);

  const filteredIdeas = useMemo(() => {
    let result = ideas;
    
    // In 'explore' (main dashboard), only show public ideas that haven't been acquired yet
    if (activeTab === 'explore' || !activeTab) {
      result = result.filter(i => i.status === 'public' && !i.acquiredBy);
    }
    
    if (activeTab === 'saved') {
      if (!userProfile) return [];
      result = result.filter(i => userProfile.favorites.includes(i.id) || userProfile.purchasedIdeas.includes(i.id));
    }
    if (searchQuery) {
      const q = (searchQuery || "").toLowerCase();
      result = result.filter(i =>
        (i.title || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.techStack || []).some(t => (t || "").toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(i => (i.category || "").toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    return result;
  }, [ideas, activeTab, searchQuery, selectedCategory, userProfile]);

  const handleIdeaClick = (idea: Idea) => {
    if (isBoosterMode) {
      if (userProfile?.purchasedIdeas.includes(idea.id)) {
        setNotifications(prev => [{ id: 'booster-owned', text: 'You already own this concept.' }, ...prev]);
        return;
      }
      if (boosterSelection.includes(idea.id)) {
        setBoosterSelection(prev => prev.filter(id => id !== idea.id));
      } else if (boosterSelection.length < 3) {
        setBoosterSelection(prev => [...prev, idea.id]);
      } else {
        setNotifications(prev => [{ id: 'booster-full', text: 'You can only select 3 concepts for the booster.' }, ...prev]);
      }
      return;
    }
    setSelectedIdea(idea);
  };

  const handleBoosterPayment = async () => {
    if (boosterSelection.length !== 3) return;
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded.");
      return;
    }

    try {
      const res = await fetch('/api/create-booster-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "IdeaVault",
        description: "Vault Booster (3 Additional Verified Concepts)",
        order_id: order.id,
        handler: async function(response: any) {
          console.log("Booster Payment Success:", response);
          
          // Transfer to private vault
          try {
            const batch = boosterSelection.map(async (id) => {
              const ideaRef = doc(db, 'ideas', id);
              await updateDoc(ideaRef, {
                status: 'private',
                acquiredBy: user!.uid
              });
            });
            
            await Promise.all(batch);
            
            const userRef = doc(db, 'users', user!.uid);
            await updateDoc(userRef, {
              purchasedIdeas: arrayUnion(...boosterSelection)
            });

            // Activity log
            const activityRef = doc(collection(db, 'activities'));
            await setDoc(activityRef, {
              id: activityRef.id,
              type: "purchase",
              text: `🌟 ${userProfile?.name} used a Vault Booster to secure 3 concepts!`,
              timestamp: new Date().toISOString()
            });

            setBoosterSelection([]);
            setIsBoosterMode(false);
            setNotifications(prev => [{ id: 'booster-success', text: 'Success! Your selections are now in your Private Vault.' }, ...prev]);
            celebrateBooster();
          } catch (err) {
            console.error("Selection update failed:", err);
          }
        },
        prefill: {
          name: userProfile?.name,
          email: userProfile?.email
        },
        theme: { color: "#9333ea" }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Booster payment error:", err);
    }
  };

  const celebrateBooster = () => {
    if ((window as any).confetti) {
      (window as any).confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#f97316', '#ffffff']
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-electric animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return (
        <div className="relative">
          <button 
            onClick={() => setShowLogin(false)}
            className="fixed top-8 left-8 z-[100] flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black uppercase tracking-widest text-navy hover:bg-gray-50 transition-colors shadow-sm"
          >
            ← Back
          </button>
          <LoginPage />
        </div>
      );
    }
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-navy font-sans selection:bg-electric/10 selection:text-electric">
      <style>{masonryStyles}</style>
      <Navbar 
        onSearch={setSearchQuery} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        notificationCount={notifications.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProfileView 
                userProfile={userProfile} 
                purchasedIdeas={ideas.filter(i => (userProfile?.purchasedIdeas || []).includes(i.id))} 
                activities={activities}
                onIdeaClick={handleIdeaClick}
              />
            </motion.div>
          ) : activeTab === 'legal-privacy' ? (
            <PrivacyPolicy key="privacy" onBack={() => setActiveTab('explore')} />
          ) : activeTab === 'legal-terms' ? (
            <TermsOfService key="terms" onBack={() => setActiveTab('explore')} />
          ) : activeTab === 'legal-disclaimer' ? (
            <Disclaimer key="disclaimer" onBack={() => setActiveTab('explore')} />
          ) : activeTab === 'legal-security' ? (
            <SecurityPolicy key="security" onBack={() => setActiveTab('explore')} />
          ) : activeTab === 'notifications' ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto py-12"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black">Stay Updated</h2>
                <button onClick={() => setNotifications([])} className="text-sm font-bold text-orange-600">Clear All</button>
              </div>

              {/* Email Subscription Form */}
              <div className="bg-orange-500 rounded-3xl p-8 mb-12 text-white shadow-xl shadow-orange-100 relative overflow-hidden group">
                <motion.div 
                  animate={{ 
                    rotate: [0, 10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute -right-10 -top-10 bg-white/10 w-64 h-64 rounded-full blur-3xl" 
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <Zap className="text-white" size={24} />
                    </div>
                    <h3 className="text-2xl font-black">Market Pulse Newsletter</h3>
                  </div>
                  <p className="text-white/80 mb-8 font-medium max-w-lg leading-relaxed">
                    Join 2,400+ innovators. Get weekly drops of trending concepts, execution blueprints, and early-bird vault access.
                  </p>
                  <form 
                    className="flex flex-col sm:flex-row gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                      if (!email) return;
                      try {
                        const subRef = doc(collection(db, 'subscribers'), email);
                        await setDoc(subRef, { email, timestamp: new Date().toISOString() });
                        setNotifications(prev => [{ id: Date.now().toString(), text: "Welcome! You're now subscribed to the Market Pulse." }, ...prev]);
                        (e.target as HTMLFormElement).reset();
                        // Also show a toast
                        setNotifications([{ id: 'sub-success', text: 'Boom! You are in. Check your inbox soon.' }, ...notifications]);
                      } catch (err) {
                         console.error(err);
                      }
                    }}
                  >
                    <input 
                      type="email" 
                      name="email"
                      placeholder="Innovator's email address..." 
                      className="px-6 py-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl flex-1 placeholder:text-white/60 focus:outline-none focus:bg-white/30 transition-all font-bold placeholder:font-medium"
                      required
                    />
                    <button className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-black hover:bg-orange-50 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                      Join the Pulse
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-4">
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-start gap-4 shadow-sm">
                    <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">New Insight</h4>
                      <p className="text-gray-500 text-sm">{n.text}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl sm:text-5xl font-black tracking-tight mb-3"
                  >
                    Fuel Your Next <span className="text-orange-500 underline decoration-4 decoration-orange-200 underline-offset-4">Breakthrough</span>
                  </motion.h1>
                  <p className="text-gray-500 max-w-xl text-lg">
                    Explore unique, AI-generated project concepts. Acquire them to go private and unlock full execution blueprints.
                  </p>
                </div>

                  <div className="flex gap-3 flex-wrap md:flex-nowrap">
                    {quotaExhausted && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
                        <AlertCircle size={14} />
                        AI Quota Exhausted
                      </div>
                    )}
                    {user?.email === 'omshrivastava01927@gmail.com' && (
                       <button
                       onClick={optimizePricing}
                       className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-50 transition-all shadow-sm active:scale-95"
                     >
                       <SlidersHorizontal size={20} />
                       Optimize Pricing
                     </button>
                    )}
                    <button
                      onClick={handleSeedTrial}
                      className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                      <Zap size={20} className="text-orange-500" />
                      Seed Trial Concept
                    </button>
                    {user?.email === 'omshrivastava01927@gmail.com' && (
                       <button
                         onClick={handleClearTrials}
                         className="px-6 py-3 bg-white border border-gray-200 text-red-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-50 transition-all shadow-sm active:scale-95"
                       >
                         <X size={20} />
                         Clear Trials
                       </button>
                    )}
                    <button
                      onClick={() => handleGenerate()}
                      disabled={generating}
                      className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                      Generate New Concept
                    </button>
                  </div>
              </div>

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-orange-500" size={20} />
                    <h2 className="text-xl font-bold tracking-tight">Handpicked for You</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map(idea => (
                      <div key={`rec-${idea.id}`} className="scale-95 hover:scale-100 transition-transform origin-left">
                        <IdeaCard
                          idea={idea}
                          onClick={() => handleIdeaClick(idea)}
                          onVote={(dir) => handleVote(idea.id, dir)}
                          userVote={userProfile.votedIdeas[idea.id]}
                          isPurchased={userProfile.purchasedIdeas.includes(idea.id)}
                          onDelete={isAdmin ? () => handleDelete(idea.id) : undefined}
                          className={cn(
                            isBoosterMode && boosterSelection.includes(idea.id) && "ring-4 ring-purple-500 ring-offset-4"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Content Tabs */}
              <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'SaaS', 'AI', 'Fintech', 'Health', 'Blockchain'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                      selectedCategory === cat ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    {cat}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                   <button className="p-2 text-gray-400 hover:text-gray-900"><SlidersHorizontal size={20} /></button>
                   <button className="p-2 text-gray-400 hover:text-gray-900"><LayoutGrid size={20} /></button>
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="animate-spin text-orange-500" size={48} />
                </div>
              ) : (
                <div className="masonry-grid">
                  <AnimatePresence mode="popLayout">
                    {filteredIdeas.map((idea) => (
                      <div key={idea.id} className="masonry-item">
                        <IdeaCard
                          idea={idea}
                          onClick={() => handleIdeaClick(idea)}
                          onVote={(dir) => handleVote(idea.id, dir)}
                          userVote={userProfile?.votedIdeas?.[idea.id]}
                          isPurchased={userProfile?.purchasedIdeas?.includes(idea.id) || false}
                          onDelete={isAdmin ? () => handleDelete(idea.id) : undefined}
                          className={cn(
                            isBoosterMode && boosterSelection.includes(idea.id) && "ring-4 ring-purple-500 ring-offset-4"
                          )}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {!loading && filteredIdeas.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">No concepts found</h3>
                  <p className="text-gray-500">Try adjusting your filters or generate a new one!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer onNavigate={setActiveTab} />

      <AnimatePresence>
        {selectedIdea && (
          <IdeaDetail
            idea={selectedIdea}
            onClose={() => setSelectedIdea(null)}
            onPurchase={(id) => {
              // Keep modal open so player can see roadmap/blueprint immediately
              console.log("Idea secured:", id);
            }}
            onStartBooster={() => {
              setSelectedIdea(null);
              setIsBoosterMode(true);
              setBoosterSelection([]);
              setActiveTab('explore');
            }}
            onViewIncrease={async (id) => {
               if (!user) return; // Prevent permission error
               try {
                 const ideaRef = doc(db, 'ideas', id);
                 await updateDoc(ideaRef, { views: increment(1) });
               } catch (err) {
                 // Squelch this or handle silently as it's background
                 console.warn("View bump failed", err);
               }
            }}
            onRemix={handleRemix}
            isPurchased={userProfile?.purchasedIdeas?.includes(selectedIdea.id) || false}
            userProfile={userProfile}
            onDelete={isAdmin ? handleDelete : undefined}
            onFavorite={async (id) => {
              if (!user || !userProfile) {
                signInWithGoogle();
                return;
              }
              const isFav = userProfile.favorites.includes(id);
              const userRef = doc(db, 'users', user.uid);
              const { arrayRemove } = await import('firebase/firestore');
              
              await updateDoc(userRef, {
                favorites: isFav ? arrayRemove(id) : arrayUnion(id)
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Selection Mode Overlay */}
      {isBoosterMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="bg-purple-500/20 p-3 rounded-2xl">
                <ShoppingBag className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-black text-lg">Vault Booster Active</h3>
                <p className="text-purple-300 text-xs font-bold uppercase tracking-widest">
                  {boosterSelection.length} / 3 Concepts Selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsBoosterMode(false);
                  setBoosterSelection([]);
                }}
                className="px-4 py-3 text-white/60 font-bold hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={boosterSelection.length !== 3}
                onClick={handleBoosterPayment}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-black shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                Unlock Bundle (₹299)
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Global Toast Placeholder */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
        {generating && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 20 }}
             className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
           >
             <Sparkles className="animate-pulse text-orange-400" size={18} />
             <span className="text-sm font-bold tracking-tight">AI is crafting a unique concept...</span>
           </motion.div>
        )}
      </div>
    </div>
  );
}
