"use client";

import React, { useEffect, useState, use, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Trash2,
  Edit2,
  Play,
  Layers,
  Loader2,
  Sparkles,
  Clock,
  Repeat,
} from "lucide-react";
import { Flashcard, Deck } from "@/types";
import FlashcardModal from "@/components/flashcards/FlashcardModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DeckDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.id;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Busca dados do Deck e seus Flashcards
  const fetchDeckData = useCallback(async () => {
    try {
      const res = await fetch(`/api/decks/${deckId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao buscar baralho");
      const data = await res.json();

      setDeck(data);
      setFlashcards(data.flashcards || []);
    } catch (err) {
      console.error("Erro ao carregar detalhes do deck:", err);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const res = await fetch(`/api/decks/${deckId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Erro ao buscar baralho");
        const data = await res.json();

        if (!ignore) {
          setDeck(data);
          setFlashcards(data.flashcards || []);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes do deck:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [deckId]);

  // Exclusão individual de um flashcard
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Deseja realmente excluir este flashcard?")) return;

    setDeletingId(cardId);
    try {
      const res = await fetch(`/api/flashcards/${cardId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir flashcard");

      setFlashcards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      console.error(err);
      alert("Não foi possível excluir o flashcard.");
    } finally {
      setDeletingId(null);
    }
  };

  // Helper para extrair 'front' / 'question'
  const getCardFront = (card: Flashcard): string => {
    const raw = card as unknown as Record<string, unknown>;
    return typeof raw.front === "string" ? raw.front : card.question || "";
  };

  // Helper para extrair 'back' / 'answer'
  const getCardBack = (card: Flashcard): string => {
    const raw = card as unknown as Record<string, unknown>;
    return typeof raw.back === "string" ? raw.back : card.answer || "";
  };

  // Helper para extrair 'interval' e 'repetitions'
  const getCardStats = (card: Flashcard) => {
    const raw = card as unknown as Record<string, unknown>;
    const interval = typeof raw.interval === "number" ? raw.interval : 0;
    const repetitions =
      typeof raw.repetitions === "number" ? raw.repetitions : 0;
    return { interval, repetitions };
  };

  // Filtro de busca na frente/verso dos cards
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return flashcards;
    const q = searchQuery.toLowerCase();
    return flashcards.filter((card) => {
      const frontText = getCardFront(card).toLowerCase();
      const backText = getCardBack(card).toLowerCase();
      return frontText.includes(q) || backText.includes(q);
    });
  }, [flashcards, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[70vh] text-slate-100 p-8 max-w-7xl mx-auto flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <p className="text-xs text-slate-400 font-medium">
          Carregando detalhes do baralho...
        </p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-[70vh] text-slate-100 p-8 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-200">
          Baralho não encontrado
        </h2>
        <Link
          href="/flashcards/decks"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Voltar para Meus Baralhos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header com Navegação e Ações */}
      <div className="space-y-6">
        <Link
          href="/flashcards/decks"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60 w-fit"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform text-indigo-400"
          />
          <span>Voltar para Baralhos</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 p-6 border border-slate-800/80 rounded-3xl backdrop-blur-xl relative overflow-hidden">
          {/* Brilho decorativo no card principal */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start sm:items-center gap-5 relative z-10">
            <div
              className={`w-16 h-16 ${deck.color || "bg-linear-to-br from-indigo-500 to-indigo-700"} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 border border-white/10 shrink-0`}
            >
              <Layers size={32} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {deck.title}
                </h1>
                {deck.subject?.name && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    {deck.subject.name}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm">
                Gerencie seus flashcards ou inicie uma sessão de estudo SM-2.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 w-full lg:w-auto relative z-10">
            <button
              onClick={() => {
                setEditingCard(null);
                setIsModalOpen(true);
              }}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-700/80 transition-all active:scale-95 shadow-md hover:shadow-indigo-500/5"
            >
              <Plus size={18} className="text-indigo-400" />
              <span>Novo Card</span>
            </button>

            <Link
              href={`/flashcards/study/${deck.id}`}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 border border-indigo-400/20 active:scale-95"
            >
              <Play size={16} className="fill-white" />
              <span>Estudar Agora</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
        <div className="relative w-full sm:w-96">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por pergunta ou resposta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium self-end sm:self-center">
          Exibindo{" "}
          <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            {filteredCards.length}
          </span>{" "}
          de {flashcards.length} cards
        </div>
      </div>

      {/* Lista de Flashcards */}
      {filteredCards.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/30 border border-dashed border-slate-800/80 rounded-3xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
            <BookOpen size={32} />
          </div>
          <h3 className="text-slate-200 font-bold text-base mb-1">
            {searchQuery
              ? "Nenhum resultado encontrado"
              : "Nenhum flashcard neste baralho"}
          </h3>
          <p className="text-slate-400 text-xs mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `Não encontramos resultados que correspondam a "${searchQuery}".`
              : "Comece criando cards para alimentar o algoritmo de repetição espaçada."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingCard(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Plus size={16} />
              <span>Criar Primeiro Card</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCards.map((card, idx) => {
            const isDeleting = deletingId === card.id;
            const front = getCardFront(card);
            const back = getCardBack(card);
            const { interval, repetitions } = getCardStats(card);

            return (
              <div
                key={card.id || idx}
                className="group relative bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 backdrop-blur-xl shadow-lg hover:shadow-indigo-500/5"
              >
                {/* Header Interno do Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      <Sparkles size={11} /> Frente / Pergunta
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-100 leading-relaxed pl-0.5">
                    {front}
                  </p>

                  <div className="border-t border-slate-800/80 pt-3 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                      Verso / Resposta
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pl-0.5">
                      {back}
                    </p>
                  </div>
                </div>

                {/* Footer do Card com Stats SM-2 e Ações */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                    <span
                      className="flex items-center gap-1"
                      title="Intervalo de revisão"
                    >
                      <Clock size={12} className="text-indigo-400" />
                      {interval}d
                    </span>
                    <span
                      className="flex items-center gap-1"
                      title="Repetições concluídas"
                    >
                      <Repeat size={12} className="text-violet-400" />
                      {repetitions} reps
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCard(card);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:text-indigo-300 hover:bg-indigo-500/10 text-slate-400 rounded-lg transition-colors"
                      title="Editar Card"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={isDeleting}
                      className="p-2 hover:text-red-400 hover:bg-red-500/10 text-slate-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir Card"
                    >
                      {isDeleting ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-red-400"
                        />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <FlashcardModal
          key={editingCard?.id || "new-card"}
          deckId={deckId}
          initialData={editingCard}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCard(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingCard(null);
            fetchDeckData();
          }}
        />
      )}
    </div>
  );
}
