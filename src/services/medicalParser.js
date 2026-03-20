// src/services/medicalParser.js
/**
 * Very naive vitals extractor – scans text for common lab values.
 * Returns an object with numeric values or null if not found.
 */
export function extractVitals(text) {
  const lines = text.split('\n');
  const vitals = {
    hemoglobin: null,
    wbc: null,
    platelets: null,
    glucose: null,
    cholesterol: null,
    triglycerides: null,
  };

  const patterns = {
    hemoglobin: /hemoglobin[:\s]*([\d.]+)\s*g\/dL/i,
    wbc: /wbc[:\s]*([\d.]+)\s*\*?10\^9\/L/i,
    platelets: /platelets[:\s]*([\d.]+)\s*10\^9\/L/i,
    glucose: /glucose[:\s]*([\d.]+)\s*mg\/dL/i,
    cholesterol: /cholesterol[:\s]*([\d.]+)\s*mg\/dL/i,
    triglycerides: /triglycerides[:\s]*([\d.]+)\s*mg\/dL/i,
  };

  for (const [key, regex] of Object.entries(patterns)) {
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        vitals[key] = parseFloat(match[1]);
        break;
      }
    }
  }
  return vitals;
}

/**
 * Formats a vitals object (or raw text) into a clean, human-readable summary string.
 * Used by HealthVault to display a brief AI-context summary of pinned content.
 * @param {Object|string} input - A vitals object OR raw text string.
 * @returns {string}
 */
export function formatMedicalSummary(input) {
  if (!input) return 'No data available';

  // If a plain string was passed, return a trimmed excerpt
  if (typeof input === 'string') {
    const preview = input.replace(/\s+/g, ' ').trim().slice(0, 200);
    return preview.length < input.trim().length ? `${preview}…` : preview;
  }

  // If a vitals object was passed, format it into a sentence
  const parts = [];
  if (input.glucose)       parts.push(`Glucose: ${input.glucose} mg/dL`);
  if (input.hemoglobin)    parts.push(`Hemoglobin: ${input.hemoglobin} g/dL`);
  if (input.wbc)           parts.push(`WBC: ${input.wbc}×10⁹/L`);
  if (input.platelets)     parts.push(`Platelets: ${input.platelets}×10⁹/L`);
  if (input.cholesterol)   parts.push(`Cholesterol: ${input.cholesterol} mg/dL`);
  if (input.triglycerides) parts.push(`Triglycerides: ${input.triglycerides} mg/dL`);

  return parts.length > 0 ? parts.join(' · ') : 'No recognisable vitals found';
}
