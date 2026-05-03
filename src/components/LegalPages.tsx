import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, FileText, AlertCircle, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  icon: React.ReactNode;
  lastUpdated: string;
  onBack: () => void;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalPageProps> = ({ title, icon, lastUpdated, onBack, children }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-4xl mx-auto px-4 py-20"
  >
    <button 
      onClick={onBack}
      className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-orange-600 transition-colors mb-12 group"
    >
      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
      Return to Vault
    </button>

    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
        {icon}
      </div>
      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">{title}</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Last updated: {lastUpdated}</p>
      </div>
    </div>

    <div className="prose prose-orange max-w-none">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm text-gray-600 leading-relaxed space-y-6">
        {children}
      </div>
    </div>
  </motion.div>
);

export const PrivacyPolicy = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout 
    title="Privacy Policy" 
    icon={<Shield size={24} />} 
    lastUpdated="May 2026"
    onBack={onBack}
  >
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">1. Data Collection</h2>
      <p>IdeaVault collects minimal personal information necessary to provide our services. This includes your name, email address, and profile information provided during Google Authentication.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">2. Intellectual Property</h2>
      <p>Your ideas are your own. We do not claim ownership of any concepts uploaded to IdeaVault. All data is encrypted and stored securely to ensure your innovations remain confidential.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">3. Cookies & Tracking</h2>
      <p>We use essential cookies to maintain your session and improve site performance. We do not use tracking cookies for advertising purposes.</p>
    </section>
  </LegalLayout>
);

export const TermsOfService = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout 
    title="Terms of Service" 
    icon={<FileText size={24} />} 
    lastUpdated="May 2026"
    onBack={onBack}
  >
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
      <p>By accessing IdeaVault, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">2. Marketplace Transactions</h2>
      <p>All sales in the IdeaVault marketplace are final. Once a concept is purchased, the transfer of conceptual intellectual property is immediate.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">3. Prohibited Conduct</h2>
      <p>Users are prohibited from uploading malicious content, infringing on others' IP, or attempting to breach platform security measures.</p>
    </section>
  </LegalLayout>
);

export const Disclaimer = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout 
    title="Disclaimer" 
    icon={<AlertCircle size={24} />} 
    lastUpdated="May 2026"
    onBack={onBack}
  >
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">1. Financial Risk</h2>
      <p>The innovation marketplace involves risk. IdeaVault does not guarantee the commercial success of any idea listed or purchased through the platform.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">2. Legal Advice</h2>
      <p>Content on this site is not legal advice. Users are encouraged to consult with IP attorneys for formal patent or trademark processes.</p>
    </section>
  </LegalLayout>
);

export const SecurityPolicy = ({ onBack }: { onBack: () => void }) => (
  <LegalLayout 
    title="Data Security" 
    icon={<Lock size={24} />} 
    lastUpdated="May 2026"
    onBack={onBack}
  >
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">1. Encryption</h2>
      <p>All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256 standards, ensuring your project blueprints remain inaccessible to unauthorized parties.</p>
    </section>
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4">2. Infrastructure</h2>
      <p>Our platform is built on Google Cloud Platform, utilizing Firestore's enterprise-grade security rules and isolated database instances.</p>
    </section>
  </LegalLayout>
);
