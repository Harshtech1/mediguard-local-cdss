import { create } from 'zustand';
import { supabase } from './supabaseClient';

/**
 * Shared state for vitals extracted from medical reports.
 * Syncs with Supabase when a user is authenticated.
 */
export const useVitalsStore = create((set, get) => ({
  userId: null,
  vitals: {
    bloodPressure: '120/80',
    glucose: '95',
    bmi: '22.5',
    heartRate: '72',
    sodium: 'Normal',
    uricAcid: '5.5',
  },
  history: [],
  forecasts: {},
  scannedPrescriptions: [], // [{ id, filename, scannedAt, medicines: [...] }]

  setUserId: (uid) => set({ userId: uid }),
  setForecasts: (forecasts) => set({ forecasts }),

  updateVitals: async (newVitals) => {
    set((state) => ({
      vitals: { ...state.vitals, ...newVitals },
    }));

    const userId = get().userId;
    if (userId && supabase) {
      const current = get().vitals;
      
      // 1. Log full snapshot
      await supabase.from('vitals_history').insert([{
        user_id: userId,
        blood_pressure: current.bloodPressure,
        glucose: parseFloat(current.glucose) || null,
        bmi: parseFloat(current.bmi) || null,
        heart_rate: parseFloat(current.heartRate) || null,
        sodium: current.sodium,
        uric_acid: parseFloat(current.uricAcid) || null,
        recorded_at: new Date().toISOString(),
      }]);

      // 2. Log individual time-series points
      const tsPoints = [];
      if (current.glucose)   tsPoints.push({ user_id: userId, vital_type: 'glucose', value: parseFloat(current.glucose) });
      if (current.heartRate) tsPoints.push({ user_id: userId, vital_type: 'heart_rate', value: parseFloat(current.heartRate) });
      if (current.bmi)       tsPoints.push({ user_id: userId, vital_type: 'bmi', value: parseFloat(current.bmi) });
      
      if (tsPoints.length > 0) {
        await supabase.from('vitals_history_ts').insert(tsPoints);
      }
    }
  },

  fetchHistory: async () => {
    const userId = get().userId;
    if (userId && supabase) {
      const { data, error } = await supabase
        .from('vitals_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (!error && data) set({ history: data });
    }
  },

  addHistory: (entry) =>
    set((state) => ({
      history: [entry, ...state.history],
    })),

  addScannedPrescription: (entry) =>
    set((state) => ({
      scannedPrescriptions: [entry, ...state.scannedPrescriptions],
    })),

  clearScannedPrescriptions: () => set({ scannedPrescriptions: [] }),

  seedData: async () => {
    const userId = get().userId;
    if (!userId || !supabase) return;

    const dataPoints = [];
    const now = new Date();
    
    // Generate 30 days of data for glucose and heart rate
    for (let i = 20; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Glucose trend (slightly increasing + noise)
      dataPoints.push({
        user_id: userId,
        vital_type: 'glucose',
        value: 90 + (20 - i) * 0.5 + Math.random() * 5,
        measured_at: date.toISOString()
      });

      // Heart rate (stable + noise)
      dataPoints.push({
        user_id: userId,
        vital_type: 'heart_rate',
        value: 70 + Math.random() * 10,
        measured_at: date.toISOString()
      });
    }

    await supabase.from('vitals_history_ts').insert(dataPoints);
    alert('30 days of synthetic data seeded! Refresh to see the forecast.');
  }
}));
