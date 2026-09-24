"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  BrainCircuit,
  CornerDownLeft,
  EyeOff,
  Eye,
  Flag,
  Brain,
  AlertTriangle,
  Target,
  X,
  Clock,
  AlertCircle,
  Check,
  Sparkles,
  PenTool,
  BookOpen,
} from "lucide-react";
import { QuestaoIA } from "../page";
import { ErrorClassification } from "@/types/quiz";
import { MentorCopilotDrawer } from "@/components/mentor/MentorCopilotDrawer";
import { QuestionScratchpad } from "@/components/questions/QuestionScratchpad";

interface QuestionCardProps {
  questao: QuestaoIA;
  index: number;
  isFocused: boolean;
  respondida: boolean;
  alternativaSelecionada?: string;
  isSavedError: boolean;
  isFlashcardCreated: boolean;
  isCreatingFlashcard: boolean;
  isFlagged?: boolean;
  onSelectAnswer: (altId: string) => void;
  onAnswerQuestion: () => void;
  onToggleSaveError: () => void;
  onCreateFlashcard: () => void;
  onToggleFlag?: () => void;
  onClassifyError?: (reason: ErrorClassification) => void;
}

const renderEnunciado = (texto: string) => {
  if (!texto) return null;
  const partes = texto.split(/(\*\*.*?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      const conteudoLimpo = parte.slice(2, -2);
      return (
        <span
          key={`highlight-${i}`}
          className="inline-block bg-indigo-500/15 text-indigo-200 px-1.5 py-0.5 mx-0.5 rounded-md border border-indigo-400/30 font-semibold align-baseline shadow-xs"
        >
          {conteudoLimpo}
        </span>
      );
    }
    return <React.Fragment key={`text-${i}`}>{parte}</React.Fragment>;
  });
};

