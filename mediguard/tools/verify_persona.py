import json
import sys

def verify_persona_prompt(agent_type, prompt_text):
    """
    Simulates a check on the persona prompt structure.
    Used for local testing of prompt logic before sending to Groq.
    """
    required_keywords = {
        "clinical": ["SBAR", "SITUATION", "ASSESSMENT"],
        "performance": ["VO2", "Recovery", "Zones"],
        "metabolic": ["Glucose", "Insulin", "HbA1c"]
    }
    
    keywords = required_keywords.get(agent_type.lower(), [])
    missing = [k for k in keywords if k.lower() not in prompt_text.lower()]
    
    if not missing:
        return True, f"Prompt for {agent_type} is valid."
    else:
        return False, f"Prompt for {agent_type} is missing key clinical markers: {', '.join(missing)}"

if __name__ == "__main__":
    # Simple CLI for the agent to call
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python verify_persona.py <type> <prompt>"}))
        sys.exit(1)
        
    a_type = sys.argv[1]
    a_prompt = sys.argv[2]
    
    success, message = verify_persona_prompt(a_type, a_prompt)
    print(json.dumps({"success": success, "message": message}))
