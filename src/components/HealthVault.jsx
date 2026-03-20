import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, Shield, Upload, Clock, Search, ExternalLink, Pin, Trash2, CheckCircle, Database, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractVitals, formatMedicalSummary } from '../services/medicalParser';
import { extractTextFromPDF } from '../services/pdfParser';
import { useVitalsStore } from '../services/vitalsStore';
import { supabase } from '../services/supabaseClient';

const HealthVault = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinContent, setPinContent] = useState('');
  const updateVitals = useVitalsStore(state => state.updateVitals);
  const userId = useVitalsStore(state => state.userId);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase
  useEffect(() => {
    const fetchReports = async () => {
      if (!supabase || !userId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('health_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(d => ({
          id: d.id,
          name: d.filename,
          date: new Date(d.uploaded_at).toLocaleDateString(),
          type: 'PDF',
          status: 'Analyzed',
          summary: d.extracted_data?.summary || 'No summary available'
        }));
        setReports(mapped);
      }
      setLoading(false);
    };
    fetchReports();
  }, [userId]);

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const text = await extractTextFromPDF(file);
      const vitals = extractVitals(text);
      const cleanVitals = {};
      Object.entries(vitals).forEach(([k, v]) => { if (v !== null) cleanVitals[k] = v; });
      await updateVitals(cleanVitals);
      
      const summary = formatMedicalSummary(cleanVitals);
      
      // Save to Supabase
      if (supabase) {
        const { data, error } = await supabase.from('health_documents').insert([{
          user_id: userId,
          filename: file.name,
          extracted_data: { summary, vitals: cleanVitals },
        }]).select();

        if (error) throw error;
      }

      setReports(prev => [{
        id: Date.now(),
        name: file.name.replace('.pdf', ''),
        date: new Date().toLocaleDateString(),
        type: 'PDF',
        status: 'Analyzed',
        summary: summary || 'Vitals extracted successfully',
      }, ...prev]);
    } catch (err) {
      console.error('PDF upload error:', err);
      alert('Failed to parse or save PDF. Check console for details.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from('health_documents').delete().eq('id', id);
    if (!error) {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handlePinContent = () => {
    if (!pinContent.trim() || !userId) return;
    
    const extracted = extractVitals(pinContent);
    const summary = formatMedicalSummary(pinContent);
    
    const newVitals = {};
    Object.entries(extracted).forEach(([k, v]) => {
      if (v !== null) newVitals[k] = v;
    });
    updateVitals(newVitals);

    // Also save pinned context to Supabase as a record
    if (supabase) {
      supabase.from('health_documents').insert([{
        user_id: userId,
        filename: 'Pinned Context',
        extracted_data: { summary, isPinned: true },
      }]);
    }

    const newReport = {
      id: Date.now(),
      name: 'Pinned Summary Context',
      date: new Date().toLocaleDateString(),
      type: 'Text',
      status: 'Pinned',
      summary: summary
    };
    setReports([newReport, ...reports]);
    setPinContent('');
    setIsPinModalOpen(false);
  };

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <Shield size={300} className="text-blue-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-inner">
            <Shield size={48} className="fill-blue-100 stroke-blue-700" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Health Vault</h2>
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
               <span className="flex items-center text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200"><Database size={16} className="mr-2" /> 100% Local Encryption</span>
               <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100"><CheckCircle size={16} className="mr-2" /> Context-Aware Active</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
          {/* Hidden real file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handlePDFUpload}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-60 transition-all shadow-xl shadow-blue-100 group"
          >
            {uploading
              ? <><Loader2 size={20} className="mr-3 animate-spin" /> Parsing…</>
              : <><Upload size={20} className="mr-3 group-hover:-translate-y-1 transition-transform" /> Upload PDF</>}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPinModalOpen(true)}
            className="flex items-center px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all border border-slate-800 shadow-xl shadow-slate-200 group"
          >
            <Pin size={20} className="mr-3 group-hover:rotate-45 transition-transform" /> PIN CONTEXT
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Stored Records</h3>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search health records..."
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredReports.map((report) => (
              <motion.div 
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-slate-50 border border-slate-100 rounded-[2rem] p-8 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className={`p-5 rounded-2xl ${report.type === 'PDF' ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-indigo-50 text-indigo-600 shadow-sm'}`}>
                    <FileText size={28} />
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 shadow-sm transition-all hover:scale-110"><ExternalLink size={18} /></button>
                    <button className="p-3 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-100 shadow-sm transition-all hover:scale-110" onClick={() => handleDelete(report.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
                <h4 className="font-bold text-lg text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors tracking-tight">{report.name}</h4>
                <div className="flex items-center space-x-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                   <span className="flex items-center"><Clock size={12} className="mr-1" /> {report.date}</span>
                   <span>•</span>
                   <span className={`${report.status === 'Analyzed' || report.status === 'Pinned' ? 'text-green-600' : 'text-amber-500'}`}>{report.status}</span>
                </div>
                <div className="p-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-600 text-sm leading-relaxed min-h-[80px] font-medium italic">
                  "{report.summary}"
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isPinModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 p-12"
            >
              <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Manual Context PIN</h3>
              <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">Paste summary or lab results for the AI assistant to reference in the medical brain.</p>
              <textarea 
                className="w-full h-64 p-8 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white resize-none text-slate-800 text-base leading-relaxed font-medium shadow-inner transition-all mb-8"
                placeholder="Example: High glucose (140 mg/dL), Vitamin D deficiency, Heart rate is 85 bpm..."
                value={pinContent}
                onChange={(e) => setPinContent(e.target.value)}
              />
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handlePinContent}
                  className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100"
                >
                  PIN TO CONTEXT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HealthVault;
