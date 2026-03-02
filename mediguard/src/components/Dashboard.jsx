import React from 'react';
import { User, Calendar, Activity, TrendingUp, AlertCircle, PlayCircle, Plus, ShieldCheck, Heart, Droplets, Thermometer, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVitalsStore } from '../services/vitalsStore';

const Dashboard = ({ setActiveTab }) => {
  const vitals = useVitalsStore(state => state.vitals);

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

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 px-4 pb-20"
    >
      {/* Premium Profile Header */}
      <motion.div 
        variants={item}
        className="glass p-10 rounded-[3rem] shadow-premium relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/10 transition-colors duration-700" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center space-x-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                <User size={48} className="fill-white/20" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome, User</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center text-sm font-bold text-slate-500 bg-slate-100/50 px-4 py-1.5 rounded-full border border-slate-200/50"><Calendar size={14} className="mr-2" /> March 2, 2026</span>
                <span className="flex items-center text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100"><ShieldCheck size={14} className="mr-2" /> GPU Sandbox: Secured</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center"
            >
              <Heart size={20} className="mr-3 text-red-400 fill-red-400" /> Vitals History
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('vault')}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center group/btn"
            >
              <Plus size={20} className="mr-3 group-hover/btn:rotate-90 transition-transform" /> Add Lab Report
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid with Staggered Entrance */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {[
          { 
            label: 'Heart Rate', 
            value: vitals.heartRate, 
            unit: 'BPM', 
            icon: Activity, 
            color: 'rose', 
            desc: 'Resting Status',
            status: 'normal' 
          },
          { 
            label: 'Glucose', 
            value: vitals.glucose, 
            unit: 'mg/dL', 
            icon: Droplets, 
            color: parseInt(vitals.glucose) > 126 ? 'red' : parseInt(vitals.glucose) >= 100 ? 'amber' : 'emerald', 
            desc: parseInt(vitals.glucose) > 126 ? 'Diabetic Range' : parseInt(vitals.glucose) >= 100 ? 'Prediabetic' : 'Fasting Optimal',
            status: parseInt(vitals.glucose) > 126 ? 'critical' : parseInt(vitals.glucose) >= 100 ? 'warning' : 'stable'
          },
          { 
            label: 'BP Status', 
            value: vitals.bloodPressure, 
            unit: 'mmHg', 
            icon: TrendingUp, 
            color: (() => {
              const sys = parseInt(vitals.bloodPressure?.split('/')[0]);
              const dia = parseInt(vitals.bloodPressure?.split('/')[1]);
              return (sys > 140 || dia > 90) ? 'red' : (sys < 90 || dia < 60) ? 'blue' : 'blue';
            })(),
            desc: (() => {
              const sys = parseInt(vitals.bloodPressure?.split('/')[0]);
              const dia = parseInt(vitals.bloodPressure?.split('/')[1]);
              if (sys > 140 || dia > 90) return 'Hypertension S2';
              if (sys < 90 || dia < 60) return 'Hypotension';
              return 'Normal Range';
            })(),
            status: (() => {
              const sys = parseInt(vitals.bloodPressure?.split('/')[0]);
              const dia = parseInt(vitals.bloodPressure?.split('/')[1]);
              return (sys > 140 || dia > 90) ? 'critical' : 'stable';
            })()
          },
          { 
            label: 'BMI Index', 
            value: vitals.bmi, 
            unit: '', 
            icon: User, 
            color: parseFloat(vitals.bmi) > 30 ? 'red' : parseFloat(vitals.bmi) > 25 ? 'amber' : 'emerald', 
            desc: parseFloat(vitals.bmi) > 30 ? 'Obese Class' : parseFloat(vitals.bmi) > 25 ? 'Overweight' : 'Healthy Weight',
            status: parseFloat(vitals.bmi) > 25 ? 'warning' : 'stable'
          }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            whileHover={{ 
              y: -10, 
              scale: 1.02,
              transition: { type: 'spring', stiffness: 400, damping: 10 } 
            }}
            className={`bg-white p-8 rounded-[2.5rem] shadow-premium border transition-all duration-500 group relative overflow-hidden ${
              stat.status === 'critical' ? 'border-red-200 shadow-red-100 ring-2 ring-red-500/10' : 
              stat.status === 'warning' ? 'border-amber-200 shadow-amber-100' : 
              'border-slate-100 hover:border-blue-200 shadow-slate-100'
            }`}
          >
            {/* Dynamic Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
              stat.status === 'critical' ? 'from-red-500/5 to-rose-500/5' : 
              stat.status === 'warning' ? 'from-amber-500/5 to-orange-500/5' : 
              'from-blue-500/5 to-indigo-500/5'
            }`} />
            
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150 ${
              stat.status === 'critical' ? 'bg-red-500/5' : 
              stat.status === 'warning' ? 'bg-amber-500/5' : 
              'bg-blue-500/5'
            }`} />

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-300 ${
              stat.status === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' : 
              stat.status === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
              'bg-slate-50 text-slate-600 border border-slate-100'
            }`}>
              <stat.icon size={28} className={stat.status === 'critical' ? 'animate-pulse' : ''} />
            </div>

            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-1 ${
              stat.status === 'critical' ? 'text-red-400' : 
              stat.status === 'warning' ? 'text-amber-500' : 
              'text-slate-400'
            }`}>{stat.label}</p>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-4xl font-black tracking-tighter ${
                stat.status === 'critical' ? 'text-red-900' : 
                stat.status === 'warning' ? 'text-amber-900' : 
                'text-slate-900'
              }`}>{stat.value}</span>
              <span className="text-sm font-bold text-slate-400">{stat.unit}</span>
            </div>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
              stat.status === 'critical' ? 'bg-red-100 text-red-700' : 
              stat.status === 'warning' ? 'bg-amber-100 text-amber-700' : 
              'bg-slate-100 text-slate-600'
            }`}>
              {stat.desc}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* AI Bio-Sync Center */}
        <motion.div 
          variants={item}
          className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20" />
          <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
             <BrainCircuit size={300} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                  <Activity size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">AI Bio-Analysis Engine</h3>
                  <p className="text-blue-200/60 text-sm font-medium">Real-time inference on AMD Radeon™</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">Stable Sync</span>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md">
                <p className="text-xl leading-relaxed font-medium italic text-blue-50">
                  "Bio-markers indicate stable metabolic health. Your glucose levels are maintained at {vitals.glucose} mg/dL. Correlation with heart rate suggests optimal cardiovascular efficiency during resting states."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-600/20 border border-blue-500/20 rounded-2xl">
                  <h4 className="text-xs font-black text-blue-300 uppercase tracking-widest mb-3">Next Step</h4>
                  <p className="text-sm font-medium text-blue-50">Maintain fiber intake to stabilize glucose peaks detected last week.</p>
                </div>
                <div className="p-6 bg-indigo-600/20 border border-indigo-500/20 rounded-2xl">
                  <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">Recommendation</h4>
                  <p className="text-sm font-medium text-indigo-50">Hydration target: 3.2L today based on current sodium levels.</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('chat')}
                className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-50 transition-all text-xs uppercase tracking-[0.2em] shadow-xl"
              >
                Launch Deep Consultation
              </button>
            </div>
          </div>
        </motion.div>

        {/* Clinical Integrity & Alerts */}
        <motion.div variants={item} className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 flex flex-col h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-8 tracking-tight flex items-center">
               <AlertCircle size={20} className="mr-3 text-blue-600" /> Security Intelligence
            </h3>
            <div className="space-y-6 flex-grow">
              <div className="flex items-start space-x-5 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 group cursor-default">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-widest">Local-Only Memory</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">Data is scrubbed from RAM every 15 minutes. No disk persistance found.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 group cursor-default">
                <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 shrink-0 group-hover:scale-110 transition-transform">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Compute Node: Active</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">Verified local AMD Radeon hardware acceleration enabled via Foundry.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-100">
               <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span>System Integrity</span>
                  <span className="text-green-600">99.9%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '99.9%' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full bg-green-500" 
                  />
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
