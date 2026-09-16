"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Flame,
  Layers,
  ArrowLeft,
  Check,
  Loader2,
  BookmarkPlus,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { QuestaoIA } from "@/app/(dashboard)/questions/page";
import { useGamification } from "@/context/GamificationContext";
import {
  deepenExplanationAction,
  DeepenExplanationResult,
} from "@/actions/quiz-actions";
import {
  saveWrongQuestionsToNotebookAction,
  WrongQuestionItem,
} from "@/actions/error-notebook-actions";

export interface QuizResultViewProps {
  quizId?: string | null;
  banca?: string;
  subject?: string;
  topicId?: string | null;
  questions: QuestaoIA[];
  selectedAnswers: Record<number, string>;
  timerSeconds: number;
  earnedXp: number;
  levelUpData?: {
    leveledUp: boolean;
    newLevel: number;
    title?: string;
  } | null;
  onRestart: () => void;
  onExit: () => void;
}

const renderEnunciado = (texto: string) => {
  if (!texto) return null;
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      const conteudoLimpo = parte.slice(2, -2);
      return (
        <span
          key={`hl-${i}`}
          className="inline-block bg-violet-500/15 text-violet-200 px-1.5 py-0.5 mx-0.5 rounded-md border border-violet-400/30 font-semibold align-baseline shadow-xs"
        >
          {conteudoLimpo}
        </span>
      );
    }
    return <React.Fragment key={`txt-${i}`}>{parte}</React.Fragment>;
  });
};

