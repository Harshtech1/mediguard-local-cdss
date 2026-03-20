// ─────────────────────────────────────────────────────────────────
// voiceService.js  –  ElevenLabs TTS  +  Browser STT helpers
// ─────────────────────────────────────────────────────────────────

const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVEN_LABS_VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" – calm medical voice

// ── TTS ──────────────────────────────────────────────────────────
let currentAudioCtx = null;
let currentSource   = null;

/**
 * Speak text via ElevenLabs streaming API.
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
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}/stream`,
      {
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
            style: 0.0,
            use_speaker_boost: true,
          },
          output_format: 'mp3_44100_128',
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[voiceService] ElevenLabs error:', err);
      return browserSpeak(text, onStart, onEnd);
    }

    const arrayBuffer = await response.arrayBuffer();
    currentAudioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer  = await currentAudioCtx.decodeAudioData(arrayBuffer);

    currentSource              = currentAudioCtx.createBufferSource();
    currentSource.buffer       = audioBuffer;
    currentSource.connect(currentAudioCtx.destination);
    currentSource.onended = () => { onEnd?.(); };

    onStart?.();
    currentSource.start(0);

    return {
      success: true,
      stop: stopSpeaking,
    };
  } catch (err) {
    console.error('[voiceService] TTS failed, fallback to browser:', err);
    return browserSpeak(text, onStart, onEnd);
  }
};

export const stopSpeaking = () => {
  try {
    currentSource?.stop();
    currentSource = null;
    currentAudioCtx?.close();
    currentAudioCtx = null;
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
