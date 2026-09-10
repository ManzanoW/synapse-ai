"use client";

import { useState } from "react";

export default function FlashcardCreator({ topicId }: { topicId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, question, answer, details }),
    });

    if (res.ok) {
      setQuestion("");
      setAnswer("");
      setDetails("");
      alert("Flashcard adicionado com sucesso!");
    } else {
      alert("Erro ao salvar flashcard.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4"
    >
      <input
        placeholder="Pergunta"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white"
      />
      <input
        placeholder="Resposta"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white"
      />
      <textarea
        placeholder="Detalhes adicionais (opcional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white"
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold"
      >
        Criar Flashcard
      </button>
    </form>
  );
}
