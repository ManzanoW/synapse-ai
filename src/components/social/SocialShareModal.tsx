// src/components/social/SocialShareModal.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  Square,
  Sparkles,
  Trophy,
  Flame,
  Clock,
  Target,
  Brain,
  MessageCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { useSound } from "@/hooks/useSound";

export interface SocialShareData {
  type: "simulado" | "redacao";
  banca: string;
  disciplineOrTheme: string;
  scoreOrAccuracy: number; // Porcentagem (0-100) ou Nota (0-100)
  maxScore?: number;
  secondaryMetrics?: {
    totalQuestions?: number;
    correctAnswers?: number;
    avgTimePerQuestion?: string;
    totalTimeFormatted?: string;
    streakDays?: number;
    earnedXp?: number;
    isApproved?: boolean;
    lineCount?: number;
  };
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SocialShareData;
}

export function SocialShareModal({
  isOpen,
  onClose,
  data,
}: SocialShareModalProps) {
  const [aspectRatio, setAspectRatio] = useState<"stories" | "feed">("stories");
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playClick, playChime } = useSound();

  const isSimulado = data.type === "simulado";
  const scoreVal = data.scoreOrAccuracy;

  // Função para desenhar no Canvas em alta definição
  const drawCardToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === "stories" ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    // 1. Fundo Gradiente Cósmico
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#030712");
    bgGrad.addColorStop(0.5, "#090d1a");
    bgGrad.addColorStop(1, "#111827");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Brilhos Neons Difusos
    const radGlow1 = ctx.createRadialGradient(200, 300, 10, 200, 300, 500);
    radGlow1.addColorStop(0, "rgba(99, 102, 241, 0.25)");
    radGlow1.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, width, height);

    const radGlow2 = ctx.createRadialGradient(width - 200, height - 300, 10, width - 200, height - 300, 500);
    radGlow2.addColorStop(0, "rgba(168, 85, 247, 0.20)");
    radGlow2.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Moldura Interna de Vidro
    const pad = 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 48);
    ctx.stroke();

    // 4. Cabeçalho Oficial Synapse AI
    const headerY = pad + 90;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("SYNAPSE", pad + 60, headerY);

    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("AI", pad + 270, headerY);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 20px monospace";
    ctx.fillText("POTÊNCIA COGNITIVA & IA", pad + 60, headerY + 36);

    // Badge Oficial de Desempenho
    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
    ctx.beginPath();
    ctx.roundRect(width - pad - 360, headerY - 35, 300, 55, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.stroke();

    ctx.fillStyle = "#c7d2fe";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      isSimulado ? "SIMULADO DE ALTA GAMA" : "REDAÇÃO OFICIAL IA",
      width - pad - 210,
      headerY
    );
    ctx.textAlign = "left";

    // 5. Bloco da Banca & Matéria
    const metaY = headerY + 160;
    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(data.banca.toUpperCase(), pad + 60, metaY);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px sans-serif";
    const disciplineText =
      data.disciplineOrTheme.length > 32
        ? `${data.disciplineOrTheme.slice(0, 32)}...`
        : data.disciplineOrTheme;
    ctx.fillText(disciplineText, pad + 60, metaY + 64);

    // 6. Placar Central Radial em Alta Definição
    const centerY = aspectRatio === "stories" ? height * 0.45 : height * 0.52;
    const centerX = width / 2;

    // Círculo de fundo
    ctx.beginPath();
    ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Arco de progresso
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const progressAngle = startAngle + (Math.PI * 2 * (scoreVal / 100));
    ctx.arc(centerX, centerY, 190, startAngle, progressAngle);
    ctx.strokeStyle = scoreVal >= 80 ? "#10b981" : scoreVal >= 60 ? "#818cf8" : "#f59e0b";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    // Texto Central do Placar
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 120px sans-serif";
    ctx.fillText(`${Math.round(scoreVal)}%`, centerX, centerY + 30);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(
      isSimulado ? "TAXA DE PRECISÃO" : "NOTA CONVERTIDA",
      centerX,
      centerY + 85
    );

    // 7. Grid de Métricas Secundárias (Ritmo, Ofensiva, etc.)
    const metricsY = aspectRatio === "stories" ? height * 0.68 : height * 0.72;
    const metrics = isSimulado
      ? [
          {
            label: "ACERTOS",
            val: `${data.secondaryMetrics?.correctAnswers ?? 0} / ${data.secondaryMetrics?.totalQuestions ?? 0}`,
          },
          {
            label: "RITMO MÉDIO",
            val: data.secondaryMetrics?.avgTimePerQuestion ?? "1m 30s",
          },
          {
            label: "OFENSIVA",
            val: `${data.secondaryMetrics?.streakDays ?? 1} Dias 🔥`,
          },
        ]
      : [
          {
            label: "STATUS",
            val: data.secondaryMetrics?.isApproved ? "APROVADO ✅" : "EM EVOLUÇÃO",
          },
          {
            label: "LINHAS",
            val: `${data.secondaryMetrics?.lineCount ?? 30} Linhas`,
          },
          {
            label: "OFENSIVA",
            val: `${data.secondaryMetrics?.streakDays ?? 1} Dias 🔥`,
          },
        ];

    const colW = (width - pad * 2 - 80) / metrics.length;
    metrics.forEach((m, idx) => {
      const colX = pad + 40 + idx * (colW + 20);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.roundRect(colX, metricsY, colW, 140, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(m.label, colX + colW / 2, metricsY + 50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText(m.val, colX + colW / 2, metricsY + 105);
    });

    // 8. Rodapé com Marca d'Água e Chamada
    const footerY = height - pad - 60;
    ctx.textAlign = "center";
    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Estude com Inteligência Artificial & Memorização Inteligente", centerX, footerY - 24);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 20px monospace";
    ctx.fillText("synapseai.app • A Plataforma do Concurseiro de Elite", centerX, footerY + 16);

    ctx.textAlign = "left";
  }, [aspectRatio, data, isSimulado, scoreVal]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        drawCardToCanvas();
      }, 100);
    }
  }, [isOpen, drawCardToCanvas]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    playClick();
    triggerHaptic("medium");

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `synapse-desempenho-${data.banca.toLowerCase()}-${aspectRatio}.png`;
      a.click();
      playChime();
    } catch (err) {
      console.error("Erro ao baixar imagem:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playClick();
    triggerHaptic("medium");

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopiedImage(true);
          playChime();
          setTimeout(() => setCopiedImage(false), 2500);
        } else {
          handleDownloadImage();
        }
      });
    } catch {
      handleDownloadImage();
    }
  };

  const handleWhatsAppShare = () => {
    playClick();
    triggerHaptic("light");
    const text = encodeURIComponent(
      `🎯 Acabei de fechar um simulado de ${data.banca} (${data.disciplineOrTheme}) com ${Math.round(scoreVal)}% de acerto no Synapse AI!\n\nConfira: https://synapseai.app`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="social-share-title"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl z-10 space-y-6 text-slate-100 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER DO MODAL */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 id="social-share-title" className="text-base sm:text-lg font-bold text-white">
                  Compartilhar Rendimento
                </h3>
                <p className="text-xs text-slate-400">
                  Gere cards estéticos em alta definição para Instagram Stories e WhatsApp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar compartilhamento"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* SELETOR DE FORMATO */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClick();
                setAspectRatio("stories");
              }}
              aria-pressed={aspectRatio === "stories"}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer border focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                aspectRatio === "stories"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <Smartphone size={15} />
              <span>Stories (9:16)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setAspectRatio("feed");
              }}
              aria-pressed={aspectRatio === "feed"}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer border focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                aspectRatio === "feed"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <Square size={15} />
              <span>Feed / WhatsApp (1:1)</span>
            </button>
          </div>

          {/* PRÉVIA VISUAL DO CARD (RENDER CANVAS) */}
          <div className="flex justify-center items-center py-2 bg-slate-950/60 rounded-2xl border border-white/5 p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              className={`rounded-2xl shadow-2xl border border-white/10 transition-all ${
                aspectRatio === "stories"
                  ? "max-h-[360px] w-auto aspect-[9/16]"
                  : "max-h-[300px] w-auto aspect-square"
              }`}
            />
          </div>

          {/* BOTÕES DE EXPORTAÇÃO E COMPARTILHAMENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              aria-label="Baixar imagem em alta definição"
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>Baixar Imagem HD</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              aria-label="Copiar imagem para área de transferência"
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
            >
              {copiedImage ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-emerald-400">Imagem Copiada!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Imagem</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              aria-label="Compartilhar no WhatsApp"
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 pt-1">
            Cada card compartilhado ajuda a divulgar o Synapse AI e estimula sua disciplina pública de estudos.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
