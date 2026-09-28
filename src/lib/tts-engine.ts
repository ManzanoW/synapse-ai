"use client";

/**
 * Motor de síntese de voz (TTS) nativo ultrarrápido com suporte a PT-BR.
 */

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

class TTSEngine {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Procura a melhor voz em português do Brasil
    const ptBrVoice =
      voices.find((v) => v.lang === "pt-BR" || v.lang === "pt_BR") ||
      voices.find((v) => v.lang.startsWith("pt")) ||
      voices[0];

    this.voice = ptBrVoice || null;
    this.isInitialized = true;
  }

  public isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public isSpeaking(): boolean {
    if (!this.isAvailable()) return false;
    return window.speechSynthesis.speaking;
  }

  public stop(): void {
    if (!this.isAvailable()) return;
    try {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    } catch {
      // Ignora erro de cancelamento
    }
  }

  public speak(text: string, options: SpeakOptions = {}): boolean {
    if (!this.isAvailable()) {
      options.onError?.(new Error("Speech synthesis not available"));
      return false;
    }

    try {
      // Cancela reprodução anterior
      this.stop();

      if (!this.voice) {
        this.initVoices();
      }

      // Remove markdown básico para leitura fluida
      const cleanText = text
        .replace(/[*_#`~[\]]/g, "")
        .replace(/\n+/g, ". ")
        .trim();

      if (!cleanText) return false;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "pt-BR";
      if (this.voice) {
        utterance.voice = this.voice;
      }

      utterance.rate = options.rate ?? 1.1; // 10% mais rápido para agilidade
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.activeUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.activeUtterance = null;
        options.onError?.(e);
      };

      this.activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn("[TTSEngine] Erro ao sintetizar áudio:", err);
      options.onError?.(err);
      return false;
    }
  }
}

export const tts = new TTSEngine();
