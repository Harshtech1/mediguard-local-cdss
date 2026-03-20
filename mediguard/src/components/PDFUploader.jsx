import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractTextFromPDF } from '../services/pdfParser';
import { extractVitals } from '../services/medicalParser';
import { useVitalsStore } from '../services/vitalsStore';

const PDFUploader = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const updateVitals = useVitalsStore(state => state.updateVitals);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF medical report.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const text = await extractTextFromPDF(file);
      const vitals = extractVitals(text);
      
      // Filter out null values
      const cleanVitals = {};
      Object.entries(vitals).forEach(([k, v]) => {
        if (v !== null) cleanVitals[k] = v;
      });

      await updateVitals(cleanVitals);
      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete(file.name, text);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('PDF Processing Error:', err);
      setError('Failed to parse PDF. Ensure it is not password protected.');
    } finally {
      setLoading(false);
    }
  }, [updateVitals, onComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false 
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`relative overflow-hidden cursor-pointer transition-all duration-500 border-2 border-dashed rounded-[2.5rem] p-12 text-center group ${
          isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.99] shadow-inner' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 mb-6 border border-blue-200">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 tracking-tight">Extracting Vitals...</h4>
              <p className="text-slate-500 text-sm font-medium mt-2">OCR is processing your report locally.</p>
            </motion.div>
          ) : success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600 mb-6 shadow-xl shadow-green-100/50">
                <CheckCircle size={32} className="fill-green-50" />
              </div>
              <h4 className="text-xl font-bold text-green-800 tracking-tight italic">Bio-Sync Complete!</h4>
            </motion.div>
          ) : (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 rounded-[2rem] flex items-center justify-center text-blue-600 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                <Upload size={32} className="group-hover:-translate-y-1 transition-transform" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 tracking-tight">Drop Lab Report Here</h4>
              <p className="text-slate-500 text-sm font-medium mt-2">Supports any standard PDF blood test or medical report.</p>
              <div className="mt-8 flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-blue-500/60 transition-opacity">
                <Sparkles size={12} />
                <span>Local GPU-Powered OCR</span>
                <Sparkles size={12} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center space-x-2 text-red-600 font-bold bg-red-50 py-3 px-6 rounded-2xl border border-red-100"
          >
            <AlertCircle size={16} />
            <span className="text-xs">{error}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PDFUploader;
