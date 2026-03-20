import { supabase } from './supabaseClient';
import { getAIResponse } from './aiService';

/**
 * Perform simple linear regression to predict the next value.
 * y = mx + b
 * @param {Array<{ x: number, y: number }>} dataPoints 
 * @returns {number} Predicted next y value
 */
function predictNextValue(dataPoints) {
  if (dataPoints.length < 2) return null;

  const n = dataPoints.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const point of dataPoints) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const denominator = (n * sumX2 - sumX * sumX);
  if (denominator === 0) return dataPoints[n - 1].y;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Predict for next index (n)
  return slope * n + intercept;
}

/**
 * Fetches historical data and generates a forecast.
 * @param {string} userId 
 * @param {string} vitalType 
 * @returns {Promise<Object>}
 */
export const getVitalForecast = async (userId, vitalType) => {
  if (!supabase) return { error: 'Supabase client not initialized' };

  try {
    // 1. Fetch last 20 entries
    const { data, error } = await supabase
      .from('vitals_history_ts')
      .select('value, measured_at')
      .eq('user_id', userId)
      .eq('vital_type', vitalType)
      .order('measured_at', { ascending: true })
      .limit(20);

    if (error) throw error;
    if (!data || data.length < 3) {
      return { 
        success: false, 
        message: 'Insufficient data for forecasting. Need at least 3 readings.' 
      };
    }

    // 2. Prepare data for math regression
    const values = data.map((d, i) => ({ x: i, y: parseFloat(d.value) }));
    const predictedValue = predictNextValue(values);
    
    // 3. Get AI Analysis from Groq
    const historyString = data.map(d => `${new Date(d.measured_at).toLocaleDateString()}: ${d.value}`).join('\n');
    
    const aiPrompt = [
      { 
        role: 'system', 
        content: `You are a Predictive Health Analyst. Analyze the following historical data for ${vitalType} and provide a forecast.
        Respond ONLY with a JSON object in this format:
        {
          "predicted_value": number,
          "trend_direction": "Increasing" | "Decreasing" | "Stable",
          "warning_level": "Green" | "Yellow" | "Red",
          "clinical_insight": "Short sentence about the trend"
        }` 
      },
      { 
        role: 'user', 
        content: `Historical ${vitalType} data:\n${historyString}` 
      }
    ];

    const aiResult = await getAIResponse(aiPrompt);
    let aiAnalysis = {};
    
    if (aiResult.success) {
      try {
        // Try to parse JSON from AI response
        const content = aiResult.data.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse AI forecast JSON', e);
      }
    }

    return {
      success: true,
      history: data,
      mathPrediction: predictedValue,
      aiForecast: aiAnalysis
    };
  } catch (err) {
    console.error('Forecast Service Error:', err);
    return { success: false, error: err.message };
  }
};
