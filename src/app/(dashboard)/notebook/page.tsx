import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getErrorMetricsAction,
  getErrorNotebookQuestionsAction,
} from "@/actions/error-notebook-actions";
import { ErrorNotebookView } from "./components/ErrorNotebookView";
import { ErrorNotebookSkeleton } from "./components/ErrorNotebookSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caderno de Erros Inteligente | Synapse AI",
  description:
    "Diagnóstico taxonômico e aprendizado ativo com remediação e fixação sob demanda orientada por IA.",
};

export default async function NotebookPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Busca concorrente de métricas, primeiros 10 itens e matérias do usuário
  const [metricsRes, questionsRes, subjectsData] = await Promise.all([
    getErrorMetricsAction(),
    getErrorNotebookQuestionsAction({ limit: 10, page: 1, status: "ALL" }),
    prisma.subject.findMany({
      where: { userId },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultMetrics = {
    totalErrors: 0,
    pendingErrors: 0,
    masteredErrors: 0,
    masteryRate: 0,
    taxonomyDistribution: [],
  };

  const metrics =
    metricsRes?.success && metricsRes.data ? metricsRes.data : defaultMetrics;

  const initialItems =
    questionsRes?.success && questionsRes.questions
      ? questionsRes.questions
      : [];

  const subjects = subjectsData ?? [];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <Suspense fallback={<ErrorNotebookSkeleton />}>
        <ErrorNotebookView
          initialItems={initialItems}
          initialMetrics={metrics}
          subjects={subjects}
        />
      </Suspense>
    </div>
  );
}
