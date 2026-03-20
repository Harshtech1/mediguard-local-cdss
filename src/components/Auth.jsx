import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Lock, Sparkles } from 'lucide-react';

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16 max-w-5xl mx-auto px-6">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex-1 text-center lg:text-left"
        >
          <div className="flex items-center justify-center lg:justify-start mb-8 space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              MediGuard <span className="text-blue-400">Local</span>
            </h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Your Health Data,<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Secured Locally.
            </span>
          </h2>

          <p className="text-lg text-blue-200/60 leading-relaxed max-w-md font-medium mb-10">
            AI-powered clinical decision support with zero-cloud data exposure. 
            Your vitals, your device, your control.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            {[
              { icon: ShieldCheck, text: 'Zero-Cloud Privacy' },
              { icon: Lock, text: 'HIPAA-Ready' },
              { icon: Sparkles, text: 'AI-Powered CDSS' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
              >
                <Icon size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Clerk Sign-In */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="flex-shrink-0"
        >
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                cardBox: 'shadow-2xl shadow-black/40',
                card: 'bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20',
                headerTitle: 'text-slate-900 font-extrabold tracking-tight',
                headerSubtitle: 'text-slate-500 font-medium',
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-200/50 transition-all',
                formFieldInput:
                  'rounded-xl border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium',
                footerActionLink: 'text-blue-600 font-bold hover:text-blue-700',
                socialButtonsBlockButton:
                  'border-slate-200 hover:bg-slate-50 rounded-xl font-medium transition-all',
                dividerLine: 'bg-slate-200',
                dividerText: 'text-slate-400 font-medium',
              },
            }}

          />
        </motion.div>
      </div>

      {/* Bottom attribution */}
      <div className="absolute bottom-6 text-center w-full">
        <p className="text-xs text-blue-300/30 font-medium tracking-wider">
          Protected by Clerk Authentication · MediGuard CDSS v1.0
        </p>
      </div>
    </div>
  );
};

export default Auth;
