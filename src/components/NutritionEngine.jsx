import React, { useState } from 'react';
import { Utensils, CheckCircle, XCircle, ShoppingBag, Leaf, Flame, Droplets, Info, Sparkles, AlertTriangle } from 'lucide-react';

import { useVitalsStore } from '../services/vitalsStore';

const NutritionEngine = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const vitals = useVitalsStore(state => state.vitals);

  const generateDietaryAdvice = () => {
    let eat = [
      { id: 'base-1', name: 'Quinoa & Brown Rice', reason: 'Stable Glucose/Low GI', icon: <Leaf size={24} className="text-green-600" /> },
      { id: 'base-2', name: 'Leafy Greens', reason: 'High Micronutrient Profile', icon: <Droplets size={24} className="text-green-600" /> }
    ];
    let avoid = [
      { id: 'base-a-1', name: 'Refined Sugar', reason: 'Inflammatory Marker Context', icon: <AlertTriangle size={24} className="text-amber-500" /> }
    ];

    // High BMI Logic
    if (parseFloat(vitals.bmi) > 25) {
      eat.push({ id: 'bmi-e', name: 'High-Fiber Meals', reason: 'BMI Management Strategy', icon: <Utensils size={24} className="text-blue-600" /> });
    }

    // High Uric Acid Logic
    if (parseFloat(vitals.uricAcid) > 6.0) {
      avoid.push({ id: 'ua-a', name: 'Red Meat & Seafood', reason: 'High Purine Content Detected', icon: <XCircle size={24} className="text-red-500" /> });
      eat.push({ id: 'ua-e', name: 'Alkaline Water (>3L)', reason: 'Uric Acid Flush Protocol', icon: <Droplets size={24} className="text-blue-500" /> });
    }

    // High Sodium Logic
    if (vitals.sodium?.toLowerCase() === 'high') {
      avoid.push({ id: 'na-a', name: 'Canned & Processed Foods', reason: 'Sodium Reduction Protocol', icon: <XCircle size={24} className="text-red-500" /> });
      eat.push({ id: 'na-e', name: 'Bananas & Spinach', reason: 'Potassium Counter-Sync', icon: <Leaf size={24} className="text-indigo-600" /> });
    }

    return { eat, avoid };
  };

  const { eat: eatList, avoid: avoidList } = generateDietaryAdvice();

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-indigo-900 to-blue-950 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
          <Utensils size={240} className="text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-6 mb-4">
             <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-blue-400 border border-white/20 shadow-xl">
               <Utensils size={32} />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Smart Nutrition Engine</h2>
          </div>
          <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-2xl">
            Hyper-personalized meal logic based on your latest clinical profile. Our AI correlates your lab reports with optimal dietary choices.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
             <span className="flex items-center text-xs font-black text-blue-900 bg-white px-5 py-2.5 rounded-full uppercase tracking-tighter shadow-lg hover:scale-105 transition-transform"><Sparkles size={14} className="mr-2" /> Nutrient Density Focus</span>
             <span className="flex items-center text-xs font-black text-white bg-blue-600/30 backdrop-blur-md px-5 py-2.5 rounded-full border border-blue-400/30 uppercase tracking-tighter hover:scale-105 transition-transform"><CheckCircle size={14} className="mr-2" /> Clinical Alignment 98%</span>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
           <button className="flex items-center px-10 py-5 bg-white text-blue-900 font-black rounded-3xl hover:bg-slate-50 transition-all shadow-2xl hover:scale-105 active:scale-95 group uppercase tracking-widest text-sm italic">
             <ShoppingBag size={20} className="mr-3 group-hover:-translate-y-1 transition-transform" /> Meal Plan
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Eat List */}
        <div className="bg-white rounded-[3rem] shadow-premium border border-slate-100 p-10 relative overflow-hidden group hover:border-green-200 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[4rem] flex items-center justify-center -mr-8 -mt-8 group-hover:scale-110 transition-transform">
             <CheckCircle size={40} className="text-green-500 opacity-20" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight flex items-center ">
            Recommended <span className="text-green-600 ml-3 italic">EAT</span>
          </h3>
          <div className="space-y-6">
            {eatList.map((item) => (
              <div key={item.id} className="flex items-center space-x-6 p-6 bg-green-50/30 border border-green-100 rounded-3xl hover:bg-green-50 transition-all hover:scale-[1.02] cursor-default">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-green-100 group-hover:rotate-6 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 tracking-tight">{item.name}</h4>
                  <p className="text-sm font-semibold text-green-700 italic mt-1">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avoid List */}
        <div className="bg-white rounded-[3rem] shadow-premium border border-slate-100 p-10 relative overflow-hidden group hover:border-red-200 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[4rem] flex items-center justify-center -mr-8 -mt-8 group-hover:scale-110 transition-transform">
             <XCircle size={40} className="text-red-500 opacity-20" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight flex items-center">
            Restricted <span className="text-red-600 ml-3 italic">AVOID</span>
          </h3>
          <div className="space-y-6">
            {avoidList.map((item) => (
              <div key={item.id} className="flex items-center space-x-6 p-6 bg-red-50/30 border border-red-100 rounded-3xl hover:bg-red-50 transition-all hover:scale-[1.02] cursor-default">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-red-100 group-hover:-rotate-6 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 tracking-tight">{item.name}</h4>
                  <p className="text-sm font-semibold text-red-700 italic mt-1">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="p-10 bg-blue-50 border border-blue-100 rounded-[3rem] flex items-start space-x-8 animate-in slide-in-from-top-4 delay-500 group hover:bg-blue-600 transition-all duration-700 hover:shadow-2xl">
        <div className="p-6 bg-white rounded-2xl shadow-xl group-hover:scale-110 transition-transform">
           <Info size={32} className="text-blue-600 font-bold" />
        </div>
        <div>
           <h4 className="font-black text-2xl text-blue-900 group-hover:text-white tracking-tight uppercase mb-2 italic underline underline-offset-8">Clinical Pro-Tip</h4>
           <p className="text-blue-800 group-hover:text-blue-50 text-lg leading-relaxed font-bold tracking-tight">
             Always prioritize hydration with trace minerals between meals to maintain cellular metabolic health. Consult with your endocrinologist before making major ketogenic shifts.
           </p>
        </div>
      </div>
    </div>
  );
};

export default NutritionEngine;
