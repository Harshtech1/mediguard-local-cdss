/**
 * Utility to parse unstructured medical text for key vitals.
 */
export const extractVitals = (text) => {
  const vitals = {
    bloodPressure: null,
    glucose: null,
    bmi: null,
    heartRate: null,
    sodium: null,
    uricAcid: null
  };

  // Regex patterns for common medical metrics (including multi-language aliases)
  const patterns = {
    bloodPressure: /(\d{2,3}\/\d{2,3})\s*(mmHg|bp|tension|presion|PA)?/i,
    glucose: /(\d{2,3})\s*(mg\/dL|glucose|sugar|glucosa|azucar)/i,
    bmi: /(bmi|imc)\s*[:=]?\s*(\d{1,2}\.?\d?)/i,
    heartRate: /(\d{2,3})\s*(bpm|pulse|heart rate|ritmo cardiaco|pulso)/i,
    sodium: /(high|low|normal|high|bajo|normal)\s*(sodium|salt|sodio|sal)/i,
    uricAcid: /(uric acid|ácido úrico)\s*[:=]?\s*(\d{1,2}\.?\d?)/i
  };

  Object.keys(patterns).forEach(key => {
    const match = text.match(patterns[key]);
    if (match) {
      // For bloodPressure, capture groups already work well. For others, ensure we grab the right group.
      vitals[key] = match[1] || match[2];
      
      // Specifically for sodium, if it's descriptive (high/low/normal)
      if (key === 'sodium') {
        vitals[key] = match[1].toLowerCase();
      }
    }
  });

  return vitals;
};

export const formatMedicalSummary = (text) => {
  const vitals = extractVitals(text);
  const found = Object.entries(vitals).filter(([_, v]) => v !== null);
  
  if (found.length === 0) return "No specific vitals extracted. General context applied.";
  
  return `Extracted Vitals: ${found.map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ')}`;
};
