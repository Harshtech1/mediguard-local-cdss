import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Calendar, Activity, TrendingUp, TrendingDown, Minus, AlertCircle, Plus, ShieldCheck, Heart, Droplets, BrainCircuit, Database, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVitalsStore } from '../services/vitalsStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getVitalForecast } from '../services/forecastService';

const Dashboard = ({ setActiveTab }) => {
  const vitals = useVitalsStore(state => state.vitals);
  const forecasts = useVitalsStore(state => state.forecasts);
  const setGlobalForecasts = useVitalsStore(state => state.setForecasts);
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      const fetchForecasts = async () => {
        const glucoseRes = await getVitalForecast(user.id, 'glucose');
        const heartRes = await getVitalForecast(user.id, 'heart_rate');
        setGlobalForecasts({
          glucose: glucoseRes,
          heart_rate: heartRes
        });
      };
      fetchForecasts();
    }
  }, [user?.id]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 }
    }
  };

  const item = {
    hidden: { y: 24, opacity: 0, scale: 0.98 },
    show: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', damping: 20, stiffness: 100 }
    }
  };

  const statItems = [
    { 
      label: 'Heart Rate', 
      type: 'heart_rate',
      value: vitals.heartRate, 
      unit: 'BPM', 
      icon: Activity, 
      status: 'normal',
      desc: 'Resting Status'
    },
    { 
      label: 'Glucose', 
      type: 'glucose',
      value: vitals.glucose, 
      unit: 'mg/dL', 
      icon: Droplets, 
      status: parseInt(vitals.glucose) > 126 ? 'critical' : parseInt(vitals.glucose) >= 100 ? 'warning' : 'stable',
      desc: parseInt(vitals.glucose) > 126 ? 'Diabetic Range' : parseInt(vitals.glucose) >= 100 ? 'Prediabetic' : 'Fasting Optimal'
    },
    { 
      label: 'BP Status', 
      type: 'blood_pressure',
      value: vitals.bloodPressure, 
      unit: 'mmHg', 
      icon: TrendingUp, 
      status: (() => {
        const sys = parseInt(vitals.bloodPressure?.split('/')[0]);
        const dia = parseInt(vitals.bloodPressure?.split('/')[1]);
        return (sys > 140 || dia > 90) ? 'critical' : 'stable';
      })(),
      desc: (() => {
        const sys = parseInt(vitals.bloodPressure?.split('/')[0]);
        const dia = parseInt(vitals.bloodPressure?.split('/')[1]);
        if (sys > 140 || dia > 90) return 'Hypertension S2';
        if (sys < 90 || dia < 60) return 'Hypotension';
        return 'Normal Range';
      })()
    },
    { 
      label: 'BMI Index', 
      type: 'bmi',
      value: vitals.bmi, 
      unit: '', 
      icon: User, 
      status: parseFloat(vitals.bmi) > 25 ? 'warning' : 'stable',
      desc: parseFloat(vitals.bmi) > 30 ? 'Obese Class' : parseFloat(vitals.bmi) > 25 ? 'Overweight' : 'Healthy Weight'
    }
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 px-4 pb-20"
    >
      {/* Header */}
      <motion.div 
        variants={item}
        className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center space-x-8">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl">
              <User size={48} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome, {user?.firstName || 'User'}</h1>
              <div className="flex gap-4 mt-2">
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">March 3, 2026</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                  AI Forecasting Active
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => useVitalsStore.getState().seedData()} className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center">
               <Database size={20} className="mr-3 text-slate-500" /> Seed Forecast Data
             </button>
             <button onClick={() => setActiveTab('vault')} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center">
               <Plus size={20} className="mr-3" /> Add Lab Report
             </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statItems.map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            className={`bg-white p-6 rounded-[2.5rem] shadow-premium border relative flex flex-col group ${
              stat.status === 'critical' ? 'border-red-200' : 
              stat.status === 'warning' ? 'border-amber-200' : 'border-slate-100'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stat.status === 'critical' ? 'bg-red-50 text-red-600' : 
                stat.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
              }`}>
                <stat.icon size={24} />
              </div>
              
              {forecasts[stat.type]?.aiForecast?.warning_level === 'Red' && (
                <div className="text-[8px] font-black bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">PREDICTED RISK</div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-16 w-full mt-4">
               {forecasts[stat.type]?.success ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[
                     ...forecasts[stat.type].history.map(d => ({ v: d.value, isPrediction: false })),
                     { v: forecasts[stat.type].mathPrediction, isPrediction: true }
                   ]}>
                     <Area 
                       type="monotone" 
                       dataKey="v" 
                       stroke={stat.status === 'critical' ? '#ef4444' : '#3b82f6'} 
                       fill={stat.status === 'critical' ? '#fee2e2' : '#dbeafe'}
                       strokeDasharray={({ payload }) => payload && payload.isPrediction ? "5 5" : "0"}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full border border-dashed border-slate-100 rounded-xl flex items-center justify-center">
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Collecting...</span>
                 </div>
               )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase">{stat.desc}</span>
              {forecasts[stat.type]?.aiForecast?.trend_direction && (
                 <div className={`flex items-center text-[9px] font-black ${
                   forecasts[stat.type].aiForecast.trend_direction === 'Increasing' ? 'text-amber-600' : 'text-green-600'
                 }`}>
                   {forecasts[stat.type].aiForecast.trend_direction === 'Increasing' ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                   Trend
                 </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <motion.div variants={item} className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <BrainCircuit className="mr-3 text-blue-400" /> AI Forecast Insight
            </h3>
            <p className="text-blue-100 leading-relaxed italic text-lg opacity-80 mb-8">
              "Based on your 30-day history, we predict your glucose will stabilize around 92 mg/dL. The current heart rate trend is perfectly linear with your activity levels."
            </p>
            <div className="flex gap-4">
               <div className="flex-1 bg-white/10 p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-blue-300 uppercase mb-2">Glucose Forecast</p>
                 <p className="text-sm font-bold">Stable (Next Reading: ~94)</p>
               </div>
               <div className="flex-1 bg-white/10 p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Warning Level</p>
                 <p className="text-sm font-bold text-green-400">Green - Optimal</p>
               </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={item} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
           <h3 className="text-xl font-bold mb-6 flex items-center">
             <ShieldCheck className="mr-3 text-blue-600" /> Security
           </h3>
           <div className="space-y-4">
             <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                 <Activity size={18} />
               </div>
               <div>
                  <p className="text-xs font-bold uppercase text-slate-800">Local OCR</p>
                  <p className="text-[10px] text-slate-500">GPU Accelerated Extraction</p>
               </div>
             </div>
             <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center mr-4">
                 <BrainCircuit size={18} />
               </div>
               <div>
                  <p className="text-xs font-bold uppercase text-slate-800">Privacy Sync</p>
                  <p className="text-[10px] text-slate-500">Clerk + Supabase Vault</p>
               </div>
             </div>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
