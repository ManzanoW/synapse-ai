"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Sparkles,
  Bookmark,
  Check,
  Copy,
  Clock,
  Zap,
  ShieldAlert,
  BookOpen,
  FileText,
  Filter,
  PenSquare,
} from "lucide-react";
import { POCKET_SUMMARY_DATA, PocketItem } from "@/lib/pocket-summary-data";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface PocketSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: string;
}

export function PocketSummaryModal({
  isOpen,
  onClose,
  targetRole = "Concursos Públicos",
}: PocketSummaryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedSubject, setSelectedSubject] = useState<string>("todos");
  const [customNote, setCustomNote] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = POCKET_SUMMARY_DATA.filter((item) => {
    const matchCategory =
      selectedCategory === "todos" || item.category === selectedCategory;
    const matchSubject =
      selectedSubject === "todos" || item.subject === selectedSubject;
    return matchCategory && matchSubject;
  });

  const handlePrint = () => {
    triggerHaptic("medium");
    window.print();
  };

  const handleCopyAll = () => {
    triggerHaptic("light");
    const header = `FOLHA DE VÉSPERA - RESUMO DE BOLSO SYNAPSE AI\nFoco: ${targetRole} | Data: ${new Date().toLocaleDateString("pt-BR")}\n\n`;
    const notesText = customNote.trim()
      ? `=== MINHAS ANOTAÇÕES PESSOAIS ===\n${customNote}\n\n`
      : "";
    const body = filteredItems
      .map(
        (it) =>
          `[${it.category.toUpperCase()}] ${it.title} (${it.subject})\n` +
          `• DESTAQUE: ${it.highlight}\n` +
          `• REGRA: ${it.description}\n` +
          (it.trick ? `• PEGADINHA: ${it.trick}\n` : "") +
          `-------------------------------------------`
      )
      .join("\n\n");

    navigator.clipboard.writeText(header + notesText + body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Folha de Véspera em PDF de Bolso"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-slate-900 border border-white/10 text-slate-100 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none print:m-0 print:p-0 print:border-none print:bg-white print:text-black">
        {/* ================= BARRA SUPERIOR (OCULTA NO PRINT) ================= */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-900/90 border-b border-white/10 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Folha de Véspera em PDF de Bolso
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Micro-A4 Ultra-Denso
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prazos fatais, mnemônicos e pegadinhas diagramados para dobrar e revisar antes de entrar na sala de prova.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "Copiado!" : "Copiar"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================= CONTROLES E FILTROS (OCULTOS NO PRINT) ================= */}
        <div className="p-4 bg-slate-950/40 border-b border-white/5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "todos", label: "Todos os Itens", icon: BookOpen },
              { id: "prazos", label: "Prazos Fatais", icon: Clock },
              { id: "mnemonicos", label: "Mnemônicos", icon: Zap },
              { id: "sumulas", label: "Súmulas Vinculantes", icon: Sparkles },
              { id: "pegadinhas", label: "Pegadinhas", icon: ShieldAlert },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Matéria */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Matéria:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-800 border border-white/10 text-white text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="todos">Todas as Matérias</option>
              <option value="Constitucional">Constitucional</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Penal & Processo">Penal & Processo Penal</option>
              <option value="Tributário">Tributário</option>
            </select>
          </div>
        </div>

        {/* ================= ÁREA DE CONTEÚDO E PREVIEW IMPRESSÃO ================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 print:p-4 print:space-y-3 print:overflow-visible">
          {/* Cabeçalho da Folha de Véspera (Estilo Caderno de Prova / Exclusivo para Print e Visualização) */}
          <div className="border border-white/10 print:border-black/30 rounded-2xl p-4 bg-slate-900/50 print:bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 print:bg-black/10 print:text-black">
                  SYNAPSE AI • ULTRA-CONDENSADO
                </span>
                <span className="text-[10px] text-slate-400 print:text-gray-600 font-mono">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-white print:text-black mt-1">
                Folha de Véspera: Pontos Críticos & Pegadinhas
              </h1>
              <p className="text-xs text-slate-300 print:text-gray-700 font-medium">
                Alvo: {targetRole} • Prazos decadenciais/prescricionais, mnemônicos e jurisprudência sumulada.
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400 print:text-gray-600 shrink-0">
              <div>Total de Tópicos: {filteredItems.length}</div>
              <div className="text-indigo-400 print:text-black font-bold">Dica: Dobre em 4 partes no bolso</div>
            </div>
          </div>

          {/* Campo editável de Anotações Pessoais do Aluno (Imprime junto se preenchido!) */}
          <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3.5 print:border-black/40 print:bg-gray-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-300 print:text-black flex items-center gap-1.5">
                <PenSquare size={13} />
                <span>Minhas Anotações & Macetes Pessoais de Última Hora:</span>
              </span>
              <span className="text-[10px] text-slate-400 print:text-gray-600">
                (opcional — digitado aqui será impresso na folha)
              </span>
            </div>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Não esquecer de levar caneta transparente preta. Lembrar: Art. 14 da 14.133 veda participação de autor do anteprojeto..."
              rows={2}
              className="w-full bg-slate-900/80 print:bg-white text-slate-200 print:text-black border border-white/10 print:border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:border-amber-400/50 resize-y"
            />
          </div>

          {/* GRID DE CARDS DENSA A4 (2 COLUNAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 print:grid-cols-2 print:gap-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 print:bg-white border border-white/10 print:border-black/25 flex flex-col justify-between break-inside-avoid shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/5 print:bg-black/5 text-slate-300 print:text-black border border-white/5 print:border-black/10">
                      {item.subject}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-semibold text-indigo-400 print:text-black">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white print:text-black leading-snug">
                    {item.title}
                  </h3>

                  {/* Destaque / Fórmula / Prazo */}
                  <div className="my-2 p-2 rounded-xl bg-indigo-500/10 print:bg-gray-100 border border-indigo-500/20 print:border-black/20 text-indigo-300 print:text-black font-mono font-bold text-xs">
                    ⚡ {item.highlight}
                  </div>

                  {/* Regra / Descrição */}
                  <p className="text-xs text-slate-300 print:text-black leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Pegadinha / Alerta de Banca */}
                {item.trick && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 print:border-black/15 text-[11px] text-amber-300/90 print:text-gray-900 flex items-start gap-1.5 leading-tight">
                    <span className="font-bold text-amber-400 print:text-black shrink-0">⚠️ Pegadinha:</span>
                    <span>{item.trick}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhum item encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
