import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, TrendingUp, Activity, Search,
  ChevronRight, Clock, Droplets, Heart, User, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useVitalsStore } from '../services/vitalsStore';

const RISK_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600', text: 'text-red-700' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700' },
  stable:   { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500', text: 'text-green-700' },
};

function getRiskLevel(vitals) {
  const glucose = parseFloat(vitals?.glucose);
  const hr = parseFloat(vitals?.heart_rate);
  const sys = parseInt(vitals?.blood_pressure?.split('/')[0]) || 120;

  if (glucose > 180 || sys > 160 || hr > 120 || hr < 45) return 'critical';
  if (glucose > 126 || sys > 140 || hr > 100) return 'warning';
  return 'stable';
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVitals, setPatientVitals] = useState(null);
  const [patientSymptoms, setPatientSymptoms] = useState([]);
  const userId = useVitalsStore(s => s.userId);

  useEffect(() => {
    if (!supabase || !userId) { setLoading(false); return; }

    const fetchPatients = async () => {
      // Get linked patient IDs
      const { data: links } = await supabase
        .from('doctor_patient_links')
        .select('patient_clerk_id')
        .eq('doctor_clerk_id', userId);

      if (!links || links.length === 0) {
        // Demo: show all patients with recent vitals
        const { data: allVitals } = await supabase
          .from('vitals_history')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(30);

        if (allVitals) {
          const grouped = {};
          allVitals.forEach(v => {
            if (!grouped[v.user_id]) grouped[v.user_id] = v;
          });
          const list = Object.values(grouped).map(v => ({
            id: v.user_id,
            name: `Patient ${v.user_id.slice(0, 8)}`,
            lastVitals: v,
            riskLevel: getRiskLevel(v),
            lastSeen: v.recorded_at,
          }));
          // Sort: critical first, then warning, then stable
          list.sort((a, b) => {
            const order = { critical: 0, warning: 1, stable: 2 };
            return (order[a.riskLevel] ?? 2) - (order[b.riskLevel] ?? 2);
          });
          setPatients(list);
        }
        setLoading(false);
        return;
      }

      const patientIds = links.map(l => l.patient_clerk_id);
      const patientList = [];

      for (const pid of patientIds) {
        const { data: vitals } = await supabase
          .from('vitals_history')
          .select('*')
          .eq('user_id', pid)
          .order('recorded_at', { ascending: false })
          .limit(1);

        const latest = vitals?.[0] || {};
        patientList.push({
          id: pid,
          name: `Patient ${pid.slice(0, 8)}`,
          lastVitals: latest,
          riskLevel: getRiskLevel(latest),
          lastSeen: latest.recorded_at || null,
        });
      }

      patientList.sort((a, b) => {
        const order = { critical: 0, warning: 1, stable: 2 };
        return (order[a.riskLevel] ?? 2) - (order[b.riskLevel] ?? 2);
      });

      setPatients(patientList);
      setLoading(false);
    };

    fetchPatients();
  }, [userId]);

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    if (!supabase) return;

    const { data: vitals } = await supabase
      .from('vitals_history')
      .select('*')
      .eq('user_id', patient.id)
      .order('recorded_at', { ascending: false })
      .limit(10);
    setPatientVitals(vitals || []);

    const { data: symptoms } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', patient.id)
      .order('logged_at', { ascending: false })
      .limit(5);
    setPatientSymptoms(symptoms || []);
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.riskLevel === 'critical').length,
    warning: patients.filter(p => p.riskLevel === 'warning').length,
    stable: patients.filter(p => p.riskLevel === 'stable').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 pb-16">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
          <Users size={30} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Predictive Triage</h1>
          <p className="text-slate-500 text-sm">Patients auto-ranked by AI risk level. Critical cases surface first.</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Patients', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Monitoring', value: stats.warning, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Stable', value: stats.stable, icon: Heart, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 border border-white shadow-sm`}>
            <s.icon size={20} className={s.color} />
            <p className="text-3xl font-black text-slate-900 mt-2">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search patients by name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 text-sm font-medium transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-violet-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No patients linked yet</p>
              <p className="text-xs mt-1">Patients will appear once they share their vault or you link them.</p>
            </div>
          ) : (
            filtered.map((patient, i) => {
              const risk = RISK_COLORS[patient.riskLevel];
              const isSelected = selectedPatient?.id === patient.id;
              return (
                <motion.button
                  key={patient.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  onClick={() => selectPatient(patient)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-5 ${
                    isSelected
                      ? 'bg-violet-50 border-violet-300 shadow-lg shadow-violet-100'
                      : `${risk.bg} ${risk.border} hover:shadow-md hover:-translate-y-0.5`
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-violet-600' : risk.badge} text-white shadow-md`}>
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{patient.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {patient.lastVitals?.glucose && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Droplets size={10} /> {patient.lastVitals.glucose} mg/dL
                        </span>
                      )}
                      {patient.lastVitals?.heart_rate && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Activity size={10} /> {patient.lastVitals.heart_rate} BPM
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${risk.text}`}>
                      {patient.riskLevel}
                    </span>
                    {patient.lastSeen && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={8} /> {new Date(patient.lastSeen).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </motion.button>
              );
            })
          )}
        </div>

        {/* Patient Detail Panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <motion.div key={selectedPatient.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${RISK_COLORS[selectedPatient.riskLevel].badge}`}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                      <p className="text-xs text-slate-400">ID: {selectedPatient.id.slice(0, 16)}…</p>
                    </div>
                  </div>

                  {/* Vitals Timeline */}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Vitals</p>
                  {patientVitals?.length > 0 ? (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {patientVitals.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                          <div className="flex items-center gap-3">
                            <Droplets size={12} className="text-blue-500" />
                            <span className="font-semibold text-slate-700">Glu: {v.glucose || '—'}</span>
                            <span className="text-slate-400">HR: {v.heart_rate || '—'}</span>
                            <span className="text-slate-400">BP: {v.blood_pressure || '—'}</span>
                          </div>
                          <span className="text-slate-300">{new Date(v.recorded_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-300">No vitals recorded.</p>}
                </div>

                {/* Symptom Logs */}
                {patientSymptoms.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Symptom Reports</p>
                    <div className="space-y-3">
                      {patientSymptoms.map((s, i) => (
                        <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs">
                          <p className="font-semibold text-slate-800">{s.translated_text?.slice(0, 80)}…</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-amber-600 font-bold uppercase">{s.severity}</span>
                            <span className="text-slate-400">{s.detected_language}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-slate-50 rounded-3xl p-12 border border-slate-100 text-center"
              >
                <Users size={40} className="mx-auto mb-4 text-slate-200" />
                <p className="text-sm font-semibold text-slate-400">Select a patient to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
