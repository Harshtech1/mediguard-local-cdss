import axios from 'axios';

// --- CONFIGURATION ---
// Always use Groq Cloud
const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const API_KEY      = import.meta.env.VITE_GROQ_API_KEY;

const api = axios.create({
  baseURL: GROQ_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  timeout: 60000,
});

// --- CORE LOGIC ---

const performAIRequest = async (payload) => {
  if (!API_KEY) {
    return {
      success: false,
      error: 'Missing VITE_GROQ_API_KEY in .env. Please add it and restart the dev server.',
    };
  }
  try {
    const response = await api.post('/chat/completions', payload);
    return { success: true, data: response.data.choices[0].message };
  } catch (error) {
    let errorMessage = 'Groq Cloud Connection Error. Check your API key and network.';
    if (error.code === 'ECONNABORTED')   errorMessage = 'Groq timed out. Please try again.';
    if (error.response?.status === 401)  errorMessage = 'Invalid Groq API Key. Update VITE_GROQ_API_KEY in .env.';
    if (error.response?.status === 429)  errorMessage = 'Groq rate limit exceeded. Please wait a moment.';
    if (error.response?.status === 404)  errorMessage = 'Groq model not found.';
    console.error('[AI SERVICE ERROR]:', error.response?.data || error.message);
    return { success: false, error: errorMessage };
  }
};

export const checkBackendStatus = async () => {
  if (!API_KEY) return { online: false, message: 'VITE_GROQ_API_KEY missing in .env' };
  try {
    await api.get('/models', { timeout: 6000 });
    return { online: true, message: 'Groq Cloud Active' };
  } catch (error) {
    if (error.response?.status === 401) return { online: false, message: 'Invalid Groq API Key' };
    return { online: false, message: 'Groq API Unreachable' };
  }
};

export const AGENT_MODES = {
  CLINICAL: 'clinical',
  PERFORMANCE: 'performance',
  METABOLIC: 'metabolic',
  RECOVERY: 'recovery'
};

const PERSONA_CONFIG = {
  [AGENT_MODES.CLINICAL]: {
    name: 'Dr. Aris',
    role: 'Chief Medical Officer & Clinical AI',
    style: 'Professional, authoritative, highly precise.',
    focus: 'SBAR Reporting, Vitals analysis, Clinical Risk Management.',
    protocol: `
    Protocol: SBAR Clinical Reporting
    If the user asks for a "summary", "report", or "SBAR", you MUST respond using this structure:
    ### **SITUATION** (Immediate status/red flags)
    ### **BACKGROUND** (Trend analysis)
    ### **ASSESSMENT** (Clinical analysis + AI predictions)
    ### **RECOMMENDATION** (Actionable medical next steps)
    `
  },
  [AGENT_MODES.PERFORMANCE]: {
    name: 'Coach Lyra',
    role: 'Elite Performance & Athletic Recovery AI',
    style: 'High-energy, data-driven, motivational.',
    focus: 'Heart Rate Zones, Workout Recovery, Vo2 Max, Sleep Optimization.',
    protocol: `
    Protocol: Performance Benchmarking
    Focus on recovery readiness and training load. 
    Use athletic terminology: "Zone 2", "EPS", "OBLA", "Supercompensation".
    Encourage consistent movement but prioritize injury prevention.
    `
  },
  [AGENT_MODES.METABOLIC]: {
    name: 'Alex',
    role: 'Metabolic Health & Nutrition specialist',
    style: 'Empathetic, scientific, lifestyle-focused.',
    focus: 'Glucose Stability, Insulin Sensitivity, Nutrition, HbA1c forecasting.',
    protocol: `
    Protocol: Metabolic Profiling
    Interpret glucose spikes in the context of nutrition and stress.
    Provide non-judgmental feedback on dietary patterns.
    Recommend "Glucose Friendly" meal swaps.
    `
  },
  [AGENT_MODES.RECOVERY]: {
    name: 'Seraph',
    role: 'Circadian Health & Recovery Lead',
    style: 'Calm, thoughtful, holistic, deeply informative.',
    focus: 'Sleep Hygiene, Parasympathetic activation, Mental clarity.',
    protocol: `
    Protocol: Circadian Rhythms & Recovery
    Prioritize HRV (Heart Rate Variability) and sleep architecture.
    Recommend "Light Hygiene", meditation, and progressive muscular relaxation.
    Connect physical recovery to mental well-being and stress resilience.
    `
  }
};


