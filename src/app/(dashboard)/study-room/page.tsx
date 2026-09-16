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

  // Busca concorrente de matérias e métricas do estudante
  const [subjects, metricsRes] = await Promise.all([
    prisma.subject.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: { name: "asc" },
    }),
    getFocusMetricsAction(userId),
  ]);

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
      initialSubjects={subjects}
      initialMetrics={initialMetrics}
    />
  );
}
