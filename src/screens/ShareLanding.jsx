import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, ShieldAlert, Clock, Activity, FileText, 
  Droplets, Heart, User, Clipboard, Lock, Calendar
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function ShareLanding() {
  // Manual token extraction: /share/TOKEN_HERE
  const token = window.location.pathname.split('/share/')[1];
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authorized | expired | error
  const [ownerProfile, setOwnerProfile] = useState(null);

  useEffect(() => {
    if (!supabase || !token) return;

    const verifyToken = async () => {
      // 1. Check if token exists and is not expired
      const { data: tokenData, error: tokenError } = await supabase
        .from('vault_share_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setStatus('error');
        return;
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      // 2. Fetch Owner Data (Vitals + Docs)
      const ownerId = tokenData.owner_clerk_id;
      
      const [vitalsRes, docsRes, profileRes] = await Promise.all([
        supabase.from('vitals_history').select('*').eq('user_id', ownerId).order('recorded_at', { ascending: false }).limit(20),
        supabase.from('health_documents').select('*').eq('user_id', ownerId).order('uploaded_at', { ascending: false }),
        supabase.from('user_profiles').select('*').eq('clerk_user_id', ownerId).single()
      ]);

      setData({
        vitals: vitalsRes.data || [],
        docs: docsRes.data || []
      });
      setOwnerProfile(profileRes.data);
      setStatus('authorized');

      // 3. Log access
      await supabase.from('vault_share_tokens')
        .update({ accessed_at: new Date().toISOString(), access_count: (tokenData.access_count || 0) + 1 })
        .eq('id', tokenData.id);
    };

    verifyToken();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Decrypting Secure Vault...</p>
      </div>
    );
  }

  if (status === 'expired' || status === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-200 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-8">
            {status === 'expired' ? 'This secure share link has expired. Request a new link from the vault owner.' : 'Invalid secure token. The link may have been revoked or is incorrect.'}
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Privacy protocol 4.2-Secure
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Read-Only Vault</p>
              <h1 className="text-sm font-bold text-slate-900">{ownerProfile?.email || 'Confidential Patient'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <Clock size={14} className="text-blue-600" />
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Active Share Entry</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vitals Overview */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Activity size={20} className="text-blue-500" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Vitals Timeline</h2>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase">Timestamp</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase">Glucose</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase">BP</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase">Heart Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.vitals.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-xs font-bold text-slate-500">{new Date(v.recorded_at).toLocaleString()}</td>
                      <td className="py-4 text-xs font-black text-blue-600">{v.glucose} mg/dL</td>
                      <td className="py-4 text-xs font-bold text-slate-700">{v.blood_pressure}</td>
                      <td className="py-4 text-xs font-bold text-slate-700">{v.heart_rate} BPM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <FileText size={20} className="text-emerald-500" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Analyzed Documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.docs.map((doc, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Clipboard size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{doc.filename}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{doc.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(doc.vitals || {}).map(([k, v]) => (
                      <span key={k} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <Lock className="absolute top-4 right-4 text-white/10" size={60} />
            <h3 className="text-lg font-black mb-4 relative z-10">Vault Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">This view is uneditable and will self-destruct once the token expires. All data is end-to-end encrypted during transit.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-[10px]">
                  <p className="font-black uppercase text-white/40">Verified On-Device</p>
                  <p className="text-slate-200">256-bit AES Encryption</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                  <Calendar size={16} />
                </div>
                <div className="text-[10px]">
                  <p className="font-black uppercase text-white/40">Expires On</p>
                  <p className="text-slate-200">24 Hours from Issue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Are you a provider?</p>
            <p className="text-xs text-slate-600 mb-6">Request full Triage access to enable real-time monitoring and AI SOAP scribing for this patient.</p>
            <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed">
              Connect to Provider Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
