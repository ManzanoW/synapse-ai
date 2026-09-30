"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Printer,
  QrCode,
  Scissors,
  FileText,
  Eye,
  EyeOff,
  Columns,
  CheckSquare,
  Sparkles,
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
  const [includeCover, setIncludeCover] = useState(true);
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(false);
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

  const registrationNumber = useMemo(() => {
    if (quizId) {
      const hash = Math.abs(
        quizId.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
      );
      return "SYN-" + String(100000 + (hash % 900000));
    }
    return "SYN-849201";
  }, [quizId]);

  return (
    <>
      {/* ========================================================================= */}
      {/* REGRAS CSS RIGOROSAS DE IMPRESSÃO (PADRÃO OFICIAL CEBRASPE / FGV / FCC) */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media print {
          /* 1. Garante fluxo vertical natural e sem limites de altura */
          html,
          body {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 2. Força todos os wrappers e containers ancestrais a permitirem paginação contínua */
          #__next,
          main,
          div {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }

          /* 3. Oculta tudo que estiver marcado com print:hidden ou casca do app */
          .print\\:hidden,
          aside,
          nav,
          header,
          footer {
            display: none !important;
          }

          /* 4. Papel da prova em fluxo normal (NUNCA position: absolute em print) */
          #printable-paper {
            position: static !important;
            display: block !important;
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
            margin: 10mm 12mm 10mm 12mm;
          }

          /* 5. Quebras de página estritas (Padrão W3C Paged Media) */
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

          /* 6. Capa Oficial em Exatamente 1 Página A4 (Calibrada para 250mm) */
          .print-cover-container {
            box-sizing: border-box !important;
            min-height: 248mm !important;
            height: 250mm !important;
            max-height: 252mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            margin: 0 0 0 0 !important;
            padding: 6mm 7mm !important;
            border: 2.5pt solid #000 !important;
          }

          /* 7. Folha Óptica Destacável em Exatamente 1 Página */
          .print-answer-sheet-container {
            box-sizing: border-box !important;
            min-height: 248mm !important;
            height: 250mm !important;
            max-height: 252mm !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            margin: 0 0 0 0 !important;
            padding: 6mm 7mm !important;
            border: 2pt solid #000 !important;
          }

          /* 8. Diagramação Oficial de Concurso em 2 Colunas */
          .print-columns-grid {
            column-count: 2 !important;
            column-gap: 7mm !important;
            column-rule: 0.5pt solid #cbd5e1 !important;
            display: block !important;
          }

          .print-explanations-columns {
            column-count: 2 !important;
            column-gap: 6mm !important;
            column-rule: 0.5pt solid #cbd5e1 !important;
            display: block !important;
          }

          /* 9. Modo Econômico: compressão vertical agressiva para economizar até 40% de papel */
          .is-compact .print-columns-grid {
            column-count: 2 !important;
            column-gap: 5mm !important;
          }

          .is-compact .compact-q-block {
            margin-bottom: 2mm !important;
            padding-bottom: 1.5mm !important;
          }

          .is-compact .q-statement-text {
            font-size: 9.5px !important;
            line-height: 1.3 !important;
            margin-bottom: 1.5mm !important;
          }

          .is-compact .q-alt-item {
            font-size: 9px !important;
            line-height: 1.25 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 md:p-8 font-sans print:bg-white print:p-0 print:text-black print:min-h-0 print:h-auto print:block print:overflow-visible">
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR DE AÇÕES & CUSTOMIZAÇÃO (Apenas em tela) */}
        {/* ========================================================================= */}
        <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              type="button"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Simulado</span>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-white block">
                Caderno de Prova Impresso • {banca.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-400">
                {totalQuestions} questões • Diagramação Oficial A4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              <span>Capa</span>
            </button>

            {/* Toggle Gabarito Óptico */}
            <button
              type="button"
              onClick={() => setIncludeAnswerSheet(!includeAnswerSheet)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                includeAnswerSheet
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Incluir Cartão-Resposta Óptico Destacável"
            >
              <CheckSquare size={13} />
              <span>Folha de Respostas</span>
            </button>

            {/* Toggle Gabarito Comentado */}
            <button
              type="button"
              onClick={() => setIncludeExplanations(!includeExplanations)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                includeExplanations
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Incluir Justificativas e Comentários Teóricos ao final"
            >
              {includeExplanations ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Gabarito Comentado</span>
            </button>

            {/* Toggle Densidade Econômica */}
            <button
              type="button"
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCompactMode
                  ? "bg-amber-500/25 border-amber-500/50 text-amber-200 ring-1 ring-amber-400/40 shadow-sm"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Economiza folhas reduzindo o espaçamento e tamanho da fonte"
            >
              <Columns size={13} />
              <span>{isCompactMode ? "Modo Econômico: ATIVADO" : "Modo Econômico"}</span>
            </button>

            {/* Botão Primário Imprimir */}
            <button
              onClick={() => window.print()}
              type="button"
              className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-linear-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTAINER DA PROVA IMPRESSA (Simula folha de prova A4) */}
        {/* ========================================================================= */}
        <div
          id="printable-paper"
          className={`max-w-5xl mx-auto bg-white text-black p-6 sm:p-10 md:p-14 rounded-2xl shadow-2xl print:shadow-none print:p-0 print:max-w-none print:w-full font-serif print:block print:static print:overflow-visible print:m-0 ${
            isCompactMode ? "is-compact" : ""
          }`}
        >
          {/* ========================================================================= */}
          {/* 1. FOLHA DE ROSTO / CAPA OFICIAL DE CONCURSO (EXATAMENTE 1 PÁGINA A4) */}
          {/* ========================================================================= */}
          {includeCover && (
            <div className="print-cover-container border-2 md:border-[2.5pt] border-black p-6 sm:p-8 flex flex-col justify-between mb-10 print:mb-0">
              {/* TOPO DA CAPA */}
              <div>
                <div className="border-b-[1.5pt] border-black pb-3 text-center">
                  <span className="font-sans text-[10px] font-bold tracking-[0.25em] text-slate-600 uppercase block mb-1">
                    SYNAPSE AI • SISTEMA COGNITIVO DE ALTO RENDIMENTO
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black font-sans">
                    CONCURSO PÚBLICO & SIMULADO OFICIAL
                  </h2>
                  <div className="mt-2 inline-block bg-black text-white font-sans text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-xs">
                    BANCA EXAMINADORA: {banca.toUpperCase()}
                  </div>
                </div>

                {/* TÍTULO DA PROVA */}
                <div className="my-6 text-center bg-slate-100 p-5 border-y-[1.5pt] border-black">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    CADERNO DE QUESTÕES OBJETIVAS
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black uppercase text-black leading-snug font-sans">
                    {title}
                  </h1>
                  <p className="font-sans text-xs text-slate-800 mt-2 font-bold">
                    DURAÇÃO TOTAL SUGERIDA: {estimatedTimeMinutes} MINUTOS • TOTAL DE ITENS: {totalQuestions}
                  </p>
                </div>

                {/* INSTRUÇÕES FORMAIS AO CANDIDATO */}
                <div className="border border-black p-4 font-sans text-xs leading-relaxed space-y-2 bg-slate-50/50">
                  <h4 className="font-black uppercase text-[11px] border-b border-slate-300 pb-1 text-black">
                    INSTRUÇÕES GERAIS AO CANDIDATO:
                  </h4>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-800 text-[10.5px]">
                    <li>
                      Verifique se este caderno contém exatamente <strong>{totalQuestions} questões</strong>. Caso contrário, acione o fiscal.
                    </li>
                    <li>
                      Utilize <strong>caneta esferográfica de tinta preta ou azul escura</strong> para a resolução e preenchimento da Folha Óptica.
                    </li>
                    <li>
                      Para cada questão, preencha <strong>completamente o círculo</strong> da opção correspondente. Não use corretivo ou marcas parciais.
                    </li>
                    <li>
                      O tempo sugerido de resolução é de <strong>{Math.round(estimatedTimeMinutes / Math.max(1, totalQuestions))} minutos por questão</strong>, incluindo a transposição do gabarito.
                    </li>
                    <li>
                      Ao finalizar a prova, utilize o <strong>QR Code impresso na Folha de Respostas</strong> para escanear com seu smartphone e consultar o gabarito comentado no Synapse AI.
                    </li>
                  </ol>
                </div>
              </div>

              {/* BLOCO DE IDENTIFICAÇÃO DO CANDIDATO (FIXADO NA BASE DA CAPA) */}
              <div className="border-t-[1.5pt] border-black pt-4 font-sans text-xs mt-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-600 block mb-1">
                      Nome Completo do Candidato:
                    </span>
                    <div className="border-b-[1.5pt] border-black h-7" />
                  </div>
                  <div>
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-600 block mb-1">
                      Número de Inscrição:
                    </span>
                    <div className="border-b-[1.5pt] border-black h-7 font-mono font-bold text-center pt-0.5 text-slate-900">
                      {registrationNumber}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-600 block mb-1">
                      Data da Aplicação:
                    </span>
                    <div className="border-b-[1.5pt] border-black h-7 pt-0.5 text-slate-800 font-mono">
                      {examDate}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-600 block mb-1">
                      Assinatura do Candidato:
                    </span>
                    <div className="border-b-[1.5pt] border-black h-7" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. CADERNO DE QUESTÕES (DIAGRAMAÇÃO EM 2 COLUNAS DE ALTA DENSIDADE) */}
          {/* ========================================================================= */}
          <div className={`mb-10 print:mb-0 ${includeCover ? "print-page-break-before" : ""}`}>
            {/* CABEÇALHO DA PROVA */}
            <div className="border-b-[1.5pt] border-black pb-1.5 mb-4 flex items-center justify-between font-sans text-[9px] font-bold uppercase text-slate-600">
              <span>{banca.toUpperCase()} • {title}</span>
              <span>SYNAPSE AI • CADERNO DE QUESTÕES</span>
            </div>

            <div
              className={`print-columns-grid ${
                isCompactMode ? "columns-compact" : ""
              }`}
            >
              {questions.map((q) => {
                const isCertoErrado = q.format === "certo_errado";

                return (
                  <div
                    key={q.id}
                    className={`print-avoid-break border-b border-slate-200 ${
                      isCompactMode
                        ? "compact-q-block mb-2 pb-1.5"
                        : "mb-3.5 pb-2.5"
                    }`}
                  >
                    {/* NÚMERO E MATÉRIA */}
                    <div className={`flex items-center justify-between gap-2 font-sans ${isCompactMode ? "mb-1" : "mb-1.5"}`}>
                      <span className={`font-black text-black uppercase tracking-wider bg-slate-200 rounded-xs shrink-0 ${
                        isCompactMode ? "text-[9px] px-1 py-0.2" : "text-[10.5px] px-1.5 py-0.5"
                      }`}>
                        QUESTÃO {q.number}
                      </span>
                      {q.subjectName && (
                        <span className={`font-bold text-slate-600 uppercase text-right leading-tight max-w-[220px] break-words ${
                          isCompactMode ? "text-[7.5px]" : "text-[8.5px]"
                        }`}>
                          {q.subjectName}
                        </span>
                      )}
                    </div>

                    {/* ENUNCIADO COMPACTO E JUSTIFICADO */}
                    <p
                      className={`q-statement-text text-slate-900 font-normal whitespace-pre-line text-justify ${
                        isCompactMode
                          ? "text-[9.5px] leading-snug mb-1"
                          : "text-[11.5px] leading-relaxed mb-2"
                      }`}
                    >
                      {renderPrintableStatement(q.statement)}
                    </p>

                    {/* ALTERNATIVAS */}
                    {isCertoErrado ? (
                      <div className={`font-sans pl-1 ${
                        isCompactMode ? "text-[9px] space-y-0.5" : "text-[10.5px] space-y-1"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full border border-black flex items-center justify-center font-bold shrink-0 ${
                            isCompactMode ? "w-3.5 h-3.5 text-[8px]" : "w-4 h-4 text-[9px]"
                          }`}>
                            C
                          </span>
                          <span>CERTO</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full border border-black flex items-center justify-center font-bold shrink-0 ${
                            isCompactMode ? "w-3.5 h-3.5 text-[8px]" : "w-4 h-4 text-[9px]"
                          }`}>
                            E
                          </span>
                          <span>ERRADO</span>
                        </div>
                      </div>
                    ) : (
                      q.options &&
                      q.options.length > 0 && (
                        <div className={`font-sans pl-0.5 ${
                          isCompactMode ? "space-y-0.5 text-[9.5px]" : "space-y-1 text-[10.5px]"
                        }`}>
                          {q.options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return (
                              <div
                                key={idx}
                                className={`q-alt-item flex items-start gap-1.5 text-slate-900 text-justify ${
                                  isCompactMode ? "leading-tight" : "leading-snug"
                                }`}
                              >
                                <span className={`rounded-full border border-black flex items-center justify-center font-bold shrink-0 ${
                                  isCompactMode ? "w-3.5 h-3.5 text-[8px] mt-0.2" : "w-4 h-4 text-[9px] mt-0.5"
                                }`}>
                                  {letter}
                                </span>
                                <span className={isCompactMode ? "leading-tight" : "leading-snug"}>{opt}</span>
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
          {/* 3. FOLHA OFICIAL DE RESPOSTAS (CARTÃO ÓPTICO DESTACÁVEL - 1 PÁGINA) */}
          {/* ========================================================================= */}
          {includeAnswerSheet && (
            <div className="print-answer-sheet-container border-2 md:border-[2pt] border-black p-6 sm:p-8 mt-10 print:mt-0 font-sans flex flex-col justify-between">
              {/* TOPO DO CARTÃO */}
              <div>
                {/* LINHA DE CORTE */}
                <div className="flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-4 border-b-2 border-dashed border-slate-400 pb-2">
                  <Scissors size={13} />
                  <span>DESTAQUE AQUI E ENTREGUE AO FISCAL DE PROVA</span>
                  <Scissors size={13} />
                </div>

                <div className="flex items-start justify-between border-b-[1.5pt] border-black pb-3 mb-4 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">
                      SYNAPSE AI • SISTEMA OFICIAL DE LEITURA ÓPTICA
                    </span>
                    <h3 className="text-base sm:text-lg font-black uppercase text-black">
                      FOLHA OFICIAL DE RESPOSTAS (GABARITO)
                    </h3>
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      Banca: <strong>{banca.toUpperCase()}</strong> • Total de Itens: <strong>{totalQuestions}</strong> • Data: <strong>{examDate}</strong>
                    </p>
                  </div>

                  {/* QR CODE */}
                  <div className="flex flex-col items-center text-center shrink-0">
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Code de Correção"
                        className="w-16 h-16 border border-slate-400 p-0.5 bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 border border-slate-400 p-1 flex items-center justify-center bg-slate-100">
                        <QrCode size={28} />
                      </div>
                    )}
                    <span className="text-[8px] font-bold uppercase text-slate-600 mt-0.5 leading-tight">
                      Gabarito Online
                    </span>
                  </div>
                </div>

                {/* INSTRUÇÃO DE PREENCHIMENTO */}
                <div className="bg-slate-100 border border-slate-300 p-2.5 text-[9.5px] mb-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <span className="font-bold block">INSTRUÇÃO DE PREENCHIMENTO:</span>
                    <span className="text-slate-600">
                      Preencha totalmente a bolha com caneta preta. Não rasure nem use corretivo.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center text-white text-[7px]">✓</div>
                      <span>Correto</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <div className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[7px]">✗</div>
                      <span>Incorreto</span>
                    </div>
                  </div>
                </div>

                {/* GRADE DE BOLHAS CALIBRADA COM AS ALTERNATIVAS REAIS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-1.5 text-xs">
                  {questions.map((q) => {
                    const isCertoErrado = q.format === "certo_errado";
                    // Define o número exato de bolinhas baseado na questão (evita renderizar E desnecessário)
                    const optionLetters = isCertoErrado
                      ? ["C", "E"]
                      : q.options && q.options.length > 0
                        ? q.options.map((_, idx) => String.fromCharCode(65 + idx))
                        : ["A", "B", "C", "D"];

                    return (
                      <div
                        key={`opt-${q.id}`}
                        className="flex items-center justify-between border-b border-slate-200 py-1 px-1"
                      >
                        <span className="font-bold text-slate-900 font-mono text-[10px] w-6">
                          {String(q.number).padStart(2, "0")}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {optionLetters.map((letter) => (
                            <div
                              key={letter}
                              className="w-4 h-4 rounded-full border-[1.5pt] border-black flex items-center justify-center text-[8.5px] font-bold cursor-pointer hover:bg-slate-200"
                            >
                              {letter}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RODAPÉ DO CARTÃO ÓPTICO */}
              <div className="border-t border-slate-400 pt-3 grid grid-cols-2 gap-4 text-[9.5px]">
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
          )}

          {/* ========================================================================= */}
          {/* 4. CHAVE DE GABARITO OFICIAL & JUSTIFICATIVAS COMENTADAS */}
          {/* ========================================================================= */}
          {includeExplanations && (
            <div className="print-page-break-before border-t-[2.5pt] border-black pt-5 mt-10 print:mt-0 font-sans">
              <div className="flex items-center justify-between border-b-[1.5pt] border-black pb-2.5 mb-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">
                    SYNAPSE AI • AUDITORIA COGNITIVA
                  </span>
                  <h3 className="text-base sm:text-lg font-black uppercase text-black">
                    CHAVE DE GABARITO OFICIAL & JUSTIFICATIVAS
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-black text-white px-2.5 py-0.5 font-bold rounded-xs">
                  CONFIDENCIAL
                </span>
              </div>

              {/* TABELA CONDENSADA DE GABARITO RÁPIDO (GRADE HORIZONTAL CONTÍNUA) */}
              <div className="mb-6 bg-slate-50 p-3 border border-slate-300">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {questions.map((q) => (
                    <div
                      key={`gabarito-${q.id}`}
                      className="border border-black bg-white rounded-xs p-1 text-center"
                    >
                      <div className="text-[8px] font-bold text-slate-500 font-mono">
                        Q-{String(q.number).padStart(2, "0")}
                      </div>
                      <div className="text-xs font-black text-indigo-700">
                        {q.correctOption || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* JUSTIFICATIVAS DETALHADAS EM 2 COLUNAS COMPACTAS */}
              <div>
                <h4 className="font-sans font-black uppercase text-[10.5px] border-b border-slate-300 pb-1 text-black mb-3">
                  FUNDAMENTAÇÃO TEÓRICA ITEM A ITEM:
                </h4>
                <div className="print-explanations-columns space-y-2.5 text-xs font-serif leading-relaxed">
                  {questions.map((q) => (
                    <div
                      key={`exp-${q.id}`}
                      className="print-avoid-break pb-2 border-b border-slate-200"
                    >
                      <div className="font-sans font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                        <span className="text-[10px]">QUESTÃO {q.number}</span>
                        <span className="bg-indigo-100 text-indigo-900 text-[9px] px-1.5 py-0.2 rounded-xs font-mono font-bold">
                          Gabarito: {q.correctOption}
                        </span>
                        {q.subjectName && (
                          <span className="text-[9px] text-slate-500 font-normal">
                            ({q.subjectName})
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 text-[10.5px] leading-relaxed text-justify">
                        {q.justification ||
                          "Gabarito fundamentado conforme as diretrizes teóricas e jurisprudenciais da banca organizadora."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
