"use client";

import React from "react";
import { X, Printer, Trophy, Clock, CheckCircle2, XCircle, Sparkles, BookOpen } from "lucide-react";
import { TimedQuizQuestion } from "@/types/quiz";

interface QuestionResultAudit {
  question: TimedQuizQuestion;
  userAnswer?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

interface PrintableTimedExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  banca: string;
  materia: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  totalTimeSpentSeconds: number;
  questionsAudit: QuestionResultAudit[];
  dateStr?: string;
}

export function PrintableTimedExamModal({
  isOpen,
  onClose,
  banca,
  materia,
  totalQuestions,
  correctAnswers,
  accuracyPercentage,
  totalTimeSpentSeconds,
  questionsAudit,
  dateStr = new Date().toLocaleDateString("pt-BR"),
}: PrintableTimedExamModalProps) {
  if (!isOpen) return null;

  const minutesSpent = Math.floor(totalTimeSpentSeconds / 60);
  const secondsSpent = totalTimeSpentSeconds % 60;
  const timeFormatted = `${String(minutesSpent).padStart(2, "0")}:${String(
    secondsSpent
  ).padStart(2, "0")}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none print:m-0 print:p-0">
        {/* BARRA SUPERIOR (OCULTA NA IMPRESSÃO) */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
              <Trophy size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Caderno Oficial do Simulado Cronometrado
              </h2>
              <p className="text-[11px] text-slate-400">
                Gabarito oficial, desempenho e justificativas fundamentadas da banca
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-violet-900/30 cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL (RENDERIZADO NA TELA E NA IMPRESSÃO) */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white">
          {/* CABEÇALHO INSTITUCIONAL */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black tracking-widest text-violet-700 uppercase">
                  SYNAPSE AI • AUDITORIA OFICIAL DE SIMULADOS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Simulado Cronometrado — {banca}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Disciplina: <strong>{materia}</strong> • Data de Realização: <strong>{dateStr}</strong>
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="inline-block p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Aproveitamento
                </span>
                <span className="text-xl font-black text-violet-700 block font-mono">
                  {accuracyPercentage}%
                </span>
                <span className="text-[10px] text-slate-600">
                  {correctAnswers}/{totalQuestions} acertos • {timeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* FOLHA RESUMO DE GABARITO (GRADE OFICIAL) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-2.5 text-xs font-bold flex items-center justify-between">
              <span>GRADE DE RESPOSTAS & GABARITO OFICIAL</span>
              <span className="font-mono text-[10px]">{totalQuestions} Questões</span>
            </div>
            <div className="p-3 bg-slate-50 grid grid-cols-5 sm:grid-cols-10 gap-2 text-center text-xs">
              {questionsAudit.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold ${
                    item.isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-rose-50 border-rose-300 text-rose-800"
                  }`}
                >
                  <span className="block text-[9px] text-slate-500">Q{idx + 1}</span>
                  <span className="block font-black">
                    {item.userAnswer || "-"} / {item.question.gabaritoCorreto}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AUDITORIA COMPLETA QUESTÃO POR QUESTÃO */}
          <div className="space-y-6 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
              Questões na Íntegra e Justificativas Fundamentadas
            </h3>

            {questionsAudit.map((item, idx) => {
              const q = item.question;
              return (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 break-inside-avoid"
                >
                  {/* Cabeçalho da Questão */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">Questão #{idx + 1}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.isCorrect ? "ACERTOU ✓" : "ERROU ✗"}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-600">
                      Sua resposta: <strong>{item.userAnswer || "N/A"}</strong> | Gabarito:{" "}
                      <strong>{q.gabaritoCorreto}</strong> | Tempo: {item.timeSpentSeconds}s
                    </div>
                  </div>

                  {/* Enunciado */}
                  <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                    {q.enunciado}
                  </p>

                  {/* Alternativas */}
                  {q.alternativas && q.alternativas.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {q.alternativas.map((alt) => {
                        const isCorrectAlt = alt.id === q.gabaritoCorreto;
                        const isUserChoice = alt.id === item.userAnswer;

                        let badgeStyle = "border-slate-200 bg-white text-slate-700";
                        if (isCorrectAlt) {
                          badgeStyle = "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold";
                        } else if (isUserChoice && !item.isCorrect) {
                          badgeStyle = "border-rose-400 bg-rose-50 text-rose-900 font-bold";
                        }

                        return (
                          <div
                            key={alt.id}
                            className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${badgeStyle}`}
                          >
                            <span className="w-5 h-5 rounded bg-slate-200 text-slate-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                              {alt.id}
                            </span>
                            <span className="leading-relaxed">{alt.texto}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Justificativa */}
                  {q.justificativa && (
                    <div className="p-3 rounded-lg border border-violet-200 bg-violet-50/60 text-xs text-slate-800 space-y-1">
                      <span className="font-bold text-[10px] text-violet-800 uppercase block">
                        Justificativa da Banca Examinadora:
                      </span>
                      <p className="leading-relaxed">{q.justificativa}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RODAPÉ INSTITUCIONAL */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500">
            Documento gerado pela plataforma Synapse AI • Sistema de Aprendizagem Adaptativa para Concursos Públicos
          </div>
        </div>
      </div>
    </div>
  );
}
