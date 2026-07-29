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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Deck } from "@/types";
import CreateDeckModal from "@/components/decks/CreateDeckModal";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Função defensiva que extrai a lista de baralhos independentemente do formato
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
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Falha ao excluir o baralho.");
      }

      // Remove da lista local instantaneamente
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

  // Filtro inteligente por título ou matéria
  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const query = searchQuery.toLowerCase();
    return decks.filter(
      (deck) =>
        deck.title?.toLowerCase().includes(query) ||
        deck.subject?.name?.toLowerCase().includes(query),
    );
  }, [decks, searchQuery]);

  return (
    <div className="min-h-screen text-slate-100 p-8 max-w-350 mx-auto space-y-8">
      {/* Header com Navegação */}
      <div>
        <Link
          href="/flashcards"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Voltar para Central</span>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Meus Baralhos
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gerencie seus conjuntos de estudos e acompanhe a quantidade de
              flashcards ativos.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
          >
            <Plus
              size={18}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            <span>Novo Baralho</span>
          </button>
        </div>
      </div>

      {/* Filtros e Contadores */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
        <div className="relative w-full sm:w-96">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Buscar por nome do baralho ou matéria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium self-end sm:self-center">
          Exibindo{" "}
          <span className="text-indigo-400 font-bold">
            {filteredDecks.length}
          </span>{" "}
          de {decks.length} baralhos
        </div>
      </div>

      {/* Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 bg-slate-900/30 border border-slate-800/60 rounded-2xl animate-pulse space-y-4"
            >
              <div className="w-12 h-12 bg-slate-800/60 rounded-xl" />
              <div className="h-5 bg-slate-800/60 rounded-md w-3/4" />
              <div className="h-3 bg-slate-800/40 rounded-md w-1/3" />
              <div className="pt-4 border-t border-slate-800/40 flex justify-between items-center">
                <div className="h-4 bg-slate-800/40 rounded-md w-20" />
                <div className="h-8 bg-slate-800/60 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
          <Layers size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-slate-200 font-bold text-base mb-1">
            {searchQuery
              ? "Nenhum baralho encontrado"
              : "Nenhum baralho cadastrado"}
          </h3>
          <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `Sua busca por "${searchQuery}" não encontrou resultados.`
              : "Comece criando seu primeiro baralho de estudos para começar as revisões."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus size={16} />
              <span>Criar Baralho</span>
            </button>
          )}
        </div>
      ) : (
        /* Lista de Decks */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const cardCount = deck._count?.flashcards || 0;
            const customColor = deck.color || "bg-indigo-600";
            const isDeletingThis = deletingId === deck.id;

            return (
              <div
                key={deck.id}
                className="group relative flex flex-col justify-between p-6 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${customColor} rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/30 group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Layers size={22} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                        {deck.subject?.name || "Geral"}
                      </span>

                      {/* 🗑️ Botão de Excluir Deck */}
                      <button
                        onClick={() => handleDeleteDeck(deck.id, deck.title)}
                        disabled={isDeletingThis}
                        title="Excluir baralho"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeletingThis ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-red-400"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 line-clamp-1 mb-1 group-hover:text-indigo-300 transition-colors">
                    {deck.title}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <BookOpen size={14} className="text-slate-500" />
                    {cardCount} {cardCount === 1 ? "card" : "cards"}
                  </span>

                  <Link
                    href={`/flashcards/study/${deck.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/15 active:scale-95"
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

      {/* Modal */}
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
