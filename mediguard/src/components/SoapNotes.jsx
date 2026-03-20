import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Mic, MicOff, Send, Loader2, ClipboardCheck, 
  Stethoscope, Save, History, ChevronRight
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useVitalsStore } from '../services/vitalsStore';
import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SOAP_SYSTEM_PROMPT = `You are an expert Clinical Scribe. 
Convert the following transcript of a doctor-patient interaction into a professional SOAP note.
Structure it clearly:
- SUBJECTIVE: Patient's complaints, symptoms, and medical history shared during the visit.
- OBJECTIVE: Observations, vitals, and physical exam findings.
- ASSESSMENT: Differential diagnosis and clinical reasoning.
- PLAN: Medications, labs, follow-up, and patient education.

Return ONLY a JSON object with fields: "subjective", "objective", "assessment", "plan". 
Do not include markdown or conversational filler.`;

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function SoapNotes({ patientId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [soapNote, setSoapNote] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | transcribing | structuring | success | error
  const [errorMsg, setErrorMsg] = useState('');
  
  const userId = useVitalsStore(s => s.userId);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch (err) {
      setErrorMsg('Microphone access denied.');
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob) => {
    if (!API_KEY) return;
    setStatus('transcribing');
    try {
      const formData = new FormData();
      formData.append('file', blob, 'consultation.webm');
      formData.append('model', 'whisper-large-v3');
      
      const res = await axios.post(`${GROQ_API_URL}/audio/transcriptions`, formData, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeout: 30000,
      });

      const text = res.data.text || '';
      setTranscript(text);
      if (text.trim()) structureSoap(text);
      else throw new Error('No speech detected.');
    } catch (err) {
      setErrorMsg('Transcription failed.');
      setStatus('error');
    }
  };

  const structureSoap = async (text) => {
    setStatus('structuring');
    try {
      const res = await axios.post(`${GROQ_API_URL}/chat/completions`, {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SOAP_SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      const raw = res.data.choices[0].message.content.trim();
      setSoapNote(JSON.parse(raw));
      setStatus('success');
    } catch (err) {
      setErrorMsg('Clinical structuring failed.');
      setStatus('error');
    }
  };

  const saveNote = async () => {
    if (!supabase || !soapNote || !userId || !patientId) return;
    const { error } = await supabase.from('soap_notes').insert([{
      doctor_clerk_id: userId,
      patient_clerk_id: patientId,
      subjective: soapNote.subjective,
      objective: soapNote.objective,
      assessment: soapNote.assessment,
      plan: soapNote.plan,
      raw_transcript: transcript
    }]);
    if (!error) alert('Clinical note saved to patient history.');
  };

  return (
    <div className="space-y-6">
      {/* Transcription Control */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
              <Mic size={18} />
            </div>
            <h3 className="font-bold text-slate-900">AI Consultation Scribe</h3>
          </div>
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'}`}
          >
            {isRecording ? 'Stop Recording' : 'Start Scribe'}
          </button>
        </div>

        {transcript && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Raw Transcript</p>
            <p className="text-xs text-slate-600 italic leading-relaxed">{transcript}</p>
          </div>
        )}

        {status === 'transcribing' || status === 'structuring' ? (
          <div className="flex items-center gap-3 py-4 text-sm text-blue-600 font-bold">
            <Loader2 size={16} className="animate-spin" />
            <span>{status === 'transcribing' ? 'Converting voice to text...' : 'AI generating SOAP note...'}</span>
          </div>
        ) : null}
      </motion.div>

      {/* Generated SOAP Note */}
      <AnimatePresence>
        {soapNote && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border-2 border-blue-50 rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} />
                <span className="font-bold text-sm">Structured Clinical Note</span>
              </div>
              <button onClick={saveNote} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                <Save size={14} /> Save to EMR
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Subjective', content: soapNote.subjective, color: 'text-indigo-600' },
                { label: 'Objective', content: soapNote.objective, color: 'text-blue-600' },
                { label: 'Assessment', content: soapNote.assessment, color: 'text-violet-600' },
                { label: 'Plan', content: soapNote.plan, color: 'text-emerald-600' },
              ].map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${section.color}`}>{section.label}</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
