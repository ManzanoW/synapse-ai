"use client";

import React, { useState, useEffect } from "react";
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

export function PrintableExamSheetModal({
  isOpen,
  onClose,
  theme,
}: PrintableExamSheetModalProps) {
  const [sheetMode, setSheetMode] = useState<"with-theme" | "blank">("with-theme");
  const [candidateName, setCandidateName] = useState<string>("Nome do Candidato");
  const [examDate, setExamDate] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    setExamDate(new Date().toLocaleDateString("pt-BR"));
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/redacao`);
    }
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const qrImageUrl = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=0&data=${encodeURIComponent(qrUrl)}`
    : "";

  return (
    <>
      {/* ========================================================================= */}
      {/* REGRAS CSS DE IMPRESSÃO A4 (FOLHA DE REDAÇÃO OFICIAL DE CONCURSO) */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media print {
          /* Oculta tudo na tela do sistema web */
          body * {
            visibility: hidden !important;
          }
          #printable-exam-sheet,
          #printable-exam-sheet * {
            visibility: visible !important;
          }
          #printable-exam-sheet {
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
            margin: 8mm 10mm 8mm 10mm;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* MODAL WEB DE VISUALIZAÇÃO E CONFIGURAÇÃO */}
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
                Com Proposta e Tópicos ({theme.banca})
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070b14] flex justify-center">
            <div
              id="printable-exam-sheet"
              className="w-full max-w-[210mm] bg-white text-black p-6 sm:p-8 shadow-2xl rounded-sm border border-slate-300 font-serif leading-tight print:p-0 print:border-none print:shadow-none"
              style={{ minHeight: "297mm" }}
            >
              {/* ========================================================================= */}
              {/* CABEÇALHO OFICIAL DO CONCURSO COM CÓDIGO DE BARRAS */}
              {/* ========================================================================= */}
              <div className="border-2 border-black p-3 mb-3 relative">
                {/* Linha 1: Marcações Oficiais e Código de Barras */}
                <div className="flex items-center justify-between border-b border-black pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-black" />
                    <span className="text-[12px] font-mono font-bold tracking-widest uppercase">
                      FOLHA DE TEXTO DEFINITIVO
                    </span>
                    <span className="text-[10px] font-mono border border-black px-1 font-bold">
                      029
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider block font-sans">
                      BANCA {theme.banca || "CEBRASPE"} • PROVA DISCURSIVA
                    </span>
                  </div>

                  {/* Código de barras decorativo oficial */}
                  <div className="text-right">
                    <div className="text-[18px] font-mono font-bold tracking-tighter select-none leading-none">
                      ||| | | |||| || | ||||| | |||
                    </div>
                    <span className="text-[8px] font-mono text-zinc-600 tracking-widest block">
                      *SYNAPSE-AI-EXAM*
                    </span>
                  </div>
                </div>

                {/* Linha 2: Campos de Identificação do Candidato */}
                <div className="grid grid-cols-4 gap-2 text-[10px] font-sans">
                  <div className="col-span-2 border-b border-dotted border-zinc-400 pb-1">
                    <span className="font-bold">NOME:</span>{" "}
                    <span className="text-zinc-600">__________________________________________</span>
                  </div>
                  <div className="border-b border-dotted border-zinc-400 pb-1">
                    <span className="font-bold">INSCRIÇÃO:</span>{" "}
                    <span className="font-mono">________-___</span>
                  </div>
                  <div className="border-b border-dotted border-zinc-400 pb-1 text-right">
                    <span className="font-bold">DATA:</span>{" "}
                    <span>{examDate}</span>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* CAIXA DA PROPOSTA E TÓPICOS (SE SHEET MODE FOR WITH-THEME) */}
              {/* ========================================================================= */}
              {sheetMode === "with-theme" && (
                <div className="border border-black p-2.5 mb-3 bg-zinc-50/50 text-[11px] print:bg-transparent">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-zinc-800">
                      TEMA DA PROVA DISCURSIVA • ÁREA: {theme.subjectArea || "GERAL"}
                    </span>
                    <span className="font-sans text-[9px] font-bold">MÍN: 20 | MÁX: 30 LINHAS</span>
                  </div>

                  <div className="font-bold text-[12px] mb-1.5 leading-snug">
                    {theme.title}
                  </div>

                  {theme.expectedTopics && theme.expectedTopics.length > 0 && (
                    <div className="space-y-0.5 pt-1 border-t border-zinc-300 text-[10px] leading-snug">
                      <span className="font-bold block">Aspectos obrigatórios a abordar:</span>
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
              <div className="border-2 border-black relative">
                {/* Linha vertical de margem direita (limite oficial de translineação) */}
                <div
                  className="absolute top-0 bottom-0 right-[15mm] w-[0.5pt] border-r border-red-500/40 print:border-black/30 pointer-events-none"
                  title="Margem Direita Oficial"
                />

                {/* Renderização das 30 Linhas Pautadas Oficiais */}
                {Array.from({ length: 30 }).map((_, i) => {
                  const lineNum = i + 1;
                  return (
                    <div
                      key={lineNum}
                      className={`flex items-center h-[8.1mm] sm:h-[8.3mm] ${
                        lineNum < 30 ? "border-b border-zinc-400 print:border-zinc-400" : ""
                      }`}
                    >
                      {/* Caixa do número da linha na margem esquerda */}
                      <div className="w-[10mm] sm:w-[12mm] h-full flex items-center justify-center border-r border-black font-mono text-[11px] sm:text-[12px] font-bold select-none shrink-0 bg-zinc-100/50 print:bg-transparent">
                        {lineNum.toString().padStart(2, "0")}
                      </div>

                      {/* Espaço em branco pautado para escrita do candidato */}
                      <div className="flex-1 h-full relative" />
                    </div>
                  );
                })}
              </div>

              {/* ========================================================================= */}
              {/* RODAPÉ OFICIAL DA FOLHA COM ORIENTAÇÕES E QR CODE DE SINCRONIZAÇÃO */}
              {/* ========================================================================= */}
              <div className="mt-2.5 pt-2 border-t border-black flex items-center justify-between text-[9px] font-sans text-zinc-700">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="font-bold uppercase tracking-wider text-black">
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
                      className="w-12 h-12 border border-black p-0.5"
                    />
                    <span className="text-[7.5px] font-mono font-bold mt-0.5 text-black">
                      ESCANEAR NO APP
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
