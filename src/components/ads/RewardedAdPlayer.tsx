// src/components/ads/RewardedAdPlayer.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  Video,
} from "lucide-react";
import { getAdConfiguration, AdProvider } from "@/config/ads";
import { loadGoogleImaSdk } from "@/lib/ad-sdk-loader";

interface RewardedAdPlayerProps {
  onCompleted: () => void;
  isCompleted: boolean;
  featureLabel?: string;
}

const TOTAL_AD_SECONDS = 15;

const SPONSOR_TIPS = [
  "Dica Synapse: Ciclos de estudo de 25 minutos com 5 de pausa aumentam a retenção em 60%.",
  "A repetição espaçada (SRS) ativa a memória de longo prazo antes da curva de esquecimento.",
  "Simulados com IA adaptam-se aos seus pontos fracos para acelerar sua aprovação.",
  "Estudantes que revisam erros nas primeiras 24 horas têm 3x mais chance de gabaritar.",
  "Mapas conceituais reduzem a carga cognitiva e estruturam a doutrina e jurisprudência.",
];

export function RewardedAdPlayer({
  onCompleted,
  isCompleted,
  featureLabel = "Recurso",
}: RewardedAdPlayerProps) {
  const config = getAdConfiguration();
  const [activeProvider, setActiveProvider] = useState<AdProvider>(config.provider);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_AD_SECONDS);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  // Estados de Vídeo Customizado / IMA
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imaContainerRef = useRef<HTMLDivElement | null>(null);
  const adsManagerRef = useRef<any>(null);
  const [videoDuration, setVideoDuration] = useState(TOTAL_AD_SECONDS);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [adPlaybackError, setAdPlaybackError] = useState<string | null>(null);

  // Inicializa Google IMA SDK se configurado
  useEffect(() => {
    let isCancelled = false;

    async function initIma() {
      if (activeProvider !== "GOOGLE_IMA" || !config.imaVastTagUrl) return;

      const sdkReady = await loadGoogleImaSdk();
      if (!sdkReady || isCancelled || !window.google?.ima) {
        console.warn("[AdPlayer] IMA SDK indisponível. Alternando para o player patrocinado.");
        setActiveProvider("SPONSOR_SIMULATOR");
        return;
      }

      const ima = window.google?.ima;
      if (!ima) {
        setActiveProvider("SPONSOR_SIMULATOR");
        return;
      }

      try {
        const adDisplayContainer = new ima.AdDisplayContainer(
          imaContainerRef.current,
          videoRef.current,
        );
        adDisplayContainer.initialize();

        const adsLoader = new ima.AdsLoader(adDisplayContainer);

        adsLoader.addEventListener(
          ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          (adsManagerLoadedEvent: any) => {
            const adsRenderingSettings = new ima.AdsRenderingSettings();
            adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

            const adsManager = adsManagerLoadedEvent.getAdsManager(
              videoRef.current,
              adsRenderingSettings,
            );
            adsManagerRef.current = adsManager;

            adsManager.addEventListener(
              ima.AdErrorEvent.Type.AD_ERROR,
              () => {
                console.warn("[AdPlayer] Erro no anúncio IMA. Fallback para simulador.");
                setActiveProvider("SPONSOR_SIMULATOR");
              },
            );

            adsManager.addEventListener(
              ima.AdEvent.Type.COMPLETE,
              () => {
                onCompleted();
              },
            );

            adsManager.addEventListener(
              ima.AdEvent.Type.ALL_ADS_COMPLETED,
              () => {
                onCompleted();
              },
            );

            try {
              adsManager.init(640, 360, ima.ViewMode.NORMAL);
              adsManager.start();
            } catch {
              setActiveProvider("SPONSOR_SIMULATOR");
            }
          },
          false,
        );

        adsLoader.addEventListener(
          ima.AdErrorEvent.Type.AD_ERROR,
          () => {
            console.warn("[AdPlayer] Erro ao carregar anúncio IMA. Usando patrocinador.");
            setActiveProvider("SPONSOR_SIMULATOR");
          },
          false,
        );

        const adsRequest = new ima.AdsRequest();
        adsRequest.adTagUrl = config.imaVastTagUrl;
        adsRequest.linearAdSlotWidth = 640;
        adsRequest.linearAdSlotHeight = 360;
        adsLoader.requestAds(adsRequest);
      } catch (err) {
        console.warn("[AdPlayer] Erro na inicialização do IMA:", err);
        setActiveProvider("SPONSOR_SIMULATOR");
      }
    }

    if (activeProvider === "GOOGLE_IMA") {
      initIma();
    }

    return () => {
      isCancelled = true;
      if (adsManagerRef.current) {
        try {
          adsManagerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [activeProvider, config.imaVastTagUrl, onCompleted]);

  // Rotaciona dicas a cada 3.8 segundos
  useEffect(() => {
    if (activeProvider !== "SPONSOR_SIMULATOR" || isCompleted) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SPONSOR_TIPS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [activeProvider, isCompleted]);

  // Timer do player simulado
  useEffect(() => {
    if (activeProvider !== "SPONSOR_SIMULATOR" || !isPlaying || isCompleted) return;

    if (secondsLeft <= 0) {
      onCompleted();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          onCompleted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeProvider, isPlaying, isCompleted, secondsLeft, onCompleted]);

  // Manipuladores de vídeo customizado (HTML5)
  const handleCustomVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration || TOTAL_AD_SECONDS);
      const remaining = Math.max(0, Math.ceil(videoRef.current.duration - videoRef.current.currentTime));
      setSecondsLeft(remaining);
    }
  };

  const handleCustomVideoEnded = () => {
    onCompleted();
  };

  const handleCustomVideoError = () => {
    console.warn("[AdPlayer] Erro ao carregar vídeo customizado. Fallback para dicas.");
    setActiveProvider("SPONSOR_SIMULATOR");
  };

  // =========================================================================
  // RENDERIZAÇÃO: MODO VÍDEO HTML5 / CUSTOM VIDEO / GOOGLE IMA
  // =========================================================================
  if (activeProvider === "CUSTOM_VIDEO" && config.customVideoUrl) {
    return (
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={config.customVideoUrl}
          autoPlay
          playsInline
          muted={isMuted}
          onTimeUpdate={handleCustomVideoTimeUpdate}
          onEnded={handleCustomVideoEnded}
          onError={handleCustomVideoError}
          className="w-full h-full object-cover"
        />

        {/* Overlay de Controles Básicos */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white/90 border border-white/10 transition-colors"
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <div className="text-[10px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded border border-white/10">
            {secondsLeft > 0 ? `${secondsLeft}s restantes` : "Concluído"}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO: MODO GOOGLE IMA (VAST/VMAP)
  // =========================================================================
  if (activeProvider === "GOOGLE_IMA") {
    return (
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
        />
        <div
          ref={imaContainerRef}
          className="absolute inset-0 z-10"
        />
      </div>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO: MODO PADRÃO (SPONSOR SIMULATOR & DICAS DE ALTA PERFORMANCE)
  // =========================================================================
  return (
    <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden select-none">
      {/* Grade sutil animada de fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      {/* Pulso dinâmico de IA */}
      <motion.div
        animate={{
          scale: isPlaying ? [1, 1.06, 1] : 1,
          opacity: isPlaying ? [0.4, 0.7, 0.4] : 0.3,
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-violet-600/20 via-indigo-500/20 to-amber-500/20 blur-2xl pointer-events-none"
      />

      {!isCompleted ? (
        <div className="relative z-10 space-y-3 sm:space-y-4 max-w-sm">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-amber-500/30 border border-violet-400/30 flex items-center justify-center mx-auto shadow-lg shadow-violet-950/60">
            <BrainCircuit size={28} className="text-violet-300 animate-pulse" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
              Synapse AI • Dicas de Aprovação
            </h3>
            <p className="text-[10px] sm:text-[11px] text-violet-300/80 font-mono mt-0.5">
              Conteúdo Patrocinado • Alta Performance
            </p>
          </div>

          <div className="min-h-[46px] flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-xs">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-slate-300 font-medium leading-relaxed italic"
              >
                &ldquo;{SPONSOR_TIPS[tipIndex]}&rdquo;
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 space-y-3 max-w-sm"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Vídeo Patrocinado Concluído!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Obrigado por apoiar a plataforma. Seu bônus de {featureLabel.toLowerCase()} está liberado!
            </p>
          </div>
        </motion.div>
      )}

      {/* Controles de Play/Pause e Áudio */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 border border-white/10 transition-colors cursor-pointer"
            title={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 border border-white/10 transition-colors cursor-pointer"
            title={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
          00:{String(TOTAL_AD_SECONDS - secondsLeft).padStart(2, "0")} / 00:{TOTAL_AD_SECONDS}
        </div>
      </div>
    </div>
  );
}
