"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  BookOpen,
  Layers,
  Search,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Settings,
  Loader2,
  Zap,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { Deck } from "@/types";
import CreateDeckModal from "@/components/decks/CreateDeckModal";

function getSubjectTheme(color?: string | null, name?: string) {
  const normalized = (name || "").toLowerCase();

  if (
    color === "emerald" ||
    normalized.includes("segurança") ||
    normalized.includes("sec") ||
    normalized.includes("info")
  ) {
    return {
      badge: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
      icon: "from-emerald-500/25 via-slate-900 to-teal-500/10 border-emerald-500/40 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-slate-950",
      hoverBorder: "hover:border-emerald-500/60 hover:shadow-emerald-500/15",
      accentText: "text-emerald-400",
      btn: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25 font-black",
      glowDot: "bg-emerald-400",
    };
  }

  if (
    color === "amber" ||
    normalized.includes("javascript") ||
    normalized.includes("js") ||
    normalized.includes("web")
  ) {
    return {
      badge: "bg-amber-500/20 border-amber-500/40 text-amber-300",
      icon: "from-amber-500/25 via-slate-900 to-orange-500/10 border-amber-500/40 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950",
      hoverBorder: "hover:border-amber-500/60 hover:shadow-amber-500/15",
      accentText: "text-amber-400",
      btn: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25 font-black",
      glowDot: "bg-amber-400",
    };
  }

  if (
    color === "violet" ||
    normalized.includes("arquitetura") ||
    normalized.includes("software") ||
    normalized.includes("dev")
  ) {
    return {
      badge: "bg-violet-500/20 border-violet-500/40 text-violet-300",
      icon: "from-violet-500/25 via-slate-900 to-purple-500/10 border-violet-500/40 text-violet-300 group-hover:bg-violet-600 group-hover:text-white",
      hoverBorder: "hover:border-violet-500/60 hover:shadow-violet-500/15",
      accentText: "text-violet-400",
      btn: "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/25 font-bold",
      glowDot: "bg-violet-400",
    };
  }

  return {
    badge: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
    icon: "from-indigo-500/25 via-slate-900 to-cyan-500/10 border-indigo-500/40 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white",
    hoverBorder: "hover:border-indigo-500/60 hover:shadow-indigo-500/15",
    accentText: "text-indigo-400",
    btn: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 font-bold",
    glowDot: "bg-indigo-400",
  };
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDecksData = async () => {
    try {
      const res = await fetch("/api/decks", { cache: "no-store" });
      const json = await res.json();

      if (Array.isArray(json)) return json;
      if (Array.isArray(json.data)) return json.data;
      if (Array.isArray(json.decks)) return json.decks;
      if (Array.isArray(json.result)) return json.result;

      return [];
    } catch (err) {
      console.error("Erro ao buscar /api/decks:", err);
      return [];
    }
  };

  const handleDeckCreated = async () => {
    const data = await fetchDecksData();
    setDecks(data);
  };

  const handleDeleteDeck = async (deckId: string, deckTitle: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o baralho "${deckTitle}"? Todos os flashcards dele serão apagados.`,
      )
    ) {
      return;
    }

    setDeletingId(deckId);
    try {
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir o baralho.");
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (error) {
      console.error("Erro ao excluir baralho:", error);
      alert("Não foi possível excluir o baralho. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitialDecks() {
      const data = await fetchDecksData();
      if (isMounted) {
        setDecks(data);
        setLoading(false);
      }
    }
    loadInitialDecks();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const query = searchQuery.toLowerCase();
    return decks.filter(
      (deck) =>
        deck.title?.toLowerCase().includes(query) ||
        deck.subject?.name?.toLowerCase().includes(query),
    );
  }, [decks, searchQuery]);

  const totalCardsCount = useMemo(() => {
    return decks.reduce((acc, deck) => {
      const count = deck._count?.flashcards ?? deck.flashcards?.length ?? 0;
      return acc + count;
    }, 0);
  }, [decks]);

  return (
    <div className="relative min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto text-slate-100 space-y-6 sm:space-y-8 animate-fade-in font-sans pb-16">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors mb-1.5 group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span>Voltar para Central</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            Meus Baralhos
            <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full">
              {decks.length} {decks.length === 1 ? "coleção" : "coleções"}
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Gerencie seus conjuntos de estudos e acompanhe suas métricas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-5 py-3 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/30 cursor-pointer w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Novo Baralho</span>
        </button>
      </div>

      {/* RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="p-4 sm:p-5 bg-slate-900/80 border border-indigo-500/30 rounded-2xl backdrop-blur-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Total de Baralhos
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {decks.length}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900/80 border border-violet-500/30 rounded-2xl backdrop-blur-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Cards Cadastrados
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {totalCardsCount}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900/80 border border-emerald-500/30 rounded-2xl backdrop-blur-2xl flex items-center gap-3.5 shadow-xl">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Algoritmo SM-2
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              Sincronizado
            </span>
          </div>
        </div>
      </div>

      {/* FILTRO E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 border border-slate-700/60 rounded-2xl backdrop-blur-2xl">
        <div className="relative w-full sm:w-96">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome do baralho ou matéria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

        <div className="text-[11px] text-slate-400 font-medium self-end sm:self-center pr-2">
          Exibindo{" "}
          <strong className="text-indigo-400 font-bold">
            {filteredDecks.length}
          </strong>{" "}
          de {decks.length} baralhos
        </div>
      </div>

      {/* GRID DE CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-800 rounded-md w-1/2" />
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <Layers size={36} className="mx-auto text-slate-600" />
          <h3 className="text-slate-300 font-bold text-sm">
            Nenhum baralho encontrado
          </h3>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus size={15} /> Criar Primeiro Baralho
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDecks.map((deck) => {
            const cardCount =
              deck._count?.flashcards ?? deck.flashcards?.length ?? 0;
            const isDeletingThis = deletingId === deck.id;
            const subjectName = deck.subject?.name || "Geral";
            const theme = getSubjectTheme(deck.subject?.color, subjectName);

            return (
              <div
                key={deck.id}
                className={`group relative flex flex-col justify-between p-5 sm:p-6 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/60 ${theme.hoverBorder} rounded-2xl sm:rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-xl space-y-5 overflow-hidden`}
              >
                <div className="flex items-center justify-between gap-2 z-10">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-lg truncate max-w-[65%] ${theme.badge}`}
                  >
                    {subjectName}
                  </span>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/flashcards/decks/${deck.id}`}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Configurações"
                    >
                      <Settings size={15} />
                    </Link>

                    <button
                      onClick={() => handleDeleteDeck(deck.id, deck.title)}
                      disabled={isDeletingThis}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      {isDeletingThis ? (
                        <Loader2
                          size={15}
                          className="animate-spin text-rose-400"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 z-10">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br border flex items-center justify-center shrink-0 ${theme.icon}`}
                  >
                    <BookOpen size={18} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <Link href={`/flashcards/decks/${deck.id}`}>
                      <h3 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-white transition-colors line-clamp-2 leading-snug">
                        {deck.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <RotateCw size={11} className={theme.accentText} />
                      <span>Revisão ativa</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 z-10">
                  <span className="text-slate-300 text-xs font-bold">
                    {cardCount} {cardCount === 1 ? "card" : "cards"}
                  </span>

                  <Link
                    href={`/flashcards/study/${deck.id}`}
                    className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl transition-all active:scale-95 ${theme.btn}`}
                  >
                    <span>Estudar</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <CreateDeckModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            handleDeckCreated();
          }}
        />
      )}
    </div>
  );
}
