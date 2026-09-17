import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { EssayWorkspace } from "@/components/essay/EssayWorkspace";

export const metadata: Metadata = {
  title: "Analista de Redação Oficial com IA | Synapse AI",
  description:
    "Prática discursiva em folha oficial pautada de concurso, propostas inéditas por banca e avaliação rigorosa e honesta com IA.",
};

export default async function RedacaoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <EssayWorkspace />
    </div>
  );
}
