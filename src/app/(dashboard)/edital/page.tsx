"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  UploadCloud,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import PendingSubjects from "./PendingSubjects";
import { Topic } from "@/types";
import { ImportEditalModal } from "@/components/edital/import-edital-modal";
import { PlannerView } from "@/components/edital/planner-table";
import { NewContentModal } from "@/components/create-subject-modal";
import { useSearchParams } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  importance?: string;
  priority?: string;
  color?: string | null;
  _count: {
    topics: number;
  };
}

function PlannerContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const targetSubjectId = searchParams.get("subjectId");

  // Estados para Revisão Ebbinghaus
  const [activeReviewTopic, setActiveReviewTopic] = useState<Topic | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [performanceValue, setPerformanceValue] = useState<number>(100);

  // Modal de Importar Edital
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 🔄 Recarregamento manual em segundo plano
  async function refreshData() {
    try {
      const subjectsRes = await fetch(`/api/edital?mode=subjects`, {
        cache: "no-store",
      });
      if (subjectsRes.ok) {
        const subjectsJson = await subjectsRes.json();
        const subjectsData = subjectsJson.data || [];
        setSubjects(subjectsData);

        // 🟢 Extrai a lista de tópicos mantendo a referência do nome da matéria pai
        const extractedTopics = subjectsData.flatMap((sub: any) =>
          (sub.topics || []).map((t: any) => ({
            ...t,
            subjectName: sub.name,
            subjectColor: sub.color || t.subjectColor || t.subject?.color,
          })),
        );

        if (extractedTopics.length > 0) {
          setTopics(extractedTopics);
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
    }
  }

  // 🎣 Carregamento inicial (apenas uma chamada única usando mode=subjects)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const subjectsRes = await fetch(`/api/edital?mode=subjects`, {
          cache: "no-store",
        });
        if (!subjectsRes.ok)
          throw new Error("Falha ao carregar os dados do banco.");

        const subjectsJson = await subjectsRes.json();

        if (!isMounted) return;

        const subjectsData = subjectsJson.data || [];
        setSubjects(subjectsData);

        // 🟢 Extrai os tópicos associando corretamente a matéria pai e o quizId
        const extractedTopics = subjectsData.flatMap((sub: any) =>
          (sub.topics || []).map((t: any) => ({
            ...t,
            subjectName: sub.name,
            subjectColor: sub.color || t.subjectColor || t.subject?.color,
          })),
        );

        setTopics(extractedTopics);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 📝 Criação de Novo Tópico/Matéria
  async function handleCreateTopic(data: {
    title: string;
    subjectName: string;
    weight: string;
  }) {
    try {
      const response = await fetch("/api/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          title: data.title,
          subjectName: data.subjectName,
          relevance: data.weight,
        }),
      });

      if (!response.ok) throw new Error("Erro ao criar novo conteúdo.");

      setIsCreateModalOpen(false);
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  // 🧠 Envio de Revisão Ebbinghaus
  async function handleReviewSubmission(grade: "Bom" | "Difícil" | "Errei") {
    if (!activeReviewTopic) return;
    try {
      setSubmitting(true);
      const response = await fetch("/api/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: activeReviewTopic.id,
          grade,
          performance: performanceValue,
        }),
      });
      if (!response.ok) throw new Error("Erro ao processar sua revisão.");
      setActiveReviewTopic(null);

      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha na requisição");
    } finally {
      setSubmitting(false);
    }
  }

  // Funções de deleção
  async function handleDeleteTopic(topicId: string) {
    try {
      const response = await fetch(`/api/edital?id=${topicId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir o tópico.");

      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao deletar tópico");
    }
  }

  async function handleDeleteSubject(subjectIdOrName: string) {
    try {
      const response = await fetch(`/api/edital?subjectId=${subjectIdOrName}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir a matéria.");

      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao deletar matéria");
    }
  }

  // 🟢 Mapeamento preservando a matéria correta e o quizId
  const mappedTopicsForView = topics.map((t: any) => ({
    id: t.id,
    title: t.title,
    subjectName: t.subjectName || t.subject?.name || "Geral",
    subjectColor: t.subjectColor || t.subject?.color,
    firstStudy: t.firstStudy,
    performance: t.performance,
    lastRev: t.lastRev,
    nextRev: t.nextRev,
    quizId:
      typeof t.quizId === "string" && t.quizId.trim().length > 0
        ? t.quizId
        : null,
  }));

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased relative">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Nav */}
        <div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#090d16] border border-slate-800/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-200">
              Planner de Estudos
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 justify-end w-full">
            {/* Campo de Busca */}
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar tópico ou matéria..."
                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <UploadCloud size={14} className="text-indigo-400" />
                <span>Importar Edital</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Plus size={14} />
                <span>Novo conteúdo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Seção de Revisões Pendentes */}
        <section className="mt-6">
          <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Pendentes de hoje
          </h2>
          <PendingSubjects
            onReviewClick={(topic: Topic) => setActiveReviewTopic(topic)}
          />
        </section>

        {/* Header de Metricas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-linear-to-r from-[#090d16] via-[#0c1222] to-[#090d16] border border-white/10 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
              {
                topics.filter(
                  (t: any) => t.firstStudy && t.firstStudy !== "Pendente",
                ).length
              }{" "}
              / {topics.length}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Tópicos Concluídos
              </p>
              <p className="text-xs font-semibold text-slate-200">
                Avanço no Edital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:border-x border-white/10 md:px-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
              {subjects.length}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Disciplinas
              </p>
              <p className="text-xs font-semibold text-slate-200">
                Mapeadas no Plano
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Desempenho Geral
              </p>
              <p className="text-xs font-semibold text-slate-200">
                Média em Questões
              </p>
            </div>
            <span className="text-sm font-mono font-bold text-indigo-400">
              {Math.round(
                topics.reduce(
                  (acc: number, t: any) => acc + (t.performance || 0),
                  0,
                ) / (topics.length || 1),
              )}
              %
            </span>
          </div>
        </div>

        {/* Tabela do Planner */}
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={16} />
            <span className="text-xs text-slate-500">Carregando dados...</span>
          </div>
        ) : (
          <PlannerView
            topics={mappedTopicsForView}
            subjects={subjects}
            searchQuery={searchQuery}
            targetSubjectId={targetSubjectId}
            onReviewClick={(topicId) => {
              const found = topics.find((t) => t.id === topicId);
              if (found) {
                setActiveReviewTopic(found);
                setPerformanceValue(found.performance || 100);
              }
            }}
            onDeleteTopic={handleDeleteTopic}
            onDeleteSubject={handleDeleteSubject}
          />
        )}
      </div>

      {/* ➕ MODAL DE CRIAÇÃO DE CONTEÚDO */}
      <NewContentModal
        isOpen={isCreateModalOpen}
        subjects={subjects}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTopic}
      />

      {/* MODAL EBBINGHAUS */}
      {activeReviewTopic && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400">
                {activeReviewTopic.subject?.name}
              </span>
              <h2 className="text-base font-bold text-slate-100">
                {activeReviewTopic.title}
              </h2>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 flex justify-between font-medium">
                <span>Porcentagem de Acertos:</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {performanceValue}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={performanceValue}
                onChange={(e) => setPerformanceValue(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-950 rounded-lg h-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                disabled={submitting}
                onClick={() => handleReviewSubmission("Bom")}
                className="flex flex-col items-center gap-2 p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 rounded-xl font-bold text-xs cursor-pointer"
              >
                <CheckCircle2 size={20} />
                Bom
              </button>
              <button
                disabled={submitting}
                onClick={() => handleReviewSubmission("Difícil")}
                className="flex flex-col items-center gap-2 p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 text-amber-400 rounded-xl font-bold text-xs cursor-pointer"
              >
                <AlertCircle size={20} />
                Difícil
              </button>
              <button
                disabled={submitting}
                onClick={() => handleReviewSubmission("Errei")}
                className="flex flex-col items-center gap-2 p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 rounded-xl font-bold text-xs cursor-pointer"
              >
                <XCircle size={20} />
                Errei
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveReviewTopic(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAR EDITAL */}
      {isImportModalOpen && (
        <ImportEditalModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={async (data) => {
            console.log("Edital processado com sucesso:", data);
            await refreshData();
          }}
        />
      )}
    </div>
  );
}

// 🟢 Export default envelopado no Suspense Boundary
export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030712] flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-indigo-500" size={20} />
          <span className="text-xs">Carregando planejador...</span>
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}
