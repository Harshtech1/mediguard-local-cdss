import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../services/supabaseClient';

/**
 * Reads the user's role from Supabase user_profiles.
 * Falls back to 'patient' if no record exists yet.
 * Also exposes a setRole() for the settings page.
 */
export function useRole() {
  const { user, isLoaded } = useUser();
  const [role, setRoleState] = useState('patient');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user || !supabase) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('clerk_user_id', user.id)
        .single();

      if (data?.role) setRoleState(data.role);
      setLoading(false);
    };
    fetch();
  }, [user, isLoaded]);

  const setRole = async (newRole) => {
    if (!supabase || !user) return;
    await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('clerk_user_id', user.id);
    setRoleState(newRole);
  };

  return { role, setRole, loading, isDoctor: role === 'doctor', isPatient: role === 'patient' };
}
