import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Pin, Loader2, Sparkles, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse, checkBackendStatus } from '../services/aiService';
import { useVitalsStore } from '../services/vitalsStore';

const Chat = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello. I'm your MediGuard local assistant. I'm ready to analyze your health records and suggest lifestyle improvements based on your vital signs. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContextPinned, setIsContextPinned] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: true, message: 'Checking...' });
  const vitals = useVitalsStore(state => state.vitals);
  const scrollRef = useRef(null);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkBackendStatus();
      setBackendStatus(status);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const result = await getAIResponse([...messages, userMessage], vitals);

    if (result.success) {
      setMessages(prev => [...prev, result.data]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ ${result.error}` 
      }]);
    }
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-10 py-7 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-xl text-slate-900 tracking-tight italic uppercase underline underline-offset-4 decoration-blue-500/30">MediGuard Assistant</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${backendStatus.online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {backendStatus.online 
                  ? (import.meta.env.PROD ? 'Groq™ Optimized' : 'Radeon™ GPU Core Active') 
                  : 'Neural Node Offline'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsContextPinned(!isContextPinned)}
          className={`flex items-center px-6 py-3 rounded-2xl border transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] ${isContextPinned ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 scale-105' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
        >
          <Pin size={14} className={`mr-2 ${isContextPinned ? 'rotate-45' : ''} transition-transform`} /> 
          {isContextPinned ? 'Context Locked' : 'Pin Bio-Context'}
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end max-w-[80%] space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-slate-100'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div 
                  className={`p-6 rounded-[2rem] shadow-sm text-sm leading-relaxed font-medium transition-all ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-blue-100' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none prose-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-end max-w-[80%] space-x-4">
              <div className="w-10 h-10 rounded-xl bg-white text-blue-600 border border-slate-100 flex items-center justify-center shadow-md">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-[2rem] rounded-bl-none shadow-sm flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Analyzing Vitals...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-6 bg-white border-t border-slate-100 glass">
        <div className="max-w-4xl mx-auto flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask anything about your health reports..."
              className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white resize-none h-14 min-h-[56px] max-h-[120px] shadow-inner text-slate-800 text-sm font-medium transition-all"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !backendStatus.online}
            className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-lg shadow-blue-100 flex items-center justify-center"
          >
            <Send size={24} />
          </motion.button>
        </div>
        <div className="flex items-center justify-center mt-4 space-x-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
           <span className="flex items-center">
             <ShieldCheck size={12} className="mr-1 inline text-blue-400" /> 
             {import.meta.env.PROD ? 'Secure Cloud Inference' : 'Private Cloud-Free'}
           </span>
           <span className="flex items-center"><Activity size={12} className="mr-1 inline text-green-400" /> Context-Aware Active</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Chat;
