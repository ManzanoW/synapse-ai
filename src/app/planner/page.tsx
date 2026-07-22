"use client";

import React, { useState, useEffect } from "react";
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
import { ImportEditalModal } from "@/components/planner/import-edital-modal";
import { PlannerView } from "@/components/planner/planner-table";
import { NewContentModal } from "@/components/create-subject-modal";

interface Subject {
  id: string;
  name: string;
  importance?: string;
  priority?: string;
  _count: {
    topics: number;
  };
}

export default function PlannerPage() {
  const [viewMode, setViewMode] = useState<"topics" | "subjects">("topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para Revisão Ebbinghaus
  const [activeReviewTopic, setActiveReviewTopic] = useState<Topic | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [performanceValue, setPerformanceValue] = useState<number>(100);

  // Modal de Importar Edital
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 🔄 Recarregamento manual em segundo plano (para chamadas após ações nos modais/botões)
  async function refreshData() {
    try {
      const response = await fetch(`/api/planner?mode=${viewMode}`);
      if (!response.ok) return;
      const json = await response.json();

      if (viewMode === "topics") {
        setTopics(json.data || []);
        const subjectsRes = await fetch(`/api/planner?mode=subjects`);
        if (subjectsRes.ok) {
          const subjectsJson = await subjectsRes.json();
          setSubjects(subjectsJson.data || []);
        }
      } else {
        setSubjects(json.data || []);
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
    }
  }

  // 🎣 Carregamento inicial sincronizado com a troca de aba
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/planner?mode=${viewMode}`);
        if (!response.ok)
          throw new Error("Falha ao carregar os dados do banco.");
        const json = await response.json();

        if (!isMounted) return;

        if (viewMode === "topics") {
          setTopics(json.data || []);

          const subjectsRes = await fetch(`/api/planner?mode=subjects`);
          if (subjectsRes.ok && isMounted) {
            const subjectsJson = await subjectsRes.json();
            setSubjects(subjectsJson.data || []);
          }
        } else {
          setSubjects(json.data || []);
        }
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
  }, [viewMode]);

  // 📝 Criação de Novo Tópico/Matéria no Banco
  async function handleCreateTopic(data: {
    title: string;
    subjectName: string;
    weight: string;
  }) {
    try {
      const response = await fetch("/api/planner", {
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
      const response = await fetch("/api/planner", {
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

      // Passa true para atualizar os dados em background sem fechar o acordeão!
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha na requisição");
    } finally {
      setSubmitting(false);
    }
  }

  // Função de deleção no PlannerPage
  async function handleDeleteTopic(topicId: string) {
    try {
      const response = await fetch(`/api/planner?id=${topicId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir o tópico.");

      // Atualiza a lista em segundo plano sem piscar os acordeões
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao deletar tópico");
    }
  }

  async function handleDeleteSubject(subjectIdOrName: string) {
    try {
      const response = await fetch(
        `/api/planner?subjectId=${subjectIdOrName}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Erro ao excluir a matéria.");

      await refreshData(); // Recarrega os dados mantendo os acordeões
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao deletar matéria");
    }
  }

  // Mapeamento dos tópicos para o formato exigido pelo PlannerView
  const mappedTopicsForView = topics.map((t) => ({
    id: t.id,
    title: t.title,
    subjectName: t.subject?.name || "Geral",
    firstStudy: t.firstStudy,
    performance: t.performance,
    lastRev: t.lastRev,
    nextRev: t.nextRev,
  }));

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
              {viewMode === "topics"
                ? "Planner de Estudos"
                : "Edital Verticalizado"}
            </h1>
            <div className="flex bg-slate-950 border border-slate-900 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("topics")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "topics"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tópicos
              </button>
              <button
                onClick={() => setViewMode("subjects")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "subjects"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Matérias
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 justify-end w-full">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  viewMode === "topics"
                    ? "Pesquisar tópico..."
                    : "Pesquisar matéria..."
                }
                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

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
                <span>
                  {viewMode === "topics" ? "Novo conteúdo" : "Nova Matéria"}
                </span>
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

        {/* Tabelas de Tópicos / Matérias */}
        {viewMode === "topics" ? (
          loading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 className="animate-spin text-indigo-500" size={16} />
              <span className="text-xs text-slate-500">
                Buscando do Supabase...
              </span>
            </div>
          ) : (
            /* Renderiza a nova visualização filtrada e paginada */
            <PlannerView
              topics={mappedTopicsForView}
              subjects={subjects}
              searchQuery={searchQuery}
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
          )
        ) : (
          <div className="space-y-3">
            {/* Renderização de Matérias */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Matéria</div>
              <div className="col-span-9 text-right">Tópicos Relacionados</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-indigo-500" size={16} />
                <span className="text-xs text-slate-500">
                  Buscando matérias...
                </span>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                Nenhuma matéria criada. Ela surgirá automaticamente ao adicionar
                um conteúdo.
              </div>
            ) : (
              filteredSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-3">
                    <div className="border border-sky-500/30 text-sky-400 bg-sky-500/5 px-3 py-1.5 rounded-xl text-xs font-bold inline-block">
                      {sub.name}
                    </div>
                  </div>
                  <div className="col-span-9 text-right text-xs font-mono text-slate-400">
                    {sub._count?.topics || 0} tópicos vinculados
                  </div>
                </div>
              ))
            )}
          </div>
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
                onClick={() => handleReviewSubmission("Bom")}
                className="flex flex-col items-center gap-2 p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 rounded-xl font-bold text-xs"
              >
                <CheckCircle2 size={20} />
                Bom
              </button>
              <button
                onClick={() => handleReviewSubmission("Difícil")}
                className="flex flex-col items-center gap-2 p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 text-amber-400 rounded-xl font-bold text-xs"
              >
                <AlertCircle size={20} />
                Difícil
              </button>
              <button
                onClick={() => handleReviewSubmission("Errei")}
                className="flex flex-col items-center gap-2 p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 rounded-xl font-bold text-xs"
              >
                <XCircle size={20} />
                Errei
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveReviewTopic(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-300"
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
            await refreshData(); // Atualiza sem desmontar a interface
          }}
        />
      )}
    </div>
  );
}
