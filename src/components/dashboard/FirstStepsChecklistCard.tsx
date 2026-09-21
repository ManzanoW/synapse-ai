"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  Headphones,
  Layers,
  ArrowRight,
  Gift,
  Trophy,
  Flame,
} from "lucide-react";

interface FirstStepsChecklistCardProps {
  hasEditalSubjects: boolean;
  sessionsCount: number;
  questionsCount: number;
  getHref: (path: string) => string;
}

function playCelebrationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Fanfarra)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.5);
    });
  } catch {}
}

export function FirstStepsChecklistCard({
  hasEditalSubjects,
  sessionsCount,
  questionsCount,
  getHref,
}: FirstStepsChecklistCardProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [floatingXp, setFloatingXp] = useState<boolean>(false);

  // Carrega estado persistido
  useEffect(() => {
    try {
      const saved = localStorage.getItem("synapse_first_steps_checklist");
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsDismissed(Boolean(parsed.dismissed));
        setIsMinimized(Boolean(parsed.minimized));
        setIsClaimed(Boolean(parsed.claimed));
      }
    } catch {}
  }, []);

  const saveState = (updates: Partial<{ dismissed: boolean; minimized: boolean; claimed: boolean }>) => {
    try {
      const current = {
        dismissed: isDismissed,
        minimized: isMinimized,
        claimed: isClaimed,
        ...updates,
      };
      localStorage.setItem("synapse_first_steps_checklist", JSON.stringify(current));
    } catch {}
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    saveState({ dismissed: true });
  };

  const handleToggleMinimize = () => {
    const next = !isMinimized;
    setIsMinimized(next);
    saveState({ minimized: next });
  };

  const handleClaim = () => {
    playCelebrationSound();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setFloatingXp(true);
    setTimeout(() => setFloatingXp(false), 2500);
    setIsClaimed(true);
    saveState({ claimed: true });
  };

  // Cálculo de tarefas completadas
  const step1Done = hasEditalSubjects;
  const step2Done = sessionsCount > 0;
  const step3Done = questionsCount >= 3;

  const completedCount =
    (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);
  const allDone = completedCount === 3;
  const progressPercent = Math.round((completedCount / 3) * 100);

  // Se o usuário já resgatou o bônus e dispensou o card, não renderiza
  if (isDismissed && isClaimed) return null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-amber-500/25 bg-linear-to-br from-[#120e06]/90 via-[#0b0f1a]/95 to-slate-950/90 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-amber-500/40">
      {/* Luz ambiente de fundo */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -left-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Floating XP Toast */}
      <AnimatePresence>
        {floatingXp && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], y: -28, scale: 1.15 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="pointer-events-none absolute right-8 top-3 z-30 flex items-center gap-1.5 rounded-full bg-amber-500/25 border border-amber-500/50 px-3 py-1 font-mono text-xs font-black text-amber-300 shadow-xl backdrop-blur-md"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>+100 XP Concedidos!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CABEÇALHO ================= */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Trophy size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                Suas Primeiras Conquistas
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-black text-amber-300 flex items-center gap-1">
                <Flame size={10} className="fill-amber-400 text-amber-400" />
                {completedCount}/3 Concluídas
              </span>
              {isClaimed && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-black text-emerald-300">
                  ✓ Recompensa Coletada
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Complete os 3 passos iniciais para calibrar sua rotina e ganhar +100 XP
            </p>
          </div>
        </div>

        {/* Controles de Minimização / Fechar */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isMinimized ? "Expandir checklist" : "Recolher checklist"}
          >
            {isMinimized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Ocultar do Dashboard"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ================= BARRA DE PROGRESSO ================= */}
      <div className="h-1 w-full bg-slate-900 border-b border-white/5">
        <div
          className="h-full bg-linear-to-r from-amber-500 via-orange-400 to-emerald-400 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ================= CORPO RECOLHÍVEL ================= */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 p-4 sm:p-5 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* PASSO 1: EDITAL */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  step1Done
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${step1Done ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}`}>
                        <BookOpen size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Passo 1
                      </span>
                    </div>
                    {step1Done ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-600 shrink-0" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">
                    Definir Edital ou Matérias
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Cadastre as disciplinas da sua prova para a IA organizar seu cronograma.
                  </p>
                </div>

                <div className="pt-3">
                  {step1Done ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
                      ✓ Configurado
                    </span>
                  ) : (
                    <Link
                      href={getHref("/edital")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition-all group/link"
                    >
                      <span>Cadastrar Edital</span>
                      <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>

              {/* PASSO 2: SALA DE FOCO */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  step2Done
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${step2Done ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}`}>
                        <Headphones size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Passo 2
                      </span>
                    </div>
                    {step2Done ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-600 shrink-0" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">
                    Fazer 1ª Sessão na Sala de Foco
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Experimente o cronômetro com áudios binaurais para manter o ritmo sem distrações.
                  </p>
                </div>

                <div className="pt-3">
                  {step2Done ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
                      ✓ Sessão Realizada
                    </span>
                  ) : (
                    <Link
                      href={getHref("/study-room")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] transition-all group/link"
                    >
                      <span>Abrir Sala de Foco</span>
                      <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>

              {/* PASSO 3: PRÁTICA */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  step3Done
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${step3Done ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}`}>
                        <Layers size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Passo 3
                      </span>
                    </div>
                    {step3Done ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-600 shrink-0" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">
                    Resolver Questões ou Cards
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Resolva suas primeiras questões ou pratique flashcards com repetição espaçada.
                  </p>
                </div>

                <div className="pt-3">
                  {step3Done ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
                      ✓ Prática Iniciada
                    </span>
                  ) : (
                    <Link
                      href={getHref("/questions")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] transition-all group/link"
                    >
                      <span>Fazer Questões</span>
                      <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* BARRA DE RESGATE DO BÔNUS QUANDO 3/3 ESTIVEREM COMPLETOS */}
            {allDone && (
              <div className="mt-3 p-3 rounded-2xl border border-amber-500/40 bg-linear-to-r from-amber-950/40 via-[#181308] to-amber-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-200 block">
                      Parabéns! Todas as 3 metas iniciais concluídas!
                    </span>
                    <span className="text-[10px] text-amber-200/70 block">
                      Você deu os primeiros passos com maestria. Resgate seus +100 XP agora!
                    </span>
                  </div>
                </div>

                {isClaimed ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-xs">
                    ✓ +100 XP Coletados!
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaim}
                    className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Gift size={14} />
                    <span>Resgatar +100 XP</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
