"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QuizResultView } from "@/components/study/QuizResultView";
import { QuestaoIA } from "../../page";

interface QuizResultClientProps {
  quiz: {
    id: string;
    banca: string;
    subject: string;
    difficulty: string;
    questions: QuestaoIA[];
    topicId?: string | null;
  };
  initialSelectedAnswers?: Record<number, string>;
  initialTimerSeconds?: number;
  initialEarnedXp?: number;
}

export function QuizResultClient({
  quiz,
  initialSelectedAnswers = {},
  initialTimerSeconds = 0,
  initialEarnedXp = 0,
}: QuizResultClientProps) {
  const router = useRouter();
  const [questions] = useState<QuestaoIA[]>(quiz.questions || []);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    initialSelectedAnswers
  );
  const [timerSeconds] = useState(initialTimerSeconds);

  const handleRestart = () => {
    router.push(`/questions/${quiz.id}`);
  };

  const handleExit = () => {
    router.push("/questions?tab=history");
  };

  return (
    <QuizResultView
      quizId={quiz.id}
      banca={quiz.banca}
      subject={quiz.subject}
      topicId={quiz.topicId}
      questions={questions}
      selectedAnswers={selectedAnswers}
      timerSeconds={timerSeconds}
      earnedXp={initialEarnedXp}
      onRestart={handleRestart}
      onExit={handleExit}
    />
  );
}
