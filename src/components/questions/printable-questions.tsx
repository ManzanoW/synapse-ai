"use client";

import React from "react";
import { ArrowLeft, Printer } from "lucide-react";

interface PrintableQuestion {
  id: string;
  number: number;
  statement: string;
  options?: string[];
  correctOption?: string;
  subjectName?: string;
}

interface PrintableQuestionsProps {
  title: string;
  totalQuestions: number;
  estimatedTimeMinutes: number;
  onBack: () => void;
  questions: PrintableQuestion[];
}

// Trata Markdown para impressão de forma limpa (substitui **texto** por <strong>texto</strong>)
function renderPrintableStatement(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-black text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function PrintableQuestions({
  title,
  totalQuestions,
  estimatedTimeMinutes,
  onBack,
  questions,
}: PrintableQuestionsProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:bg-white print:text-black print:p-0">
      {/* BARRA SUPERIOR DE AÇÕES */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Voltar para Banco de Questões</span>
        </button>

        <button
          onClick={() => window.print()}
          type="button"
          className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
        >
          <Printer size={14} />
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* FOLHA DE PROVA */}
      <div className="max-w-4xl mx-auto bg-white text-black p-8 md:p-12 rounded-2xl shadow-2xl print:shadow-none print:p-0 print:max-w-none">
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
            <span>SYNAPSE AI • BATERIA DE QUESTÕES</span>
            <span>
              Questões: {totalQuestions} | Tempo Sugerido:{" "}
              {estimatedTimeMinutes} min
            </span>
          </div>
          <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight">
            {title}
          </h1>

          <div className="grid grid-cols-3 gap-4 mt-6 text-xs text-slate-700">
            <div>
              <span className="font-bold text-slate-400 block text-[9px] uppercase">
                Nome do Candidato:
              </span>
              <div className="border-b border-slate-400 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-400 block text-[9px] uppercase">
                Data:
              </span>
              <div className="border-b border-slate-400 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-400 block text-[9px] uppercase">
                Pontuação:
              </span>
              <div className="border-b border-slate-400 h-5" />
            </div>
          </div>
        </div>

        {/* QUESTÕES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-xs text-slate-800 mb-10 print:grid-cols-2">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 gap-2">
                <span className="font-black text-slate-900 shrink-0">
                  QUESTÃO {q.number}
                </span>
                {q.subjectName && (
                  <span className="text-[9px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-45">
                    {q.subjectName}
                  </span>
                )}
              </div>
              <p className="leading-relaxed text-slate-900 font-medium whitespace-pre-line">
                {renderPrintableStatement(q.statement)}
              </p>
              {q.options && q.options.length > 0 && (
                <div className="space-y-1 pl-1 pt-1">
                  {q.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-slate-700"
                      >
                        <span className="font-bold text-slate-900">
                          ({letter})
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOLHA DE RESPOSTAS */}
        <div className="border-t-2 border-black pt-6 break-before-auto">
          <h3 className="text-xs font-black uppercase text-slate-900 mb-3">
            ☑ FOLHA DE RESPOSTAS (GABARITO RASCUNHO)
          </h3>
          <div className="flex flex-wrap gap-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="border border-slate-300 rounded-lg p-2 text-center min-w-16 bg-slate-50"
              >
                <div className="text-[10px] font-bold text-slate-500 mb-1">
                  Q-{q.number}
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-700">
                  <span>(A)</span>
                  <span>(B)</span>
                  <span>(C)</span>
                  <span>(D)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GABARITO OFICIAL */}
        <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page">
          <h3 className="text-xs font-black uppercase text-slate-900 mb-3">
            🔑 CHAVE DE GABARITO OFICIAL
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="border border-slate-200 rounded p-1.5 text-center bg-slate-100"
              >
                <div className="text-[9px] text-slate-500 font-bold">
                  Q-{q.number}
                </div>
                <div className="text-xs font-black text-indigo-600">
                  {q.correctOption || "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
