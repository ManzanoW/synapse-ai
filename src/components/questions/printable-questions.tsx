"use client";

import React, { useRef } from "react";
import { Printer, ArrowLeft, CheckSquare } from "lucide-react";
import Link from "next/link";

interface QuestionItem {
  id: string;
  number: number;
  statement: string;
  options?: string[];
  correctOption?: number | string;
  subjectName: string;
}

interface PrintableQuestionsProps {
  title: string;
  totalQuestions: number;
  estimatedTimeMinutes: number;
  questions: QuestionItem[];
}

export function PrintableQuestions({
  title,
  totalQuestions,
  estimatedTimeMinutes,
  questions,
}: PrintableQuestionsProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 p-4 md:p-8 font-sans">
      {/* BARRA DE AÇÕES (Oculta na Impressão) */}
      <div className="print:hidden max-w-5xl mx-auto mb-6 flex items-center justify-between bg-[#090d16] border border-white/10 p-4 rounded-2xl shadow-xl">
        <Link
          href="/questions"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Banco de Questões</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
        >
          <Printer size={15} />
          <span>Imprimir / Salvar PDF</span>
        </button>
      </div>

      {/* FOLHA DE PROVA (Visualização em tela / Papel A4 para impressão) */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto bg-white text-slate-900 p-8 md:p-12 rounded-2xl shadow-2xl print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 print:bg-white print:text-black"
      >
        {/* CABEÇALHO */}
        <header className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Synapse AI • Bateria de Questões
              </span>
              <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight mt-0.5">
                {title}
              </h1>
            </div>
            <div className="text-right text-xs font-mono">
              <p><strong>Questões:</strong> {totalQuestions}</p>
              <p><strong>Tempo Sugerido:</strong> {estimatedTimeMinutes} min</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-xs">
            <div>
              <span className="text-slate-500">Nome do Candidato:</span>
              <div className="border-b border-slate-400 h-5 w-full mt-1" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <span className="text-slate-500">Data:</span>
                <div className="border-b border-slate-400 h-5 w-full mt-1" />
              </div>
              <div className="flex-1">
                <span className="text-slate-500">Pontuação:</span>
                <div className="border-b border-slate-400 h-5 w-full mt-1" />
              </div>
            </div>
          </div>
        </header>

        {/* QUESTÕES EM 2 COLUNAS (Estilo Concurso) */}
        <main className="columns-1 md:columns-2 gap-8 space-y-6 print:columns-2 print:gap-6">
          {questions.map((q) => (
            <div
              key={q.id}
              className="break-inside-avoid border-b border-slate-200 pb-4 mb-4 space-y-2 text-xs"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-black text-slate-900 font-mono">
                  QUESTÃO {q.number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {q.subjectName}
                </span>
              </div>

              <p className="text-slate-800 leading-relaxed font-serif">
                {q.statement}
              </p>

              {q.options && q.options.length > 0 && (
                <div className="space-y-1.5 pt-1 pl-1">
                  {q.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-slate-700">({letter})</span>
                        <span className="text-slate-700 leading-snug">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </main>

        {/* CARTÃO RESPOSTA (GABARITO) */}
        <div className="break-before-page pt-8 border-t-2 border-slate-900 mt-12">
          <h2 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-2">
            <CheckSquare size={16} /> Folha de Respostas / Gabarito
          </h2>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center">
            {questions.map((q) => (
              <div
                key={`answer-${q.id}`}
                className="border border-slate-300 rounded p-1.5 font-mono text-[10px]"
              >
                <span className="block font-bold text-slate-500">Q-{q.number}</span>
                <div className="h-5 w-5 rounded-full border border-slate-400 mx-auto mt-1 flex items-center justify-center font-bold text-slate-900">
                  {q.correctOption || " "}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
