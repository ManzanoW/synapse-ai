"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  X,
  FileText,
  Sparkles,
  Download,
  Settings2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { EssayTheme } from "@/actions/essay-actions";

interface PrintableExamSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: EssayTheme;
}

interface ExamSheetPaperProps {
  theme: EssayTheme;
  sheetMode: "with-theme" | "blank";
  examDate: string;
  qrImageUrl: string;
  rowHeight: string;
  isPrintVersion?: boolean;
}

/**
 * Componente unificado que renderiza a Folha Oficial de Redação (Cebraspe / Concursos)
 * Tanto na prévia interativa quanto na impressão nativa A4
 */
function ExamSheetPaper({
  theme,
  sheetMode,
  examDate,
  qrImageUrl,
  rowHeight,
  isPrintVersion = false,
}: ExamSheetPaperProps) {
  return (
    <div
      className={`w-full bg-white text-black font-serif leading-tight ${
        isPrintVersion
          ? "max-w-[190mm] mx-auto p-0 border-none shadow-none"
          : "max-w-[210mm] p-5 sm:p-7 shadow-2xl rounded-xs border border-slate-300 shrink-0 flex flex-col justify-between"
      }`}
      style={{
        boxSizing: "border-box",
        minHeight: isPrintVersion ? undefined : "297mm",
      }}
    >
      {/* ÁREA SUPERIOR: CABEÇALHO + PROPOSTA + GRADE DE 30 LINHAS */}
      <div>
        {/* ========================================================================= */}
        {/* CABEÇALHO OFICIAL DO CONCURSO COM CÓDIGO DE BARRAS */}
        {/* ========================================================================= */}
        <div className="border-2 border-black p-2 sm:p-2.5 mb-2 bg-white">
          {/* Linha 1: Marcações Oficiais e Código de Barras */}
          <div className="flex items-center justify-between border-b border-black pb-1.5 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-black shrink-0" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase">
                FOLHA DE TEXTO DEFINITIVO
              </span>
              <span className="text-[9px] font-mono border border-black px-1 font-bold">
                029
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10.5px] font-bold uppercase tracking-wider block font-sans">
                BANCA {theme.banca || "CEBRASPE"} • PROVA DISCURSIVA
              </span>
            </div>

            {/* Código de barras decorativo oficial */}
            <div className="text-right shrink-0">
              <div className="text-[15px] font-mono font-bold tracking-tighter select-none leading-none">
                ||| | | |||| || | ||||| | |||
              </div>
              <span className="text-[7.5px] font-mono text-zinc-600 tracking-widest block">
                *SYNAPSE-AI-EXAM*
              </span>
            </div>
          </div>

          {/* Linha 2: Campos de Identificação do Candidato */}
          <div className="grid grid-cols-4 gap-2 text-[9.5px] font-sans items-center">
            <div className="col-span-2 border-b border-dotted border-zinc-500 pb-0.5 flex items-center">
              <span className="font-bold shrink-0 mr-1">NOME:</span>
              <span className="text-zinc-600 text-[8.5px] truncate">_____________________________________________</span>
            </div>
            <div className="border-b border-dotted border-zinc-500 pb-0.5 flex items-center">
              <span className="font-bold shrink-0 mr-1">INSCRIÇÃO:</span>
              <span className="font-mono text-[9px]">________-___</span>
            </div>
            <div className="border-b border-dotted border-zinc-500 pb-0.5 text-right flex items-center justify-end">
              <span className="font-bold shrink-0 mr-1">DATA:</span>
              <span className="text-[9px] font-mono">{examDate}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CAIXA DA PROPOSTA E TÓPICOS (SE SHEET MODE FOR WITH-THEME) */}
        {/* ========================================================================= */}
        {sheetMode === "with-theme" && (
          <div className="border border-black p-2 mb-2 bg-zinc-50/50 print:bg-transparent text-[10.5px]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-sans font-bold text-[9.5px] uppercase tracking-wider text-zinc-800">
                TEMA DA PROVA DISCURSIVA • ÁREA: {theme.subjectArea || "GERAL"}
              </span>
              <span className="font-sans text-[8.5px] font-bold">MÍN: 20 | MÁX: 30 LINHAS</span>
            </div>

            <div className="font-bold text-[11px] mb-1 leading-snug line-clamp-2">
              {theme.title}
            </div>

            {theme.expectedTopics && theme.expectedTopics.length > 0 && (
              <div className="space-y-0.5 pt-1 border-t border-zinc-300 text-[9.5px] leading-tight">
                <span className="font-bold block text-[9px]">Aspectos obrigatórios a abordar:</span>
                {theme.expectedTopics.map((top, idx) => (
                  <div key={idx} className="text-zinc-800 pl-2">
                    • {top}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* GRADE DE REDAÇÃO PAUTADA OFICIAL (1 A 30 LINHAS) */}
        {/* ========================================================================= */}
        <div className="border-2 border-black bg-white">
          {Array.from({ length: 30 }).map((_, i) => {
            const lineNum = i + 1;
            return (
              <div
                key={lineNum}
                className={`flex items-stretch ${
                  lineNum < 30 ? "border-b border-zinc-400 print:border-zinc-400" : ""
                }`}
                style={{ height: rowHeight }}
              >
                {/* Caixa do número da linha na margem esquerda */}
                <div
                  className="flex items-center justify-center border-r border-black font-mono text-[11px] font-bold select-none shrink-0 bg-zinc-100/70 print:bg-transparent"
                  style={{ width: "11mm" }}
                >
                  {lineNum.toString().padStart(2, "0")}
                </div>

                {/* Espaço em branco pautado para escrita do candidato */}
                <div className="flex-1 h-full" />

                {/* Margem direita oficial de translineação */}
                <div
                  className="h-full border-l border-red-500/40 print:border-zinc-400 shrink-0"
                  style={{ width: "14mm" }}
                  title="Margem Direita (Limite Oficial de Translineação)"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RODAPÉ OFICIAL DA FOLHA COM ORIENTAÇÕES E QR CODE DE SINCRONIZAÇÃO */}
      {/* ========================================================================= */}
      <div className="mt-2 pt-1.5 border-t border-black flex items-center justify-between text-[8.5px] font-sans text-zinc-800 leading-tight">
        <div className="space-y-0.5 max-w-[78%]">
          <p className="font-bold uppercase tracking-wider text-black text-[9px]">
            INSTRUÇÕES OFICIAIS AO CANDIDATO:
          </p>
          <p>
            1. Utilize caneta esferográfica de tinta preta fabricada em material transparente.
          </p>
          <p>
            2. Escreva com letra legível. Em caso de erro, risque com um traço simples a palavra e escreva a forma correta ao lado.
          </p>
          <p>
            3. Respeite rigorosamente as margens laterais. Não escreva nas margens nem assine fora dos campos permitidos.
          </p>
        </div>

        {/* QR Code de digitalização rápida no app */}
        {qrImageUrl && (
          <div className="flex flex-col items-center shrink-0 pl-2">
            <img
              src={qrImageUrl}
              alt="QR Synapse AI"
              className="w-11 h-11 border border-black p-0.5 bg-white"
            />
            <span className="text-[7px] font-mono font-bold mt-0.5 text-black">
              ESCANEAR NO APP
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PrintableExamSheetModal({
  isOpen,
  onClose,
  theme,
}: PrintableExamSheetModalProps) {
  const [sheetMode, setSheetMode] = useState<"with-theme" | "blank">("with-theme");
  const [examDate, setExamDate] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setExamDate(new Date().toLocaleDateString("pt-BR"));
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/redacao`);
    }
  }, []);

  if (!isOpen) return null;

  // Altura calibrada das 30 linhas para encaixe estrito em 1 ÚNICA página A4 (297mm):
  // - Mode with-theme: 7.0mm/linha -> 30 * 7.0 = 210mm + cabeçalho (15mm) + proposta (22mm) + rodapé (12mm) = ~265mm (dentro dos 285mm úteis da folha)
  // - Mode blank: 7.8mm/linha -> 30 * 7.8 = 234mm + cabeçalho (15mm) + rodapé (12mm) = ~265mm
  const rowHeight = sheetMode === "with-theme" ? "7.0mm" : "7.8mm";

  const handlePrint = () => {
    window.print();
  };

  const qrImageUrl = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=0&data=${encodeURIComponent(qrUrl)}`
    : "";

  return (
    <>
      {/* ========================================================================= */}
      {/* REGRAS CSS NATIVAS DE IMPRESSÃO A4 (VIA PORTAL DIRETO NO BODY) */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media screen {
          #synapse-print-section {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
          }

          html,
          body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Oculta tudo que é filho direto do body exceto o container de impressão oficial */
          body > *:not(#synapse-print-section) {
            display: none !important;
          }

          /* Exibe exclusivamente o documento oficial de redação na raiz */
          body > #synapse-print-section {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* PORTAL DE IMPRESSÃO NATIVO: RENDERIZADO DIRETAMENTE NA RAIZ DO BODY */}
      {mounted &&
        createPortal(
          <div id="synapse-print-section" className="bg-white text-black">
            <ExamSheetPaper
              theme={theme}
              sheetMode={sheetMode}
              examDate={examDate}
              qrImageUrl={qrImageUrl}
              rowHeight={rowHeight}
              isPrintVersion={true}
            />
          </div>,
          document.body
        )}

      {/* MODAL WEB DE VISUALIZAÇÃO E CONFIGURAÇÃO NA TELA */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
        <div className="relative w-full max-w-4xl flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh]">
          {/* CABEÇALHO DO MODAL */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
                <Printer size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Imprimir Folha de Redação Oficial
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    A4 Concurso
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    1 Página Exata
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simule a prova real: imprima a folha pautada padrão Cebraspe/FGV/FCC, redija à caneta e envie a foto para correção.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* BARRA DE OPÇÕES RÁPIDAS */}
          <div className="bg-slate-950/40 border-b border-white/5 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Toggle Tipo de Folha */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setSheetMode("with-theme")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sheetMode === "with-theme"
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Com Proposta e Tópicos ({theme.banca || "CEBRASPE"})
              </button>
              <button
                type="button"
                onClick={() => setSheetMode("blank")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sheetMode === "blank"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Folha Universal Pautada (Em Branco)
              </button>
            </div>

            {/* Botão de Disparo da Impressão */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-5 py-2 rounded-xl shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir Folha A4</span>
            </button>
          </div>

          {/* PRÉVIA VISUAL DA FOLHA DE REDAÇÃO A4 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
            <ExamSheetPaper
              theme={theme}
              sheetMode={sheetMode}
              examDate={examDate}
              qrImageUrl={qrImageUrl}
              rowHeight={rowHeight}
              isPrintVersion={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
