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
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Zap,
  Coffee,
  Rocket,
  GraduationCap,
  FileText,
  Check,
  Loader2,
  Wand2,
  HelpCircle,
  UploadCloud,
} from "lucide-react";
import {
  importStarterEditalAction,
  generateCustomEditalAction,
  saveOnboardingPreferencesAction,
} from "@/actions/edital-templates-actions";
import { STARTER_EDITAL_TEMPLATES } from "@/lib/edital-templates";

export type OnboardingProfileMode = "minimal" | "practice" | "full";

export interface OnboardingQuizResult {
  profileMode: OnboardingProfileMode;
  dailyHours: number;
  startAction: "dashboard" | "flashcards" | "questions" | "redacao" | "edital";
  careerTemplate?: string | null;
  customRole?: string | null;
}

interface WelcomeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: OnboardingQuizResult) => void;
  onOpenFullTour?: () => void;
  userName?: string | null;
}

const QUICK_AI_SUGGESTIONS = [
  { label: "👮 PF / PRF", value: "Polícia Federal - Agente / PRF" },
  { label: "💰 Receita Federal", value: "Auditor Fiscal da Receita Federal" },
  { label: "🏛️ Tribunais (TRF/TJ)", value: "Técnico / Analista Judiciário TRF" },
  { label: "💻 TI & Dados", value: "Analista de Tecnologia da Informação" },
  { label: "🏦 BB / Caixa", value: "Carreira Bancária - Banco do Brasil / Caixa" },
  { label: "📋 INSS", value: "Técnico do Seguro Social - INSS" },
  { label: "⚖️ Jurídico / OAB", value: "Exame de Ordem OAB / Analista Jurídico" },
];

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
  const [selectedMode, setSelectedMode] = useState<OnboardingProfileMode>("minimal");
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [selectedCareerTemplate, setSelectedCareerTemplate] = useState<string>("ti");
  const [customRoleInput, setCustomRoleInput] = useState<string>("");
  const [careerCategoryFilter, setCareerCategoryFilter] = useState<string>("all");
  const [isActivatingEdital, setIsActivatingEdital] = useState(false);
  const [selectedBanca, setSelectedBanca] = useState<string>("CEBRASPE");

  if (!isOpen) return null;

  const firstName = userName ? userName.split(" ")[0] : "Concurseiro";

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else if (step === 3) {
      // Se selecionou custom IA mas não digitou nada, seleciona TI padrão
      if (selectedCareerTemplate === "ai-custom" && !customRoleInput.trim()) {
        setSelectedCareerTemplate("ti");
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleFinish = async (destination: "dashboard" | "questions" = "dashboard") => {
    setIsActivatingEdital(true);

    try {
      // 1. Salva preferências e meta de horas no perfil do usuário
      await saveOnboardingPreferencesAction({
        dailyHours: selectedHours,
        profileMode: selectedMode,
      });

      // 2. Sempre importa a carreira escolhida para garantir que o aluno comece com matérias prontas
      if (selectedCareerTemplate === "ai-custom" && customRoleInput.trim()) {
        const res = await generateCustomEditalAction(customRoleInput.trim());
        if (!res.success) {
          console.warn("Erro ao gerar edital com IA, prosseguindo:", res.error);
        }
      } else if (
        selectedCareerTemplate &&
        selectedCareerTemplate !== "custom" &&
        selectedCareerTemplate !== "ai-custom"
      ) {
        await importStarterEditalAction(selectedCareerTemplate);
      }

      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Erro ao ativar preferências e edital no onboarding:", err);
    } finally {
      setIsActivatingEdital(false);
    }

    const result: OnboardingQuizResult = {
      profileMode: selectedMode,
      dailyHours: selectedHours,
      startAction: destination === "questions" ? "questions" : "edital",
      careerTemplate: selectedCareerTemplate,
      customRole: customRoleInput.trim() || null,
    };

    onComplete(result);

    // Navega para o destino escolhido
    if (destination === "questions") {
      router.push(`/questions?banca=${selectedBanca}&autoStart=1&count=3`);
    } else if (selectedCareerTemplate === "custom") {
      router.push("/edital?import=true");
    } else {
      router.push("/dashboard");
    }
  };

  // Filtragem de templates de carreiras oficiais
  const allTemplates = Object.values(STARTER_EDITAL_TEMPLATES);
  const filteredTemplates = allTemplates.filter((t) => {
    if (careerCategoryFilter === "all") return true;
    if (careerCategoryFilter === "ti") return t.category === "ti";
    if (careerCategoryFilter === "policial") return t.category === "policial";
    if (careerCategoryFilter === "fiscal_controle") return t.category === "fiscal_controle";
    if (careerCategoryFilter === "administrativo") return t.category === "administrativo";
    if (careerCategoryFilter === "juridica") return t.category === "juridica";
    if (careerCategoryFilter === "saude_educacao") return t.category === "saude_educacao";
    return true;
  });

  // Nome legível da carreira selecionada para o resumo do Passo 4
  const selectedCareerLabel =
    selectedCareerTemplate === "ai-custom"
      ? customRoleInput.trim() || "Cargo Personalizado por IA"
      : selectedCareerTemplate === "custom"
        ? "Edital Próprio em PDF / Texto"
        : STARTER_EDITAL_TEMPLATES[selectedCareerTemplate]?.title.split("(")[0].trim() ||
          "Tecnologia da Informação & Dados";

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

        {/* ================= CORPO DAS ETAPAS ================= */}
        <div className="relative z-10 p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* ETAPA 1: MOMENTO DE ESTUDOS */}
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
                    Vamos ajustar a quantidade de informações da sua tela para você estudar com foco e sem ansiedade.
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
                        Já possuo uma rotina. Quero treinar com questões, cartões de memória inteligentes e ver minhas metas diárias.
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
                        Quero todas as métricas: radar de cobertura do edital, previsão de aprovação e análise completa de desempenho.
                      </p>
                    </div>
                  </button>
                </div>

                {/* 3. SELETOR DE ESTILO DE BANCA ORGANIZADORA */}
                <div className="pt-2.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Target size={14} className="text-amber-400" />
                      Qual é o seu estilo ou banca de preferência?
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">Calibra o formato dos simulados</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "CEBRASPE", label: "⚖️ Cebraspe", desc: "Certo / Errado" },
                      { id: "FGV", label: "📝 FGV", desc: "Casos Práticos (A-E)" },
                      { id: "FCC", label: "🏛️ FCC", desc: "Letra da Lei (A-E)" },
                      { id: "GERAL", label: "🎲 Misto", desc: "Todas as bancas" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBanca(b.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedBanca === b.id
                            ? "border-amber-400/80 bg-amber-500/15 text-white ring-1 ring-amber-400/50 shadow-sm"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <span className="text-xs font-bold block">{b.label}</span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">{b.desc}</span>
                      </button>
                    ))}
                  </div>
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
                        Conciliando com trabalho ou faculdade. Sessões de 30-45 min.
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

            {/* ETAPA 3: ESCOLHA DA CARREIRA OU PERSONALIZAÇÃO COM IA */}
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
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <GraduationCap size={16} />
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Qual é o seu concurso ou foco de estudo?
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Escolha uma carreira pronta, personalize com IA ou importe seu edital próprio em PDF.
                  </p>
                </div>

                {/* ================= SEÇÃO SUPERIOR: AS 2 OPÇÕES PERSONALIZADAS (IA + UPLOAD PDF) ================= */}
                <div className="space-y-2.5">
                  {/* 1. HERO CARD: PERSONALIZAR COM IA (DIGITE SEU CARGO DESEJADO) */}
                  <div
                    className={`rounded-2xl border p-4 transition-all ${
                      selectedCareerTemplate === "ai-custom"
                        ? "border-indigo-400/80 bg-indigo-950/40 ring-1 ring-indigo-400/50 shadow-[0_0_24px_rgba(99,102,241,0.2)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        <Wand2 size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                            Personalizar com IA (Meu Cargo ou Concurso)
                          </span>
                          <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            ✨ Mais flexível
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Digite qualquer concurso do Brasil e a IA monta sua grade de matérias oficial na hora.
                        </p>

                        {/* Campo de Texto para o Cargo */}
                        <div className="mt-3">
                          <input
                            type="text"
                            value={customRoleInput}
                            onChange={(e) => {
                              setCustomRoleInput(e.target.value);
                              setSelectedCareerTemplate("ai-custom");
                            }}
                            onFocus={() => setSelectedCareerTemplate("ai-custom")}
                            placeholder="Ex: Perito Criminal PF, Analista Judiciário TRF, Auditor da Receita, Caixa..."
                            className="w-full bg-slate-900/90 border border-white/15 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
                          />
                        </div>

                        {/* Pílulas de Sugestões Rápidas (1 Clique) */}
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 mr-1">Sugestões:</span>
                          {QUICK_AI_SUGGESTIONS.map((sug) => (
                            <button
                              key={sug.label}
                              type="button"
                              onClick={() => {
                                setCustomRoleInput(sug.value);
                                setSelectedCareerTemplate("ai-custom");
                              }}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all cursor-pointer ${
                                selectedCareerTemplate === "ai-custom" && customRoleInput === sug.value
                                  ? "bg-indigo-500 text-white border-indigo-400 shadow-sm"
                                  : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {sug.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. CARD EM DESTAQUE NO TOPO: IMPORTAR EDITAL PRÓPRIO EM PDF / TEXTO */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCareerTemplate("custom");
                      setCustomRoleInput("");
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedCareerTemplate === "custom"
                        ? "border-emerald-400/80 bg-emerald-950/40 ring-1 ring-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/40 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                          selectedCareerTemplate === "custom"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-white/5 text-slate-300 border-white/10"
                        }`}
                      >
                        <UploadCloud size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-white block">
                            Tenho Edital Próprio em PDF ou Texto
                          </span>
                          <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Upload PDF 📄
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Faça upload do seu edital ou cole o conteúdo programático para a IA extrair sua grade.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pl-2">
                      {selectedCareerTemplate === "custom" ? (
                        <div className="p-1.5 rounded-full bg-emerald-400 text-slate-950">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400/90 hidden sm:inline-flex items-center gap-1">
                          Importar <ArrowRight size={13} />
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* DIVISOR ELEGANTE */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Ou escolha uma carreira pronta
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* FILTRO DE CATEGORIAS (FLEX-WRAP LIMPO SEM ROLAGEM DUPLA) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all", label: `🔥 Todas (${allTemplates.length})` },
                    { id: "ti", label: `💻 TI & Dados` },
                    { id: "policial", label: `👮 Policial` },
                    { id: "fiscal_controle", label: `💰 Fiscal & Controle` },
                    { id: "administrativo", label: `🏛️ Tribunais & Adm` },
                    { id: "juridica", label: `⚖️ Jurídica` },
                    { id: "saude_educacao", label: `🩺 Saúde & Educação` },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCareerCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        careerCategoryFilter === cat.id
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* GRID DE CARREIRAS OFICIAIS (SEM TRUNCAMENTO DE TEXTO) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = selectedCareerTemplate === tpl.id;
                    const cleanTitle = tpl.title.split("(")[0].trim();
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedCareerTemplate(tpl.id);
                          setCustomRoleInput("");
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                          isSelected
                            ? "border-amber-400/80 bg-amber-500/15 text-white ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 text-slate-200"
                        }`}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{tpl.icon}</span>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white block leading-snug">
                              {cleanTitle}
                            </span>
                            {tpl.badge && (
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                {tpl.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {tpl.materias.length} matérias essenciais inclusas
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 p-1 rounded-full bg-amber-400 text-slate-950">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ETAPA 4: CONFIRMAÇÃO & DIRECIONAMENTO ACOLHEDOR */}
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
                    Tudo pronto para sua aprovação, {firstName}!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    {selectedCareerTemplate === "custom"
                      ? "Seu perfil foi configurado. Agora você será direcionado para carregar o seu edital oficial."
                      : "Seu ambiente e seu ciclo de estudos foram calibrados para sua carreira."}
                  </p>
                </div>

                {/* Resumo dos Ajustes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto text-left pt-2">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      Foco / Carreira
                    </span>
                    <span className="text-xs font-black text-amber-300 mt-0.5 block truncate">
                      {selectedCareerLabel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      Meta Semanal
                    </span>
                    <span className="text-xs font-black text-white mt-0.5 block">
                      {selectedHours * 5}h semanais
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({selectedHours}h/dia em 5 dias)
                    </span>
                  </div>

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
                </div>

                {/* Botões de Ação Direta para o Aluno não se sentir perdido */}
                <div className="pt-3 max-w-md mx-auto space-y-2">
                  <button
                    disabled={isActivatingEdital}
                    onClick={() => handleFinish("dashboard")}
                    className="w-full px-6 py-3.5 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActivatingEdital ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Configurando seu plano...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {selectedCareerTemplate === "custom"
                            ? "Importar Meu Edital em PDF 📄"
                            : "Acessar Meu Painel de Estudos"}
                        </span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {selectedCareerTemplate !== "custom" && (
                    <button
                      type="button"
                      disabled={isActivatingEdital}
                      onClick={() => handleFinish("questions")}
                      className="w-full px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>⚡ Fazer Simulado Diagnóstico Rápido (5 questões)</span>
                    </button>
                  )}
                </div>

                {onOpenFullTour && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFullTour();
                      }}
                      className="text-[11px] text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <HelpCircle size={12} />
                      <span>Deseja ver o manual completo de cada ferramenta? Abrir Tour</span>
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
              <span>{step === 3 ? "Criar Meu Plano de Estudos" : "Continuar"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
