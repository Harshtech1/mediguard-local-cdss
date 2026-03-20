import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, ScanLine, AlertTriangle, CheckCircle2, RotateCcw,
  Pill, Info, ShieldAlert, ChevronDown, ChevronUp, Microscope,
  FileImage, X
} from 'lucide-react';
import { analyzePrescriptionImage } from '../services/aiService';
import { useVitalsStore } from '../services/vitalsStore';

// ─── Animation Variants ──────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.1, ease: 'easeOut' }
  }),
};

const scanLine = {
  animate: {
    top: ['5%', '95%', '5%'],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Medicine Card ────────────────────────────────────────
function MedicineCard({ med, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="bg-white border border-slate-100 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Header bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

      <div className="p-6">
        {/* Name + dosage */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-blue-700 leading-tight">{med.medicineName}</h3>
            <span className="inline-block mt-1 text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
              {med.dosage}
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Pill size={18} className="text-blue-600" />
          </div>
        </div>

        {/* Purpose */}
        <div className="flex items-start gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
          <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600 leading-relaxed">{med.purpose}</p>
        </div>

        {/* Warnings */}
        {med.warnings && med.warnings !== 'None noted' && (
          <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <ShieldAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">{med.warnings}</p>
          </div>
        )}

        {/* Side effects collapsible */}
        {med.commonSideEffects?.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors border-t border-slate-100 pt-3"
          >
            <span>Side Effects ({med.commonSideEffects.length})</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3 space-y-1.5"
            >
              {med.commonSideEffects.map((se, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {se}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function PrescriptionScanner() {
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [medicines, setMedicines] = useState([]);
  const inputRef = useRef(null);

  const addScannedPrescription = useVitalsStore(s => s.addScannedPrescription);
  const scannedPrescriptions = useVitalsStore(s => s.scannedPrescriptions);

  const acceptFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStatus('idle');
    setMedicines([]);
    setErrorMsg('');
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    acceptFile(file);
  }, [acceptFile]);

  const onInputChange = (e) => acceptFile(e.target.files[0]);

  const handleScan = async () => {
    if (!imageFile) return;
    setStatus('scanning');
    setMedicines([]);
    setErrorMsg('');

    const result = await analyzePrescriptionImage(imageFile);

    if (!result.success) {
      setStatus('error');
      setErrorMsg(result.error);
      return;
    }

    if (result.medicines.length === 0) {
      setStatus('error');
      setErrorMsg('No medications detected. Make sure the prescription is legible and well-lit.');
      return;
    }

    setMedicines(result.medicines);
    setStatus('success');

    // Persist to Zustand store
    addScannedPrescription({
      id: Date.now(),
      filename: imageFile.name,
      scannedAt: new Date().toISOString(),
      medicines: result.medicines,
    });
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setStatus('idle');
    setMedicines([]);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-5">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <Microscope size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Smart Prescription Decoder</h2>
          <p className="text-slate-500 text-sm mt-0.5">Upload a prescription image — AI reads, decodes, and explains every medication.</p>
        </div>
      </motion.div>

      {/* ── Drop Zone ── */}
      <motion.div
        variants={fadeUp}
        custom={1}
        initial="hidden"
        animate="visible"
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !imageFile && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : imagePreview
            ? 'border-slate-200 bg-white cursor-default'
            : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />

        {!imagePreview ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
              <FileImage size={28} className="text-blue-600" />
            </div>
            <p className="text-base font-semibold text-slate-700 mb-2">Drop your prescription here</p>
            <p className="text-sm text-slate-400">or <span className="text-blue-600 font-semibold">click to browse</span></p>
            <p className="text-xs text-slate-300 mt-3">Supports JPG, PNG, HEIC, WEBP</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Prescription preview"
              className="w-full max-h-72 object-contain bg-white rounded-3xl"
              style={{ objectFit: 'contain' }}
            />

            {/* Scanning overlay */}
            <AnimatePresence>
              {status === 'scanning' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                >
                  {/* Scan line animation */}
                  <motion.div
                    className="absolute left-6 right-6 h-0.5 bg-blue-400/80"
                    variants={scanLine}
                    animate="animate"
                    style={{ boxShadow: '0 0 12px 4px rgba(96,165,250,0.7)' }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-white/30 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-white text-sm font-semibold">Analyzing with Groq AI…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clear button */}
            {status !== 'scanning' && (
              <button
                onClick={reset}
                className="absolute top-3 right-3 w-8 h-8 bg-slate-900/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
          >
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA Buttons ── */}
      {imageFile && status !== 'scanning' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScan}
            disabled={status === 'scanning'}
            className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:opacity-90 transition-all text-sm"
          >
            <ScanLine size={18} />
            Analyze Prescription
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={reset}
            className="flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-all text-sm"
          >
            <RotateCcw size={16} />
            Reset
          </motion.button>
        </motion.div>
      )}

      {/* ── Success Banner ── */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl"
          >
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-800">
              {medicines.length} medication{medicines.length !== 1 ? 's' : ''} decoded and saved to your Health Vault.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Medicine Cards Grid ── */}
      <AnimatePresence>
        {medicines.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Pill size={18} className="text-blue-600" />
              Decoded Medications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {medicines.map((med, i) => (
                <MedicineCard key={i} med={med} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Previous Scans History ── */}
      {scannedPrescriptions.length > 0 && medicines.length === 0 && (
        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="text-base font-bold text-slate-700">Previous Scans (this session)</h3>
          <div className="space-y-3">
            {scannedPrescriptions.map((scan) => (
              <button
                key={scan.id}
                onClick={() => setMedicines(scan.medicines)}
                className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileImage size={16} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{scan.filename}</p>
                    <p className="text-xs text-slate-400">{new Date(scan.scannedAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full">
                  {scan.medicines.length} meds
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── HIPAA note ── */}
      <p className="text-xs text-slate-300 text-center pt-4">
        🔒 Images are processed locally and never stored on any server. Analysis uses Groq Cloud AI.
      </p>
    </div>
  );
}
