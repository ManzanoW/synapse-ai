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
} from "lucide-react";
import { Flashcard, Deck } from "@/types";
import FlashcardModal from "@/components/flashcards/FlashcardModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DeckDetailPage({ params }: PageProps) {
  // Desembrulha a Promise de params no React Client Component
  const resolvedParams = use(params);
  const deckId = resolvedParams.id;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Busca dados do Deck e seus Flashcards com useCallback para estabilidade
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
    let active = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/decks/${deckId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Erro ao buscar baralho");
        const data = await res.json();

        if (active) {
          setDeck(data);
          setFlashcards(data.flashcards || []);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes do deck:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
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
      <div className="min-h-screen text-slate-100 p-8 max-w-350 mx-auto flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen text-slate-100 p-8 max-w-350 mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-300">
          Baralho não encontrado
        </h2>
        <Link
          href="/flashcards/decks"
          className="inline-flex items-center gap-2 text-indigo-400 hover:underline text-sm"
        >
          <ArrowLeft size={16} /> Voltar para Meus Baralhos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 p-8 max-w-350 mx-auto space-y-8">
      {/* Header com Navegação */}
      <div>
        <Link
          href="/flashcards/decks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Voltar para Baralhos</span>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 ${deck.color || "bg-indigo-600"} rounded-2xl flex items-center justify-center text-white shadow-lg`}
            >
              <Layers size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  {deck.title}
                </h1>
                {deck.subject?.name && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    {deck.subject.name}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                {flashcards.length}{" "}
                {flashcards.length === 1
                  ? "flashcard cadastrado"
                  : "flashcards cadastrados"}
              </p>
            </div>
          </div>

          {/* Ações principais */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditingCard(null);
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition-all active:scale-95"
            >
              <Plus size={18} />
              <span>Novo Card</span>
            </button>

            <Link
              href={`/flashcards/study/${deck.id}`}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
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
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Buscar por pergunta ou resposta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Exibindo{" "}
          <span className="text-indigo-400 font-bold">
            {filteredCards.length}
          </span>{" "}
          de {flashcards.length} cards
        </div>
      </div>

      {/* Lista de Flashcards */}
      {filteredCards.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
          <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-slate-200 font-bold text-base mb-1">
            {searchQuery
              ? "Nenhum card encontrado"
              : "Nenhum flashcard neste baralho"}
          </h3>
          <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `Não encontramos resultados para "${searchQuery}".`
              : "Adicione seu primeiro card manualmente ou gere conjuntos via IA."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingCard(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus size={16} />
              <span>Criar Primeiro Card</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card, idx) => {
            const isDeleting = deletingId === card.id;
            const front = getCardFront(card);
            const back = getCardBack(card);
            const { interval, repetitions } = getCardStats(card);

            return (
              <div
                key={card.id || idx}
                className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Frente (Pergunta) */}
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                      Frente / Pergunta
                    </span>
                    <p className="text-sm font-medium text-slate-100 mt-1 line-clamp-3">
                      {front}
                    </p>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3">
                    {/* Verso (Resposta) */}
                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                      Verso / Resposta
                    </span>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3">
                      {back}
                    </p>
                  </div>
                </div>

                {/* Footer do Card com Ações */}
                <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Intervalo: {interval}d | Reps: {repetitions}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingCard(card);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Editar Card"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={isDeleting}
                      className="p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir Card"
                    >
                      {isDeleting ? (
                        <Loader2
                          size={15}
                          className="animate-spin text-red-400"
                        />
                      ) : (
                        <Trash2 size={15} />
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
