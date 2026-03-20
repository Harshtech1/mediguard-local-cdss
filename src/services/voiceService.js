// ─────────────────────────────────────────────────────────────────
// voiceService.js  –  ElevenLabs TTS  +  Browser STT helpers
// ─────────────────────────────────────────────────────────────────

const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVEN_LABS_VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" – calm medical voice

// ── TTS ──────────────────────────────────────────────────────────
let currentAudio = null;   // HTML Audio element for ElevenLabs playback
let currentBlobUrl = null; // Blob URL to revoke on cleanup

/**
 * Speak text via ElevenLabs TTS API.
 * Uses a Blob URL + Audio element for maximum browser compatibility.
 * Returns { success, stop }  – call stop() to interrupt playback.
 */
export const speakText = async (text, onStart, onEnd) => {
  if (!ELEVEN_LABS_API_KEY) {
    console.warn('[voiceService] VITE_ELEVENLABS_API_KEY not set – falling back to browser TTS');
    return browserSpeak(text, onStart, onEnd);
  }

  // Stop any playing audio first
  stopSpeaking();

  try {
    // output_format must be a query parameter, not in the JSON body
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}?output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[voiceService] ElevenLabs error:', response.status, err);
      return browserSpeak(text, onStart, onEnd);
    }

    // Create a Blob from the audio data and play via Audio element
    // This is far more reliable than AudioContext.decodeAudioData with MP3
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    currentBlobUrl = URL.createObjectURL(blob);

    currentAudio = new Audio(currentBlobUrl);
    currentAudio.onplay = () => onStart?.();
    currentAudio.onended = () => {
      onEnd?.();
      cleanupAudio();
    };
    currentAudio.onerror = (e) => {
      console.error('[voiceService] Audio playback error:', e);
      cleanupAudio();
      onEnd?.();
    };

    await currentAudio.play();

    return {
      success: true,
      stop: stopSpeaking,
    };
  } catch (err) {
    console.error('[voiceService] TTS failed, fallback to browser:', err);
    cleanupAudio();
    return browserSpeak(text, onStart, onEnd);
  }
};

/** Clean up Blob URL and Audio element without cancelling browser TTS */
const cleanupAudio = () => {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load(); // release resources
      currentAudio = null;
    }
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
  } catch (_) {
    // ignore
  }
};

export const stopSpeaking = () => {
  cleanupAudio();
  try {
    window.speechSynthesis?.cancel();
  } catch (_) {
    // ignore
  }
};

// ── Browser TTS fallback ─────────────────────────────────────────
const browserSpeak = (text, onStart, onEnd) => {
  if (!window.speechSynthesis) return { success: false, stop: () => {} };

  window.speechSynthesis.cancel();
  const utter        = new SpeechSynthesisUtterance(text);
  utter.rate         = 0.92;
  utter.pitch        = 1.0;
  utter.volume       = 1.0;
  utter.onstart      = () => onStart?.();
  utter.onend        = () => onEnd?.();

  // Pick clearest English voice available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && /female|zira|hazel|karen|samantha/i.test(v.name)
  ) || voices.find((v) => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

  window.speechSynthesis.speak(utter);
  return { success: true, stop: () => window.speechSynthesis.cancel() };
};

// ── STT (browser Web Speech API) ────────────────────────────────
let recognitionInstance = null;

export const startListening = ({ onResult, onError, onEnd, lang = 'en-US' }) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.('Speech recognition is not supported in this browser.');
    return { stop: () => {} };
  }

  stopListening(); // clean up previous

  recognitionInstance                  = new SpeechRecognition();
  recognitionInstance.lang             = lang;
  recognitionInstance.continuous       = false;
  recognitionInstance.interimResults   = false;
  recognitionInstance.maxAlternatives  = 1;

  recognitionInstance.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript || '';
    onResult?.(transcript);
  };
  recognitionInstance.onerror  = (event) => onError?.(event.error);
  recognitionInstance.onend    = () => onEnd?.();

  recognitionInstance.start();

  return { stop: stopListening };
};

export const stopListening = () => {
  try {
    recognitionInstance?.stop();
    recognitionInstance = null;
  } catch (_) {}
};

export const isVoiceSupported = () =>
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);
