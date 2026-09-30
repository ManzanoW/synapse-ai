import React from "react";
import Link from "next/link";
import { getSavedQuizByIdAction } from "@/actions/quiz-actions";
import { PrintClient } from "./PrintClient";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { QuestaoIA } from "../../page";

export default async function QuizPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getSavedQuizByIdAction(id);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Simulado não encontrado</h2>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          {res.error || "Este simulado não existe ou não pertence à sua conta."}
        </p>
        <Link
          href="/questions?tab=history"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-violet-950/40 mt-2"
        >
          <ArrowLeft size={14} />
          <span>Voltar ao Histórico</span>
        </Link>
      </div>
    );
  }

  const rawQuiz = res.data;
  const rawQuestions = (Array.isArray(rawQuiz.questions)
    ? rawQuiz.questions
    : []) as unknown as QuestaoIA[];

  const printableQuestions = rawQuestions.map((q, idx) => ({
    id: q.id || `q-${idx}`,
    number: idx + 1,
    statement: q.enunciado || "",
    options: Array.isArray(q.alternativas)
      ? q.alternativas.map((a) => (typeof a === "string" ? a : a.texto))
      : [],
    correctOption: q.gabaritoCorreto || "",
    subjectName: rawQuiz.subject || "Conhecimentos Gerais",
    format: q.formato || "multipla",
    justification: q.justificativa || "",
  }));

  return (
    <PrintClient
      title={`Simulado Oficial - ${rawQuiz.subject}`}
      banca={rawQuiz.banca || "FGV"}
      quizId={rawQuiz.id}
      questions={printableQuestions}
    />
  );
}