export function QuizResultView({
  quizId,
  banca = "FGV",
  subject = "Conhecimentos Gerais",
  topicId,
  questions,
  selectedAnswers,
  timerSeconds,
  earnedXp,
  levelUpData,
  onRestart,
  onExit,
}: QuizResultViewProps) {
  const { stats } = useGamification();

  // Estados de navegação e filtros
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [filterReview, setFilterReview] = useState<"all" | "incorrect" | "correct">("all");

  // Estado de persistência no Caderno de Erros
  const [isSavingErrors, setIsSavingErrors] = useState(false);
  const [isErrorsSaved, setIsErrorsSaved] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Estado de aprofundamento por IA sob demanda
  const [deepenedExplanations, setDeepenedExplanations] = useState<
    Record<number, DeepenExplanationResult>
  >({});
  const [loadingDeepIndex, setLoadingDeepIndex] = useState<number | null>(null);

  // Cálculos de desempenho
  const totalQuestions = questions.length;
  const correctCount = useMemo(() => {
    return questions.filter(
      (q, idx) => selectedAnswers[idx] === q.gabaritoCorreto
    ).length;
  }, [questions, selectedAnswers]);

  const incorrectCount = totalQuestions - correctCount;
  const percentageAcc =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const averageTimePerQuestion =
    totalQuestions > 0 ? Math.round(timerSeconds / totalQuestions) : 0;

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  // Classificação Dinâmica
  const classification = useMemo(() => {
    if (percentageAcc >= 85) {
      return {
        title: "Performance de Elite",
        badge: "🏆 PERFORMANCE DE ELITE",
        color: "text-amber-300",
        border: "border-amber-500/40 bg-amber-500/10",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.25)]",
        ringGradient: ["#a855f7", "#eab308"],
        description:
          "Domínio cirúrgico dos conceitos! Sua taxa de acerto atinge patamares de aprovação no topo das bancas.",
      };
    }
    if (percentageAcc >= 60) {
      return {
        title: "Em Evolução",
        badge: "⚡ EM EVOLUÇÃO",
        color: "text-violet-300",
        border: "border-violet-500/40 bg-violet-500/10",
        glow: "shadow-[0_0_30px_rgba(168,85,247,0.25)]",
        ringGradient: ["#6366f1", "#a855f7"],
        description:
          "Bom ritmo de estudos! Revise com atenção as questões incorretas para lapidar as arestas teóricas.",
      };
    }
    return {
      title: "Revisão Necessária",
      badge: "⚠️ REVISÃO NECESSÁRIA",
      color: "text-rose-300",
      border: "border-rose-500/40 bg-rose-500/10",
      glow: "shadow-[0_0_30px_rgba(244,63,94,0.2)]",
      ringGradient: ["#f43f5e", "#a855f7"],
      description:
        "Retenção abaixo do ideal. Recomendamos adicionar os erros ao Caderno de Erros e reforçar a teoria base.",
    };
  }, [percentageAcc]);

  // Lista filtrada de questões
  const filteredQuestions = useMemo(() => {
    return questions
      .map((q, idx) => ({
        question: q,
        index: idx,
        userAnswer: selectedAnswers[idx],
        isCorrect: selectedAnswers[idx] === q.gabaritoCorreto,
      }))
      .filter((item) => {
        if (filterReview === "incorrect") return !item.isCorrect;
        if (filterReview === "correct") return item.isCorrect;
        return true;
      });
  }, [questions, selectedAnswers, filterReview]);

  // Ação: Salvar Questões Erradas no Caderno de Erros
  const handleSaveWrongQuestions = async () => {
    if (isSavingErrors || isErrorsSaved || incorrectCount === 0) return;

    setIsSavingErrors(true);
    setSaveErrorMessage(null);

    try {
      const wrongItems: WrongQuestionItem[] = [];

      questions.forEach((q, idx) => {
        const isCorrect = selectedAnswers[idx] === q.gabaritoCorreto;
        if (!isCorrect) {
          wrongItems.push({
            questionText: q.enunciado,
            options: q.alternativas || [],
            userAnswer: selectedAnswers[idx] || "Não informada",
            correctAnswer: q.gabaritoCorreto,
            explanation: q.justificativa || null,
            errorReason: "UNCLASSIFIED",
            subjectId: q.subjectId || null,
            topicId: q.topicId || topicId || null,
          });
        }
      });

      const res = await saveWrongQuestionsToNotebookAction({
        quizId,
        subjectId: questions[0]?.subjectId || null,
        topicId: topicId || null,
        questions: wrongItems,
      });

      if (res.success) {
        setIsErrorsSaved(true);
        setSavedCount(res.countAdded ?? wrongItems.length);
      } else {
        setSaveErrorMessage(
          res.error || "Não foi possível salvar as questões no Caderno de Erros."
        );
      }
    } catch (err) {
      console.error("Erro ao salvar no caderno de erros:", err);
      setSaveErrorMessage("Erro ao conectar ao servidor.");
    } finally {
      setIsSavingErrors(false);
    }
  };

  // Ação: Aprofundar Explicação com IA sob demanda
  const handleDeepenExplanation = async (qIndex: number) => {
    const q = questions[qIndex];
    if (!q || loadingDeepIndex !== null) return;
    if (deepenedExplanations[qIndex]) return;

    setLoadingDeepIndex(qIndex);
    try {
      const res = await deepenExplanationAction({
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        gabaritoCorreto: q.gabaritoCorreto,
        selectedAnswer: selectedAnswers[qIndex],
        justificativaOriginal: q.justificativa,
        banca,
        subject,
      });

      if (res.success && res.data) {
        setDeepenedExplanations((prev) => ({
          ...prev,
          [qIndex]: res.data!,
        }));
      } else {
        alert(res.error || "Não foi possível gerar o aprofundamento por IA.");
      }
    } catch (err) {
      console.error("Erro ao aprofundar com IA:", err);
    } finally {
      setLoadingDeepIndex(null);
    }
  };

  // Parâmetros do Anel SVG
  const ringRadius = 58;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (percentageAcc / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans antialiased selection:bg-violet-500/30 relative pb-24 pt-6 px-4 sm:px-6">
      {/* Glows Decorativos de Fundo */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-0 right-10 w-[500px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* ========================================================================= */}
        {/* TOP BAR: CONTEXTO DO SIMULADO & AÇÕES DE TOPO                             */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              type="button"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Voltar ao início"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-md">
                  {banca}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {subject}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                Diagnóstico de Rendimento Pós-Simulado
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onRestart}
              type="button"
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            >
              <RotateCcw size={13} />
              <span>Refazer Simulado</span>
            </button>
            <button
              onClick={onExit}
              type="button"
              className="flex-1 sm:flex-initial px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-violet-950/50"
            >
              <CheckCircle2 size={13} />
              <span>Concluir</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. HERO DE DESEMPENHO & RECOMPENSAS (Dark/Futurista com Anel Framer Motion) */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-linear-to-br from-[#090d18] via-[#070b16] to-[#04060c] border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
        >
          {/* Luzes internas da moldura */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* LADO ESQUERDO: TEXTOS, CLASSIFICAÇÃO & GAMIFICAÇÃO */}
            <div className="space-y-4 text-center md:text-left flex-1">
              {/* Tag de Classificação Dinâmica */}
              <div className="inline-flex items-center gap-2">
                <span
                  className={`text-[11px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border shadow-sm ${classification.border} ${classification.color} ${classification.glow}`}
                >
                  {classification.badge}
                </span>
              </div>

              {/* Título Principal */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white via-slate-100 to-violet-200">
                {classification.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                {classification.description}
              </p>

              {/* CARDS DE GAMIFICAÇÃO & LEVEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {/* 1. XP Ganho */}
                <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/25 shadow-inner flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0 shadow-xs">
                    <Zap size={18} className="fill-violet-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-300 block">
                      Recompensa
                    </span>
                    <span className="text-sm sm:text-base font-mono font-black text-white block truncate">
                      +{earnedXp} XP
                    </span>
                  </div>
                </div>

                {/* 2. Nível & Barra de Progresso */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-300 shrink-0">
                    <Trophy size={18} />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
                        Nível {levelUpData?.newLevel || stats?.gamification?.level || 1}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-violet-400">
                        {stats?.gamification?.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <motion.div
                        className="bg-linear-to-r from-violet-500 to-indigo-400 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${stats?.gamification?.progressPercentage || 0}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Confirmação de Streak */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-inner flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
                    <Flame size={18} className="fill-amber-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                      Ofensiva Ativa
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-black text-white block truncate">
                      {stats?.streak?.currentDays || 1} dias seguidos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: ANEL CIRCULAR ANIMADO SVG (Framer Motion) */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 140 140"
                >
                  <defs>
                    <linearGradient
                      id="futuristicNeonGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={classification.ringGradient[0]}
                      />
                      <stop
                        offset="100%"
                        stopColor={classification.ringGradient[1]}
                      />
                    </linearGradient>
                    <filter
                      id="glowFilter"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Círculo de Fundo (Track) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                  />

                  {/* Círculo Animado Neon */}
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={ringRadius}
                    fill="transparent"
                    stroke="url(#futuristicNeonGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    strokeLinecap="round"
                    filter="url(#glowFilter)"
                  />
                </svg>

                {/* Conteúdo Central do Anel */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  >
                    {percentageAcc}%
                  </motion.span>
                  <span className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                    {correctCount} de {totalQuestions} certas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PÍLULAS DE TELEMETRIA NA BASE DO HERO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-center sm:justify-start gap-1">
                <Clock size={11} className="text-violet-400" /> Tempo Total
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-white mt-0.5 block">
                {formatTimer(timerSeconds)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Duração da sessão
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-center sm:justify-start gap-1">
                <Clock size={11} className="text-amber-400" /> Média / Questão
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-amber-300 mt-0.5 block">
                ~{averageTimePerQuestion}s
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Ritmo de prova
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-center sm:justify-start gap-1">
                <Layers size={11} className="text-emerald-400" /> Questões
              </span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-300 mt-0.5 block">
                {correctCount}/{totalQuestions}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {incorrectCount} incorreta(s)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-center sm:justify-start gap-1">
                <ShieldCheck size={11} className="text-indigo-400" /> Algoritmo
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-indigo-300 mt-0.5 block truncate">
                {percentageAcc >= 80 ? "Revisão Estendida" : "Revisão Prioritária"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Sincronizado SM-2
              </span>
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 2. AÇÕES DE RETENÇÃO E CADERNO DE ERROS                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* CARD EM DESTAQUE: ADICIONAR QUESTÕES ERRADAS AO CADERNO DE ERROS (8 cols) */}
          <div className="md:col-span-8 relative overflow-hidden bg-linear-to-r from-violet-950/30 via-[#070b16] to-[#090d18] border border-violet-500/30 hover:border-violet-500/50 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shrink-0">
                  <BookmarkPlus size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Caderno de Erros Inteligente
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {incorrectCount > 0
                      ? `${incorrectCount} questão(ões) identificada(s) para retenção ativa.`
                      : "Gabarito 100% perfeito — sem erros pendentes!"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300/80 leading-relaxed pt-1">
                Isole suas falhas no simulado para treinar com reclassificação de
                pegadinhas e micro-questões de fixação formuladas pela IA.
              </p>
              {saveErrorMessage && (
                <p className="text-xs text-rose-400 font-semibold pt-1">
                  {saveErrorMessage}
                </p>
              )}
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {incorrectCount === 0 ? (
                <div className="px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center gap-2">
                  <Check size={16} />
                  <span>Sem Erros Registrados</span>
                </div>
              ) : isErrorsSaved ? (
                <div className="px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50">
                  <Check size={16} />
                  <span>{savedCount} Erro(s) no Caderno ✓</span>
                </div>
              ) : (
                <button
                  onClick={handleSaveWrongQuestions}
                  disabled={isSavingErrors}
                  type="button"
                  className="w-full sm:w-auto px-6 py-3.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-violet-950/60 border border-violet-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingErrors ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Salvando no Caderno...</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={16} />
                      <span>Adicionar Erros ao Caderno</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* BOTÕES SECUNDÁRIOS DE RETENÇÃO (4 cols) */}
          <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3 justify-between">
            <button
              onClick={onRestart}
              type="button"
              className="flex-1 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-violet-500/40 transition-all flex items-center justify-between group cursor-pointer text-left shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-300 group-hover:scale-105 transition-transform">
                  <RotateCcw size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Refazer Este Simulado
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Reiniciar com cronômetro zerado
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={onExit}
              type="button"
              className="flex-1 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-violet-500/40 transition-all flex items-center justify-between group cursor-pointer text-left shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-300 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                    Concluir e Voltar ao Início
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Retornar ao painel de questões
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. GABARITO DETALHADO E REVISÃO ATIVA (Accordion Interativo)              */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-2">
          {/* Header da Seção com Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Gabarito Detalhado & Revisão Ativa</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {totalQuestions}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Revise alternativa por alternativa e aprofunde o raciocínio das
                pegadinhas com a IA.
              </p>
            </div>

            {/* Filtros em Pílulas */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterReview("all")}
                type="button"
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterReview === "all"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todas ({totalQuestions})
              </button>
              <button
                onClick={() => setFilterReview("incorrect")}
                type="button"
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterReview === "incorrect"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Erros ({incorrectCount})
              </button>
              <button
                onClick={() => setFilterReview("correct")}
                type="button"
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterReview === "correct"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Acertos ({correctCount})
              </button>
            </div>
          </div>

          {/* LISTA DE ACCORDIONS */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/30 border border-white/5 rounded-2xl text-slate-400 text-xs">
                Nenhuma questão encontrada para este filtro.
              </div>
            ) : (
              filteredQuestions.map((item) => {
                const isExpanded = expandedQuestion === item.index;
                const deepData = deepenedExplanations[item.index];
                const isDeepLoading = loadingDeepIndex === item.index;

                return (
                  <div
                    key={`review-q-${item.index}`}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      item.isCorrect
                        ? "bg-[#060a14]/80 border-emerald-500/20 hover:border-emerald-500/40"
                        : "bg-[#0b0c16]/90 border-rose-500/30 hover:border-rose-500/50 shadow-sm"
                    }`}
                  >
                    {/* CABEÇALHO DO ACCORDION */}
                    <button
                      onClick={() =>
                        setExpandedQuestion(isExpanded ? null : item.index)
                      }
                      type="button"
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Ícone de Status (Check ou X) */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            item.isCorrect
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {item.isCorrect ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <XCircle size={18} />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white">
                              Questão {String(item.index + 1).padStart(2, "0")}
                            </span>

                            {/* Tags de Resposta Marcada vs Gabarito */}
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                item.isCorrect
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                              }`}
                            >
                              Sua resposta: {item.userAnswer || "Em branco"}
                            </span>

                            {!item.isCorrect && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                                Gabarito: {item.question.gabaritoCorreto}
                              </span>
                            )}

                            {deepData && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border bg-violet-500/20 border-violet-500/40 text-violet-300 flex items-center gap-1">
                                <Sparkles size={10} />
                                IA Analisada
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 truncate max-w-xl sm:max-w-2xl">
                            {item.question.enunciado.replace(/\*\*/g, "")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-slate-400">
                        <span className="text-[11px] font-bold hidden sm:inline-block">
                          {isExpanded ? "Recolher" : "Ver Detalhes"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-slate-300" />
                        ) : (
                          <ChevronDown size={18} className="text-slate-500" />
                        )}
                      </div>
                    </button>

                    {/* CORPO EXPANDIDO DO ACCORDION */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/5 bg-black/30 p-5 sm:p-6 space-y-5 text-xs"
                        >
                          {/* 1. ENUNCIADO COMPLETO */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Enunciado da Questão
                            </span>
                            <div className="text-slate-200 text-sm leading-relaxed font-normal bg-slate-950/60 p-4 rounded-xl border border-white/5">
                              {renderEnunciado(item.question.enunciado)}
                            </div>
                          </div>

                          {/* 2. ALTERNATIVAS */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Alternativas & Confronto
                            </span>
                            <div className="space-y-1.5">
                              {item.question.formato === "multipla"
                                ? item.question.alternativas?.map((alt) => {
                                    const isGabarito =
                                      alt.id === item.question.gabaritoCorreto;
                                    const isUserPicked =
                                      alt.id === item.userAnswer;

                                    let altStyle =
                                      "bg-white/[0.02] border-white/5 text-slate-400";

                                    if (isGabarito) {
                                      altStyle =
                                        "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold shadow-xs";
                                    } else if (isUserPicked && !item.isCorrect) {
                                      altStyle =
                                        "bg-rose-500/15 border-rose-500/40 text-rose-200 font-semibold shadow-xs";
                                    }

                                    return (
                                      <div
                                        key={alt.id}
                                        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${altStyle}`}
                                      >
                                        <span
                                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[11px] shrink-0 ${
                                            isGabarito
                                              ? "bg-emerald-500 text-slate-950 font-black"
                                              : isUserPicked
                                                ? "bg-rose-500 text-white"
                                                : "bg-white/10 text-slate-300"
                                          }`}
                                        >
                                          {alt.id}
                                        </span>
                                        <span className="leading-relaxed flex-1 pt-0.5">
                                          {alt.texto}
                                        </span>
                                        {isGabarito && (
                                          <span className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                                            Gabarito Oficial
                                          </span>
                                        )}
                                        {isUserPicked && !isGabarito && (
                                          <span className="text-[10px] uppercase font-black text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md shrink-0">
                                            Sua Escolha
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })
                                : ["Certo", "Errado"].map((opcao) => {
                                    const isGabarito =
                                      opcao === item.question.gabaritoCorreto;
                                    const isUserPicked =
                                      opcao === item.userAnswer;

                                    let ceStyle =
                                      "bg-white/[0.02] border-white/5 text-slate-400";
                                    if (isGabarito) {
                                      ceStyle =
                                        "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold";
                                    } else if (isUserPicked && !item.isCorrect) {
                                      ceStyle =
                                        "bg-rose-500/15 border-rose-500/40 text-rose-200 font-semibold";
                                    }

                                    return (
                                      <div
                                        key={opcao}
                                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${ceStyle}`}
                                      >
                                        <span className="font-bold">
                                          {opcao}
                                        </span>
                                        {isGabarito && (
                                          <span className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                                            Gabarito Oficial
                                          </span>
                                        )}
                                        {isUserPicked && !isGabarito && (
                                          <span className="text-[10px] uppercase font-black text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md">
                                            Sua Escolha
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                            </div>
                          </div>

                          {/* 3. JUSTIFICATIVA OFICIAL DA BANCA */}
                          {item.question.justificativa && (
                            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-1.5">
                              <span className="text-[10px] uppercase font-black text-violet-300 flex items-center gap-1.5 tracking-wider">
                                <BookOpen size={12} />
                                Justificativa Oficial da Banca
                              </span>
                              <p className="text-slate-200 leading-relaxed text-xs sm:text-sm whitespace-pre-line font-normal">
                                {renderEnunciado(item.question.justificativa)}
                              </p>
                            </div>
                          )}

                          {/* 4. BOTÃO INLINE: APROFUNDAR EXPLICAÇÃO COM IA */}
                          <div className="pt-1">
                            {!deepData ? (
                              <button
                                onClick={() =>
                                  handleDeepenExplanation(item.index)
                                }
                                disabled={isDeepLoading}
                                type="button"
                                className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-violet-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                {isDeepLoading ? (
                                  <>
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                    <span>Dissecando questão com IA...</span>
                                  </>
                                ) : (
                                  <>
                                    <BrainCircuit size={15} />
                                    <span>
                                      Aprofundar Explicação com IA ✨
                                    </span>
                                  </>
                                )}
                              </button>
                            ) : (
                              /* CARD COMPLETO DE ANÁLISE NEURAL EXPANDIDA */
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 rounded-2xl bg-linear-to-br from-violet-950/40 via-[#0a0e1c] to-[#080b16] border border-violet-500/40 space-y-4 shadow-xl"
                              >
                                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-wider border-b border-violet-500/20 pb-2">
                                  <Sparkles
                                    size={14}
                                    className="text-violet-400 animate-pulse"
                                  />
                                  <span>
                                    Análise Cognitiva Aprofundada (Synapse AI)
                                  </span>
                                </div>

                                {/* Visão Geral do Examinador */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono font-bold text-violet-300 uppercase">
                                    Raciocínio Central do Examinador:
                                  </span>
                                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                    {deepData.overview}
                                  </p>
                                </div>

                                {/* Dissecação dos Distratores */}
                                {deepData.alternativesAnalysis &&
                                  deepData.alternativesAnalysis.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                      <span className="text-[10px] font-mono font-bold text-violet-300 uppercase block">
                                        Dissecação dos Distratores:
                                      </span>
                                      <div className="space-y-1.5">
                                        {deepData.alternativesAnalysis.map(
                                          (altDetail, dIdx) => (
                                            <div
                                              key={`alt-deep-${dIdx}`}
                                              className="text-xs p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-start gap-2.5"
                                            >
                                              <span
                                                className={`font-black px-2 py-0.5 rounded-md text-[10px] shrink-0 ${
                                                  altDetail.isCorrect
                                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                                }`}
                                              >
                                                {altDetail.letter}
                                              </span>
                                              <span className="text-slate-300 leading-relaxed">
                                                {altDetail.explanation}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Fundamento Legal / Normativo */}
                                {deepData.legalBasis && (
                                  <div className="text-xs p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 space-y-1">
                                    <span className="font-bold text-violet-200 block uppercase tracking-wider text-[10px]">
                                      ⚖️ Fundamento Legal / Doutrinário:
                                    </span>
                                    <p className="text-slate-200">
                                      {deepData.legalBasis}
                                    </p>
                                  </div>
                                )}

                                {/* Regra de Ouro & Mnemônico */}
                                {deepData.mnemonicTip && (
                                  <div className="text-xs p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                                    <span className="font-bold text-amber-300 block uppercase tracking-wider text-[10px]">
                                      💡 Dica de Ouro & Mnemônico:
                                    </span>
                                    <p className="text-slate-200">
                                      {deepData.mnemonicTip}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizResultView;
