"use client";
import { useState } from "react";

export default function Flashcard({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className={`cursor-pointer w-full p-8 rounded-2xl border transition-all duration-500 transform ${
        isFlipped
          ? "bg-indigo-900 border-indigo-500"
          : "bg-[#090d16] border-slate-800"
      }`}
    >
      <p className="text-slate-400 text-sm mb-2">
        {isFlipped ? "Resposta" : "Pergunta"}
      </p>
      <p className="text-xl font-bold">{isFlipped ? answer : question}</p>
    </div>
  );
}