export function QuestionCard({
  questao,
  index,
  respondida,
  isFocused = false,
  alternativaSelecionada,
  isFlashcardCreated,
  isCreatingFlashcard,
  isFlagged = false,
  onSelectAnswer,
  onAnswerQuestion,
  onCreateFlashcard,
  onToggleFlag,
  onClassifyError,
}: QuestionCardProps) {
  const [eliminatedAlts, setEliminatedAlts] = useState<Record<string, boolean>>({});
  const [selectedReason, setSelectedReason] = useState<ErrorClassification | null>(null);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [hasScratchpadNotes, setHasScratchpadNotes] = useState(false);

  // Atalho global ⌘J / Ctrl+J para acionar o Mentor IA na questão focada
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsMentorOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  const toggleEliminate = (e: React.MouseEvent, altId: string) => {
    e.stopPropagation();
    if (respondida) return;
    setEliminatedAlts((prev) => ({ ...prev, [altId]: !prev[altId] }));
  };

  const acertou = alternativaSelecionada === questao.gabaritoCorreto;

  // Resposta com classificação automática invisível para o Caderno de Erros
  const handleAnswer = () => {
    onAnswerQuestion();
    if (alternativaSelecionada !== questao.gabaritoCorreto && onClassifyError) {
      const autoReason: ErrorClassification =
        questao.pegadinhaBanca || questao.mentorGuidance?.trapWarning
          ? "ATTENTION_LAPSE"
          : "THEORY_GAP";
      onClassifyError(autoReason);
      setSelectedReason(autoReason);
    }
  };

  const getCardStyle = () => {
    if (isFocused) {
      if (respondida) {
        return acertou
          ? "bg-linear-to-br from-emerald-950/20 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-emerald-400 shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] opacity-100 z-20 scale-[1.01]"
          : "bg-linear-to-br from-rose-950/20 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-rose-500 shadow-[0_0_30px_-5px_rgba(244,63,94,0.25)] opacity-100 z-20 scale-[1.01]";
      }
      return "bg-linear-to-br from-indigo-950/30 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-indigo-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] opacity-100 z-20 scale-[1.01]";
    }

    if (respondida) {
      return acertou
        ? "bg-[#060810]/70 border border-emerald-500/20 opacity-70 hover:opacity-100 transition-all z-0"
        : "bg-[#060810]/70 border border-rose-500/20 opacity-70 hover:opacity-100 transition-all z-0";
    }

    return "bg-[#060810]/70 border border-slate-800/60 opacity-80 hover:opacity-100 transition-all z-0";
  };

  return (
    <motion.div
      id={`question-card-${index}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-4 sm:p-6 transition-all duration-300 relative ${getCardStyle()}`}
    >
      {/* BADGE FLUTUANTE DE FOCO */}
      {isFocused && (
        <div
          className={`absolute -top-3.5 right-4 sm:right-8 px-3 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1.5 shadow-xl z-30 border font-extrabold uppercase tracking-widest ${
            respondida
              ? acertou
                ? "bg-[#080b13] border-emerald-500/80 text-emerald-400"
                : "bg-[#080b13] border-rose-500/80 text-rose-400"
              : "bg-[#080b13] border-indigo-500/80 text-indigo-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              respondida
                ? acertou
                  ? "bg-emerald-500"
                  : "bg-rose-500"
                : "bg-indigo-500"
            }`}
          />
          <span>Em Foco</span>
        </div>
      )}

      {/* HEADER DA QUESTÃO */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black tracking-wider text-indigo-400 uppercase">
            QUESTÃO {index + 1}
          </span>
          {questao.formato && (
            <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md uppercase">
              {questao.formato === "multipla"
                ? "Múltipla Escolha"
                : "Certo / Errado"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Copilot Mentor IA */}
          <button
            type="button"
            onClick={() => setIsMentorOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs min-h-[36px]"
            title="Abrir Mentor IA Copilot (⌘J ou Ctrl+J)"
          >
            <Brain size={13} className="text-violet-400" />
            <span className="text-[11px] font-bold">Mentor IA</span>
            <span className="text-[9px] font-mono text-violet-400/80 bg-violet-500/20 px-1 py-0.5 rounded border border-violet-500/30 hidden sm:inline">
              ⌘J
            </span>
          </button>

          {/* Botão Rascunho de Prova */}
          <button
            type="button"
            onClick={() => setIsScratchpadOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs min-h-[36px] ${
              isScratchpadOpen
                ? "border-indigo-500 bg-indigo-600/20 text-indigo-200"
                : hasScratchpadNotes
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20"
            }`}
            title="Abrir lousa de rascunho da questão"
          >
            <PenTool
              size={13}
              className={hasScratchpadNotes ? "text-indigo-400" : ""}
            />
            <span className="text-[11px] font-bold">Rascunho</span>
            {hasScratchpadNotes && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleFlag}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 min-h-[36px] ${
              isFlagged
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
            title="Marcar questão para revisar depois"
          >
            <Flag
              size={13}
              className={isFlagged ? "fill-amber-300 text-amber-300" : ""}
            />
            <span className="text-[11px]">
              {isFlagged ? "Marcada" : "Revisar"}
            </span>
          </button>
        </div>
      </div>

      {/* LOUSA DE RASCUNHO DA QUESTÃO */}
      <QuestionScratchpad
        storageKey={questao.id || `q_${index}`}
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        onNotesChange={setHasScratchpadNotes}
      />

      {/* ENUNCIADO */}
      <p className="text-slate-200 text-sm sm:text-base font-medium mb-5 leading-relaxed whitespace-pre-line">
        {renderEnunciado(questao.enunciado)}
      </p>

      {/* ALTERNATIVAS */}
      <div className="space-y-2.5 mb-6">
        {questao.formato === "multipla"
          ? questao.alternativas?.map((alt, altIdx) => {
              const isSelected = alternativaSelecionada === alt.id;
              const isEliminated = Boolean(eliminatedAlts[alt.id]);
              const atalhoNum = altIdx + 1;

              return (
                <div
                  key={`q-${index}-alt-${alt.id}`}
                  className="relative flex items-center gap-1.5 group"
                >
                  <button
                    disabled={respondida}
                    onClick={() => !isEliminated && onSelectAnswer(alt.id)}
                    type="button"
                    className={`w-full text-left px-3.5 py-3.5 sm:px-4 sm:py-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start justify-between cursor-pointer disabled:cursor-default active:scale-[0.99] min-h-[48px] ${
                      isEliminated && !respondida
                        ? "opacity-30 line-through bg-slate-950/20 border-slate-900/50 text-slate-500"
                        : respondida
                          ? alt.id === questao.gabaritoCorreto
                            ? "bg-emerald-500/10 border-emerald-500/80 text-emerald-300 font-semibold shadow-xs"
                            : isSelected
                              ? "bg-rose-500/10 border-rose-500/80 text-rose-300"
                              : "bg-slate-950/30 border-slate-900 text-slate-600"
                          : isSelected
                            ? "bg-indigo-600/15 border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/40 shadow-xs"
                            : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3 pr-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                          isEliminated && !respondida
                            ? "bg-slate-950 border border-slate-900 text-slate-600"
                            : isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-900 border border-slate-800 text-slate-400 group-hover:border-slate-700 group-hover:text-slate-200"
                        }`}
                      >
                        {alt.id}
                      </span>
                      <span className="pt-0.5 leading-relaxed">
                        {alt.texto}
                      </span>
                    </div>

                    {!respondida && (
                      <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border border-slate-800/80 group-hover:border-slate-700 px-1.5 py-0.5 rounded shrink-0 self-center transition-colors">
                        {atalhoNum}
                      </kbd>
                    )}
                  </button>

                  {!respondida && (
                    <button
                      type="button"
                      onClick={(e) => toggleEliminate(e, alt.id)}
                      title={
                        isEliminated
                          ? "Restaurar alternativa"
                          : "Riscar alternativa"
                      }
                      className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isEliminated
                          ? "text-rose-400 hover:text-rose-300 opacity-100"
                          : "text-slate-600 hover:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100"
                      }`}
                    >
                      {isEliminated ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  )}
                </div>
              );
            })
          : ["Certo", "Errado"].map((opcao, altIdx) => {
              const isSelected = alternativaSelecionada === opcao;
              const atalhoNum = altIdx + 1;

              return (
                <button
                  key={`q-${index}-ce-${opcao}`}
                  disabled={respondida}
                  onClick={() => onSelectAnswer(opcao)}
                  type="button"
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer disabled:cursor-default active:scale-[0.99] min-h-[48px] ${
                    respondida
                      ? opcao === questao.gabaritoCorreto
                        ? "bg-emerald-500/10 border-emerald-500/80 text-emerald-300 shadow-xs"
                        : isSelected
                          ? "bg-rose-500/10 border-rose-500/80 text-rose-300"
                          : "bg-slate-950/30 border-slate-900 text-slate-600"
                      : isSelected
                        ? "bg-indigo-600/15 border-indigo-500/80 text-slate-100 ring-1 ring-indigo-500/40 shadow-xs"
                        : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        opcao === "Certo" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>{opcao}</span>
                  </div>
                  {!respondida && (
                    <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border border-slate-800/80 group-hover:border-slate-700 px-1.5 py-0.5 rounded transition-colors">
                      {atalhoNum}
                    </kbd>
                  )}
                </button>
              );
            })}
      </div>

      {/* RODAPÉ / BOTÃO DE SUBMISSÃO */}
      <div className="flex flex-col gap-4">
        {!respondida ? (
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 gap-4">
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <kbd className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  ↑
                </kbd>
                <kbd className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  ↓
                </kbd>
                <span className="text-slate-600 ml-0.5">Navegar</span>
              </span>

              <span className="text-slate-700">•</span>

              <span className="flex items-center gap-1">
                <kbd className="bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <CornerDownLeft size={10} /> Enter
                </kbd>
                <span className="text-slate-600 ml-0.5">Confirmar</span>
              </span>
            </div>

            <button
              disabled={!alternativaSelecionada}
              onClick={handleAnswer}
              type="button"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-indigo-950/50 ml-auto cursor-pointer min-h-[48px]"
            >
              Responder Questão
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-3.5 sm:p-4 animate-in fade-in duration-300 bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                {acertou ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Você acertou!
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <XCircle size={15} /> Resposta incorreta
                  </span>
                )}
                <span className="text-slate-700">•</span>
                <span className="text-slate-300 font-medium">
                  Gabarito:{" "}
                  <strong className="text-emerald-400 font-bold">
                    {questao.gabaritoCorreto}
                  </strong>
                </span>
              </div>

              {!acertou && (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <span
                    className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                    title="Questão catalogada automaticamente no seu Caderno de Erros"
                  >
                    <BookOpen size={12} className="text-rose-400" />
                    <span>Caderno de Erros</span>
                  </span>

                  <button
                    onClick={onCreateFlashcard}
                    disabled={isCreatingFlashcard || isFlashcardCreated}
                    type="button"
                    className={`w-full sm:w-auto px-3.5 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer min-h-[44px] ${
                      isFlashcardCreated
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed opacity-90"
                        : "bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                    }`}
                  >
                    {isCreatingFlashcard ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Gerando Flashcard...</span>
                      </>
                    ) : isFlashcardCreated ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Flashcard Criado!</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={13} className="text-indigo-400" />
                        <span>🎴 Criar Flashcard</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-300 font-semibold block mb-1">
                Explicação & Justificativa:
              </strong>
              {renderEnunciado(questao.justificativa)}
            </div>

            {/* ALERTA DE PEGADINHA DA BANCA */}
            {(questao.pegadinhaBanca || questao.mentorGuidance?.trapWarning) && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                  <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                  <span>⚠️ Pegadinha Clássica da Banca</span>
                </div>
                <p className="leading-relaxed text-amber-100/90 font-medium">
                  {questao.pegadinhaBanca || questao.mentorGuidance?.trapWarning}
                </p>
              </div>
            )}

            {/* PONTO CEGO / ANÁLISE DO ERRO */}
            {!acertou && questao.explicacaoErro && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-300 mb-1">
                  <Target size={15} className="text-indigo-400 shrink-0" />
                  <span>🎯 Ponto Cego & Análise do Erro</span>
                </div>
                <p className="leading-relaxed text-indigo-100/90 font-medium">
                  {questao.explicacaoErro}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAWER FLUTUANTE DO COPILOT MENTOR IA */}
      <MentorCopilotDrawer
        isOpen={isMentorOpen}
        onClose={() => setIsMentorOpen(false)}
        questionIndex={index}
        questionText={questao.enunciado}
        options={questao.alternativas}
        correctAnswer={questao.gabaritoCorreto}
        explanation={questao.justificativa}
        mentorGuidance={questao.mentorGuidance}
        onGuidanceGenerated={(newGuidance) => {
          questao.mentorGuidance = newGuidance;
        }}
      />
    </motion.div>
  );
}
