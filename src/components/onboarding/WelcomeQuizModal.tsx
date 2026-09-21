"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Clock,
  Target,
  Flame,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Zap,
  PenTool,
  Layers,
  Compass,
  Coffee,
  Rocket,
  ShieldCheck,
  GraduationCap,
  FileText,
  Check,
  Loader2,
} from "lucide-react";
import { importStarterEditalAction } from "@/actions/edital-templates-actions";
import { STARTER_EDITAL_TEMPLATES } from "@/lib/edital-templates";

export type OnboardingProfileMode = "minimal" | "practice" | "full";

export interface OnboardingQuizResult {
  profileMode: OnboardingProfileMode;
  dailyHours: number;
  startAction: "dashboard" | "flashcards" | "questions" | "redacao" | "edital";
  careerTemplate?: string | null;
}

interface WelcomeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: OnboardingQuizResult) => void;
  onOpenFullTour?: () => void;
  userName?: string | null;
}

export function WelcomeQuizModal({
  isOpen,
  onClose,
  onComplete,
  onOpenFullTour,
  userName,
}: WelcomeQuizModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Estados das escolhas do usuário
  const [selectedMode, setSelectedMode] =
    useState<OnboardingProfileMode>("minimal");
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [selectedAction, setSelectedAction] = useState<
    "dashboard" | "flashcards" | "questions" | "redacao" | "edital"
  >("edital");
  const [selectedCareerTemplate, setSelectedCareerTemplate] = useState<string>("comum");
  const [isActivatingEdital, setIsActivatingEdital] = useState(false);

  if (!isOpen) return null;

  const firstName = userName ? userName.split(" ")[0] : "Concurseiro";

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else if (step === 3) {
      // Vai para a tela de confirmação e resumo
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleFinish = async () => {
    setIsActivatingEdital(true);

    try {
      if (selectedAction === "edital" && selectedCareerTemplate && selectedCareerTemplate !== "custom") {
        await importStarterEditalAction(selectedCareerTemplate);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error("Erro ao ativar modelo de edital no onboarding:", err);
    } finally {
      setIsActivatingEdital(false);
    }

    const result: OnboardingQuizResult = {
      profileMode: selectedMode,
      dailyHours: selectedHours,
      startAction: selectedAction,
      careerTemplate: selectedCareerTemplate,
    };

    onComplete(result);

    // Navega para o destino escolhido
    if (selectedAction === "edital") {
      if (selectedCareerTemplate === "custom") {
        router.push("/edital");
      } else {
        router.push("/dashboard");
      }
    } else if (selectedAction === "flashcards") {
      router.push("/flashcards");
    } else if (selectedAction === "questions") {
      router.push("/questions");
    } else if (selectedAction === "redacao") {
      router.push("/redacao");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-[#0f1424] via-[#090d18] to-[#05070d] shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Glow de ambientação no topo */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/60 to-transparent" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* ================= BARRA DE CABEÇALHO ================= */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Boas-vindas ao Synapse AI
                </span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.2 font-mono text-[9px] font-black text-indigo-300">
                  {step <= 3 ? `Passo ${step} de 3` : "Pronto!"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Personalize sua experiência em menos de 1 minuto
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Pular personalização"
          >
            <X size={15} />
          </button>
        </div>

        {/* ================= BARRA DE PROGRESSO ================= */}
        <div className="h-1 w-full bg-slate-900 border-b border-white/5">
          <motion.div
            className="h-full bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400"
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* ================= CONTEÚDO PRINCIPAL (CORPO DO WIZARD) ================= */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* ETAPA 1: MOMENTO E RITMO */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Olá, {firstName}! Qual é o seu momento de estudos hoje?
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Vamos ajustar a quantidade de informações da sua tela para você estudar sem ansiedade.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-1">
                  {/* Opção 1: Iniciante / Foco */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("minimal")}
                    className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === "minimal"
                        ? "border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                        selectedMode === "minimal"
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-400 group-hover:text-white"
                      }`}
                    >
                      <Coffee size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          Iniciante / Sem Ansiedade
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Modo Essencial
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Estou começando agora ou tenho pouco tempo. Quero uma tela limpa e descomplicada, focada apenas no que estudar hoje.
                      </p>
                    </div>
                  </button>

                  {/* Opção 2: Praticante Focado */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("practice")}
                    className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === "practice"
                        ? "border-indigo-500/50 bg-indigo-950/25 shadow-[0_0_20px_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/30"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                        selectedMode === "practice"
                          ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                          : "border-white/10 bg-white/5 text-slate-400 group-hover:text-white"
                      }`}
                    >
                      <Target size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          Praticante Focado
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Modo Prática
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Já possuo uma rotina. Quero treinar com questões, flashcards com repetição espaçada e ver minhas metas diárias.
                      </p>
                    </div>
                  </button>

                  {/* Opção 3: Reta Final / Estrategista */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("full")}
                    className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === "full"
                        ? "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                        selectedMode === "full"
                          ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                          : "border-white/10 bg-white/5 text-slate-400 group-hover:text-white"
                      }`}
                    >
                      <Rocket size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          Reta Final / Edital Aberto
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Modo Completo
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Quero todas as métricas: radar de cobertura do edital, estimativa preditiva de aprovação e telemetria profunda.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ETAPA 2: HORAS DISPONÍVEIS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Quanto tempo você planeja estudar por dia?
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Não se preocupe: a IA reorganiza sua meta automaticamente caso você perca algum dia.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Opção 1: 1 a 2 horas */}
                  <button
                    type="button"
                    onClick={() => setSelectedHours(2)}
                    className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[140px] ${
                      selectedHours === 2
                        ? "border-indigo-500/60 bg-indigo-950/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/40"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Clock size={18} />
                      </div>
                      {selectedHours === 2 && (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white">
                        1 a 2 horas
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Conciliando com trabalho ou faculdade. Sessões curtas de 30-45 min.
                      </span>
                    </div>
                  </button>

                  {/* Opção 2: 2 a 4 horas */}
                  <button
                    type="button"
                    onClick={() => setSelectedHours(3)}
                    className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[140px] ${
                      selectedHours === 3
                        ? "border-cyan-500/60 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/40"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Flame size={18} />
                      </div>
                      {selectedHours === 3 && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white">
                        2 a 4 horas
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Ritmo contínuo com blocos intercalados e intervalos regulares.
                      </span>
                    </div>
                  </button>

                  {/* Opção 3: 4+ horas */}
                  <button
                    type="button"
                    onClick={() => setSelectedHours(5)}
                    className={`flex flex-col justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[140px] ${
                      selectedHours === 5
                        ? "border-emerald-500/60 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Zap size={18} />
                      </div>
                      {selectedHours === 5 && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      )}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-white">
                        4h ou mais
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Foco integral com ciclos rotativos para manter alta absorção.
                      </span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ETAPA 3: PONTO DE PARTIDA */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Por onde você gostaria de começar hoje?
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Definir sua área de estudo é o passo mais importante para liberar simulados, flashcards e seu cronograma adaptativo.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Opção Principal: Definir Concurso / Edital */}
                  <div
                    className={`rounded-2xl border transition-all ${
                      selectedAction === "edital"
                        ? "border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/40 p-4"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 p-3.5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAction("edital")}
                      className="w-full flex items-start gap-3 text-left cursor-pointer"
                    >
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-black text-white">
                            Definir meu Concurso / Área de Estudo
                          </span>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            ⭐ Recomendado 1º Passo
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          Escolha sua carreira para carregar as matérias essenciais em 1 clique e liberar todos os simulados e flashcards sem travas.
                        </p>
                      </div>
                    </button>

                    {/* Sub-seletor de carreiras quando Edital está selecionado */}
                    {selectedAction === "edital" && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                          Selecione sua carreira para carregar as disciplinas:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.values(STARTER_EDITAL_TEMPLATES).map((tpl) => (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => setSelectedCareerTemplate(tpl.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                selectedCareerTemplate === tpl.id
                                  ? "border-amber-400/60 bg-amber-500/15 text-white ring-1 ring-amber-400/40"
                                  : "border-white/10 bg-black/40 text-slate-300 hover:border-white/20"
                              }`}
                            >
                              <span className="text-lg">{tpl.icon}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold block truncate">
                                  {tpl.title.split("(")[0].trim()}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {tpl.materias.length} matérias base
                                </span>
                              </div>
                              {selectedCareerTemplate === tpl.id && (
                                <Check size={14} className="text-amber-400 shrink-0" />
                              )}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setSelectedCareerTemplate("custom")}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              selectedCareerTemplate === "custom"
                                ? "border-amber-400/60 bg-amber-500/15 text-white ring-1 ring-amber-400/40"
                                : "border-white/10 bg-black/40 text-slate-300 hover:border-white/20"
                            }`}
                          >
                            <FileText size={18} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate">
                                Tenho edital próprio em PDF
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                Importar texto ou arquivo
                              </span>
                            </div>
                            {selectedCareerTemplate === "custom" && (
                              <Check size={14} className="text-amber-400 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4 Outras Ferramentas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Ponto: Simulados */}
                    <button
                      type="button"
                      onClick={() => setSelectedAction("questions")}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedAction === "questions"
                          ? "border-emerald-500/60 bg-emerald-950/25 ring-1 ring-emerald-500/30"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Fazer Simulado Rápido
                        </span>
                        <span className="text-[10px] text-slate-400 leading-snug block mt-0.5">
                          Resolva questões calibradas por banca e tema.
                        </span>
                      </div>
                    </button>

                    {/* Ponto: Flashcards */}
                    <button
                      type="button"
                      onClick={() => setSelectedAction("flashcards")}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedAction === "flashcards"
                          ? "border-indigo-500/60 bg-indigo-950/25 ring-1 ring-indigo-500/30"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                        <Layers size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Praticar Flashcards
                        </span>
                        <span className="text-[10px] text-slate-400 leading-snug block mt-0.5">
                          Revise com repetição espaçada e áudio neural.
                        </span>
                      </div>
                    </button>

                    {/* Ponto: Redação */}
                    <button
                      type="button"
                      onClick={() => setSelectedAction("redacao")}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedAction === "redacao"
                          ? "border-cyan-500/60 bg-cyan-950/25 ring-1 ring-cyan-500/30"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                        <PenTool size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Corretor de Redação
                        </span>
                        <span className="text-[10px] text-slate-400 leading-snug block mt-0.5">
                          Envie foto manuscrita ou texto e receba parecer.
                        </span>
                      </div>
                    </button>

                    {/* Ponto: Dashboard Direto */}
                    <button
                      type="button"
                      onClick={() => setSelectedAction("dashboard")}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedAction === "dashboard"
                          ? "border-violet-500/60 bg-violet-950/25 ring-1 ring-violet-500/30"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 shrink-0">
                        <Compass size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Entrar no Dashboard
                        </span>
                        <span className="text-[10px] text-slate-400 leading-snug block mt-0.5">
                          Ver meu cronograma ajustado ao perfil.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ETAPA 4: CONFIRMAÇÃO & RESUMO */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 text-center py-2"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={32} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Tudo pronto para sua aprovação!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Seu ambiente foi configurado com sucesso e está calibrado para o seu ritmo.
                  </p>
                </div>

                {/* Resumo dos Ajustes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto text-left pt-2">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      Modo Ativado
                    </span>
                    <span className="text-xs font-black text-white mt-0.5 block">
                      {selectedMode === "minimal"
                        ? "🌟 Modo Essencial"
                        : selectedMode === "practice"
                          ? "🎯 Modo Prática"
                          : "🚀 Modo Completo"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      Meta Diária
                    </span>
                    <span className="text-xs font-black text-white mt-0.5 block">
                      {selectedHours === 2
                        ? "1 a 2 horas/dia"
                        : selectedHours === 3
                          ? "2 a 4 horas/dia"
                          : "4h+ intensivo"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      Primeiro Passo
                    </span>
                    <span className="text-xs font-black text-white mt-0.5 block truncate">
                      {selectedAction === "edital"
                        ? selectedCareerTemplate === "custom"
                          ? "Importar Edital"
                          : `${STARTER_EDITAL_TEMPLATES[selectedCareerTemplate]?.icon || "📚"} ${
                              STARTER_EDITAL_TEMPLATES[selectedCareerTemplate]?.title.split("(")[0].trim() || "Edital"
                            }`
                        : selectedAction === "flashcards"
                          ? "Flashcards"
                          : selectedAction === "questions"
                            ? "Simulado"
                            : selectedAction === "redacao"
                              ? "Redação IA"
                              : "Dashboard"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={isActivatingEdital}
                    onClick={handleFinish}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActivatingEdital ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Carregando seu Edital...</span>
                      </>
                    ) : (
                      <>
                        <span>Começar Meus Estudos Agora</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>

                {onOpenFullTour && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFullTour();
                      }}
                      className="text-[11px] text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      Deseja ver o manual completo de cada ferramenta? Abrir Tour Detalhado
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= RODAPÉ COM BOTÕES DE NAVEGAÇÃO ================= */}
        {step < 4 && (
          <div className="relative z-10 flex items-center justify-between border-t border-white/5 px-5 py-3.5 bg-black/40">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Voltar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Pular personalização
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <span>{step === 3 ? "Concluir Perfil" : "Continuar"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
