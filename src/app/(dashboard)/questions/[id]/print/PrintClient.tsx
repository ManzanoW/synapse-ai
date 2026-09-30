"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  PrintableQuestions,
  PrintableQuestion,
} from "@/components/questions/printable-questions";

interface PrintClientProps {
  title: string;
  banca: string;
  quizId: string;
  questions: PrintableQuestion[];
}

export function PrintClient({
  title,
  banca,
  quizId,
  questions,
}: PrintClientProps) {
  const router = useRouter();

  return (
    <PrintableQuestions
      title={title}
      banca={banca}
      quizId={quizId}
      totalQuestions={questions.length}
      estimatedTimeMinutes={Math.max(15, questions.length * 3)}
      onBack={() => router.push(`/questions/${quizId}`)}
      questions={questions}
    />
  );
}
