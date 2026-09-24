"use client";

import React, { useState, useTransition } from "react";
import {
  Scale,
  Search,
  Sparkles,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  BookmarkCheck,
  HelpCircle,
  Loader2,
  ExternalLink,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  JurisprudenceItem,
  CURATED_JURISPRUDENCE,
  searchJurisprudenceAction,
  createJurisprudenceFlashcardAction,
} from "@/actions/jurisprudence-actions";

interface JurisprudenciaClientProps {
  initialItems: JurisprudenceItem[];
}

export default function JurisprudenciaClient({
  initialItems,
}: JurisprudenciaClientProps) {
  const [items, setItems] = useState<JurisprudenceItem[]>(initialItems || CURATED_JURISPRUDENCE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTribunal, setSelectedTribunal] = useState<string>("TODOS");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("TODAS");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(items[0]?.id || null);
  const [isSearching, startSearchTransition] = useTransition();

  // Estados de feedback por card
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Record<string, boolean>>({});
  const [savingFlashcardId, setSavingFlashcardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  const tribunais = ["TODOS", "STF", "STJ", "TST"];
  const disciplinas = [
    "TODAS",
    "Direito Constitucional",
    "Direito Administrativo",
    "Direito Penal",
    "Direito Processual Penal",
    "Direito Tributário",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startSearchTransition(async () => {
      const res = await searchJurisprudenceAction({
        query: searchQuery,
        tribunal: selectedTribunal,
        disciplina: selectedDisciplina,
      });

      if (res.success && res.data) {
        setItems(res.data);
        if (res.data.length > 0) {
          setExpandedCardId(res.data[0].id);
        }
      }
    });
  };

  const handleFilterChange = (tribunal: string, disciplina: string) => {
    setSelectedTribunal(tribunal);
    setSelectedDisciplina(disciplina);

    startSearchTransition(async () => {
      const res = await searchJurisprudenceAction({
        query: searchQuery,
        tribunal,
        disciplina,
      });

      if (res.success && res.data) {
        setItems(res.data);
      }
    });
  };

  const handleCreateFlashcard = async (item: JurisprudenceItem) => {
    if (savingFlashcardId || savedFlashcardIds[item.id]) return;

    setSavingFlashcardId(item.id);
    try {
      const res = await createJurisprudenceFlashcardAction({
        front: item.flashcardFrente,
        back: item.flashcardVerso,
        details: `${item.numero} (${item.tribunal})\n\n${item.teseResumida}\n\n🚨 Pegadinha da Banca: ${item.pegadinhaBanca}`,
        disciplina: item.disciplina,
      });

      if (res.success) {
        setSavedFlashcardIds((prev) => ({ ...prev, [item.id]: true }));
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      } else {
        alert(res.error || "Erro ao salvar flashcard.");
      }
    } catch {
      alert("Erro ao salvar flashcard.");
    } finally {
      setSavingFlashcardId(null);
    }
  };

  const handleCopyText = (item: JurisprudenceItem) => {
    const text = `${item.numero} (${item.tribunal}) - ${item.titulo}\nDISCIPLINA: ${item.disciplina} | ASSUNTO: ${item.assunto}\n\nTESE:\n${item.teseResumida}\n\nPEGADINHA DA BANCA:\n${item.pegadinhaBanca}\n\nCASO PRÁTICO:\n${item.casoPratico}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 p-3 sm:p-8 font-sans antialiased relative selection:bg-indigo-500/30">
      {/* Glow de ambientação */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative">
        {/* ================= HERO HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-linear-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Raio-X de Jurisprudência & Súmulas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                  Vade Mecum IA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Teses do STF e STJ traduzidas para concurseiros, com divergências e alertas de pegadinhas das bancas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/questions"
              className="px-3.5 py-2 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800/60 text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <HelpCircle size={15} className="text-amber-400" />
              <span>Resolver Questões</span>
            </Link>
          </div>
        </div>

        {/* ================= BARRA DE PESQUISA & FILTROS ================= */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por tema, número da súmula (ex: SV 13, Súmula 599) ou assunto..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 focus:border-indigo-500/60 focus:bg-white/[0.07] text-white text-xs sm:text-sm outline-none transition-all placeholder:text-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 rounded-2xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} className="text-amber-300" />
              )}
              <span className="hidden sm:inline">Pesquisar com IA</span>
            </button>
          </form>

          {/* Filtros em Pílulas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
            {/* Tribunais */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
                <Gavel size={12} /> Tribunal:
              </span>
              {tribunais.map((trib) => (
                <button
                  key={trib}
                  type="button"
                  onClick={() => handleFilterChange(trib, selectedDisciplina)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTribunal === trib
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {trib}
                </button>
              ))}
            </div>

            {/* Disciplinas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-semibold text-zinc-400 mr-1 flex items-center gap-1">
                <Filter size={12} /> Matéria:
              </span>
              {disciplinas.map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => handleFilterChange(selectedTribunal, disc)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedDisciplina === disc
                      ? "bg-blue-600/30 border border-blue-500/50 text-blue-200"
                      : "bg-white/[0.03] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  {disc === "TODAS" ? "Todas" : disc.replace("Direito ", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= LISTA DE SÚMULAS & PRECEDENTES ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {items.length} {items.length === 1 ? "Precedente Encontrado" : "Precedentes Catalogados"}
            </span>
          </div>

          {items.length === 0 && !isSearching && (
            <div className="p-8 rounded-3xl border border-white/10 bg-slate-950/40 text-center space-y-3">
              <Scale size={32} className="mx-auto text-zinc-500" />
              <h3 className="text-sm font-bold text-zinc-300">
                Nenhum precedente localizado com esses filtros.
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Digite um tema no campo de busca acima e clique em &quot;Pesquisar com IA&quot; para que o motor jurídico sintetize o entendimento das Cortes Superiores.
              </p>
            </div>
          )}

          {items.map((item) => {
            const isExpanded = expandedCardId === item.id;
            const isSavedCard = Boolean(savedFlashcardIds[item.id]);
            const isSavingCard = savingFlashcardId === item.id;
            const isOriginalShown = Boolean(showOriginalMap[item.id]);

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "border-indigo-500/40 bg-slate-950/80 shadow-2xl backdrop-blur-2xl ring-1 ring-indigo-500/20"
                    : "border-white/[0.08] bg-slate-950/50 hover:border-white/20 hover:bg-slate-900/40"
                }`}
              >
                {/* CABEÇALHO DO CARD */}
                <div
                  onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                  className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Tribunal Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          item.tribunal === "STF"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : item.tribunal === "STJ"
                            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {item.tribunal}
                      </span>

                      {/* Número do Precedente */}
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {item.numero}
                      </span>

                      {/* Disciplina */}
                      <span className="text-[11px] font-medium text-zinc-400">
                        {item.disciplina} • {item.assunto}
                      </span>

                      {item.isCustomGenerated && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Sintetizado por IA
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                      {item.titulo}
                    </h3>

                    {/* Resumo quando recolhido */}
                    {!isExpanded && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.teseResumida}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* CORPO EXPANDIDO (RAIO-X DETALHADO) */}
                {isExpanded && (
                  <div className="px-5 pb-6 sm:px-6 space-y-4 pt-1 border-t border-white/[0.06] animate-fade-in">
                    {/* 1. Tese Traduzida */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                        <BookOpen size={14} />
                        <span>Tese Fixada (Linguagem Direta)</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs sm:text-[13px] text-zinc-200 leading-relaxed font-serif">
                        {item.teseResumida}
                      </div>
                    </div>

                    {/* Botão Ver Texto Oficial da Ementa */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setShowOriginalMap((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                      >
                        <FileText size={12} />
                        <span>{isOriginalShown ? "Ocultar redação oficial" : "Ver redação oficial / ementa literal"}</span>
                      </button>

                      {isOriginalShown && (
                        <div className="mt-2 p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 text-xs text-zinc-400 font-mono leading-relaxed">
                          {item.teseOriginal}
                        </div>
                      )}
                    </div>

                    {/* 2. Divergência ou Evolução Jurisprudencial */}
                    {item.divergenciaOuEvolucao && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wide">
                          <Scale size={14} />
                          <span>Divergência das Cortes & Evolução</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-zinc-300 leading-relaxed">
                          {item.divergenciaOuEvolucao}
                        </div>
                      </div>
                    )}

                    {/* 3. 🚨 Alerta de Pegadinha da Banca */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide">
                        <AlertTriangle size={14} />
                        <span>Como as Bancas Examinadoras Cobram (Alerta de Pegadinha)</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-[13px] text-amber-200/90 leading-relaxed">
                        {item.pegadinhaBanca}
                      </div>
                    </div>

                    {/* 4. Caso Prático Contextualizado */}
                    {item.casoPratico && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                          <FileText size={14} />
                          <span>Exemplo Prático (Situação Hipotética de Prova)</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-white/[0.08] text-xs text-zinc-300 leading-relaxed italic">
                          &quot;{item.casoPratico}&quot;
                        </div>
                      </div>
                    )}

                    {/* BARRA DE AÇÕES INFERIORES */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.06] flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyText(item)}
                        className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        {copiedId === item.id ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedId === item.id ? "Tese Copiada!" : "Copiar Tese"}</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Botão Criar Flashcard FSRS */}
                        <button
                          type="button"
                          onClick={() => handleCreateFlashcard(item)}
                          disabled={isSavedCard || isSavingCard}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSavedCard
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                              : "border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 cursor-pointer active:scale-95"
                          }`}
                        >
                          {isSavingCard ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isSavedCard ? (
                            <BookmarkCheck size={13} className="text-emerald-400" />
                          ) : (
                            <Layers size={13} />
                          )}
                          <span>
                            {isSavedCard ? "Flashcard Salvo" : "Criar Flashcard desta Tese"}
                          </span>
                        </button>

                        {/* Botão Treinar Questões da Disciplina */}
                        <Link
                          href={`/questions?materia=${encodeURIComponent(item.disciplina)}`}
                          className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95"
                        >
                          <HelpCircle size={13} />
                          <span>Praticar Questões</span>
                          <ExternalLink size={11} className="opacity-70" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
