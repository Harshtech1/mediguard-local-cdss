import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Shield, Settings as SettingsIcon, Stethoscope, 
  Activity, CheckCircle2, AlertCircle, Database, Layout
} from 'lucide-react';
import { useRole } from '../hooks/useRole';
import { useUser } from '@clerk/clerk-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function SettingsScreen() {
  const { role, setRole, loading } = useRole();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);

  const handleRoleChange = async (newRole) => {
    setSaving(true);
    await setRole(newRole);
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-5">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm">
          <SettingsIcon size={26} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Platform Settings</h2>
          <p className="text-slate-500 text-sm">Configure your identity and access permissions within MediGuard.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="md:col-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <User size={120} />
          </div>
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden shadow-lg mb-4">
              <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-slate-900">{user?.fullName || 'User'}</h3>
            <p className="text-xs text-slate-400 mb-6">{user?.primaryEmailAddress?.emailAddress}</p>
            
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              role === 'doctor' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
            }`}>
              Current Role: {role}
            </div>
          </div>
        </motion.div>

        {/* Role Switcher */}
        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Role-Based Access
            </h3>
            <p className="text-xs text-slate-500 mb-8 leading-relaxed">
              MediGuard changes its entire logic engine based on your role. Patient accounts focus on personal monitoring and vault logic, while Provider accounts access triage tools and clinical scribing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Role */}
              <button 
                onClick={() => handleRoleChange('patient')}
                disabled={role === 'patient' || saving}
                className={`flex flex-col p-6 rounded-2xl border-2 transition-all ${
                  role === 'patient' 
                    ? 'border-blue-600 bg-blue-50/50 cursor-default' 
                    : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${role === 'patient' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Activity size={20} />
                </div>
                <p className="font-bold text-slate-900 mb-1">Patient Portal</p>
                <p className="text-[10px] text-slate-500 leading-relaxed text-left">Access personal vitals, AI assistant, and health docs vault.</p>
                {role === 'patient' && <CheckCircle2 size={16} className="text-blue-600 ml-auto mt-2" />}
              </button>

              {/* Doctor Role */}
              <button 
                onClick={() => handleRoleChange('doctor')}
                disabled={role === 'doctor' || saving}
                className={`flex flex-col p-6 rounded-2xl border-2 transition-all ${
                  role === 'doctor' 
                    ? 'border-violet-600 bg-violet-50/50 cursor-default' 
                    : 'border-slate-100 hover:border-violet-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${role === 'doctor' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Stethoscope size={20} />
                </div>
                <p className="font-bold text-slate-900 mb-1">Provider Portal</p>
                <p className="text-[10px] text-slate-500 leading-relaxed text-left">Manage patients, AI triage, and voice-to-SOAP note scribe.</p>
                {role === 'doctor' && <CheckCircle2 size={16} className="text-violet-600 ml-auto mt-2" />}
              </button>
            </div>

            {saving && (
              <div className="mt-6 flex items-center gap-2 text-blue-600 text-sm font-bold animate-pulse">
                <Loader2 size={16} className="animate-spin" /> Updating Identity Engine...
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start gap-4">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-amber-800">Permission Protocol</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Switching roles will refresh your session and update all Row Level Security (RLS) policies in real-time. Changes are immediately persisted in the global user_profiles table.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pt-10 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
          <Database size={10} /> MediGuard v2.4-CDSS System Architecture
        </p>
      </div>
    </div>
  );
}
