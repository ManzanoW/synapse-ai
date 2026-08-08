"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  BrainCircuit,
} from "lucide-react";
import { QuestaoIA } from "../page";

interface QuestionCardProps {
  questao: QuestaoIA;
  index: number;
  respondida: boolean;
  alternativaSelecionada?: string;
  isSavedError: boolean;
  isFlashcardCreated: boolean;
  isCreatingFlashcard: boolean;
  onSelectAnswer: (answerId: string) => void;
  onAnswerQuestion: () => void;
  onToggleSaveError: () => void;
  onCreateFlashcard: () => void;
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
          className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold mx-0.5"
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
  alternativaSelecionada,
  isSavedError,
  isFlashcardCreated,
  isCreatingFlashcard,
  onSelectAnswer,
  onAnswerQuestion,
  onToggleSaveError,
  onCreateFlashcard,
}: QuestionCardProps) {
  const acertou = alternativaSelecionada === questao.gabaritoCorreto;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`rounded-2xl p-6 border shadow-xl transition-all duration-500 relative ${
        respondida
          ? acertou
            ? "bg-[#090d16]/80 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
            : "bg-[#090d16]/80 border-rose-500/30 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]"
          : "bg-[#090d16]/60 border-slate-900 shadow-xl"
      }`}
    >
      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <span>Questão {index + 1}</span>
          <button
            onClick={onToggleSaveError}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] ${
              isSavedError
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
            title="Salvar no Caderno de Erros/Favoritos"
          >
            {isSavedError ? (
              <>
                <BookmarkCheck size={13} className="text-amber-400" />
                <span className="font-bold">Salva no Caderno de Erros</span>
              </>
            ) : (
              <>
                <Bookmark size={13} />
                <span>Salvar no Caderno de Erros</span>
              </>
            )}
          </button>
        </div>

        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full text-[10px]">
          {questao.formato === "multipla"
            ? "Múltipla Escolha"
            : "Certo / Errado"}
        </span>
      </div>

      <p className="text-slate-200 text-lg font-medium mb-6 leading-relaxed whitespace-pre-line">
        {renderEnunciado(questao.enunciado)}
      </p>

      <div className="space-y-3 mb-6">
        {questao.formato === "multipla"
          ? questao.alternativas?.map((alt) => {
              const isSelected = alternativaSelecionada === alt.id;
              return (
                <button
                  key={`q-${index}-alt-${alt.id}`}
                  disabled={respondida}
                  onClick={() => onSelectAnswer(alt.id)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 
                  ${
                    respondida
                      ? alt.id === questao.gabaritoCorreto
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : isSelected
                          ? "bg-rose-500/10 border-rose-500 text-rose-400"
                          : "bg-slate-950/20 border-slate-900 text-slate-600"
                      : isSelected
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30"
                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-300"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${isSelected ? "bg-indigo-600 text-slate-100" : "bg-slate-900 border border-slate-800 text-slate-400"}`}
                  >
                    {alt.id}
                  </span>
                  <span className="pt-0.5">{alt.texto}</span>
                </button>
              );
            })
          : ["Certo", "Errado"].map((opcao) => {
              const isSelected = alternativaSelecionada === opcao;
              return (
                <button
                  key={`q-${index}-ce-${opcao}`}
                  disabled={respondida}
                  onClick={() => onSelectAnswer(opcao)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3
                  ${
                    respondida
                      ? opcao === questao.gabaritoCorreto
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : isSelected
                          ? "bg-rose-500/10 border-rose-500 text-rose-400"
                          : "bg-slate-950/20 border-slate-900 text-slate-600"
                      : isSelected
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30"
                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/40 text-slate-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${opcao === "Certo" ? "bg-emerald-500" : "bg-rose-500"}`}
                  />
                  {opcao}
                </button>
              );
            })}
      </div>

      <div className="flex flex-col gap-4">
        {!respondida ? (
          <button
            disabled={!alternativaSelecionada}
            onClick={onAnswerQuestion}
            className="w-full sm:w-auto self-end px-5 py-2 bg-slate-100 text-slate-950 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            Responder Questão
          </button>
        ) : (
          <div className="rounded-xl p-4 animate-in fade-in duration-300 bg-slate-950/60 border border-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                {acertou ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Você acertou!
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle size={14} /> Resposta incorreta
                  </span>
                )}
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-slate-400 font-normal">
                  Gabarito oficial:{" "}
                  <strong className="text-slate-200 font-bold">
                    {questao.gabaritoCorreto}
                  </strong>
                </span>
              </div>

              {!acertou && (
                <button
                  onClick={onCreateFlashcard}
                  disabled={isCreatingFlashcard || isFlashcardCreated}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-[0.98] ${
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
                      <span>🎴 Gerar Flashcard</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300 font-semibold">
                Justificativa teórica:
              </strong>{" "}
              {questao.justificativa}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
