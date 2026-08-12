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
        `Tem certeza que deseja excluir o baralho "${deckTitle}"? Todos os flashcards dele serão apagados.`
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
        deck.subject?.name?.toLowerCase().includes(query)
    );
  }, [decks, searchQuery]);

  const totalCardsCount = useMemo(() => {
    return decks.reduce((acc, deck) => {
      const count = deck._count?.flashcards ?? deck.flashcards?.length ?? 0;
      return acc + count;
    }, 0);
  }, [decks]);

  return (
    <div className="relative min-h-screen p-4 md:p-8 max-w-7xl mx-auto text-slate-100 space-y-8 animate-fade-in overflow-hidden font-sans">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors mb-2 group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span>Voltar para Central</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Meus Baralhos
            <span className="text-xs font-bold px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full shadow-xs">
              {decks.length} {decks.length === 1 ? "coleção" : "coleções"}
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Gerencie seus conjuntos de estudos e acompanhe suas métricas de
            memorização.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/30 cursor-pointer"
        >
          <Plus
            size={18}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
          <span>Novo Baralho</span>
        </button>
      </div>

      {/* WIDGETS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="relative overflow-hidden p-5 bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl backdrop-blur-2xl flex items-center gap-4 transition-all duration-300 shadow-xl shadow-indigo-950/30 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Layers size={22} />
          </div>
          <div className="z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Total de Baralhos
            </span>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              {decks.length}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 bg-slate-900/80 border border-violet-500/30 hover:border-violet-500/50 rounded-2xl backdrop-blur-2xl flex items-center gap-4 transition-all duration-300 shadow-xl shadow-violet-950/30 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <Zap size={22} />
          </div>
          <div className="z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Cards Cadastrados
            </span>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent">
              {totalCardsCount}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden p-5 bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl backdrop-blur-2xl flex items-center gap-4 transition-all duration-300 shadow-xl shadow-emerald-950/30 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <div className="z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Algoritmo SM-2
            </span>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full inline-block mt-1 shadow-xs">
              Ativo & Sincronizado
            </span>
          </div>
        </div>
      </div>

      {/* 🔍 FILTRO E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-3.5 border border-slate-700/60 rounded-2xl backdrop-blur-2xl shadow-xl">
        <div className="relative w-full sm:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome do baralho ou matéria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium self-end sm:self-center pr-2">
          Exibindo{" "}
          <strong className="text-indigo-400 font-bold">
            {filteredDecks.length}
          </strong>{" "}
          de {decks.length} baralhos
        </div>
      </div>

      {/* ⏳ SKELETON LOADING STATE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-20 h-5 bg-slate-800 rounded-lg" />
                <div className="w-12 h-5 bg-slate-800 rounded-lg" />
              </div>
              <div className="w-12 h-12 bg-slate-800 rounded-2xl" />
              <div className="h-5 bg-slate-800 rounded-md w-3/4" />
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded-md w-20" />
                <div className="h-9 bg-slate-800 rounded-xl w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        /* 📦 EMPTY STATE */
        <div className="p-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3 backdrop-blur-xl">
          <Layers size={44} className="mx-auto text-slate-600" />
          <h3 className="text-slate-300 font-bold text-base">
            {searchQuery
              ? "Nenhum baralho encontrado"
              : "Nenhum baralho cadastrado"}
          </h3>
          <p className="text-slate-500 text-xs max-w-xs mx-auto">
            {searchQuery
              ? `Sua busca por "${searchQuery}" não encontrou resultados.`
              : "Comece criando seu primeiro baralho de estudos para ativar o algoritmo."}
          </p>
          {!searchQuery && (
            <div className="pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>Criar Primeiro Baralho</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 🎴 GRID DE CARDS PREMIUM */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const cardCount =
              deck._count?.flashcards ?? deck.flashcards?.length ?? 0;
            const isDeletingThis = deletingId === deck.id;
            const subjectName = deck.subject?.name || "Geral";
            const theme = getSubjectTheme(deck.subject?.color, subjectName);

            return (
              <div
                key={deck.id}
                className={`group relative flex flex-col justify-between p-6 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/60 ${theme.hoverBorder} rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-xl hover:shadow-2xl space-y-6 overflow-hidden`}
              >
                {/* CABEÇALHO DO CARD */}
                <div className="flex items-center justify-between gap-2 z-10">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 border rounded-xl truncate max-w-[65%] shadow-xs ${theme.badge}`}
                  >
                    {subjectName}
                  </span>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/flashcards/decks/${deck.id}`}
                      title="Gerenciar Flashcards"
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Settings size={16} />
                    </Link>

                    <button
                      onClick={() => handleDeleteDeck(deck.id, deck.title)}
                      disabled={isDeletingThis}
                      title="Excluir baralho"
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isDeletingThis ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-rose-400"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CORPO DO CARD */}
                <div className="flex items-start gap-4 z-10">
                  <div
                    className={`w-13 h-13 rounded-2xl bg-gradient-to-br border flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md shrink-0 ${theme.icon}`}
                  >
                    <BookOpen size={22} />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Link href={`/flashcards/decks/${deck.id}`}>
                      <h3 className="font-bold text-slate-100 text-base group-hover:text-white transition-colors line-clamp-2 cursor-pointer leading-snug">
                        {deck.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <RotateCw size={12} className={theme.accentText} />
                      <span>Revisão espaçada ativa</span>
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DO CARD */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.glowDot}`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${theme.glowDot}`}
                      />
                    </span>
                    <span className="text-slate-300 text-xs font-bold">
                      {cardCount} {cardCount === 1 ? "card" : "cards"}
                    </span>
                  </div>

                  <Link
                    href={`/flashcards/study/${deck.id}`}
                    className={`inline-flex items-center gap-2 text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 ${theme.btn}`}
                  >
                    <span>Estudar</span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO */}
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
