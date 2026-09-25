import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ProvaOralClient from "./prova-oral-client";

import { prisma } from "@/lib/prisma";
import { isLawFocused } from "@/lib/career-utils";

export const metadata: Metadata = {
  title: "Simulador de Prova Oral com IA | Synapse AI",
  description:
    "Treine a fase oral de concursos públicos de alta performance com voz ativa, arguição da banca examinadora e avaliação por rubrica técnica e oratória.",
};

export default async function ProvaOralPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { careerFocus: true, targetRole: true },
      })
    : null;

  const isLaw = isLawFocused(dbUser?.careerFocus, dbUser?.targetRole);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#02050e] flex items-center justify-center text-slate-400">
          Carregando Simulador de Prova Oral...
        </div>
      }
    >
      <ProvaOralClient
        isLawUser={isLaw}
        userCareer={dbUser?.careerFocus || "Concurso Geral"}
        userRole={dbUser?.targetRole || "Concurso Geral"}
      />
    </Suspense>
  );
}
