import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, User, Bot, Loader2, ShieldCheck, Activity,
  Mic, MicOff, Volume2, VolumeX, Stethoscope, Zap, Leaf, Moon,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getAIResponse, checkBackendStatus, AGENT_MODES } from '../services/aiService';
import { useVitalsStore } from '../services/vitalsStore';
import {
  speakText, stopSpeaking, startListening, stopListening, isVoiceSupported
} from '../services/voiceService';

// ─── Agent Themes ────────────────────────────────────────────────────────────
const AGENT_THEMES = {
  [AGENT_MODES.CLINICAL]: {
    name: 'Dr. Aris',
    label: 'Clinical',
    color: 'bg-indigo-600',
    gradient: 'from-blue-600 to-indigo-700',
    ring: 'ring-indigo-400',
    shadow: 'shadow-indigo-200',
    icon: <Stethoscope size={26} />,
    accent: 'text-indigo-600',
    accentBg: 'bg-indigo-50',
    border: 'border-indigo-100',
    glow: 'rgba(99,102,241,0.35)',
  },
  [AGENT_MODES.PERFORMANCE]: {
    name: 'Coach Lyra',
    label: 'Performance',
    color: 'bg-orange-600',
    gradient: 'from-orange-500 to-red-600',
    ring: 'ring-orange-400',
    shadow: 'shadow-orange-200',
    icon: <Zap size={26} />,
    accent: 'text-orange-600',
    accentBg: 'bg-orange-50',
    border: 'border-orange-100',
    glow: 'rgba(234,88,12,0.35)',
  },
  [AGENT_MODES.METABOLIC]: {
    name: 'Alex',
    label: 'Metabolic',
    color: 'bg-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-400',
    shadow: 'shadow-emerald-200',
    icon: <Leaf size={26} />,
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    border: 'border-emerald-100',
    glow: 'rgba(5,150,105,0.35)',
  },
  [AGENT_MODES.RECOVERY]: {
    name: 'Seraph',
    label: 'Recovery',
    color: 'bg-violet-600',
    gradient: 'from-violet-500 to-purple-700',
    ring: 'ring-violet-400',
    shadow: 'shadow-violet-200',
    icon: <Moon size={26} />,
    accent: 'text-violet-600',
    accentBg: 'bg-violet-50',
    border: 'border-violet-100',
    glow: 'rgba(124,58,237,0.35)',
  },
};

// ─── Animated Wave Bars (listening indicator) ────────────────────────────────
const VoiceWave = ({ color = '#6366f1', active = false }) => (
  <div className="flex items-end justify-center gap-[3px] h-5">
    {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
      <motion.div
        key={i}
        animate={active ? { scaleY: [h, 1, h * 0.5, 1, h] } : { scaleY: 0.3 }}
        transition={active ? { repeat: Infinity, duration: 0.8, delay: i * 0.1 } : {}}
        style={{ backgroundColor: color, height: '100%', transformOrigin: 'bottom' }}
        className="w-[3px] rounded-full"
        initial={{ scaleY: 0.3 }}
      />
    ))}
  </div>
);

