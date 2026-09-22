import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEssaySubmissionByIdAction } from "@/actions/essay-actions";
import { DiscursivaIdClient } from "./DiscursivaIdClient";
import { ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resultado da Redação Discursiva | Synapse AI",
  description: "Parecer detalhado da banca examinadora e versão padrão ouro nota 100 comparativa.",
};

export default async function DiscursivaIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const res = await getEssaySubmissionByIdAction(id);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">
          Redação Discursiva não encontrada
        </h2>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          {res.error ||
            "Esta redação não existe ou não pertence à sua conta de estudante."}
        </p>
        <Link
          href="/redacao"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-violet-950/40 mt-2"
        >
          <ArrowLeft size={14} />
          <span>Voltar para Redação Oficial</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <DiscursivaIdClient result={res.data} />
    </div>
  );
}
