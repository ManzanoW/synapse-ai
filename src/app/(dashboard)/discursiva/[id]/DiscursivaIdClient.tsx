"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EssayEvaluationResult } from "@/actions/essay-actions";
import { EssayResultView } from "@/components/essay/EssayResultView";

interface DiscursivaIdClientProps {
  result: EssayEvaluationResult;
}

export function DiscursivaIdClient({ result }: DiscursivaIdClientProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      {/* Botão Superior de Retorno */}
      <div className="flex items-center justify-between">
        <Link
          href="/redacao"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group cursor-pointer"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-1 text-violet-400"
          />
          <span>Voltar para Prática de Redação</span>
        </Link>
      </div>

      <EssayResultView
        result={result}
        onNewEssay={() => router.push("/redacao")}
        onViewHistory={() => router.push("/redacao")}
      />
    </div>
  );
}
