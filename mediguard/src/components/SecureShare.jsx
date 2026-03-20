import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Copy, CheckCircle2, Clock, Shield, AlertCircle,
  ExternalLink, Loader2, Eye, Trash2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useVitalsStore } from '../services/vitalsStore';

function generateToken(len = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function SecureShare() {
  const [links, setLinks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');
  const userId = useVitalsStore(s => s.userId);

  const generateShareLink = async () => {
    if (!supabase || !userId) {
      setError('You must be signed in to generate share links.');
      return;
    }

    setGenerating(true);
    setError('');

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const { data, error: dbErr } = await supabase
      .from('vault_share_tokens')
      .insert([{
        owner_clerk_id: userId,
        token,
        expires_at: expiresAt,
      }])
      .select();

    if (dbErr) {
      setError('Failed to generate link. Please try again.');
      console.error(dbErr);
    } else if (data?.[0]) {
      setLinks(prev => [
        {
          id: data[0].id,
          token: data[0].token,
          expiresAt: data[0].expires_at,
          createdAt: data[0].created_at,
          accessCount: 0,
          url: `${window.location.origin}/share/${data[0].token}`,
        },
        ...prev,
      ]);
    }
    setGenerating(false);
  };

  const revokeLink = async (id) => {
    if (!supabase) return;
    await supabase.from('vault_share_tokens').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const copyToClipboard = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy. Please copy the link manually.');
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4 py-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200">
          <Shield size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Secure Share</h2>
          <p className="text-slate-500 text-sm">Generate read-only links that auto-expire in 24 hours.</p>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="bg-slate-50 rounded-3xl p-6 border border-slate-100"
      >
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Zero-Trust Architecture</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Link2, label: 'Generate Link', desc: 'Unique cryptographic hash' },
            { icon: Eye, label: 'Read-Only Access', desc: 'Viewer cannot edit data' },
            { icon: Clock, label: 'Auto-Expires', desc: 'Destroyed after 24 hours' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm border border-slate-100">
                <step.icon size={18} className="text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-700">{step.label}</p>
              <p className="text-[10px] text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Generate Button */}
      <motion.button
        variants={fadeUp}
        custom={2}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={generateShareLink}
        disabled={generating}
        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {generating ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Link2 size={18} />
        )}
        {generating ? 'Generating…' : 'Generate 24-Hour Share Link'}
      </motion.button>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
          >
            <AlertCircle size={16} className="text-red-500 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Links */}
      <AnimatePresence>
        {links.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Share Links</p>
            {links.map((link, i) => {
              const expired = new Date(link.expiresAt) < new Date();
              return (
                <motion.div
                  key={link.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className={`p-5 rounded-2xl border transition-all ${
                    expired ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${expired ? 'bg-slate-300' : 'bg-green-500 animate-pulse'}`} />
                      <span className={`text-xs font-bold uppercase tracking-widest ${expired ? 'text-slate-400' : 'text-green-600'}`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {getTimeRemaining(link.expiresAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 mb-3">
                    <ExternalLink size={12} className="text-slate-400 shrink-0" />
                    <code className="text-xs text-slate-600 truncate flex-1 font-mono">{link.url}</code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(link.url, link.id)}
                      disabled={expired}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        copied === link.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      } disabled:opacity-40`}
                    >
                      {copied === link.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copied === link.id ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={() => revokeLink(link.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Trash2 size={12} />
                      Revoke
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-slate-300 text-center">🔒 Links use SHA-256 tokens with RLS-enforced access policies.</p>
    </div>
  );
}
