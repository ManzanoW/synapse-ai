import React from "react";
import { getStudyTrailsOverviewAction } from "@/actions/trail-actions";
import { TrilhasClient } from "./trilhas-client";

export const metadata = {
  title: "Trilhas Guiadas & Cursos | Synapse AI",
  description:
    "Trilhas de aprendizado customizadas por edital e banca, teorias interativas e rastreador de cursos externos sincronizados.",
};

export default async function TrilhasPage() {
  const res = await getStudyTrailsOverviewAction();

  const initialData = res.success && res.data
    ? res.data
    : {
        user: null,
        activeTrail: null,
        allTrails: [],
        editalSubjects: [],
        externalCourses: [],
        dueFlashcardsCount: 15,
      };

  return <TrilhasClient initialData={initialData} />;
}
