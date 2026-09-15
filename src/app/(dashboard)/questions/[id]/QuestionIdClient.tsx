"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuizResolutionView } from "@/components/study/QuizResolutionView";
import { CompletionModal } from "../_components/CompletionModal";
import { QuestaoIA } from "../page";
import { submitQuizAttemptAction } from "@/actions/quiz-actions";
import { useGamification } from "@/context/GamificationContext";
import { ErrorClassification, QuestionAnswerSubmission } from "@/types/quiz";

interface QuestionIdClientProps {
  quiz: {
    id: string;
    banca: string;
    subject: string;
    difficulty: string;
    questions: QuestaoIA[];
    topicId?: string | null;
  };
}

export function QuestionIdClient({ quiz }: QuestionIdClientProps) {
  const router = useRouter();
  const { refreshStats } = useGamification();

  const [questions, setQuestions] = useState<QuestaoIA[]>(quiz.questions || []);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [errorClassifications, setErrorClassifications] = useState<
    Record<number, ErrorClassification>
  >({});
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [finalCorrectCount, setFinalCorrectCount] = useState(0);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);
  const [isSyncingSM2, setIsSyncingSM2] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    leveledUp: boolean;
    newLevel: number;
    title?: string;
  } | null>(null);

  // Flashcards
  const [createdFlashcards, setCreatedFlashcards] = useState<Record<number, boolean>>({});
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);

  const handleAnswerQuestion = (
    index: number,
    selectedAlt: string,
    isCorrect: boolean,
  ) => {
    setSelectedAnswers((prev) => ({ ...prev, [index]: selectedAlt }));
    setCheckedQuestions((prev) => ({ ...prev, [index]: true }));
  };

  const handleCreateFlashcard = async (index: number) => {
    const q = questions[index];
    if (!q || createdFlashcards[index] || isCreatingFlashcard) return;

    setIsCreatingFlashcard(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: q.topicId || quiz.topicId || undefined,
          question: q.flashcardFrente || q.enunciado,
          answer: q.flashcardVerso || q.justificativa,
          front: q.flashcardFrente || q.enunciado,
          back: q.flashcardVerso || q.justificativa,
        }),
      });

      if (res.ok) {
        setCreatedFlashcards((prev) => ({ ...prev, [index]: true }));
      }
    } catch (err) {
      console.error("Erro ao criar flashcard:", err);
    } finally {
      setIsCreatingFlashcard(false);
    }
  };

  const handleFinishQuiz = async (finalData: {
    totalQuestions: number;
    correctCount: number;
    timerSeconds: number;
    selectedAnswers: Record<number, string>;
    checkedQuestions: Record<number, boolean>;
    errorClassifications: Record<number, ErrorClassification>;
  }) => {
    setFinalCorrectCount(finalData.correctCount);
    setTimerSeconds(finalData.timerSeconds);
    setSelectedAnswers(finalData.selectedAnswers);
    setCheckedQuestions(finalData.checkedQuestions);
    setErrorClassifications(finalData.errorClassifications);

    const total = finalData.totalQuestions || 1;
    const accuracy = Math.round((finalData.correctCount / total) * 100);

    // Sincronização SM-2
    if (quiz.topicId) {
      setIsSyncingSM2(true);
      let grade = 1;
      if (accuracy >= 95) grade = 5;
      else if (accuracy >= 85) grade = 4;
      else if (accuracy >= 70) grade = 3;
      else if (accuracy >= 50) grade = 2;

      try {
        await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: quiz.topicId,
            grade,
            source: "QUIZ",
          }),
        });
      } catch (err) {
        console.error("Erro SM-2:", err);
      } finally {
        setIsSyncingSM2(false);
      }
    }

    // Submissão da tentativa no banco de dados
    try {
      const submissions: QuestionAnswerSubmission[] = questions.map((q, idx) => ({
        questionId: q.id || `q-${idx}`,
        subjectId: q.subjectId || quiz.subject || "Geral",
        topicId: q.topicId || quiz.topicId || undefined,
        selectedOption: finalData.selectedAnswers[idx] || "",
        isCorrect: finalData.selectedAnswers[idx] === q.gabaritoCorreto,
        timeSpentSeconds: Math.round(finalData.timerSeconds / total),
        errorReason: finalData.errorClassifications[idx] || "UNCLASSIFIED",
        questionText: q.enunciado,
        options: q.alternativas,
        correctAnswer: q.gabaritoCorreto,
        explanation: q.justificativa,
      }));

      const res = await submitQuizAttemptAction({
        title: `Simulado ${quiz.banca} - ${quiz.subject}`,
        topicId: quiz.topicId || undefined,
        totalQuestions: total,
        correctAnswers: finalData.correctCount,
        timeSpentSeconds: finalData.timerSeconds,
        answers: submissions,
      });

      if (res.success && res.data) {
        setLastEarnedXp(res.data.earnedXp);
        if (refreshStats) {
          refreshStats();
        }
      }
    } catch (err) {
      console.error("Erro ao registrar tentativa:", err);
    }

    setShowCompletionModal(true);
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCheckedQuestions({});
    setErrorClassifications({});
    setTimerSeconds(0);
    setShowCompletionModal(false);
  };

  return (
    <>
      <QuizResolutionView
        quizId={quiz.id}
        banca={quiz.banca}
        subject={quiz.subject}
        questions={questions}
        initialSelectedAnswers={selectedAnswers}
        initialCheckedQuestions={checkedQuestions}
        initialErrorClassifications={errorClassifications}
        initialTimerSeconds={timerSeconds}
        isInitialTimerRunning={!showCompletionModal}
        onAnswerQuestion={handleAnswerQuestion}
        onFinishQuiz={handleFinishQuiz}
        onExit={() => router.push("/questions")}
        onCreateFlashcard={handleCreateFlashcard}
        isCreatingFlashcard={isCreatingFlashcard}
        createdFlashcards={createdFlashcards}
      />

      {showCompletionModal && (
        <CompletionModal
          totalQuestions={questions.length}
          correctCount={finalCorrectCount}
          percentageAcc={
            questions.length > 0
              ? Math.round((finalCorrectCount / questions.length) * 100)
              : 0
          }
          timerSeconds={timerSeconds}
          lastEarnedXp={lastEarnedXp}
          isSyncingSM2={isSyncingSM2}
          levelUpData={levelUpData}
          onRestart={handleRestart}
          onReview={() => setShowCompletionModal(false)}
        />
      )}
    </>
  );
}
