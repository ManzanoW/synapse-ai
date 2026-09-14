"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  CalendarDays,
  Layers,
  BrainCircuit,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Zap,
  Check,
} from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemo?: boolean;
}

interface TutorialStep {
  id: number;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  headline: string;
  description: string;
  highlights: { title: string; desc: string }[];
  actionLabel?: string;
  actionHref?: string;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Edital Verticalizado",
    badge: "Passo 1",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    icon: BookOpen,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    headline: "O alicerce dos seus estudos: organize seu edital",
    description:
      "Cadastre manualmente ou importe seu edital oficial com matérias, tópicos prioritários e pesos definidos pela banca examinadora.",
    highlights: [
      {
        title: "Pesos da Banca",
        desc: "Defina o grau de relevância de cada matéria para calibrar sua meta.",
      },
      {
        title: "Controle de Cobertura",
        desc: "Acompanhe tópicos estudados vs. pendentes com cálculo de % em tempo real.",
      },
      {
        title: "Agendamento SM-2",
        desc: "Revisões automáticas de 24h, 7d e 30d geradas automaticamente por tópico.",
      },
    ],
    actionLabel: "Cadastrar Edital",
    actionHref: "/edital",
    tip: "Dica: Em modo demonstração, você pode cadastrar disciplinas de teste a qualquer momento!",
  },
  {
    id: 2,
    title: "Ciclo & Cronograma Adaptativo",
    badge: "Passo 2",
    badgeColor: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    icon: CalendarDays,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/30",
    headline: "Distribuição inteligente de horas e remanejamento",
    description:
      "A IA divide sua carga horária semanal entre as matérias de forma proporcional aos pesos. Se você faltar a um dia de estudos, a IA remaneja automaticamente sem acumular matéria.",
    highlights: [
      {
        title: "Ciclo de Estudos Dinâmico",
        desc: "Alternância otimizada de disciplinas para evitar fadiga cognitiva.",
      },
      {
        title: "Remanejamento Inteligente",
        desc: "Perdeu a meta de ontem? Um clique reorganiza a semana preservando sua data-alvo.",
      },
      {
        title: "Estimativa de Conclusão",
        desc: "Previsão exata de quantas semanas faltam para cobrir 100% do edital.",
      },
    ],
    actionLabel: "Ver Cronograma",
    actionHref: "/week",
    tip: "Você pode alterar suas horas semanais e dias ativos na aba Perfil a qualquer momento.",
  },
  {
    id: 3,
    title: "Prática: Cards e Questões",
    badge: "Passo 3",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    icon: Layers,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/30",
    headline: "Fixação definitiva com repetição espaçada e simulados",
    description:
      "Estude seus flashcards com o algoritmo FSRS (Free Spaced Repetition) e pratique simulados focados com diagnóstico neural de erros.",
    highlights: [
      {
        title: "Flashcards FSRS / Anki",
        desc: "Intervalos de repetição adaptativos com classificação de dificuldade.",
      },
      {
        title: "Simulados e Questões",
        desc: "Resolva questões inéditas por tópico ou provas completas comentadas.",
      },
      {
        title: "Diagnóstico Neural de Erros",
        desc: "Identifica se o erro foi lacuna teórica, distração ou pegadinha da banca.",
      },
    ],
    actionLabel: "Praticar Flashcards",
    actionHref: "/flashcards",
    tip: "Treinar questões alimenta o algoritmo para calibrar o seu Radar de Domínio!",
  },
  {
    id: 4,
    title: "Predição Neural & Radar",
    badge: "Passo 4",
    badgeColor: "text-violet-300 bg-violet-500/10 border-violet-500/20",
    icon: BrainCircuit,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/30",
    headline: "Monitore suas chances reais de aprovação",
    description:
      "O Radar de Domínio cruza sua precisão em simulados com os pesos do edital para revelar pontos cegos antes que eles custem sua vaga no concurso.",
    highlights: [
      {
        title: "Chance de Aprovação (%)",
        desc: "Projeção matemática calculada a partir de cobertura, precisão e constância.",
      },
      {
        title: "Alerta de Pontos Cegos",
        desc: "Destaca matérias com alto peso na prova mas com baixo índice de domínio.",
      },
      {
        title: "Gamificação & Níveis XP",
        desc: "Ganhe experiência, suba de nível e colecione conquistas a cada sessão.",
      },
    ],
    actionLabel: "Explorar Dashboard",
    actionHref: "/dashboard",
    tip: "Tudo pronto! Você já conhece todos os módulos essenciais do Synapse AI.",
  },
];

export function TutorialModal({ isOpen, onClose, isDemo = false }: TutorialModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;
  const progressPercent = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("synapse_tutorial_seen", "true");
    } catch {}
    onClose();
  };

  const getActionHref = (href?: string) => {
    if (!href) return "/dashboard";
    return isDemo ? `${href}?demo=true` : href;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
        >
          {/* Luz ambiente neon sutil no topo */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />

          {/* Header Superior: Título + Progresso + Fechar */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                  Modo Tutorial Synapse
                </span>
                <h2 className="text-sm sm:text-base font-black text-white">
                  Guia Interativo da Plataforma
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300">
                {currentStepIndex + 1} / {TUTORIAL_STEPS.length}
              </span>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/5 bg-white/[0.03] p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Fechar Tutorial"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="relative mb-6 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full bg-linear-to-r from-indigo-500 via-cyan-400 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Conteúdo Dinâmico do Passo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Badge + Título Principal */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${step.iconBg} ${step.iconColor} shadow-inner`}
                >
                  <step.icon size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${step.badgeColor}`}
                    >
                      {step.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-200">
                    {step.headline}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Destaques / Funcionalidades Chave */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-2">
                {step.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dica do Especialista */}
              {step.tip && (
                <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2 text-xs text-indigo-300">
                  <Zap size={14} className="text-amber-400 shrink-0" />
                  <span className="text-[11px]">{step.tip}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Rodapé: Ações & Navegação */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleComplete}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
              >
                Pular Tutorial
              </button>
              {step.actionHref && (
                <Link
                  href={getActionHref(step.actionHref)}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1"
                >
                  <span>{step.actionLabel || "Acessar Módulo"}</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors active:scale-95"
                >
                  <ArrowLeft size={14} />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-95"
              >
                {isLast ? (
                  <>
                    <Check size={14} />
                    <span>Concluir Tutorial</span>
                  </>
                ) : (
                  <>
                    <span>Próximo Passo</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
