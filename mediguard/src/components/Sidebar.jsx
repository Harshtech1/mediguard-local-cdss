import React from 'react';
import { LayoutDashboard, MessageCircle, FileText, Utensils, Settings, Activity } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 mb-2 rounded-xl transition-all duration-300 group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
  >
    <Icon size={20} className={`${isActive ? 'text-white' : 'group-hover:scale-110'}`} />
    <span className="ml-3 font-medium">{label}</span>
  </button>
);

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col h-full transform transition-all duration-300">
      <div className="flex items-center mb-10 px-2 space-x-3">
        <Activity size={32} className="text-blue-600 font-bold" />
        <h1 className="text-xl font-bold tracking-tight text-slate-900">MediGuard <span className="text-blue-600">Local</span></h1>
      </div>
      
      <nav className="flex-1">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          isActive={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <SidebarItem 
          icon={MessageCircle} 
          label="Chat Assistant" 
          isActive={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
        />
        <SidebarItem 
          icon={FileText} 
          label="Health Vault" 
          isActive={activeTab === 'vault'} 
          onClick={() => setActiveTab('vault')} 
        />
        <SidebarItem 
          icon={Utensils} 
          label="Nutrition Engine" 
          isActive={activeTab === 'nutrition'} 
          onClick={() => setActiveTab('nutrition')} 
        />
      </nav>
      
      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
          <p className="text-xs text-slate-400 mb-1">Local Node Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-700">AMD Radeon GPU Active</span>
          </div>
        </div>
        <SidebarItem 
          icon={Settings} 
          label="Settings" 
          isActive={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </div>
    </aside>
  );
};

export default Sidebar;
