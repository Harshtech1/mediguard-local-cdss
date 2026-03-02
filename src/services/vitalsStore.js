import { create } from 'zustand';

/**
 * Shared state for vitals extracted from medical reports.
 * Uses Zustand for simple, performant state management.
 */
export const useVitalsStore = create((set) => ({
  vitals: {
    bloodPressure: '120/80',
    glucose: '95',
    bmi: '22.5',
    heartRate: '72',
    sodium: 'Normal',
    uricAcid: '5.5'
  },
  updateVitals: (newVitals) => set((state) => ({
    vitals: { ...state.vitals, ...newVitals }
  })),
  history: [],
  addHistory: (entry) => set((state) => ({
    history: [entry, ...state.history]
  }))
}));
