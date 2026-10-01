"use client";

import React from "react";
import { X, Printer, Scale, AlertTriangle, BookOpen, Sparkles } from "lucide-react";
import { JurisprudenceItem } from "@/lib/jurisprudence-data";

interface PrintableJurisprudenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: JurisprudenceItem[];
  title?: string;
  tribunal?: string;
  disciplina?: string;
  dateStr?: string;
}

export function PrintableJurisprudenceModal({
  isOpen,
  onClose,
  items,
  title = "Caderno de Jurisprudência & Súmulas dos Tribunais Superiores",
  tribunal = "TODOS",
  disciplina = "TODAS",
  dateStr = new Date().toLocaleDateString("pt-BR"),
}: PrintableJurisprudenceModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none print:m-0 print:p-0">
        {/* BARRA SUPERIOR (OCULTA NA IMPRESSÃO) */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <Scale size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Caderno de Véspera de Jurisprudência (PDF)
              </h2>
              <p className="text-[11px] text-slate-400">
                Compilado de teses, pegadinhas de bancas e casos práticos para revisão de alta retenção
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer"
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

        {/* CONTEÚDO IMPRESSO (A4 LIMPO) */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white">
          {/* CABEÇALHO FORMAL */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black tracking-widest text-indigo-700 uppercase">
                  SYNAPSE AI • REVISÃO DE JURISPRUDÊNCIA E PRECEDENTES
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Tribunal: <strong>{tribunal}</strong> • Disciplina: <strong>{disciplina}</strong> • Emitido em: <strong>{dateStr}</strong>
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="inline-block p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Total de Julgados
                </span>
                <span className="text-xl font-black text-indigo-700 block font-mono">
                  {items.length}
                </span>
                <span className="text-[10px] text-slate-600">precedentes salvos</span>
              </div>
            </div>
          </div>

          {/* LISTA DE JULGADOS FORMATADOS */}
          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum julgado selecionado para emissão deste caderno.
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 break-inside-avoid"
                >
                  {/* Cabeçalho do Julgado */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                        {item.tribunal}
                      </span>
                      <span className="font-bold text-slate-900">{item.numero}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-indigo-800 font-semibold">{item.disciplina}</span>
                      <span className="text-slate-400">({item.assunto})</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                  </div>

                  {/* Título do Precedente */}
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {item.titulo}
                  </h3>

                  {/* Tese Resumida Fixada pela Corte */}
                  <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/70 text-xs text-slate-900 space-y-1">
                    <span className="font-bold text-[10px] text-indigo-900 uppercase block tracking-wider">
                      Tese Fixada pela Corte Superior:
                    </span>
                    <p className="leading-relaxed font-serif italic text-slate-800">
                      &ldquo;{item.teseResumida}&rdquo;
                    </p>
                  </div>

                  {/* Alerta de Pegadinha da Banca */}
                  {item.pegadinhaBanca && (
                    <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/80 text-xs text-slate-900 space-y-1">
                      <span className="font-bold text-[10px] text-amber-900 uppercase flex items-center gap-1 tracking-wider">
                        <AlertTriangle size={12} className="text-amber-700" /> Como as Bancas Cobram / Casca de Banana:
                      </span>
                      <p className="leading-relaxed text-slate-800 font-sans">
                        {item.pegadinhaBanca}
                      </p>
                    </div>
                  )}

                  {/* Exemplo / Caso Prático */}
                  {item.casoPratico && (
                    <div className="text-xs text-slate-700 leading-relaxed pt-1">
                      <strong className="text-slate-900 font-semibold">Caso Concreto de Prova: </strong>
                      {item.casoPratico}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RODAPÉ INSTITUCIONAL */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500">
            Synapse AI Precedents Engine • Revisão Otimizada com Repetição Espaçada e IA
          </div>
        </div>
      </div>
    </div>
  );
}
