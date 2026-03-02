import axios from 'axios';

// --- CONFIGURATION ---
const DEFAULT_PORT = 64281;
const BASE_URL = import.meta.env.VITE_AI_API_URL || `http://127.0.0.1:${DEFAULT_PORT}/v1`;
const MODEL_ID = import.meta.env.VITE_MODEL_ID || "qwen2.5-0.5b-instruct-generic-gpu:4";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_API_KEY || 'not-needed'}`
  },
  timeout: 45000, // Increased timeout for potentially slower cloud/tunnel connections
});

// --- CORE LOGIC ---

/**
 * Resilient request wrapper for local LLM communication.
 * Handles timeouts and specific GPU node disconnection states.
 */
const performAIRequest = async (payload) => {
  try {
    const response = await api.post('/chat/completions', payload);
    return { success: true, data: response.data.choices[0].message };
  } catch (error) {
    let errorMessage = 'Connection Failed. Ensure Foundry is running.';
    
    if (error.code === 'ECONNABORTED') errorMessage = 'Inference Timed Out. GPU might be under heavy load.';
    if (error.response?.status === 404) errorMessage = 'Model not found in current Foundry sandbox.';
    
    console.error('[AI SERVICE ERROR]:', error);
    return { success: false, error: errorMessage };
  }
};

export const checkBackendStatus = async () => {
  try {
    // Standard OpenAI models list endpoint to verify node is ALIVE
    await axios.get(`${BASE_URL}/models`, { timeout: 3000 });
    return { online: true, message: 'GPU Node: Active' };
  } catch (error) {
    return { online: false, message: 'Backend Offline. Check port 64281.' };
  }
};

export const getAIResponse = async (messages, vitals = {}) => {
  const vitalsContext = vitals ? `
    Current Bio-Sync Vitals:
    - Blood Pressure: ${vitals.bloodPressure || 'Unknown'}
    - Glucose: ${vitals.glucose || 'Unknown'} mg/dL
    - BMI: ${vitals.bmi || 'Unknown'}
    - Heart Rate: ${vitals.heartRate || 'Unknown'} BPM
    - Sodium: ${vitals.sodium || 'Unknown'}
    - Uric Acid: ${vitals.uricAcid || 'Unknown'}
  ` : '';

  const clinicalSystemPrompt = `
    Role: Specialized Medical & Nutrition Advisor (MediGuard Local).
    Persona: Supportive, clinical, and precise.
    
    ${vitalsContext}

    Clinical Logic Protocols:
    - Blood Pressure:
      - > 140/90: Flag as "High/Hypertension Stage 2".
      - < 90/60: Flag as "Low/Hypotension".
    - Fasting Glucose:
      - > 126 mg/dL: Flag as "Diabetic Range".
      - 100-125 mg/dL: Flag as "Prediabetic".
    - BMI:
      - > 25: Overweight.
      - > 30: Obese.
    
    Dietary Correlation Engine:
    - High Uric Acid: Avoid purine-rich foods (red meat, seafood). Increase water intake (> 3L/day).
    - High BMI (>25): Prioritize high-fiber, low-calorie density meals. Suggest 150 min/week aerobic activity.
    - High Sodium: Avoid processed/canned foods. Increase potassium-rich foods (bananas, spinach).
    
    Communication Standard:
    1. Always use "SBAR" formatting:
       - Situation: Brief statement of the current health concern/vitals.
       - Background: Relevant clinical history or context.
       - Assessment: Analysis of the vitals based on thresholds.
       - Recommendation: Specific dietary or lifestyle advice.
    2. Medical Disclaimer: Always include "Consult a human doctor for formal diagnosis." at the end.
    
    Constraint: Strictly follow provided lab values. Do not invent data. Address the user as "User" or "the Patient".
  `;

  return await performAIRequest({
    model: MODEL_ID,
    messages: [
      { role: "system", content: clinicalSystemPrompt },
      ...messages
    ],
    temperature: 0.7,
  });
};

/**
 * Secure Session Manager (Refactored for In-Memory Pattern)
 */
export const sessionManager = {
  activeSession: null,
  init: (data) => { sessionManager.activeSession = data; },
  clear: () => { sessionManager.activeSession = null; }
};
