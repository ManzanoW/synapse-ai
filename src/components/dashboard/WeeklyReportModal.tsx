"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
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
  ShieldCheck,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  WeeklyPerformanceReportData,
  getWeeklyPerformanceReportAction,
} from "@/actions/analytics-actions";

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: WeeklyPerformanceReportData | null;
}

export function WeeklyReportModal({
  isOpen,
  onClose,
  initialData,
}: WeeklyReportModalProps) {
  const [data, setData] = useState<WeeklyPerformanceReportData | null>(
    initialData ?? null,
  );
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [aspectRatio, setAspectRatio] = useState<"stories" | "feed">("stories");
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carrega dados se não foram passados
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchReport() {
      setLoading(true);
      try {
        const res = await getWeeklyPerformanceReportAction();
        if (isMounted && res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Erro ao carregar boletim semanal:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData]);

  // Fecha o modal ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Função para desenhar no Canvas em alta definição (1080x1920 ou 1080x1080)
  const drawCardToCanvas = useCallback(() => {
    if (!data) return;
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
    bgGrad.addColorStop(0.4, "#0b0f1a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Nebulosas e Brilhos Neon Difusos
    const radGlow1 = ctx.createRadialGradient(250, 350, 20, 250, 350, 600);
    radGlow1.addColorStop(0, "rgba(99, 102, 241, 0.22)");
    radGlow1.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, width, height);

    const radGlow2 = ctx.createRadialGradient(
      width - 250,
      height - 350,
      20,
      width - 250,
      height - 350,
      600,
    );
    radGlow2.addColorStop(0, "rgba(6, 182, 212, 0.18)");
    radGlow2.addColorStop(1, "rgba(6, 182, 212, 0)");
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Moldura Externa de Vidro
    const pad = 55;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 48);
    ctx.stroke();

    // 4. Cabeçalho Oficial Synapse AI
    const headerY = pad + 90;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("SYNAPSE", pad + 50, headerY);

    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("AI", pad + 260, headerY);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 20px monospace";
    ctx.fillText("BOLETIM DE PERFORMANCE", pad + 50, headerY + 36);

    // Badge do Período
    ctx.fillStyle = "rgba(99, 102, 241, 0.18)";
    ctx.beginPath();
    ctx.roundRect(width - pad - 380, headerY - 35, 330, 56, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.stroke();

    ctx.fillStyle = "#c7d2fe";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.periodLabel.toUpperCase(), width - pad - 215, headerY);
    ctx.textAlign = "left";

    // 5. Bloco de Saudação e Arquétipo
    const archY = headerY + 120;
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    const archCardH = aspectRatio === "stories" ? 220 : 160;
    ctx.roundRect(pad + 50, archY, width - pad * 2 - 100, archCardH, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(129, 140, 248, 0.25)";
    ctx.stroke();

    // Nome e Arquétipo
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`RELATÓRIO DE: ${data.userName.toUpperCase()}`, pad + 85, archY + 50);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 42px sans-serif";
    ctx.fillText(data.archetype.title, pad + 85, archY + 105);

    if (aspectRatio === "stories") {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "italic 22px sans-serif";
      ctx.fillText(`"${data.archetype.quote}"`, pad + 85, archY + 165);
    }

    // 6. Placar Central / Métricas em Destaque
    const isStories = aspectRatio === "stories";

    if (isStories) {
      // STORIES: Círculo radial de acertos no centro
      const centerY = height * 0.48;
      const centerX = width / 2;

      // Círculo de fundo
      ctx.beginPath();
      ctx.arc(centerX, centerY, 170, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 14;
      ctx.stroke();

      // Arco de acertos
      const accuracy = data.accuracyPercentage;
      const startAngle = -Math.PI / 2;
      const progressAngle = startAngle + Math.PI * 2 * (accuracy / 100);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 170, startAngle, progressAngle);
      ctx.strokeStyle =
        accuracy >= 80 ? "#10b981" : accuracy >= 60 ? "#818cf8" : "#f59e0b";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.stroke();

      // Placar de acerto dentro do círculo
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 100px sans-serif";
      ctx.fillText(`${accuracy}%`, centerX, centerY + 24);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("PRECISÃO GERAL", centerX, centerY + 75);
      ctx.textAlign = "left";

      // Grid 2x2 de cards de métricas
      const gridY = height * 0.65;
      const cardW = (width - pad * 2 - 130) / 2;
      const cardH = 140;

      const items = [
        {
          label: "TEMPO DE FOCO",
          val: data.totalHoursFormatted,
          sub: `${data.sessionsCount} sessões`,
          color: "#818cf8",
        },
        {
          label: "QUESTÕES RESOLVIDAS",
          val: `${data.questionsCorrect}/${data.questionsTotal}`,
          sub: "acertos na semana",
          color: "#10b981",
        },
        {
          label: "ERROS CICATRIZADOS",
          val: `${data.masteredErrorsCount}`,
          sub: "pontos cegos superados",
          color: "#06b6d4",
        },
        {
          label: "OFENSIVA / XP",
          val: `${data.streakDays} Dias 🔥`,
          sub: `+${data.estimatedWeekXp} XP ganho`,
          color: "#f59e0b",
        },
      ];

      items.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cardX = pad + 50 + col * (cardW + 30);
        const cardY = gridY + row * (cardH + 25);

        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(item.label, cardX + 28, cardY + 42);

        ctx.fillStyle = item.color;
        ctx.font = "900 42px sans-serif";
        ctx.fillText(item.val, cardX + 28, cardY + 92);

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(item.sub, cardX + 28, cardY + 122);
      });
    } else {
      // FEED (1:1): Grid 4 colunas compacto e harmonioso
      const gridY = archY + archCardH + 50;
      const cardW = (width - pad * 2 - 130) / 2;
      const cardH = 175;

      const items = [
        {
          label: "TEMPO DE FOCO",
          val: data.totalHoursFormatted,
          sub: `${data.sessionsCount} sessões registradas`,
          color: "#818cf8",
        },
        {
          label: "TAXA DE ACERTOS",
          val: `${data.accuracyPercentage}%`,
          sub: `${data.questionsCorrect} de ${data.questionsTotal} questões`,
          color: data.accuracyPercentage >= 80 ? "#10b981" : "#f59e0b",
        },
        {
          label: "ERROS CICATRIZADOS",
          val: `${data.masteredErrorsCount}`,
          sub: "no Caderno de Erros",
          color: "#06b6d4",
        },
        {
          label: "OFENSIVA ATUAL",
          val: `${data.streakDays} Dias 🔥`,
          sub: `+${data.estimatedWeekXp} XP acumulado`,
          color: "#f59e0b",
        },
      ];

      items.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cardX = pad + 50 + col * (cardW + 30);
        const cardY = gridY + row * (cardH + 25);

        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 19px sans-serif";
        ctx.fillText(item.label, cardX + 30, cardY + 48);

        ctx.fillStyle = item.color;
        ctx.font = "900 48px sans-serif";
        ctx.fillText(item.val, cardX + 30, cardY + 110);

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 17px sans-serif";
        ctx.fillText(item.sub, cardX + 30, cardY + 148);
      });
    }

    // 7. Rodapé Oficial
    const footerY = height - pad - 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad + 50, footerY - 30);
    ctx.lineTo(width - pad - 50, footerY - 30);
    ctx.stroke();

    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("synapseai.app", pad + 50, footerY + 10);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(
      "Inteligência Artificial para Concursos de Elite",
      width - pad - 50,
      footerY + 10,
    );
    ctx.textAlign = "left";
  }, [data, aspectRatio]);

  // Redesenha sempre que os dados ou a proporção mudarem
  useEffect(() => {
    if (data && isOpen) {
      // Pequeno timeout para permitir que o modal e o canvas terminem a montagem
      const timer = setTimeout(() => {
        drawCardToCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [data, isOpen, drawCardToCanvas]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement("a");
      link.download = `boletim-semanal-synapse-${data?.userName ?? "estudos"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.error("Erro ao baixar imagem do boletim:", err);
    }
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      });
    } catch (err) {
      console.error("Erro ao copiar imagem para área de transferência:", err);
    }
  };

  const handleShareWhatsApp = () => {
    if (!data) return;

    const text = `📊 *Meu Boletim Semanal de Estudos no Synapse AI*
🗓 *Período:* ${data.periodLabel}
🎖 *Perfil:* ${data.archetype.title}

⏱ *Tempo de Foco:* ${data.totalHoursFormatted} (${data.sessionsCount} sessões)
🎯 *Questões:* ${data.questionsCorrect}/${data.questionsTotal} acertos (${data.accuracyPercentage}%)
🛡 *Erros Cicatrizados:* ${data.masteredErrorsCount} pontos cegos
🔥 *Ofensiva:* ${data.streakDays} dias consecutivos
⚡ *XP Semanal:* +${data.estimatedWeekXp} XP

Estude com inteligência artificial e acelere sua posse no Synapse AI: https://synapseai.app`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="weekly-report-modal-title"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden text-white"
        >
          {/* Header do Modal */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Trophy size={20} />
              </div>
              <div>
                <h3 id="weekly-report-modal-title" className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Boletim Semanal do Concurseiro
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                    Últimos 7 Dias
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Compartilhe seu progresso, inspire amigos e celebre sua constância.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar boletim semanal"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo Central */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visualizador do Card (Canvas) */}
            <div className="md:col-span-7 flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-indigo-400" />
                  <p className="text-xs font-bold">Compilando seu boletim...</p>
                </div>
              ) : (
                <div className="relative group w-full flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="max-h-[58vh] w-auto rounded-2xl shadow-2xl border border-white/10 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Painel Lateral de Ações e Configurações */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {/* Seletor de Formato */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Formato do Card
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("stories")}
                    aria-pressed={aspectRatio === "stories"}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[44px] text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                      aspectRatio === "stories"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Stories (9:16)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("feed")}
                    aria-pressed={aspectRatio === "feed"}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[44px] text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                      aspectRatio === "feed"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <Square size={14} />
                    <span>Feed (1:1)</span>
                  </button>
                </div>
              </div>

              {/* Resumo Rápido de Métricas */}
              {data && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2 text-xs">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Destaques da Semana
                  </span>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-400" />
                      Foco Total:
                    </span>
                    <strong className="text-white font-mono">{data.totalHoursFormatted}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Target size={13} className="text-emerald-400" />
                      Acertos:
                    </span>
                    <strong className="text-white font-mono">
                      {data.questionsCorrect}/{data.questionsTotal} ({data.accuracyPercentage}%)
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-cyan-400" />
                      Cicatrizados:
                    </span>
                    <strong className="text-white font-mono">
                      {data.masteredErrorsCount} erros
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Flame size={13} className="text-amber-400" />
                      Ofensiva:
                    </span>
                    <strong className="text-white font-mono">{data.streakDays} dias</strong>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={loading || !data}
                  aria-label="Baixar boletim semanal em imagem de alta resolução"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-500 to-cyan-500 py-3 px-4 min-h-[44px] font-black text-xs text-white shadow-xl shadow-indigo-600/25 hover:brightness-110 active:scale-98 transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                >
                  <Download size={16} />
                  <span>Baixar Imagem em Alta Resolução</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    disabled={loading || !data}
                    aria-label="Copiar imagem do boletim semanal para a área de transferência"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 min-h-[44px] text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                  >
                    {copiedImage ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar Imagem</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    disabled={loading || !data}
                    aria-label="Compartilhar boletim semanal no WhatsApp"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-2.5 px-3 min-h-[44px] text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
