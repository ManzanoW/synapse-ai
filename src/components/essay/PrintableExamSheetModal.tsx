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
  Loader2,
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
  const [examDate, setExamDate] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    setExamDate(new Date().toLocaleDateString("pt-BR"));
    if (typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/redacao`);
    }
  }, []);

  if (!isOpen) return null;

  // Altura calculada das 30 linhas para garantir encaixe estrito em 1 ÚNICA página A4 (297mm)
  // Mode with-theme: 7.0mm por linha (30 * 7.0mm = 210mm) + cabeçalho (15mm) + proposta (24mm) + rodapé (12mm) = ~263mm (cabe perfeitamente nos 283mm úteis da folha)
  // Mode blank: 7.8mm por linha (30 * 7.8mm = 234mm) + cabeçalho (15mm) + rodapé (12mm) = ~263mm
  const rowHeight = sheetMode === "with-theme" ? "7.0mm" : "7.8mm";

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      const sheetElement = document.getElementById("printable-exam-sheet");
      if (!sheetElement) {
        window.print();
        setIsPrinting(false);
        return;
      }

      // Utiliza um iframe isolado para impressão limpa e à prova de interferências do DOM pai
      let iframe = document.getElementById("exam-sheet-print-iframe") as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "exam-sheet-print-iframe";
        iframe.style.position = "fixed";
        iframe.style.top = "-9999px";
        iframe.style.left = "-9999px";
        iframe.style.width = "210mm";
        iframe.style.height = "297mm";
        iframe.style.border = "none";
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        setIsPrinting(false);
        return;
      }

      // Captura estilos existentes da página para manter fontes e Tailwind
      const headStyles = Array.from(
        document.querySelectorAll("style, link[rel='stylesheet']")
      )
        .map((el) => el.outerHTML)
        .join("\n");

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Folha de Redação Oficial - ${theme.banca || "CEBRASPE"}</title>
            ${headStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 6mm 10mm 6mm 10mm;
              }
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: "Times New Roman", Times, Georgia, serif !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 190mm !important;
                margin: 0 auto !important;
                background: #ffffff !important;
                color: #000000 !important;
                padding: 0 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${sheetElement.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        setIsPrinting(false);
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 300);
    } catch (err) {
      console.error("Erro ao imprimir via iframe:", err);
      setIsPrinting(false);
      window.print();
    }
  };

  const qrImageUrl = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=0&data=${encodeURIComponent(qrUrl)}`
    : "";

  return (
    <>
      {/* ========================================================================= */}
      {/* REGRAS CSS GLOBAIS DE IMPRESSÃO A4 (FOLHA DE REDAÇÃO OFICIAL DE CONCURSO) */}
      {/* ========================================================================= */}
      <style jsx global>{`
        @media print {
          /* Oculta tudo na tela do sistema web exceto o documento de impressão */
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
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
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
              disabled={isPrinting}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold px-5 py-2 rounded-xl shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              {isPrinting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              <span>{isPrinting ? "Preparando..." : "Imprimir Folha A4"}</span>
            </button>
          </div>

          {/* PRÉVIA VISUAL DA FOLHA DE REDAÇÃO A4 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
            <div
              id="printable-exam-sheet"
              className="w-full max-w-[210mm] bg-white text-black p-5 sm:p-7 shadow-2xl rounded-xs border border-slate-300 font-serif leading-tight print:p-0 print:border-none print:shadow-none print:max-w-none shrink-0 flex flex-col justify-between"
              style={{
                boxSizing: "border-box",
                minHeight: "297mm",
              }}
            >
              {/* ÁREA SUPERIOR: CABEÇALHO + TEMA + GRADE DE LINHAS */}
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
                  <div className="border border-black p-2 mb-2 bg-zinc-50/50 text-[10.5px] print:bg-transparent">
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
                  {/* Renderização das 30 Linhas Pautadas Oficiais */}
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
                          className="flex items-center justify-center border-r border-black font-mono text-[11px] sm:text-[12px] font-bold select-none shrink-0 bg-zinc-100/70 print:bg-transparent"
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
          </div>
        </div>
      </div>
    </>
  );
}