export const getAIResponse = async (messages, vitals = {}, forecasts = {}, agentType = AGENT_MODES.CLINICAL) => {
  const config = PERSONA_CONFIG[agentType] || PERSONA_CONFIG[AGENT_MODES.CLINICAL];

  const vitalsContext = vitals ? `
    [CURRENT VITALS]
    - Blood Pressure: ${vitals.bloodPressure || 'Unknown'}
    - Glucose: ${vitals.glucose || 'Unknown'} mg/dL
    - BMI: ${vitals.bmi || 'Unknown'}
    - Heart Rate: ${vitals.heartRate || 'Unknown'} BPM
  ` : '';

  const forecastContext = Object.keys(forecasts).length > 0 ? `
    [PREDICTIVE FORECASTS]
    - Glucose Trend: ${forecasts.glucose?.aiForecast?.trend_direction || 'Stable'} (Predicted: ${forecasts.glucose?.mathPrediction?.toFixed(1) || 'N/A'})
    - Heart Rate Trend: ${forecasts.heart_rate?.aiForecast?.trend_direction || 'Stable'} (Predicted: ${forecasts.heart_rate?.mathPrediction?.toFixed(1) || 'N/A'})
    - Risk Alerts: ${forecasts.glucose?.aiForecast?.warning_level === 'Red' ? 'CRITICAL GLUCOSE SPIKE PREDICTED' : 'None active'}
  ` : '';

  const systemPrompt = `
    Role: ${config.name} (${config.role}).
    Persona: ${config.style}
    
    ${vitalsContext}
    ${forecastContext}

    ${config.protocol}

    General Constraints:
    - Never invent data.
    - If data is missing, state it.
    - Always end with: "Consult a human healthcare provider for formal medical diagnosis."
    - Address user as "User".
  `;

  return await performAIRequest({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
  });
};

export const sessionManager = {
  activeSession: null,
  init: (data) => { sessionManager.activeSession = data; },
  clear: () => { sessionManager.activeSession = null; },
};

// --- PRESCRIPTION VISION ANALYSIS ---
// Groq vision model — supports image_url content blocks
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const PHARMACIST_SYSTEM_PROMPT = `You are a board-certified Clinical Pharmacist AI.
The user will provide an image of a doctor's prescription.
Your task is to:
1. Read and extract every medication listed on the prescription.
2. For each medication, produce ONLY a raw JSON array (no markdown fences, no extra text).

Each element must have exactly these fields:
{
  "medicineName": "string (brand + generic if available)",
  "dosage": "string (e.g., 500mg twice daily)",
  "purpose": "string (what condition/symptom it treats)",
  "commonSideEffects": ["array", "of", "strings"],
  "warnings": "string (key interaction or contraindication, or 'None noted')"
}

Return ONLY the JSON array. If you cannot read the prescription clearly, return an empty array [].
Never include disclaimers, markdown, or explanation outside the JSON.`;

export const analyzePrescriptionImage = async (file) => {
  if (!API_KEY) {
    return { success: false, error: 'Missing VITE_GROQ_API_KEY in .env.' };
  }

  // Convert file → base64 data URL
  const toBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data:image/...;base64,...
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  try {
    const base64DataUrl = await toBase64(file);

    const payload = {
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: PHARMACIST_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: base64DataUrl },
            },
            {
              type: 'text',
              text: 'Please analyze this prescription and return the JSON array of medications.',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    };

    const result = await performAIRequest(payload);
    if (!result.success) return result;

    // Parse the JSON from the response
    let raw = result.data.content.trim();
    // Strip possible markdown fences
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

    const medicines = JSON.parse(raw);
    return { success: true, medicines: Array.isArray(medicines) ? medicines : [] };
  } catch (err) {
    console.error('[PRESCRIPTION SCAN ERROR]:', err);
    return {
      success: false,
      error: 'Failed to parse prescription. Ensure the image is clear and try again.',
    };
  }
};

