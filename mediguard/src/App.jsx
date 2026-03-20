import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import HealthVault from './components/HealthVault';
import NutritionEngine from './components/NutritionEngine';
import PrivacyBanner from './components/PrivacyBanner';
import Auth from './components/Auth';
import PricingScreen from './screens/PricingScreen';
import PrescriptionScanner from './components/PrescriptionScanner';
import SymptomLogger from './components/SymptomLogger';
import DoctorDashboard from './components/DoctorDashboard';
import SecureShare from './components/SecureShare';
import ShareLanding from './screens/ShareLanding';
import SettingsScreen from './screens/SettingsScreen';
import { useVitalsStore } from './services/vitalsStore';
import { supabase } from './services/supabaseClient';
import { useRole } from './hooks/useRole';

// Inner component so useUser() is inside ClerkProvider
function AppInner() {
  const { role, isDoctor } = useRole();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, isLoaded } = useUser();
  const setUserId = useVitalsStore((s) => s.setUserId);

  // Sync Clerk user → Zustand & Supabase user_profiles
  useEffect(() => {
    if (!isLoaded || !user) return;
    const uid = user.id;
    setUserId(uid);

    if (supabase) {
      supabase.from('user_profiles').upsert(
        { clerk_user_id: uid, email: user.primaryEmailAddress?.emailAddress, updated_at: new Date().toISOString() },
        { onConflict: 'clerk_user_id' }
      );
    }
  }, [user, isLoaded, setUserId]);

  // Set default tab based on role
  useEffect(() => {
    if (isDoctor && activeTab === 'dashboard') {
      setActiveTab('triage');
    }
  }, [isDoctor]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'triage':
        return <DoctorDashboard />;
      case 'chat':
        return <Chat />;
      case 'vault':
        return <HealthVault />;
      case 'nutrition':
        return <NutritionEngine />;
      case 'pricing':
        return <PricingScreen />;
      case 'scanner':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <PrescriptionScanner />
          </div>
        );
      case 'symptoms':
        return (
          <div className="max-w-3xl mx-auto px-4 py-8">
            <SymptomLogger />
          </div>
        );
      case 'share':
        return <SecureShare />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return isDoctor ? <DoctorDashboard /> : <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  // --- Public Share Link Handling ---
  const path = window.location.pathname;
  if (path.startsWith('/share/')) {
    return <ShareLanding />;
  }

  return (
    <>
      <SignedOut>
        <Auth />
      </SignedOut>

      <SignedIn>
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans antialiased text-slate-800">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} />
          <div className="flex-1 flex flex-col min-w-0">
            <PrivacyBanner />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              {renderContent()}
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}

const App = () => <AppInner />;

export default App;
