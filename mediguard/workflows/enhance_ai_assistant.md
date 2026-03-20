# Workflow: Enhance AI Assistant with Specialist Suite

## Objective
Transform the single-bot chat interface into a multi-agent "Specialist Suite" where users can toggle between specialized medical/health personas (Clinical, Performance, Metabolic).

## Required Inputs
- `src/services/aiService.js`: Existing Groq integration logic.
- `src/components/Chat.jsx`: Existing chat UI.
- `.env`: VITE_GROQ_API_KEY.

## Steps

### 1. Define Specialized Personas
- **Dr. Aris (Clinical Lead)**: Focus on SBAR, vitals, and red flags. (Indigo theme)
- **Coach Lyra (Performance AI)**: Focus on activity, heart rate zones, and recovery. (Orange theme)
- **Alex (Metabolic Specialist)**: Focus on glucose, nutrition, and insulin. (Emerald theme)
- **Seraph (Circadian & Recovery)**: Focus on sleep hygiene, mental well-being, and circadian alignment. (Violet theme)

### 2. Update AI Logic (Tools/Services)
- Modify `aiService.js` to accept an `agentType` parameter.
- Implement conditional system prompts based on the selected agent.
- Ensure SBAR formatting is preserved for the Clinical agent.

### 3. Update Chat UI
- Add an `AgentSelector` component to the header.
- Implement state management for `activeAgent`.
- Apply dynamic styling (colors, icons, shadows) based on the active agent.
- Use `framer-motion` for smooth brain-state transitions.

### 4. Verification
- Test each agent with a specific query (e.g., "Summarize my vitals" for Aris, "How's my glucose?" for Alex).
- Verify the Groq payload includes the correct system prompt.

## Edge Cases
- **Missing Vitals**: Agents should gracefully state they lack data instead of inventing it.
- **Connection Failure**: Show the "Neural Node Offline" state clearly for all agents.
- **Switching mid-conversation**: Reset the chat (or keep context but update the assistant's perspective). *Decision: Keep context but update the "Brain" identity.*
