"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  X,
  Zap,
} from "lucide-react";
import { useGamification } from "@/context/GamificationContext";
import { triggerHaptic } from "@/lib/sensory/haptics";

export interface DiagnosticQuestion {
  id: string;
  discipline: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

const DEFAULT_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "diag_1",
    discipline: "Direito Constitucional",
    question:
      "A respeito dos direitos e garantias fundamentais previstos na CF/88, assinale a opção correta:",
    options: [
      {
        id: "A",
        text: "A casa é asilo inviolável do indivíduo, não podendo nela penetrar sem consentimento, salvo por determinação judicial, a qualquer hora do dia ou da noite.",
      },
      {
        id: "B",
        text: "É livre a manifestação do pensamento, sendo expressamente vedado o anonimato.",
      },
      {
        id: "C",
        text: "A criação de associações e, na forma da lei, a de cooperativas dependem de autorização do Poder Executivo.",
      },
      {
        id: "D",
        text: "Haverá penas de caráter perpétuo e de trabalhos forçados em casos de crimes hediondos.",
      },
    ],
    correctAnswer: "B",
    explanation:
      "Art. 5º, IV, da CF/88: 'é livre a manifestação do pensamento, sendo vedado o anonimato'. A inviolabilidade do domicílio por ordem judicial só pode ocorrer durante o dia (inciso XI).",
  },
  {
    id: "diag_2",
    discipline: "Direito Administrativo",
    question:
      "Em relação aos princípios expressos da Administração Pública (art. 37, caput, CF/88 - LIMPE), é CORRETO afirmar que:",
    options: [
      {
        id: "A",
        text: "O princípio da impessoalidade veda a promoção pessoal de agentes públicos em obras e publicidades estatais.",
      },
      {
        id: "B",
        text: "A publicidade é requisito absoluto e intransponível em todos os atos da administração, sem exceções de sigilo.",
      },
      {
        id: "C",
        text: "A moralidade administrativa confunde-se estritamente com a legalidade formal, não exigindo ética de conduta.",
      },
      {
        id: "D",
        text: "O princípio da eficiência foi introduzido no texto original da Constituição de 1988 pelo poder constituinte originário.",
      },
    ],
    correctAnswer: "A",
    explanation:
      "Art. 37, § 1º: A publicidade dos atos deve ter caráter educativo/informativo, sem constar nomes, símbolos ou imagens que caracterizem promoção pessoal. O princípio da eficiência foi inserido pela EC 19/1998.",
  },
  {
    id: "diag_3",
    discipline: "Língua Portuguesa",
    question:
      "Assinale a frase em que o uso do acento grave indicativo de crase está CORRETO:",
    options: [
      {
        id: "A",
        text: "O concurseiro começou à estudar assim que o edital foi publicado.",
      },
      {
        id: "B",
        text: "O candidato compareceu à reunião pontualmente às nove horas.",
      },
      {
        id: "C",
        text: "Eles caminharam passo à passo até a sala de provas.",
      },
      {
        id: "D",
        text: "O professor se referiu à ela com bastante respeito.",
      },
    ],
    correctAnswer: "B",
    explanation:
      "Ocorre crase diante de substantivo feminino acompanhado de preposição ('à reunião') e em horas exatas ('às nove horas'). Não ocorre crase antes de verbo ('a estudar'), entre palavras repetidas ('passo a passo') nem antes de pronomes pessoais ('a ela').",
  },
  {
    id: "diag_4",
    discipline: "Raciocínio Lógico",
    question:
      "Considere a proposição: 'Se João estuda com consistência, então ele é aprovado'. A negação lógica dessa proposição é:",
    options: [
      {
        id: "A",
        text: "Se João não estuda com consistência, então ele não é aprovado.",
      },
      {
        id: "B",
        text: "João não estuda com consistência ou ele não é aprovado.",
      },
      {
        id: "C",
        text: "João estuda com consistência e ele não é aprovado.",
      },
      {
        id: "D",
        text: "João não estuda com consistência e ele é aprovado.",
      },
    ],
    correctAnswer: "C",
    explanation:
      "A negação de uma condicional (P → Q) segue a regra do 'MANÉ' (Mantém a primeira e Nega a segunda): P ∧ ~Q. Logo: 'João estuda com consistência E ele não é aprovado'.",
  },
  {
    id: "diag_5",
    discipline: "Ética e Integridade",
    question:
      "No serviço público, a conduta ética do servidor visa precipuamente assegurar:",
    options: [
      {
        id: "A",
        text: "A primazia do interesse público sobre os interesses particulares, com probidade e transparência.",
      },
      {
        id: "B",
        text: "O atendimento preferencial aos amigos do órgão público em nome da cortesia.",
      },
      {
        id: "C",
        text: "O sigilo das informações orçamentárias perante a população em geral.",
      },
      {
        id: "D",
        text: "A imunidade administrativa perante erros causados por desídia ou desatenção.",
      },
    ],
    correctAnswer: "A",
    explanation:
      "O dever ético fundamental do servidor público é pautar-se pelo interesse coletivo, integridade, moralidade e supremacia do interesse público sobre o privado.",
  },
];

interface QuickDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: {
    score: number;
    total: number;
    level: "iniciante" | "intermediario" | "avancado";
  }) => void;
}

