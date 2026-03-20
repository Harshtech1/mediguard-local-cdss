import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Languages, Activity, AlertCircle, CheckCircle2,
  Loader2, Globe, Stethoscope, Send
} from 'lucide-react';
import { useVitalsStore } from '../services/vitalsStore';
import { supabase } from '../services/supabaseClient';
import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYMPTOM_SYSTEM_PROMPT = `You are a multilingual medical intake AI. You MUST:
1. Detect the language of the patient's input.
2. Translate it to English (if not already English).
3. Extract medical symptoms, map them to standard medical terminology (ICD-style).
4. Estimate severity: "mild", "moderate", "severe", or "emergency".

Return ONLY a raw JSON object with these exact fields:
{
  "detected_language": "string (e.g. Hindi, English, Mandarin)",
  "original_text": "string (what the user typed)",
  "translated_text": "string (English translation, or same if already English)",
  "medical_terms": [
    { "symptom": "standard medical term", "layman": "what the user said", "bodySystem": "e.g. respiratory, cardiac" }
  ],
  "severity": "mild|moderate|severe|emergency",
  "triage_note": "one-sentence clinical summary for a doctor"
}

Return ONLY the JSON object. No markdown, no explanation.`;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const SEVERITY_STYLES = {
  mild:      { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  dot: 'bg-green-500' },
  moderate:  { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  dot: 'bg-amber-500' },
  severe:    { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    dot: 'bg-red-500' },
  emergency: { bg: 'bg-red-100',   border: 'border-red-400',   text: 'text-red-900',    dot: 'bg-red-600' },
};

export default function SymptomLogger() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | analyzing | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const userId = useVitalsStore(s => s.userId);

  // --- Voice Recording via Web Audio API ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
      setErrorMsg('Microphone access denied. Please allow mic access in your browser settings.');
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (blob) => {
    if (!API_KEY) { setErrorMsg('Missing Groq API key'); setStatus('error'); return; }
    setStatus('analyzing');
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', ''); // auto-detect

      const res = await axios.post(`${GROQ_API_URL}/audio/transcriptions`, formData, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeout: 30000,
      });

      const transcript = res.data.text || '';
      if (transcript.trim()) {
        setInput(transcript);
        // Auto-analyze after transcription
        analyzeSymptoms(transcript);
      } else {
        setStatus('error');
        setErrorMsg('Could not detect speech. Please try again.');
      }
    } catch (err) {
      console.error('Whisper error:', err);
      setStatus('error');
      setErrorMsg('Voice transcription failed. Try typing your symptoms instead.');
    }
  };

  // --- Text-based symptom analysis ---
  const analyzeSymptoms = async (text) => {
    const symptomText = text || input;
    if (!symptomText.trim()) return;
    if (!API_KEY) { setErrorMsg('Missing Groq API key'); setStatus('error'); return; }

    setStatus('analyzing');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await axios.post(`${GROQ_API_URL}/chat/completions`, {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYMPTOM_SYSTEM_PROMPT },
          { role: 'user', content: symptomText },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        timeout: 30000,
      });

      let raw = res.data.choices[0].message.content.trim();
      raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(raw);
      setResult(parsed);
      setStatus('success');

      // Save to Supabase
      if (supabase && userId) {
        await supabase.from('symptom_logs').insert([{
          user_id: userId,
          original_text: parsed.original_text || symptomText,
          detected_language: parsed.detected_language,
          translated_text: parsed.translated_text,
          medical_terms: parsed.medical_terms,
          severity: parsed.severity,
        }]);
      }

      setHistory(prev => [{ ...parsed, id: Date.now() }, ...prev]);
    } catch (err) {
      console.error('Symptom analysis error:', err);
      setStatus('error');
      setErrorMsg('AI analysis failed. Please try again.');
    }
  };

  const sev = result?.severity ? SEVERITY_STYLES[result.severity] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
          <Languages size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Symptom Logger</h2>
          <p className="text-slate-500 text-sm">Speak or type in any language — AI translates and maps to clinical terms.</p>
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md"
      >
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your symptoms in any language…&#10;e.g. 'मुझे सिरदर्द और बुखार है' or 'I have a sore throat and chills'"
            rows={4}
            className="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl resize-none text-slate-800 text-sm leading-relaxed focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
              }`}
              title="Hold to record voice"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe size={12} />
            <span>Auto-detects Hindi, Mandarin, Spanish, Arabic, and 50+ languages</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => analyzeSymptoms()}
            disabled={!input.trim() || status === 'analyzing'}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:opacity-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'analyzing' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {status === 'analyzing' ? 'Analyzing…' : 'Log Symptoms'}
          </motion.button>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
          >
            <AlertCircle size={18} className="text-red-500 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && sev && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`${sev.bg} border ${sev.border} rounded-3xl p-8 space-y-6`}
          >
            {/* Severity Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${sev.dot} animate-pulse`} />
                <span className={`text-sm font-black uppercase tracking-widest ${sev.text}`}>{result.severity} Severity</span>
              </div>
              <span className="text-xs font-semibold bg-white/80 text-slate-600 px-3 py-1 rounded-full border border-white">
                {result.detected_language}
              </span>
            </div>

            {/* Translation */}
            {result.detected_language?.toLowerCase() !== 'english' && (
              <div className="bg-white/60 rounded-2xl p-5 border border-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Translation</p>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">{result.translated_text}</p>
              </div>
            )}

            {/* Medical Terms */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Stethoscope size={12} /> Mapped Medical Terms
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.medical_terms?.map((term, i) => (
                  <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                    className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
                  >
                    <p className="text-sm font-bold text-slate-900">{term.symptom}</p>
                    <p className="text-xs text-slate-400 mt-0.5">"{term.layman}"</p>
                    <span className="inline-block mt-2 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                      {term.bodySystem}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Triage Note */}
            <div className="bg-white/80 rounded-2xl p-5 border border-white flex items-start gap-3">
              <Activity size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Triage Summary</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{result.triage_note}</p>
              </div>
            </div>

            {/* Success */}
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 size={14} />
              Logged to your Health Vault
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-600">Recent Logs (this session)</p>
          {history.slice(1).map(item => {
            const s = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.mild;
            return (
              <button key={item.id} onClick={() => setResult(item)}
                className={`w-full text-left p-4 ${s.bg} border ${s.border} rounded-2xl hover:shadow-md transition-all flex items-center justify-between`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.translated_text?.slice(0, 60)}…</p>
                  <p className="text-xs text-slate-400">{item.detected_language} · {item.medical_terms?.length} terms</p>
                </div>
                <span className={`text-[10px] font-black uppercase ${s.text}`}>{item.severity}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-300 text-center">🔒 Symptom data encrypted and stored only in your Supabase vault.</p>
    </div>
  );
}
