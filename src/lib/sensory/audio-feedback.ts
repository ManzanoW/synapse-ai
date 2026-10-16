// src/lib/sensory/audio-feedback.ts

/**
 * Síntese procedural de áudio para micro-interações táteis (Linear / Apple standard).
 * Utiliza Web Audio API nativa com osciladores e curvas de ganho exponenciais.
 * Zero dependências externas, zero arquivos MP3 adicionais e latência inferior a 1ms.
 */

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

export type SoundEffectType = "click" | "switch" | "slider" | "success";

export function playUiSound(type: SoundEffectType = "click"): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case "click": {
        // Micro-pop suave estilo botão hélio (800Hz descendo rápido para 300Hz em 25ms)
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.start(now);
        osc.stop(now + 0.025);
        break;
      }

      case "switch": {
        // Bi-tom sutil para alternância de abas / toggles (600Hz -> 900Hz em 35ms)
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.035);

        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }

      case "slider": {
        // Clique percussivo ultra curto (12ms) para ticks de sliders
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.012);

        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

        osc.start(now);
        osc.stop(now + 0.012);
        break;
      }

      case "success": {
        // Micro-acorde cristalino (harmônicos suaves em 80ms)
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.07); // C6

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
    }
  } catch {
    // Silencia qualquer política estrita de autoplay
  }
}

export function toggleMuteUiSound(): boolean {
  isMuted = !isMuted;
  return isMuted;
}

export function isUiSoundMuted(): boolean {
  return isMuted;
}
