import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Building2, Star, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { createCheckoutSession } from '../services/stripe';
import { useUser } from '@clerk/clerk-react';

const STATIC_PLANS = [
  {
    name: 'Free',
    price: 0,
    currency: 'USD',
    description: 'Essential health monitoring for individuals.',
    features: [
      'Vitals tracking',
      'AI health tips',
      'PDF report upload (3/mo)',
      'Community support',
    ],
    icon: Shield,
    color: 'from-slate-500 to-slate-700',
    highlight: false,
    cta: 'Get Started Free',
  },
  {
    name: 'Pro',
    price: 9.99,
    currency: 'USD',
    description: 'Advanced analytics for health-conscious users.',
    features: [
      'Everything in Free',
      'Unlimited PDF uploads',
      'Personalised diet plans',
      'Clinical SBAR reports',
      'Priority email support',
      'Data export (CSV / JSON)',
    ],
    icon: Zap,
    color: 'from-blue-500 to-indigo-600',
    highlight: true,
    cta: 'Start Pro',
  },
  {
    name: 'Enterprise',
    price: null,
    currency: 'USD',
    description: 'Custom solutions for clinics & research.',
    features: [
      'Everything in Pro',
      'On-premise deployment',
      'Custom AI model integration',
      'Dedicated account manager',
      'HIPAA compliance kit',
      'SLA 99.9% uptime',
    ],
    icon: Building2,
    color: 'from-violet-500 to-purple-700',
    highlight: false,
    cta: 'Contact Sales',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const Shimmer = () => (
  <motion.div
    initial={{ x: '-150%' }}
    animate={{ x: '150%' }}
    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none z-10"
  />
);

export default function PricingScreen() {
  const { user } = useUser();
  const [plans, setPlans] = useState(STATIC_PLANS);
  const [loading, setLoading] = useState(true);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [purchasing, setPurchasing] = useState(null);

  const handlePurchase = async (plan) => {
    if (plan.name.toLowerCase() === 'free') return;
    setPurchasing(plan.name);
    try {
      await createCheckoutSession(plan.name.toLowerCase(), user?.id);
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setPurchasing(null);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('pricing_plans').select('*').order('price');
      if (!error && data && data.length > 0) {
        const merged = STATIC_PLANS.map((sp) => {
          const dbPlan = data.find((d) => d.name.toLowerCase() === sp.name.toLowerCase());
          if (!dbPlan) return sp;
          return {
            ...sp,
            price: dbPlan.price,
            description: dbPlan.description,
            features: Array.isArray(dbPlan.features)
              ? dbPlan.features
              : JSON.parse(dbPlan.features ?? '[]'),
          };
        });
        setPlans(merged);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const displayPrice = (plan) => {
    if (plan.price === null || plan.price === undefined) return 'Custom';
    if (plan.price === 0) return 'Free';
    const monthly = plan.price;
    const annual = (monthly * 10).toFixed(2);
    return billingAnnual ? `$${annual} /yr` : `$${monthly.toFixed(2)} /mo`;
  };

  return (
    <div className="min-h-full py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-4 text-blue-700 text-sm font-medium">
          <Sparkles size={14} />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
          Choose Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
            Health Plan
          </span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-lg">
          All plans include secure local data storage, AI-powered clinical insights, and zero cloud exposure of your health data.
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${!billingAnnual ? 'text-slate-800' : 'text-slate-400'}`}>Monthly</span>
          <button
            onClick={() => setBillingAnnual((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${billingAnnual ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${billingAnnual ? 'translate-x-6' : ''}`}
            />
          </button>
          <span className={`text-sm font-medium flex items-center gap-1 ${billingAnnual ? 'text-slate-800' : 'text-slate-400'}`}>
            Annual
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Save 17%</span>
          </span>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl overflow-hidden border ${
                  plan.highlight
                    ? 'border-blue-400 shadow-2xl shadow-blue-100'
                    : 'border-slate-200 shadow-md'
                } bg-white flex flex-col`}
              >
                {plan.highlight && (
                  <>
                    <Shimmer />
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                      <Star size={10} fill="white" />
                      Most Popular
                    </div>
                  </>
                )}

                <div className={`h-2 w-full bg-gradient-to-r ${plan.color}`} />

                <div className="p-7 flex flex-col flex-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                  <p className="text-slate-500 text-sm mb-5">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">{displayPrice(plan)}</span>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((feat, i) => (
                      <motion.li
                        key={feat}
                        custom={i}
                        variants={featureVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-start gap-2.5 text-sm text-slate-700"
                      >
                        <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </span>
                        {feat}
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePurchase(plan)}
                    disabled={purchasing === plan.name}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-md shadow-blue-200'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    } ${purchasing === plan.name ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {purchasing === plan.name ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-slate-400 text-sm mt-10"
      >
        🔒 HIPAA-Ready · Zero cloud exposure · Cancel any time
      </motion.p>
    </div>
  );
}
