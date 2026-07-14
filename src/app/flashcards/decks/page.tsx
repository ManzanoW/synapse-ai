"use client";

import React, { useEffect, useState } from "react"; // 1. Garanta que useCallback está aqui
import { Plus, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import { Deck } from "@/types";
import CreateDeckModal from "@/components/decks/CreateDeckModal";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Definimos a função AQUI dentro.
    // O linter para de reclamar de dependências externas.
    const loadDecks = async () => {
      try {
        const res = await fetch("/api/decks");
        const json = await res.json();
        setDecks(json.data);
      } catch (error) {
        console.error("Erro ao buscar decks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, []); // Array vazio: só roda na montagem. Sem dependências, sem cascata.

  // Precisamos de uma versão para o Modal que NÃO use o useEffect
  const refreshDecks = async () => {
    const res = await fetch("/api/decks");
    const json = await res.json();
    setDecks(json.data);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-8">
      {/* Header com Ação */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold">Meus Decks</h1>
          <p className="text-slate-500 text-sm">
            Gerencie seus conjuntos de flashcards
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} />
          Novo Deck
        </button>
      </div>

      {/* Grid de Decks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className="group bg-[#090d16] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-black"
          >
            <div
              className={`w-12 h-12 ${deck.color} rounded-xl mb-4 flex items-center justify-center`}
            >
              <Layers size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-bold mb-1">{deck.title}</h3>
            <span className="text-xs text-indigo-400 font-medium">
              {deck.subject?.name || "Geral"}
            </span>

            <div className="mt-6 flex justify-between items-center text-slate-400">
              <span className="text-xs flex items-center gap-1">
                <BookOpen size={14} /> {deck._count?.flashcards || 0} cards
              </span>
              <Link
                href={`/flashcards/study/${deck.id}`}
                className="text-[11px] font-bold border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-white inline-block text-center"
              >
                Estudar
              </Link>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <CreateDeckModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            refreshDecks();
          }}
        />
      )}
    </div>
  );
}
