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
  FileText,
  ListChecks,
  Compass,
  AlertTriangle,
  Headphones,
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
    title: "Edital & Organização",
    badge: "Passo 1 • Fundação",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    icon: BookOpen,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    headline: "O alicerce da aprovação: organize seu edital",
    description:
      "Cadastre suas disciplinas com matérias, tópicos prioritários e pesos definidos pela banca examinadora do seu concurso.",
    highlights: [
      {
        title: "Pesos da Banca",
        desc: "Defina a relevância de cada matéria para calibrar sua meta de horas.",
      },
      {
        title: "Controle de Cobertura",
        desc: "Acompanhe tópicos estudados vs. pendentes com % em tempo real.",
      },
      {
        title: "Revisões Automáticas",
        desc: "Revisões de 24h, 7d e 30d geradas automaticamente conforme você avança.",
      },
    ],
    actionLabel: "Configurar Edital",
    actionHref: "/edital",
    tip: "💡 Dica de início: Se tiver pouco tempo hoje, cadastre apenas as 2 disciplinas com maior peso na prova!",
  },
  {
    id: 2,
    title: "Ciclo & Metas Adaptativas",
    badge: "Passo 2 • Rotina",
    badgeColor: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    icon: CalendarDays,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/30",
    headline: "Divisão equilibrada de horas e remanejamento",
    description:
      "A IA divide sua carga horária semanal proporcionalmente aos pesos do edital. Se faltar a um dia, o sistema reorganiza a semana sem sobrecarga.",
    highlights: [
      {
        title: "Ciclo de Estudos Dinâmico",
        desc: "Alternância otimizada de matérias para evitar fadiga cognitiva.",
      },
      {
        title: "Remanejamento Inteligente",
        desc: "Perdeu a meta de ontem? Um clique reorganiza os estudos pendentes.",
      },
      {
        title: "Estimativa de Conclusão",
        desc: "Previsão exata de quantas semanas faltam para cobrir 100% do edital.",
      },
    ],
    actionLabel: "Ver Cronograma",
    actionHref: "/week",
    tip: "Você pode alterar suas horas semanais e dias disponíveis no seu Perfil a qualquer momento.",
  },
  {
    id: 3,
    title: "Flashcards, PDF & Áudio",
    badge: "Passo 3 • Memória",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    icon: Layers,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/30",
    headline: "Repetição espaçada com algoritmo FSRS e IA em PDFs",
    description:
      "Transforme apostilas PDF em baralhos inteligentes com extração rápida, estude em áudio no trânsito e exporte tudo para o Anki oficial.",
    highlights: [
      {
        title: "Importação de PDFs",
        desc: "Extraia flashcards e simulados direto das suas apostilas em instantes.",
      },
      {
        title: "Estudo em Áudio (Voz Neural)",
        desc: "Podcast interativo com fones Bluetooth para revisar durante trajetos.",
      },
      {
        title: "Exportação Oficial Anki",
        desc: "Baixe arquivos .txt formatados e sincronize com seu Anki Desktop/Mobile.",
      },
    ],
    actionLabel: "Acessar Flashcards",
    actionHref: "/flashcards",
    tip: "O algoritmo FSRS calcula a data exata em que você começaria a esquecer cada card.",
  },
  {
    id: 4,
    title: "Analista de Redação & OCR",
    badge: "Passo 4 • Discursiva",
    badgeColor: "text-violet-300 bg-violet-500/10 border-violet-500/20",
    icon: FileText,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/30",
    headline: "Simulador oficial de prova com correção pela banca examinadora",
    description:
      "Treine na folha pautada de concurso de 30 linhas, envie foto do manuscrito para digitalização automática com OCR e receba a versão Nota 100.",
    highlights: [
      {
        title: "Foto Manuscrito (OCR)",
        desc: "Tire foto da sua folha de papel e a IA transcreve sua caligrafia perfeitamente.",
      },
      {
        title: "Critérios da Banca",
        desc: "Notas desdobradas em Aspectos Macroestruturais, Legislação e Gramática.",
      },
      {
        title: "Versão Padrão Ouro",
        desc: "Reescrita nota máxima da sua redação mantendo suas ideias e argumentos.",
      },
    ],
    actionLabel: "Laboratório de Redação",
    actionHref: "/essay",
    tip: "A prova discursiva é responsável por definir as primeiras posições em concursos de alto nível!",
  },
  {
    id: 5,
    title: "Caderno de Erros & Remediação",
    badge: "Passo 5 • Diagnóstico",
    badgeColor: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    icon: AlertTriangle,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/30",
    headline: "Descubra a causa-raiz dos seus erros e cure suas falhas",
    description:
      "A IA classifica cada erro em Lacuna Teórica, Interpretação, Pegadinha da Banca ou Distração, gerando simulados direcionados de remediação.",
    highlights: [
      {
        title: "Taxonomia Cognitiva",
        desc: "Entenda o motivo real do erro para não repeti-lo no dia da prova.",
      },
      {
        title: "Simulado de Remediação",
        desc: "Gere baterias de questões focadas especificamente nas suas vulnerabilidades.",
      },
      {
        title: "Radar de Domínio",
        desc: "Monitore sua evolução até eliminar 100% dos seus pontos cegos.",
      },
    ],
    actionLabel: "Caderno de Erros",
    actionHref: "/notebook",
    tip: "Revisar erros de ontem gera 3x mais retenção do que apenas resolver questões novas.",
  },
  {
    id: 6,
    title: "Checklist de Primeiros Passos",
    badge: "Passo 6 • Comece Agora",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    icon: ListChecks,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/30",
    headline: "Seu plano de ação para hoje: 3 passos simples",
    description:
      "Para que a plataforma trabalhe por você, siga estas 3 etapas recomendadas no seu primeiro dia:",
    highlights: [
      {
        title: "1. Definir Meta de Horas",
        desc: "No Perfil, escolha quantas horas semanais você tem disponíveis para estudar.",
      },
      {
        title: "2. Adicionar Matérias",
        desc: "No Edital, cadastre ao menos as principais matérias do seu cargo-alvo.",
      },
      {
        title: "3. Fazer Primeiro Teste",
        desc: "Resolva uma bateria rápida de 5 questões ou importe um PDF em Flashcards.",
      },
    ],
    actionLabel: "Começar pelo Edital",
    actionHref: "/edital",
    tip: "🎯 Se preferir uma interface mais limpa, você pode ativar o 'Modo Minimalista' no topo do Dashboard a qualquer momento!",
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
