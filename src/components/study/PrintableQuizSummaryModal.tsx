"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Target,
  Trophy,
  Leaf,
  Download,
} from "lucide-react";
import { QuestaoIA } from "@/app/(dashboard)/questions/page";

const TRAP_WORDS_REGEX = /\b(EXCETO|INCORRETO|INCORRETA|INCORRETAS|INCORRETOS|VEDADO|VEDADA|VEDADOS|VEDADAS|DEFESO|DEFESA|PRESCINDE|PRESCINDÍVEL|PRIVATIVAMENTE|EXCLUSIVAMENTE|NUNCA|SEMPRE|SALVO|NÃO\s+PODE|NÃO\s+É|NÃO\s+SERÁ)\b/i;

interface PrintableQuizSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  banca?: string;
  subject?: string;
  questions: QuestaoIA[];
  selectedAnswers: Record<number, string>;
  timerSeconds: number;
  accuracyPercentage: number;
  correctCount: number;
  wrongCount: number;
}

export function PrintableQuizSummaryModal({
  isOpen,
  onClose,
  banca = "Geral",
  subject = "Simulado Geral",
  questions,
  selectedAnswers,
  timerSeconds,
  accuracyPercentage,
  correctCount,
  wrongCount,
}: PrintableQuizSummaryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [ecoMode, setEcoMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const minutesSpent = Math.floor(timerSeconds / 60);
  const secondsSpent = timerSeconds % 60;
  const timeFormatted = `${String(minutesSpent).padStart(2, "0")}:${String(
    secondsSpent
  ).padStart(2, "0")}`;

  const avgSecsPerQuestion =
    questions.length > 0 ? Math.round(timerSeconds / questions.length) : 0;
  const avgFormatted = `${Math.floor(avgSecsPerQuestion / 60)}m ${
    avgSecsPerQuestion % 60
  }s`;

  const dateFormatted = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Numero",
      "Materia",
      "Banca",
      "Gabarito Oficial",
      "Sua Resposta",
      "Resultado",
      "Enunciado Resumido",
    ];
    const rows = questions.map((q, idx) => {
      const userAns = selectedAnswers[idx] || "Em branco";
      const isCorrect = userAns === q.gabaritoCorreto;
      const cleanEnunciado = (q.enunciado || "")
        .replace(/[\r\n]+/g, " ")
        .replace(/"/g, '""')
        .slice(0, 160);
      return [
        idx + 1,
        `"${(subject || "Geral").replace(/"/g, '""')}"`,
        `"${(banca || "Geral").replace(/"/g, '""')}"`,
        `"${q.gabaritoCorreto}"`,
        `"${userAns}"`,
        isCorrect ? "ACERTOU" : "ERROU",
        `"${cleanEnunciado}"`,
      ].join(",");
    });

    const summary = [
      "",
      "# RESUMO DE RENDIMENTO",
      `Total de Questoes,${questions.length}`,
      `Acertos,${correctCount}`,
      `Erros,${wrongCount}`,
      `Aproveitamento,${accuracyPercentage}%`,
      `Tempo Total,${timeFormatted}`,
      `Data,${dateFormatted}`,
    ].join("\n");

    const csvContent = "\uFEFF" + [headers.join(","), ...rows, summary].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `simulado_${(banca || "geral").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-quiz-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-sans"
    >
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none print:m-0 print:p-0 print:border-none">
        {/* Barra superior de controle (Oculta na impressão) */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-900 text-white shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <FileText size={18} />
            </div>
            <div>
              <h2
                id="printable-quiz-modal-title"
                className="text-sm sm:text-base font-bold text-white leading-tight"
              >
                Folha de Respostas & Gabarito Executivo A4
              </h2>
              <p className="text-[11px] text-slate-400">
                Resumo em 1 página otimizado para impressão direta ou exportação em PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEcoMode((prev) => !prev)}
              aria-label="Alternar modo de economia de tinta para impressão"
              className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
                ecoMode
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
              title="Modo Tinta Zero (Eco): Remove sombreamentos e fundos coloridos para impressão limpa em preto e branco"
            >
              <Leaf size={14} className={ecoMode ? "text-emerald-400" : "text-slate-400"} />
              <span>{ecoMode ? "Modo Eco (Tinta Zero)" : "Econômico / Eco"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              aria-label="Baixar planilha CSV para Excel ou Notion"
              className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95 shadow-xs"
              title="Baixar planilha CSV com gabarito completo e métricas para Excel, Google Planilhas ou Notion"
            >
              <Download size={14} className="text-slate-400" />
              <span>Baixar CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Imprimir ou salvar PDF do gabarito"
              className="min-h-[38px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-900/30 cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualização de impressão"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conteúdo Executivo A4 */}
        <div
          id="printable-quiz-summary-sheet"
          data-eco-mode={ecoMode ? "true" : "false"}
          className="p-5 sm:p-8 space-y-4 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white"
        >
          {/* Cabeçalho da Folha */}
          <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black tracking-widest text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  SYNAPSE AI • GABARITO & AUDITORIA OFICIAL
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {dateFormatted}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                Simulado — {banca}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Disciplina: <strong>{subject}</strong> • Total:{" "}
                <strong>{questions.length} Questões</strong>
              </p>
            </div>

            {/* Quadro Resumo de Métricas */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-center min-w-[70px]">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">
                  Aproveitamento
                </span>
                <span className="text-base sm:text-lg font-black text-indigo-700 block font-mono">
                  {accuracyPercentage}%
                </span>
              </div>
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-center min-w-[70px]">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">
                  Acertos / Total
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700 block font-mono">
                  {correctCount}/{questions.length}
                </span>
              </div>
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-center min-w-[70px]">
                <span className="text-[9px] font-bold uppercase text-slate-500 block">
                  Tempo Gasto
                </span>
                <span className="text-base sm:text-lg font-black text-slate-800 block font-mono">
                  {timeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Grade Rápida de Gabarito Horizontal */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
            <div className="bg-slate-900 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-between">
              <span>FOLHA ÓPTICA RESUMIDA</span>
              <span className="font-mono text-[10px] text-slate-300">
                Ritmo Médio: {avgFormatted}/questão
              </span>
            </div>
            <div className="p-2 grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx] || "-";
                const isCorrect = userAns === q.gabaritoCorreto;
                return (
                  <div
                    key={idx}
                    className={`py-1 px-1 rounded border text-[10px] font-mono ${
                      isCorrect
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                        : "bg-rose-50 border-rose-400 text-rose-900 font-bold"
                    }`}
                  >
                    <span className="block text-[8px] text-slate-500">Q{idx + 1}</span>
                    <span className="block leading-none mt-0.5">
                      {userAns} <span className="text-[8px] text-slate-400 font-normal">/</span> {q.gabaritoCorreto}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grade Detalhada de Respostas em 2 Colunas (Otimizada para 1 Página A4) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-700 border-b border-slate-200 pb-1">
              <span>Auditoria Individual de Questões & Fundamentos</span>
              <span className="text-[9px] font-mono text-slate-500 font-normal">
                {correctCount} certas • {wrongCount} erradas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:grid-cols-2">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx] || "Em branco";
                const isCorrect = userAns === q.gabaritoCorreto;
                const hasTrap = Boolean(
                  q.pegadinhaBanca ||
                  q.mentorGuidance?.trapWarning ||
                  TRAP_WORDS_REGEX.test(q.enunciado || "")
                );
                const cleanEnunciado = q.enunciado
                  ? q.enunciado.replace(/\*\*/g, "").slice(0, 100) +
                    (q.enunciado.length > 100 ? "..." : "")
                  : "";
                const cleanJustificativa = q.justificativa
                  ? q.justificativa.replace(/\*\*/g, "").slice(0, 130) +
                    (q.justificativa.length > 130 ? "..." : "")
                  : "";

                return (
                  <div
                    key={q.id || idx}
                    className={`p-2 rounded-lg border text-xs break-inside-avoid flex flex-col justify-between ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-rose-200 bg-rose-50/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1 border-b border-slate-200/80 pb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-slate-900 text-[11px]">
                            #{idx + 1}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              isCorrect
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isCorrect ? "Acertou" : "Errou"}
                          </span>
                          {hasTrap && (
                            <span
                              className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1"
                              title={q.pegadinhaBanca || q.mentorGuidance?.trapWarning || "Contém pegadinha ou armadilha da banca"}
                            >
                              ⚠️ Pegadinha
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">
                          Resp: <strong className={isCorrect ? "text-emerald-700" : "text-rose-700 font-bold"}>{userAns}</strong> • Gab:{" "}
                          <strong className="text-slate-900 font-bold">{q.gabaritoCorreto}</strong>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-slate-700 line-clamp-2 leading-tight">
                        {cleanEnunciado}
                      </p>
                    </div>

                    {cleanJustificativa && (
                      <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-[9.5px] text-slate-600 line-clamp-2 leading-snug">
                        <strong className="text-slate-700">Fundamento:</strong>{" "}
                        {cleanJustificativa}
                      </div>
                    )}

                    {q.pegadinhaBanca && (
                      <div className="mt-0.5 text-[9px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 line-clamp-1">
                        <strong>Pegadinha:</strong> {q.pegadinhaBanca}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rodapé Institucional */}
          <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>Synapse AI • Ecossistema Cognitivo para Concursos Públicos</span>
            <span>Documento Oficial de Treinamento • Validação Individual</span>
          </div>
        </div>

        {/* Estilos dedicados para impressão em folha única A4 */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            .print\\:hidden {
              display: none !important;
            }
            #printable-quiz-summary-sheet {
              padding: 0 !important;
              margin: 0 !important;
              font-size: 11px !important;
            }
          }
          #printable-quiz-summary-sheet[data-eco-mode="true"],
          #printable-quiz-summary-sheet[data-eco-mode="true"] * {
            background-color: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          #printable-quiz-summary-sheet[data-eco-mode="true"] .bg-slate-900 {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-bottom: 2px solid #000000 !important;
          }
          #printable-quiz-summary-sheet[data-eco-mode="true"] .text-white {
            color: #000000 !important;
          }
          #printable-quiz-summary-sheet[data-eco-mode="true"] .border-emerald-200,
          #printable-quiz-summary-sheet[data-eco-mode="true"] .border-rose-200,
          #printable-quiz-summary-sheet[data-eco-mode="true"] .border-slate-200,
          #printable-quiz-summary-sheet[data-eco-mode="true"] .border-slate-300 {
            border-color: #64748b !important;
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
