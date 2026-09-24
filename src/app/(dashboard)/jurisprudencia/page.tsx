import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import JurisprudenciaClient from "./jurisprudencia-client";
import { CURATED_JURISPRUDENCE } from "@/lib/jurisprudence-data";

export const metadata: Metadata = {
  title: "Raio-X de Jurisprudência & Súmulas | Synapse AI",
  description:
    "Vade Mecum Cognitivo com teses traduzidas de STF e STJ, divergências jurisprudenciais e alertas de pegadinhas das bancas examinadoras.",
};

export default async function JurisprudenciaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#02050e] flex items-center justify-center text-slate-400">
          Carregando Raio-X de Jurisprudência...
        </div>
      }
    >
      <JurisprudenciaClient initialItems={CURATED_JURISPRUDENCE} />
    </Suspense>
  );
}
