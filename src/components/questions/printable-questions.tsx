"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Printer,
  QrCode,
  Scissors,
  CheckCircle2,
  FileText,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export interface PrintableQuestion {
  id: string;
  number: number;
  statement: string;
  options?: string[];
  correctOption?: string;
  subjectName?: string;
  format?: string; // "multipla" | "certo_errado"
  justification?: string;
}

export interface PrintableQuestionsProps {
  title: string;
  banca?: string;
  totalQuestions: number;
  estimatedTimeMinutes: number;
  onBack: () => void;
  questions: PrintableQuestion[];
  quizId?: string | null;
}

function renderPrintableStatement(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function PrintableQuestions({
  title,
  banca = "FGV",
  totalQuestions,
  estimatedTimeMinutes,
  onBack,
  questions,
  quizId,
}: PrintableQuestionsProps) {
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);
  const [examDate, setExamDate] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setExamDate(new Date().toLocaleDateString("pt-BR"));
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const target = quizId
        ? `${origin}/questions/${quizId}`
        : `${origin}/questions`;
      setQrUrl(target);
    }
  }, [quizId]);

  const qrImageUrl = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=1&data=${encodeURIComponent(qrUrl)}`
    : "";

  return (
    <>
      {/* ESTILOS DE IMPRESSÃO OFICIAIS DE CONCURSO PÚBLICO */}
      <style jsx global>{`
        @media print {
          /* Oculta interface e elementos web */
          body * {
            visibility: hidden !important;
          }
          #printable-paper,
          #printable-paper * {
            visibility: visible !important;
          }
          #printable-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }

          .print-page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }

          .print-page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-two-columns {
            column-count: 2 !important;
            column-gap: 8mm !important;
            column-rule: 1px solid #d1d5db !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 print:text-black">
        {/* BARRA SUPERIOR DE AÇÕES (Apenas em tela) */}
        <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              type="button"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Voltar</span>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-white block">
                Caderno de Prova Oficial • {banca}
              </span>
              <span className="text-[11px] text-slate-400">
                {totalQuestions} questões • {estimatedTimeMinutes} min
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Gabarito Comentado */}
            <button
              type="button"
              onClick={() => setIncludeExplanations(!includeExplanations)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                includeExplanations
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Incluir chave com explicação teórica no final"
            >
              {includeExplanations ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Gabarito Comentado</span>
            </button>

            {/* Toggle Capa */}
            <button
              type="button"
              onClick={() => setIncludeCover(!includeCover)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                includeCover
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Incluir Folha de Rosto e Instruções"
            >
              <FileText size={13} />
              <span>Capa & Instruções</span>
            </button>

            {/* Botão Primário Imprimir */}
            <button
              onClick={() => window.print()}
              type="button"
              className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-linear-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir Caderno (Ctrl+P)</span>
            </button>
          </div>
        </div>

        {/* CONTAINER DA PROVA IMPRESSA (Simula papel A4) */}
        <div
          id="printable-paper"
          className="max-w-5xl mx-auto bg-white text-black p-8 md:p-14 rounded-2xl shadow-2xl print:shadow-none print:p-0 print:max-w-none print:w-full font-serif"
        >
          {/* ========================================================================= */}
          {/* 1. FOLHA DE ROSTO / CAPA OFICIAL DE CONCURSO */}
          {/* ========================================================================= */}
          {includeCover && (
            <div className="print-page-break-after border-4 border-black p-6 md:p-10 flex flex-col justify-between min-h-[900px] mb-12 print:mb-0 print:min-h-[1050px]">
              <div>
                {/* TOPO DA CAPA */}
                <div className="border-b-2 border-black pb-4 text-center">
                  <span className="font-sans text-[11px] font-bold tracking-widest text-slate-600 uppercase block mb-1">
                    SYNAPSE AI • SISTEMA COGNITIVO DE ALTO RENDIMENTO
                  </span>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                    CONCURSO PÚBLICO & SIMULADO OFICIAL
                  </h2>
                  <div className="mt-2 inline-block bg-black text-white font-sans text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-xs">
                    BANCA EXAMINADORA: {banca.toUpperCase()}
                  </div>
                </div>

                {/* TÍTULO DA PROVA */}
                <div className="my-8 text-center bg-slate-100 p-6 border-y-2 border-black">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    CADERNO DE QUESTÕES OBJETIVAS
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black uppercase text-black leading-snug">
                    {title}
                  </h1>
                  <p className="font-sans text-xs text-slate-700 mt-2 font-bold">
                    DURAÇÃO TOTAL SUGERIDA: {estimatedTimeMinutes} MINUTOS • TOTAL DE ITENS: {totalQuestions}
                  </p>
                </div>

                {/* INSTRUÇÕES FORMAIS AO CANDIDATO */}
                <div className="border border-black p-5 font-sans text-xs leading-relaxed space-y-2.5 bg-slate-50/50">
                  <h4 className="font-black uppercase text-xs border-b border-slate-400 pb-1 text-black flex items-center gap-1.5">
                    <span>INSTRUÇÕES GERAIS AO CANDIDATO:</span>
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-800 text-[11px]">
                    <li>
                      Verifique se este caderno contém exatamente <strong>{totalQuestions} questões</strong>. Caso contrário, acione o fiscal.
                    </li>
                    <li>
                      Utilize <strong>caneta esferográfica de tinta preta ou azul escura</strong> para a resolução das questões e preenchimento da Folha de Respostas Óptica.
                    </li>
                    <li>
                      Para cada questão, preencha <strong>completamente o círculo</strong> da opção escolhida. Não use corretivo, marcas com X ou rasuras na folha óptica.
                    </li>
                    <li>
                      O tempo sugerido de resolução é de <strong>{Math.round(estimatedTimeMinutes / Math.max(1, totalQuestions))} minutos por questão</strong>, incluindo o tempo de transposição do gabarito.
                    </li>
                    <li>
                      Ao finalizar a prova, utilize o <strong>QR Code impresso na Folha de Respostas</strong> para escanear com seu celular e obter o gabarito comentado oficial no Synapse AI.
                    </li>
                  </ol>
                </div>
              </div>

              {/* BLOCO DE IDENTIFICAÇÃO DO CANDIDATO */}
              <div className="border-t-2 border-black pt-5 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-[10px] uppercase text-slate-600 block mb-1">
                      Nome do Candidato:
                    </span>
                    <div className="border-b-2 border-black h-8" />
                  </div>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-slate-600 block mb-1">
                      Número de Inscrição:
                    </span>
                    <div className="border-b-2 border-black h-8 font-mono font-bold text-center pt-1">
                      SYN-{Math.floor(100000 + Math.random() * 900000)}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-slate-600 block mb-1">
                      Data da Aplicação:
                    </span>
                    <div className="border-b-2 border-black h-8 pt-1 text-slate-800">
                      {examDate}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-slate-600 block mb-1">
                      Assinatura do Candidato:
                    </span>
                    <div className="border-b-2 border-black h-8" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. CADERNO DE QUESTÕES (Diagramação 2 Colunas Oficial de Concurso) */}
          {/* ========================================================================= */}
          <div className="mb-12 print:mb-0">
            {/* CABEÇALHO SUPERIOR DE PÁGINA */}
            <div className="border-b-2 border-black pb-2 mb-6 flex items-center justify-between font-sans text-[10px] font-bold uppercase text-slate-600">
              <span>{banca.toUpperCase()} • {title}</span>
              <span>SYNAPSE AI • CADERNO DE QUESTÕES</span>
            </div>

            <div className="print-two-columns space-y-6">
              {questions.map((q) => {
                const isCertoErrado = q.format === "certo_errado";

                return (
                  <div key={q.id} className="print-avoid-break mb-6 pb-4 border-b border-slate-200">
                    {/* NÚMERO E TÓPICO */}
                    <div className="flex items-center justify-between gap-2 mb-2 font-sans">
                      <span className="font-black text-black text-xs uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-xs">
                        QUESTÃO {q.number}
                      </span>
                      {q.subjectName && (
                        <span className="text-[9px] font-bold text-slate-600 uppercase truncate max-w-[150px]">
                          {q.subjectName}
                        </span>
                      )}
                    </div>

                    {/* ENUNCIADO */}
                    <p className="text-xs leading-relaxed text-slate-900 font-normal mb-3 whitespace-pre-line text-justify">
                      {renderPrintableStatement(q.statement)}
                    </p>

                    {/* ALTERNATIVAS */}
                    {isCertoErrado ? (
                      <div className="font-sans text-xs space-y-1 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold text-[10px]">
                            C
                          </span>
                          <span>CERTO</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold text-[10px]">
                            E
                          </span>
                          <span>ERRADO</span>
                        </div>
                      </div>
                    ) : (
                      q.options &&
                      q.options.length > 0 && (
                        <div className="space-y-1.5 font-sans text-xs pl-1">
                          {q.options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return (
                              <div key={idx} className="flex items-start gap-2 text-slate-800">
                                <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                  {letter}
                                </span>
                                <span className="leading-snug text-justify">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. CARTÃO-RESPOSTA ÓPTICO DESTACÁVEL (COM BOLINHAS DE PREENCHIMENTO REAL) */}
          {/* ========================================================================= */}
          <div className="print-page-break-before border-2 border-black p-6 md:p-8 mt-12 print:mt-0 font-sans">
            {/* LINHA PONTILHADA DE DESTAQUE */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 border-b-2 border-dashed border-slate-400 pb-3">
              <Scissors size={14} />
              <span>DESTAQUE AQUI E ENTREGUE AO FISCAL DE PROVA</span>
              <Scissors size={14} />
            </div>

            {/* CABEÇALHO DO CARTÃO */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-5 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-600 uppercase block">
                  SYNAPSE AI • SISTEMA OFICIAL DE LEITURA ÓPTICA
                </span>
                <h3 className="text-base md:text-lg font-black uppercase text-black">
                  FOLHA OFICIAL DE RESPOSTAS (GABARITO)
                </h3>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  Banca: <strong>{banca}</strong> • Total de Questões: <strong>{totalQuestions}</strong> • Data: <strong>{examDate}</strong>
                </p>
              </div>

              {/* QR CODE DE SINCRONIZAÇÃO */}
              <div className="flex flex-col items-center text-center shrink-0">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="QR Code de Correção"
                    className="w-20 h-20 border border-slate-400 p-1 bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 border border-slate-400 p-2 flex items-center justify-center bg-slate-100">
                    <QrCode size={36} />
                  </div>
                )}
                <span className="text-[8px] font-bold uppercase text-slate-600 mt-1 max-w-[85px] leading-tight">
                  Escaneie p/ Correção
                </span>
              </div>
            </div>

            {/* GUIA DE PREENCHIMENTO */}
            <div className="bg-slate-100 border border-slate-300 p-3 rounded-xs text-[10px] mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-0.5">
                <span className="font-bold block">INSTRUÇÃO DE PREENCHIMENTO:</span>
                <span className="text-slate-600">
                  Preencha totalmente a bolinha com caneta preta. Não faça X ou traços parciais.
                </span>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-bold">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[8px]">✓</div>
                  <span>Correto</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px]">✗</div>
                  <span>Incorreto</span>
                </div>
              </div>
            </div>

            {/* GRADE DE BOLINHAS (ORGANIZADA EM COLUNAS DE 10 OU 15 ITENS) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
              {questions.map((q) => {
                const isCertoErrado = q.format === "certo_errado";

                return (
                  <div
                    key={`opt-${q.id}`}
                    className="flex items-center justify-between border-b border-slate-200 py-1.5 px-1"
                  >
                    <span className="font-bold text-slate-900 font-mono text-[11px] w-7">
                      {String(q.number).padStart(2, "0")}
                    </span>

                    {isCertoErrado ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-slate-200">
                          C
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-slate-200">
                          E
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {["A", "B", "C", "D", "E"].map((letter) => (
                          <div
                            key={letter}
                            className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold cursor-pointer hover:bg-slate-200"
                          >
                            {letter}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RODAPÉ DA FOLHA ÓPTICA */}
            <div className="mt-8 pt-4 border-t border-slate-400 grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <span className="font-bold text-slate-600 block">Assinatura do Candidato:</span>
                <div className="border-b border-black h-6" />
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-600 block">Total de Acertos (Uso do Fiscal):</span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  ____ / {totalQuestions}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. CHAVE DE GABARITO OFICIAL & RESOLUÇÃO COMENTADA */}
          {/* ========================================================================= */}
          {includeExplanations && (
            <div className="print-page-break-before border-t-4 border-black pt-6 mt-12 print:mt-0 font-sans">
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    SYNAPSE AI • AUDITORIA COGNITIVA
                  </span>
                  <h3 className="text-lg font-black uppercase text-black">
                    CHAVE DE GABARITO OFICIAL & JUSTIFICATIVAS
                  </h3>
                </div>
                <span className="text-xs font-mono bg-black text-white px-3 py-1 font-bold rounded-xs">
                  CONFIDENCIAL
                </span>
              </div>

              {/* TABELA CONDENSADA DE GABARITO RÁPIDO */}
              <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 p-4 border border-slate-300">
                {questions.map((q) => (
                  <div
                    key={`gabarito-${q.id}`}
                    className="border border-black bg-white rounded-xs p-1.5 text-center min-w-[52px]"
                  >
                    <div className="text-[9px] font-bold text-slate-500">
                      Q-{q.number}
                    </div>
                    <div className="text-sm font-black text-indigo-700">
                      {q.correctOption || "-"}
                    </div>
                  </div>
                ))}
              </div>

              {/* JUSTIFICATIVAS DETALHADAS */}
              <div className="space-y-4 text-xs font-serif leading-relaxed">
                <h4 className="font-sans font-black uppercase text-xs border-b border-slate-300 pb-1 text-black">
                  FUNDAMENTAÇÃO TEÓRICA ITEM A ITEM:
                </h4>
                {questions.map((q) => (
                  <div key={`exp-${q.id}`} className="print-avoid-break pb-3 border-b border-slate-200">
                    <div className="font-sans font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <span>QUESTÃO {q.number}</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.2 rounded-xs font-mono">
                        Gabarito: {q.correctOption}
                      </span>
                      {q.subjectName && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({q.subjectName})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 text-[11px] leading-relaxed text-justify">
                      {q.justification || "Gabarito fundamentado conforme as diretrizes teóricas e jurisprudenciais da banca organizadora."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
