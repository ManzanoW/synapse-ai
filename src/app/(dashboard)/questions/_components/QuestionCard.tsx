"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  BrainCircuit,
  CornerDownLeft,
  EyeOff,
  Eye,
  Flag,
} from "lucide-react";
import { QuestaoIA } from "../page";

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
  isSavedError,
  isFlashcardCreated,
  isCreatingFlashcard,
  onSelectAnswer,
  onAnswerQuestion,
  onToggleSaveError,
  onCreateFlashcard,
}: QuestionCardProps) {
  const [eliminatedAlts, setEliminatedAlts] = useState<Record<string, boolean>>(
    {},
  );

  const toggleEliminate = (e: React.MouseEvent, altId: string) => {
    e.stopPropagation();
    if (respondida) return;
    setEliminatedAlts((prev) => ({ ...prev, [altId]: !prev[altId] }));
  };

  const acertou = alternativaSelecionada === questao.gabaritoCorreto;
  const qtdOpcoes =
    questao.formato === "multipla" ? questao.alternativas?.length || 4 : 2;

  const getCardStyle = () => {
    if (isFocused) {
      if (respondida) {
        return acertou
          ? "bg-gradient-to-br from-emerald-950/20 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-emerald-400 shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] opacity-100 z-20 scale-[1.01]"
          : "bg-gradient-to-br from-rose-950/20 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-rose-500 shadow-[0_0_30px_-5px_rgba(244,63,94,0.25)] opacity-100 z-20 scale-[1.01]";
      }
      return "bg-gradient-to-br from-indigo-950/30 via-[#0a0e1a] to-[#080b13] border-y border-r border-slate-800/80 border-l-4 border-l-indigo-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] opacity-100 z-20 scale-[1.01]";
    }

    if (respondida) {
      return acertou
        ? "bg-[#060810]/70 border border-emerald-500/20 opacity-60 hover:opacity-90 transition-all z-0"
        : "bg-[#060810]/70 border border-rose-500/20 opacity-60 hover:opacity-90 transition-all z-0";
    }

    return "bg-[#060810]/70 border border-slate-800/60 opacity-65 hover:opacity-90 transition-all z-0";
  };

  return (
    <motion.div
      id={`question-card-${index}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-6 transition-all duration-300 relative ${getCardStyle()}`}
    >
      {/* BADGE FLUTUANTE DE FOCO */}
      {isFocused && (
        <div
          className={`absolute -top-3.5 right-8 px-3 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1.5 shadow-xl z-30 border font-extrabold uppercase tracking-widest ${
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
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
  <div className="flex items-center gap-2">
    <span className="text-xs font-black tracking-wider text-indigo-400 uppercase">
      QUESTÃO {index + 1}
    </span>
    {questao.formato && (
      <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md uppercase">
        {questao.formato === "multipla" ? "Múltipla Escolha" : "Certo / Errado"}
      </span>
    )}
  </div>

  <div className="flex items-center gap-2">
    {/* BOTÃO DE REVISAR DEPOIS / BANDEIRA */}
    <button
      type="button"
      onClick={onToggleFlag}
      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
        isFlagged
          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
      }`}
      title="Marcar questão para revisar depois"
    >
      <Flag size={13} className={isFlagged ? "fill-amber-300 text-amber-300" : ""} />
      <span className="hidden sm:inline text-[11px]">
        {isFlagged ? "Marcada" : "Revisar"}
      </span>
    </button>
  </div>
</div>

      {/* ENUNCIADO */}
      <p className="text-slate-200 text-[15px] sm:text-base font-medium mb-6 leading-relaxed whitespace-pre-line">
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
                  className="relative flex items-center gap-2 group"
                >
                  <button
                    disabled={respondida}
                    onClick={() => !isEliminated && onSelectAnswer(alt.id)}
                    type="button"
                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-start justify-between cursor-pointer disabled:cursor-default ${
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
                    <div className="flex items-start gap-3.5 pr-2">
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
                      <kbd className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border border-slate-800/80 group-hover:border-slate-700 px-1.5 py-0.5 rounded shrink-0 self-center transition-colors">
                        {atalhoNum}
                      </kbd>
                    )}
                  </button>

                  {/* BOTÃO DISCRETO DE RISCAR ALTERNATIVA */}
                  {!respondida && (
                    <button
                      type="button"
                      onClick={(e) => toggleEliminate(e, alt.id)}
                      title={
                        isEliminated
                          ? "Restaurar alternativa"
                          : "Riscar alternativa"
                      }
                      className={`p-1.5 rounded-md transition-all shrink-0 cursor-pointer ${
                        isEliminated
                          ? "text-rose-400 hover:text-rose-300 opacity-80 hover:opacity-100"
                          : "text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isEliminated ? <Eye size={14} /> : <EyeOff size={14} />}
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
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between group cursor-pointer disabled:cursor-default ${
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
                      className={`w-2 h-2 rounded-full ${
                        opcao === "Certo" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span>{opcao}</span>
                  </div>
                  {!respondida && (
                    <kbd className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400 border border-slate-800/80 group-hover:border-slate-700 px-1.5 py-0.5 rounded transition-colors">
                      {atalhoNum}
                    </kbd>
                  )}
                </button>
              );
            })}
      </div>

      {/* RODAPÉ */}
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
                <kbd className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  1-{qtdOpcoes}
                </kbd>
                <span className="text-slate-600 ml-0.5">Opção</span>
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
              onClick={onAnswerQuestion}
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md shadow-indigo-950/50 ml-auto cursor-pointer"
            >
              Responder Questão
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-4 animate-in fade-in duration-300 bg-slate-950/80 border border-slate-800/80 space-y-3">
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
                <button
                  onClick={onCreateFlashcard}
                  disabled={isCreatingFlashcard || isFlashcardCreated}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer ${
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
              )}
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-300 font-semibold block mb-1">
                Explicação & Justificativa:
              </strong>
              {renderEnunciado(questao.justificativa)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