// ─── Main Chat Component ─────────────────────────────────────────────────────
const Chat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello, I'm **Dr. Aris** — your MediGuard AI assistant. I can analyse your vitals, generate SBAR clinical reports, and answer health questions.\n\n🎤 **Tap the microphone** to speak directly, or type below. I'll respond in text *and* voice.",
    },
  ]);
  const [activeAgent, setActiveAgent] = useState(AGENT_MODES.CLINICAL);
  const [input, setInput]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: true, message: 'Checking…' });

  // Voice state
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [autoSpeak, setAutoSpeak]       = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listeningError, setListeningError] = useState('');

  const stopRef    = useRef(null);   // stores the stopSpeaking fn
  const scrollRef  = useRef(null);
  const textareaRef = useRef(null);

  const vitals    = useVitalsStore(s => s.vitals);
  const forecasts = useVitalsStore(s => s.forecasts);
  const theme     = AGENT_THEMES[activeAgent];

  // ── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    setVoiceSupported(isVoiceSupported());
    const check = async () => setBackendStatus(await checkBackendStatus());
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, []);

  // Switch agent → stop speaking
  useEffect(() => {
    handleStopSpeaking();
  }, [activeAgent]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // ── Speak AI reply ────────────────────────────────────────────────
  const speakMessage = useCallback(async (text) => {
    // Strip markdown for speech
    const plain = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    setIsSpeaking(true);
    const result = await speakText(
      plain,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
    stopRef.current = result?.stop || stopSpeaking;
  }, []);

  const handleStopSpeaking = () => {
    stopRef.current?.();
    stopSpeaking();
    setIsSpeaking(false);
  };

  // ── Send message ──────────────────────────────────────────────────
  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    handleStopSpeaking();
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const result = await getAIResponse(
      [...messages, userMessage], vitals, forecasts, activeAgent
    );

    if (result.success) {
      setMessages(prev => [...prev, result.data]);
      if (autoSpeak) speakMessage(result.data.content);
    } else {
      const errMsg = { role: 'assistant', content: `⚠️ ${result.error}` };
      setMessages(prev => [...prev, errMsg]);
    }
    setIsLoading(false);
  };

  // ── Mic (STT) ─────────────────────────────────────────────────────
  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    setListeningError('');
    handleStopSpeaking();   // stop TTS while user speaks
    setIsListening(true);

    startListening({
      onResult: (transcript) => {
        setIsListening(false);
        if (transcript) handleSend(transcript);
      },
      onError: (err) => {
        setIsListening(false);
        setListeningError(
          err === 'not-allowed'
            ? 'Microphone access denied. Please allow it in browser settings.'
            : `Voice error: ${err}`
        );
      },
      onEnd: () => setIsListening(false),
    });
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between px-8 py-4 gap-4">
          {/* Agent Avatar + Status */}
          <div className="flex items-center gap-4 min-w-0">
            <motion.div
              key={activeAgent}
              initial={{ rotate: -15, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className={`relative w-13 h-13 flex-shrink-0`}
            >
              <div
                className={`w-12 h-12 bg-gradient-to-tr ${theme.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                style={{ boxShadow: `0 8px 24px ${theme.glow}` }}
              >
                {theme.icon}
              </div>
              {/* speaking ring */}
              {isSpeaking && (
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.3, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className={`absolute inset-0 rounded-2xl ring-2 ${theme.ring}`}
                />
              )}
            </motion.div>

            <div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight leading-tight">
                {theme.name}
                <span className="ml-2 text-[10px] font-normal text-slate-400 font-mono not-italic">v4.0</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${backendStatus.online ? 'bg-green-500' : 'bg-red-500'}`}
                  style={backendStatus.online ? { boxShadow: '0 0 6px rgba(34,197,94,0.6)' } : {}} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  {backendStatus.message}
                </span>
              </div>
            </div>
          </div>

          {/* Agent Mode Pills */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner gap-1 flex-wrap justify-end">
            {Object.entries(AGENT_THEMES).map(([mode, t]) => (
              <button
                key={mode}
                id={`agent-${mode}`}
                onClick={() => setActiveAgent(mode)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                  activeAgent === mode
                    ? `bg-white ${t.accent} shadow-md scale-105`
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Auto-speak toggle */}
          <button
            id="toggle-auto-speak"
            onClick={() => { setAutoSpeak(v => !v); handleStopSpeaking(); }}
            title={autoSpeak ? 'Auto-speak ON — click to mute' : 'Auto-speak OFF — click to enable'}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
              autoSpeak
                ? `${theme.accentBg} ${theme.accent} border-current`
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scroll-smooth"
        style={{ background: 'linear-gradient(180deg,#f8faff 0%,#ffffff 100%)' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 110 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow ${
                  msg.role === 'user'
                    ? `bg-gradient-to-br ${theme.gradient} text-white`
                    : 'bg-white border border-slate-100 text-slate-500'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className={`relative group px-5 py-4 rounded-[1.75rem] text-sm leading-relaxed font-medium shadow-sm transition-all ${
                  msg.role === 'user'
                    ? `bg-gradient-to-br ${theme.gradient} text-white rounded-br-md`
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-md'
                }`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h3: ({ node, ...p }) => (
                              <h3 className={`${theme.accent} font-black uppercase tracking-widest text-[9px] mt-5 mb-1.5 border-b ${theme.border} pb-1`} {...p} />
                            ),
                            p:      ({ node, ...p }) => <p className="mb-3 last:mb-0" {...p} />,
                            strong: ({ node, ...p }) => <strong className="font-black text-slate-900" {...p} />,
                            li:     ({ node, ...p }) => <li className="mb-1" {...p} />,
                            ul:     ({ node, ...p }) => <ul className="list-disc ml-4 mb-3" {...p} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {/* Re-speak button on hover */}
                      <button
                        onClick={() => speakMessage(msg.content)}
                        className={`absolute -bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${theme.accentBg} ${theme.accent} border ${theme.border} shadow-sm`}
                      >
                        ▶ Play
                      </button>
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-end gap-3 max-w-[80%]">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow">
                <Loader2 size={16} className="animate-spin text-slate-400" />
              </div>
              <div className={`px-5 py-4 bg-white border border-slate-100 rounded-[1.75rem] rounded-bl-md shadow-sm flex items-center gap-3`}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-2 h-2 ${theme.color} rounded-full animate-bounce`}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {theme.name} thinking…
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Voice Status Bar ──────────────────────────────────────── */}
      <AnimatePresence>
        {(isListening || isSpeaking || listeningError) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className={`flex items-center justify-between px-8 py-2.5 ${
              isListening ? theme.accentBg : isSpeaking ? 'bg-slate-50' : 'bg-red-50'
            }`}>
              {isListening && (
                <div className="flex items-center gap-3">
                  <VoiceWave color={theme.glow.replace('0.35', '1')} active={true} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme.accent}`}>
                    Listening — speak your query…
                  </span>
                </div>
              )}
              {isSpeaking && !isListening && (
                <div className="flex items-center gap-3">
                  <Volume2 size={14} className="text-slate-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {theme.name} is speaking…
                  </span>
                </div>
              )}
              {listeningError && (
                <span className="text-[10px] font-black text-red-500">{listeningError}</span>
              )}
              {(isListening || isSpeaking) && (
                <button
                  onClick={isListening ? () => { stopListening(); setIsListening(false); } : handleStopSpeaking}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition"
                >
                  <Square size={10} className="fill-current" /> Stop
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Bar ─────────────────────────────────────────────── */}
      <div className="p-5 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex items-end gap-3">

          {/* Text area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              id="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={isListening ? 'Listening…' : "Ask about your health, request a report, or tap 🎤"}
              disabled={isListening}
              rows={1}
              className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white resize-none min-h-[52px] max-h-[120px] shadow-inner text-slate-800 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mic Button */}
          {voiceSupported && (
            <motion.button
              id="voice-mic-button"
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleMicToggle}
              disabled={isLoading}
              title={isListening ? 'Stop listening' : 'Tap to speak'}
              className={`relative p-3.5 rounded-2xl flex items-center justify-center transition-all shadow-lg flex-shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white shadow-red-200'
                  : `${theme.color} text-white ${theme.shadow}`
              } disabled:opacity-40`}
              style={isListening ? {} : { boxShadow: `0 6px 20px ${theme.glow}` }}
            >
              {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              {isListening && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 rounded-2xl bg-red-400"
                />
              )}
            </motion.button>
          )}

          {/* Send Button */}
          <motion.button
            id="chat-send-button"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={`p-3.5 ${theme.color} text-white rounded-2xl hover:brightness-110 disabled:bg-slate-200 disabled:shadow-none transition-all shadow-lg ${theme.shadow} flex items-center justify-center flex-shrink-0`}
            style={input.trim() && !isLoading ? { boxShadow: `0 6px 20px ${theme.glow}` } : {}}
          >
            <Send size={20} />
          </motion.button>
        </div>

        {/* Footer status row */}
        <div className="flex items-center justify-center mt-3 gap-6 text-slate-400 text-[9px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-blue-500">
            <ShieldCheck size={11} />Predictive Bio-Sync Active
          </span>
          <span className="flex items-center gap-1 text-green-500">
            <Activity size={11} />Clinical Decision Support ON
          </span>
          {voiceSupported && (
            <span className="flex items-center gap-1 text-violet-500">
              <Mic size={11} />Voice Ready
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Chat;
