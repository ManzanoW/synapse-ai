/**
 * Motor de Paisagens Sonoras Procedurais (Web Audio API)
 * 100% sintetizado localmente - Zero arquivos de mídia externos, zero latência, funciona offline.
 */

export type SoundscapeType =
  | "none"
  | "alpha_binaural"
  | "soft_rain"
  | "cafe_ambience"
  | "brown_noise"
  | "zen_drone";

export interface SoundscapeOption {
  id: SoundscapeType;
  label: string;
  description: string;
  iconName: string;
  badge?: string;
}

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  {
    id: "none",
    label: "Silêncio",
    description: "Sem som ambiente",
    iconName: "VolumeX",
  },
  {
    id: "alpha_binaural",
    label: "Ondas Alfa (10 Hz)",
    description: "Binaural beats para foco profundo e estado de flow (use fones)",
    iconName: "BrainCircuit",
    badge: "BINAURAL",
  },
  {
    id: "soft_rain",
    label: "Chuva Suave",
    description: "Ruído relaxante de chuva leve para mascarar distrações",
    iconName: "CloudRain",
  },
  {
    id: "cafe_ambience",
    label: "Cafeteria Acústica",
    description: "Murmúrio e calor acústico de coffee shop para estimular foco",
    iconName: "Coffee",
    badge: "WARMTH",
  },
  {
    id: "brown_noise",
    label: "Ruído Marrom",
    description: "Frequências graves aveludadas para máxima concentração",
    iconName: "Waves",
    badge: "DEEP FOCUS",
  },
  {
    id: "zen_drone",
    label: "Drone Zen",
    description: "Harmônicos quentes e oscilação suave para meditação e foco",
    iconName: "Sparkles",
  },
];

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: SoundscapeType = "none";
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
  private volume: number = 0.5;

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public stop() {
    if (!this.ctx || !this.masterGain) {
      this.currentType = "none";
      return;
    }

    const now = this.ctx.currentTime;
    // Fade out suave em 300ms
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
    }

    setTimeout(() => {
      this.activeNodes.forEach((node) => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch {
          // Ignora se já finalizado
        }
      });
      this.activeNodes = [];
      this.currentType = "none";
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      }
    }, 320);
  }

  public play(type: SoundscapeType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (type === "none") {
      this.stop();
      return;
    }

    // Se já estiver tocando o mesmo tipo, não reinicia
    if (this.currentType === type) return;

    // Para o som anterior
    this.stop();

    // Pequeno delay para permitir o fade-out anterior
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.currentType = type;
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      switch (type) {
        case "alpha_binaural":
          this.startAlphaBinaural();
          break;
        case "soft_rain":
          this.startSoftRain();
          break;
        case "cafe_ambience":
          this.startCafeAmbience();
          break;
        case "brown_noise":
          this.startBrownNoise();
          break;
        case "zen_drone":
          this.startZenDrone();
          break;
      }
    }, 350);
  }

  /**
   * Binaural Beats Alfa: 200 Hz na esquerda, 210 Hz na direita -> batimento perceptivo de 10 Hz
   */
  private startAlphaBinaural() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Frequência base: 200 Hz (Left) e 210 Hz (Right)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const gainL = ctx.createGain();
    const gainR = ctx.createGain();
    const merger = ctx.createChannelMerger(2);

    oscL.type = "sine";
    oscL.frequency.setValueAtTime(200, ctx.currentTime);

    oscR.type = "sine";
    oscR.frequency.setValueAtTime(210, ctx.currentTime);

    gainL.gain.setValueAtTime(0.25, ctx.currentTime);
    gainR.gain.setValueAtTime(0.25, ctx.currentTime);

    // Conecta esquerdo no canal 0 e direito no canal 1
    oscL.connect(gainL);
    oscR.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);

    merger.connect(this.masterGain);

    oscL.start();
    oscR.start();

    this.activeNodes.push(
      { stop: () => oscL.stop(), disconnect: () => oscL.disconnect() },
      { stop: () => oscR.stop(), disconnect: () => oscR.disconnect() },
      { disconnect: () => gainL.disconnect() },
      { disconnect: () => gainR.disconnect() },
      { disconnect: () => merger.disconnect() }
    );
  }

  /**
   * Chuva Suave: Ruído rosa com filtro passa-baixa em ~800 Hz e modulações sutis
   */
  private startSoftRain() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Cria buffer de 5 segundos de ruído com textura de chuva
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.15;
      data[i] = (b0 + b1 + b2) * 0.4;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();

    this.activeNodes.push(
      { stop: () => noiseSource.stop(), disconnect: () => noiseSource.disconnect() },
      { disconnect: () => filter.disconnect() },
      { disconnect: () => gain.disconnect() }
    );
  }

  /**
   * Cafeteria Acústica: Filtro de banda média (300-2400Hz) sobre ruído com modulação de LFO
   * simulando murmúrio distante e ressonância acolhedora de coffee shop.
   */
  private startCafeAmbience() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Buffer de ruído com textura aveludada
    const bufferSize = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      data[i] = (b0 + b1 + b2 + b3) * 0.25;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filtro Passa-Banda focado nas frequências de voz/ambiente de sala (500Hz - 1800Hz)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(850, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    // Segundo filtro passa-baixas para suavizar o topo
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(2200, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.38, ctx.currentTime);

    // LFO suave oscilando o ganho para simular dinamismo acústico humano natural
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 1 ciclo a cada 5s
    lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    noiseSource.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();

    this.activeNodes.push(
      { stop: () => noiseSource.stop(), disconnect: () => noiseSource.disconnect() },
      { stop: () => lfo.stop(), disconnect: () => lfo.disconnect() },
      { disconnect: () => lfoGain.disconnect() },
      { disconnect: () => bandpass.disconnect() },
      { disconnect: () => lowpass.disconnect() },
      { disconnect: () => gain.disconnect() }
    );
  }

  /**
   * Ruído Marrom (Brownian Noise): Integração de ruído branco com ênfase total em graves
   */
  private startBrownNoise() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Ganho compensatório
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();

    this.activeNodes.push(
      { stop: () => noiseSource.stop(), disconnect: () => noiseSource.disconnect() },
      { disconnect: () => filter.disconnect() },
      { disconnect: () => gain.disconnect() }
    );
  }

  /**
   * Drone Zen: Acorde harmônico quente e flutuante
   */
  private startZenDrone() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Frequências da tríade com sétima (C3, G3, D4, E4)
    const freqs = [130.81, 196.0, 293.66, 329.63];

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(filter);
      osc.start();
      this.activeNodes.push({
        stop: () => osc.stop(),
        disconnect: () => osc.disconnect(),
      });
    });

    // LFO para sweep suave no filtro
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // 1 ciclo a cada 10s
    lfoGain.gain.setValueAtTime(120, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.activeNodes.push(
      { stop: () => lfo.stop(), disconnect: () => lfo.disconnect() },
      { disconnect: () => lfoGain.disconnect() }
    );

    filter.connect(gain);
    gain.connect(this.masterGain);

    this.activeNodes.push(
      { disconnect: () => filter.disconnect() },
      { disconnect: () => gain.disconnect() }
    );
  }

  /**
   * Chime cristalino tocado ao concluir um bloco de foco (Solfeggio 528 Hz)
   */
  public playCompletionChime() {
    this.initContext();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(528, now); // Solfeggio 528 Hz

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1056, now); // Oitava superior

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.9);
    osc2.stop(now + 2.9);
  }
}

export const soundscapeEngine = new SoundscapeEngine();
