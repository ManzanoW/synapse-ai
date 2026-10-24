"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  BookOpen,
  X,
  FileText,
  Grid,
  Check,
  Eye,
  EyeOff,
  Scissors,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard, Deck } from "@/types";

interface PrintableDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: Deck;
  flashcards: Flashcard[];
}

export function PrintableDeckModal({
  isOpen,
  onClose,
  deck,
  flashcards,
}: PrintableDeckModalProps) {
  const [mounted, setMounted] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"cards" | "table" | "pocket">("cards");
  const [showAnswers, setShowAnswers] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const getCardFront = (card: Flashcard): string => {
    const raw = card as unknown as Record<string, unknown>;
    return typeof raw.front === "string" ? raw.front : card.question || "";
  };

  const getCardBack = (card: Flashcard): string => {
    const raw = card as unknown as Record<string, unknown>;
    return typeof raw.back === "string" ? raw.back : card.answer || "";
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop (oculto na impressão) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md print:hidden"
        />

        {/* Estilos específicos para impressão */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-deck-area, #printable-deck-area * {
                visibility: visible !important;
              }
              #printable-deck-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
              }
              .print-break-inside-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .pocket-sheet {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                page-break-after: always !important;
                break-after: page !important;
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                grid-template-rows: repeat(4, 1fr) !important;
                gap: 2mm !important;
                min-height: 265mm !important;
                max-height: 280mm !important;
                padding: 3mm !important;
                box-sizing: border-box !important;
              }
              .pocket-cell {
                border: 1.5px dashed #4b5563 !important;
                padding: 2.5mm !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                font-size: 8pt !important;
                line-height: 1.25 !important;
                border-radius: 4px !important;
              }
            }
          `
        }} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col print:border-none print:shadow-none print:bg-white print:max-h-none print:h-auto"
        >
          {/* Header do Modal (oculto na impressão) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Printer size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Imprimir Fichas & Exportar PDF
                  <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {flashcards.length} cards
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure a formatação para impressão em folha A4 ou fichário.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Barra de Controles e Opções (oculto na impressão) */}
          <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Layout:</span>
              <div className="flex rounded-xl bg-slate-800/80 p-0.5 border border-slate-700/60">
                <button
                  onClick={() => setLayoutMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    layoutMode === "cards"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Grid size={13} />
                  Fichas Recortáveis
                </button>
                <button
                  onClick={() => setLayoutMode("pocket")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    layoutMode === "pocket"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BookOpen size={13} />
                  Bolso A4 (8 em 1)
                </button>
                <button
                  onClick={() => setLayoutMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    layoutMode === "table"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText size={13} />
                  Tabela Resumo
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium select-none">
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  {showAnswers ? <Eye size={13} className="text-indigo-400" /> : <EyeOff size={13} className="text-slate-500" />}
                  Incluir Respostas
                </span>
              </label>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>

          {/* Área Imprimível (Preview na tela e Conteúdo no Print) */}
          <div
            id="printable-deck-area"
            className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-900/60 print:bg-white print:p-0 print:overflow-visible text-slate-200 print:text-black"
          >
            {/* Cabeçalho do Documento */}
            <div className="border-b-2 border-slate-700/60 print:border-black pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400 print:text-indigo-900">
                    Synapse AI • Memorização Ativa
                  </span>
                  {deck.subject?.name && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 print:bg-gray-100 text-slate-300 print:text-gray-800 border border-slate-700 print:border-gray-300">
                      {deck.subject.name}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white print:text-black mt-1">
                  {deck.title}
                </h1>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-400 print:text-gray-500">
                <p>Total de Cartões: <strong className="text-white print:text-black">{flashcards.length}</strong></p>
                <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
              </div>
            </div>

            {/* Visualização 1: Fichas Recortáveis */}
            {layoutMode === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
                {flashcards.map((card, idx) => {
                  const front = getCardFront(card);
                  const back = getCardBack(card);

                  return (
                    <div
                      key={card.id || idx}
                      className="print-break-inside-avoid border-2 border-dashed border-slate-700/80 print:border-gray-400 rounded-2xl p-4 bg-slate-950/40 print:bg-white flex flex-col justify-between min-h-[160px] relative transition-all"
                    >
                      {/* Indicador de recorte */}
                      <div className="absolute top-2 right-2 text-[10px] text-slate-500 print:text-gray-400 font-mono flex items-center gap-1">
                        <Scissors size={10} className="print:text-gray-500" />
                        #{idx + 1}
                      </div>

                      {/* Frente do Card */}
                      <div className="space-y-1.5 pr-8">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 print:text-indigo-800 bg-indigo-500/10 print:bg-indigo-50 px-2 py-0.5 rounded">
                          Frente (Pergunta)
                        </span>
                        <p className="text-sm font-semibold text-white print:text-black whitespace-pre-wrap leading-relaxed">
                          {front}
                        </p>
                      </div>

                      {/* Linha Divisória de Dobra */}
                      <div className="my-3 border-t border-dashed border-slate-800 print:border-gray-300 relative flex items-center justify-center">
                        <span className="bg-slate-900 print:bg-white px-2 text-[9px] text-slate-500 print:text-gray-400 uppercase tracking-widest font-mono">
                          Dobre aqui ✂
                        </span>
                      </div>

                      {/* Verso do Card */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 print:text-emerald-800 bg-emerald-500/10 print:bg-emerald-50 px-2 py-0.5 rounded">
                          Verso (Resposta)
                        </span>
                        {showAnswers ? (
                          <p className="text-xs text-slate-300 print:text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {back}
                          </p>
                        ) : (
                          <div className="h-12 border border-dashed border-slate-800 print:border-gray-300 rounded-lg p-2 text-[10px] text-slate-600 print:text-gray-400 italic">
                            Espaço para resposta manual...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Visualização 2: Tabela Resumo */}
            {layoutMode === "table" && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 print:bg-gray-100 text-slate-300 print:text-black border-b border-slate-800 print:border-gray-300">
                      <th className="py-2.5 px-3 w-12 font-bold text-center">#</th>
                      <th className="py-2.5 px-4 font-bold w-1/2">Frente (Conceito / Pergunta)</th>
                      <th className="py-2.5 px-4 font-bold w-1/2">Verso (Resposta / Fundamento)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                    {flashcards.map((card, idx) => {
                      const front = getCardFront(card);
                      const back = getCardBack(card);

                      return (
                        <tr
                          key={card.id || idx}
                          className="print-break-inside-avoid hover:bg-slate-800/30 print:hover:bg-transparent"
                        >
                          <td className="py-3 px-3 text-center font-mono text-slate-400 print:text-gray-600 align-top">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-white print:text-black align-top whitespace-pre-wrap leading-relaxed">
                            {front}
                          </td>
                          <td className="py-3 px-4 text-slate-300 print:text-gray-800 align-top whitespace-pre-wrap leading-relaxed">
                            {showAnswers ? back : (
                              <span className="text-slate-600 print:text-gray-400 italic text-[11px]">
                                ________________________________________
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Visualização 3: Minilivro de Bolso Dobrável A4 (8 cards por folha) */}
            {layoutMode === "pocket" && (
              <div className="space-y-8">
                {/* Banner explicativo na tela */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-violet-950/80 border border-indigo-500/30 text-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Formato Dobrável de Bolso (Pocket Book A4)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-mono">
                          8 cards por folha
                        </span>
                      </p>
                      <p className="text-[11px] text-indigo-300/90 mt-0.5">
                        Imprima em folha A4 e dobre nas linhas tracejadas para transformar 8 cartões em um livreto portátil para revisar antes da prova.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Folhas de 8 cartões */}
                {Array.from({ length: Math.ceil(flashcards.length / 8) }).map((_, sheetIdx) => {
                  const sheetCards = flashcards.slice(sheetIdx * 8, (sheetIdx + 1) * 8);

                  return (
                    <div
                      key={`pocket-sheet-${sheetIdx}`}
                      className="pocket-sheet grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-white text-slate-900 rounded-2xl border-2 border-slate-300 print:border-none print:p-0 print:m-0 print:gap-2 print:shadow-none"
                    >
                      {sheetCards.map((card, cardIdx) => {
                        const globalIdx = sheetIdx * 8 + cardIdx;
                        const front = getCardFront(card);
                        const back = getCardBack(card);

                        return (
                          <div
                            key={card.id || globalIdx}
                            className="pocket-cell border-2 border-dashed border-slate-400 p-3 rounded-xl flex flex-col justify-between bg-slate-50/60 print:bg-white text-xs min-h-[140px] print:min-h-0 print:border-gray-500"
                          >
                            <div>
                              <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-1 mb-1.5 text-[9px] text-slate-500 font-mono">
                                <span className="font-bold text-indigo-700 uppercase">
                                  #{globalIdx + 1} • {deck.title}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Scissors size={9} /> Dobra
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 text-[11px] leading-snug">
                                {front}
                              </p>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-dashed border-slate-300">
                              <span className="text-[8px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 block w-fit mb-1">
                                Resposta
                              </span>
                              <p className="text-[10px] text-slate-700 leading-tight">
                                {showAnswers ? back : "_____________________"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé da Folha */}
            <div className="pt-4 border-t border-slate-800 print:border-gray-300 flex items-center justify-between text-[11px] text-slate-500 print:text-gray-500">
              <span>Synapse AI • Fichas de Memorização para Concursos</span>
              <span>Página gerada em {new Date().toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
