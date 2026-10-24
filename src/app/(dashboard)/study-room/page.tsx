import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFocusMetricsAction } from "@/actions/focus-session-actions";
import StudyRoomClient from "./StudyRoomClient";

export const metadata = {
  title: "Sala de Foco & Pomodoro | Synapse AI",
  description:
    "Espaço de concentração profunda com paisagens sonoras procedurais, cockpit Pomodoro e registro de foco para concursos.",
};

export default async function StudyRoomPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  // Busca concorrente de matérias (com tópicos do edital) e métricas do estudante
  const [subjects, metricsRes] = await Promise.all([
    prisma.subject.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
        topics: {
          select: {
            id: true,
            title: true,
            firstStudy: true,
            nextRev: true,
            performance: true,
          },
          orderBy: { title: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    getFocusMetricsAction(userId),
  ]);

  const serializedSubjects = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    topics: s.topics.map((t) => ({
      id: t.id,
      title: t.title,
      firstStudy: t.firstStudy,
      nextRev: t.nextRev ? t.nextRev.toISOString() : null,
      performance: t.performance,
    })),
  }));

  const initialMetrics = metricsRes.success && metricsRes.data
    ? metricsRes.data
    : {
        todayMinutes: 0,
        todayCycles: 0,
        weeklyMinutes: 0,
        currentStreak: 0,
        streakFreezes: 0,
      };

  return (
    <StudyRoomClient
      userId={userId}
      user={{
        name: session.user?.name,
        email: session.user?.email,
      }}
      initialSubjects={serializedSubjects}
      initialMetrics={initialMetrics}
    />
  );
}