export function QuickDiagnosticModal({
  isOpen,
  onClose,
  onComplete,
}: QuickDiagnosticModalProps) {
  const { refreshStats } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answersLog, setAnswersLog] = useState<
    { questionId: string; selected: string; isCorrect: boolean }[]
  >([]);
  const [isFinished, setIsFinished] = useState(false);

  // Timer de 3 minutos (180 segundos)
  const [secondsLeft, setSecondsLeft] = useState(180);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset ao abrir
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setAnswersLog([]);
    setIsFinished(false);
    setSecondsLeft(180);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const currentQ = DEFAULT_DIAGNOSTIC_QUESTIONS[currentIndex];

  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    triggerHaptic("light");
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption || isAnswered) return;

    const isCorrect = selectedOption === currentQ.correctAnswer;
    setIsAnswered(true);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      triggerHaptic("medium");
    } else {
      triggerHaptic("heavy");
    }

    setAnswersLog((prev) => [
      ...prev,
      { questionId: currentQ.id, selected: selectedOption, isCorrect },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 < DEFAULT_DIAGNOSTIC_QUESTIONS.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishDiagnostic();
    }
  };

  const finishDiagnostic = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);

    const finalScore = score + (selectedOption === currentQ.correctAnswer ? 1 : 0);
    const total = DEFAULT_DIAGNOSTIC_QUESTIONS.length;
    const ratio = finalScore / total;

    let level: "iniciante" | "intermediario" | "avancado" = "iniciante";
    if (ratio >= 0.8) level = "avancado";
    else if (ratio >= 0.5) level = "intermediario";

    try {
      localStorage.setItem(
        "synapse_diagnostic_result_v1",
        JSON.stringify({
          score: finalScore,
          total,
          level,
          completedAt: new Date().toISOString(),
        })
      );
    } catch {}

    // Confetes se foi bem
    if (ratio >= 0.5) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    if (onComplete) {
      onComplete({ score: finalScore, total, level });
    }

    try {
      await refreshStats();
    } catch {}
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[#070b14] p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header Superior: Título + Timer + Fechar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Diagnóstico Rápido de 3 Minutos
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-bold uppercase">
                    Calibrador
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  {isFinished
                    ? "Diagnóstico concluído"
                    : `Questão ${currentIndex + 1} de ${DEFAULT_DIAGNOSTIC_QUESTIONS.length}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isFinished && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                    secondsLeft <= 30
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}
                >
                  <Clock size={13} />
                  <span>{formatTimer(secondsLeft)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Conteúdo Dinâmico: Questões ou Tela Final */}
          {!isFinished ? (
            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {/* Disciplina & Barra de Progresso */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  {currentQ.discipline}
                </span>

                <div className="flex gap-1.5">
                  {DEFAULT_DIAGNOSTIC_QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-all ${
                        i === currentIndex
                          ? "bg-violet-500 shadow-sm shadow-violet-500/50"
                          : i < currentIndex
                          ? "bg-emerald-500"
                          : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Enunciado */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                {currentQ.question}
              </div>

              {/* Alternativas */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrectAnswer = opt.id === currentQ.correctAnswer;

                  let style =
                    "border-slate-800 bg-slate-950/70 hover:bg-slate-900/80 text-slate-300";

                  if (isSelected && !isAnswered) {
                    style =
                      "border-violet-500 bg-violet-600/15 text-white ring-1 ring-violet-500/40";
                  }

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      style =
                        "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/40 font-semibold";
                    } else if (isSelected && !isCorrectAnswer) {
                      style =
                        "border-rose-500/60 bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/40";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${style}`}
                    >
                      <span
                        className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isAnswered && isCorrectAnswer
                            ? "bg-emerald-500 text-white"
                            : isAnswered && isSelected && !isCorrectAnswer
                            ? "bg-rose-500 text-white"
                            : isSelected
                            ? "bg-violet-600 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explicação da IA após responder */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs sm:text-sm text-indigo-200 space-y-1.5"
                >
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Justificativa da IA:</span>
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    {currentQ.explanation}
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            /* Tela Final de Resultado & Radar */
            <div className="py-6 text-center space-y-5 overflow-y-auto">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/30">
                <Trophy size={40} className="drop-shadow-md" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {score >= 4
                    ? "Nível Avançado 🏆"
                    : score >= 2
                    ? "Nível Intermediário ⚡"
                    : "Nível Fundamento 🎯"}
                </span>
                <h4 className="text-2xl font-black text-white mt-2">
                  Você acertou {score} de {DEFAULT_DIAGNOSTIC_QUESTIONS.length}{" "}
                  questões ({Math.round((score / DEFAULT_DIAGNOSTIC_QUESTIONS.length) * 100)}%)
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5">
                  {score >= 4
                    ? "Excelente base! Você está pronto para simulados cronometrados da banca e resolução intensiva de questões."
                    : score >= 2
                    ? "Boa base! O foco agora é blindar os pontos fracos e usar os Flashcards FSRS para fixação de longo prazo."
                    : "Ótimo ponto de partida! Comece pelas aulas essenciais da sua Trilha e avance passo a passo com o ciclo semanal."}
                </p>
              </div>

              {/* Bônus de XP Concedido */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Zap size={16} className="text-amber-400" />
                <span>+150 XP de Diagnóstico adicionados ao seu perfil!</span>
              </div>
            </div>
          )}

          {/* Footer de Ação */}
          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between gap-3 shrink-0">
            {!isFinished ? (
              <>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {isAnswered
                    ? "Revise a justificativa e avance"
                    : "Selecione uma alternativa"}
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  {!isAnswered ? (
                    <button
                      type="button"
                      disabled={!selectedOption}
                      onClick={handleConfirmAnswer}
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-violet-900/30 cursor-pointer active:scale-95"
                    >
                      Confirmar Resposta
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <span>
                        {currentIndex + 1 < DEFAULT_DIAGNOSTIC_QUESTIONS.length
                          ? "Próxima Questão"
                          : "Finalizar Diagnóstico"}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-violet-900/40 cursor-pointer"
              >
                Concluir e Explorar meu Dashboard
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
