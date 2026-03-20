import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { 
  LayoutDashboard, 
  MessageCircle, 
  FileText, 
  Utensils, 
  Settings, 
  Activity, 
  CreditCard,
  ChevronRight,
  Shield,
  Zap,
  ScanLine,
  Users,
  Languages,
  Link2,
  Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, isActive, onClick, badge }) => (
  <motion.button 
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3.5 mb-2 rounded-2xl transition-all duration-300 group relative ${
      isActive 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'
    }`}
  >
    <Icon size={20} className={`${isActive ? 'text-white' : 'group-hover:text-blue-600 transition-colors'}`} />
    <span className={`ml-4 font-bold text-sm tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    
    {badge && (
      <span className="ml-auto bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
        {badge}
      </span>
    )}

    {isActive && (
      <motion.div 
        layoutId="activeIndicator"
        className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
      />
    )}
  </motion.button>
);

const Sidebar = ({ activeTab, setActiveTab, role = 'patient' }) => {
  const { user } = useUser();
  const isDoctor = role === 'doctor';

  return (
    <aside className="w-72 bg-white border-r border-slate-100 p-8 flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.04)]">
      {/* Brand Header */}
      <div className="flex items-center mb-12 px-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mr-4 ${isDoctor ? 'bg-gradient-to-tr from-violet-600 to-purple-700 shadow-violet-200' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-200'}`}>
          {isDoctor ? <Stethoscope size={28} /> : <Activity size={28} className="fill-white/10" />}
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 flex items-center">
            MediGuard <span className={`ml-1 ${isDoctor ? 'text-violet-600' : 'text-blue-600'}`}>v2</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-1">
            {isDoctor ? 'Provider Portal' : 'Clinical Engine'}
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-2">Core Platform</p>
        
        {isDoctor ? (
          /* Doctor Navigation */
          <>
            <SidebarItem 
              icon={Users} 
              label="Triage Dashboard" 
              isActive={activeTab === 'triage'} 
              onClick={() => setActiveTab('triage')} 
              badge="LIVE"
            />
            <SidebarItem 
              icon={MessageCircle} 
              label="AI Assistant" 
              isActive={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
              badge="SOAP"
            />
          </>
        ) : (
          /* Patient Navigation */
          <>
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Overview" 
              isActive={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <SidebarItem 
              icon={MessageCircle} 
              label="AI Assistant" 
              isActive={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
              badge="SBAR"
            />
            <SidebarItem 
              icon={FileText} 
              label="Clinical Vault" 
              isActive={activeTab === 'vault'} 
              onClick={() => setActiveTab('vault')} 
            />
          </>
        )}
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-8 mb-4 px-2">Extensions</p>
        
        {!isDoctor && (
          <>
            <SidebarItem 
              icon={Languages} 
              label="Symptom Logger" 
              isActive={activeTab === 'symptoms'} 
              onClick={() => setActiveTab('symptoms')} 
              badge="50+ Lang"
            />
            <SidebarItem 
              icon={Utensils} 
              label="Nutrition Logic" 
              isActive={activeTab === 'nutrition'} 
              onClick={() => setActiveTab('nutrition')} 
            />
          </>
        )}
        
        <SidebarItem 
          icon={ScanLine} 
          label="Rx Decoder" 
          isActive={activeTab === 'scanner'} 
          onClick={() => setActiveTab('scanner')} 
          badge="AI"
        />
        
        {!isDoctor && (
          <SidebarItem 
            icon={Link2} 
            label="Secure Share" 
            isActive={activeTab === 'share'} 
            onClick={() => setActiveTab('share')} 
          />
        )}
        
        <SidebarItem 
          icon={CreditCard} 
          label="Billing & Plan" 
          isActive={activeTab === 'pricing'} 
          onClick={() => setActiveTab('pricing')} 
        />
      </nav>
      
      {/* Footer / Account */}
      <div className="mt-auto pt-8 border-t border-slate-100">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-50 rounded-3xl p-5 mb-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield size={16} className="text-blue-500 fill-blue-50" />
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Enterprise Privacy</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${import.meta.env.PROD ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'} animate-pulse`}></div>
            <span className="text-[11px] font-bold text-slate-600">
              {import.meta.env.PROD ? 'Groq Cloud Sync' : 'AMD Local Core'}
            </span>
          </div>
        </motion.div>

        {/* User Profile */}
        <div className="flex items-center p-2 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all hover:bg-slate-50 cursor-default">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10 ring-2 ring-blue-50',
                userButtonPopoverCard: 'rounded-3xl shadow-2xl border border-slate-100 overflow-hidden',
              },
            }}
          />
          <div className="ml-3 overflow-hidden">
            <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{user?.fullName || 'Health Professional'}</p>
            <p className={`text-[10px] font-bold truncate tracking-tighter capitalize ${isDoctor ? 'text-violet-600' : 'text-slate-400'}`}>
              {role} · {user?.primaryEmailAddress?.emailAddress.split('@')[0]}
            </p>
          </div>
          <Settings 
            size={14} 
            onClick={() => setActiveTab('settings')}
            className={`ml-auto mr-1 cursor-pointer transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600'}`} 
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
