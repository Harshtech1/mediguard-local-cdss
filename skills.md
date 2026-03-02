# Agent Skills & Medical Knowledge Base

## Core Technical Skills
- **Frontend**: React, Vite, Tailwind CSS (v4), Framer Motion.
- **State Management**: Zustand for global clinical state sync.
- **AI Integration**: OpenAI-compatible local endpoints (Foundry/DirectML).
- **Security**: In-memory data handling, no disk writes for PHI (Protected Health Information).

## Clinical Knowledge Base & Protocols

### Vitals Thresholds
- **Blood Pressure**: 
  - > 140/90: Flag as "High/Hypertension Stage 2".
  - < 90/60: Flag as "Low/Hypotension".
- **Fasting Glucose**:
  - > 126 mg/dL: Flag as "Diabetic Range".
  - 100-125 mg/dL: Flag as "Prediabetic".
- **BMI**:
  - > 25: Overweight.
  - > 30: Obese.

### Dietary Correlation Engine
- **Condition: High Uric Acid**
  - Recommendation: Avoid purine-rich foods (red meat, seafood).
  - Protocol: Increase water intake to > 3L/day.
- **Condition: High BMI (>25)**
  - Recommendation: Prioritize high-fiber, low-calorie density meals.
  - Protocol: Suggest 150 min/week of aerobic activity.
- **Condition: High Sodium**
  - Recommendation: Avoid processed foods, canned goods.
  - Protocol: Increase potassium-rich foods (bananas, spinach).

### Clinical Communication
- **Standard**: Always use "SBAR" (Situation, Background, Assessment, Recommendation) formatting for health summaries.
- **Disclaimer**: Always include a medical disclaimer: "Consult a human doctor for formal diagnosis."
