import React from 'react';
import { ShieldCheck, Database, Info } from 'lucide-react';

const PrivacyBanner = () => {
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 glass">
      <div className="flex items-center space-x-3 text-blue-800">
        <ShieldCheck size={20} className="text-blue-600 animate-pulse" />
        <span className="font-semibold text-sm tracking-wide uppercase">Privacy First</span>
        <span className="h-4 w-px bg-blue-200 mx-2 hidden sm:block"></span>
        <p className="text-sm font-medium hidden sm:block">
          {import.meta.env.PROD 
            ? 'Encrypted clinical inference via Groq Secure Cloud.' 
            : 'All health data processed locally. Data stays 100% on your local AMD Radeon GPU.'}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 cursor-help transition-colors">
          <Database size={16} />
          <span className="text-xs font-semibold">Local Storage Only</span>
        </div>
        <button className="text-xs text-blue-600 font-bold hover:underline flex items-center transition-all hover:scale-105">
          <Info size={14} className="mr-1" /> Learn More
        </button>
      </div>
    </div>
  );
};

export default PrivacyBanner;
