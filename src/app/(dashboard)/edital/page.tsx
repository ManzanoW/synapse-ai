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
  BookOpen,
  Copy,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import PendingSubjects from "./PendingSubjects";
import { Topic } from "@/types";
import { ImportEditalModal } from "@/components/edital/import-edital-modal";
import { PlannerView } from "@/components/edital/planner-table";
import { NewContentModal } from "@/components/create-subject-modal";
import { useSearchParams } from "next/navigation";

interface ApiTopic {
  id: string;
  title: string;
  subjectName?: string;
  firstStudy?: string;
  performance?: number;
  lastRev?: string;
  nextRev?: string;
  quizId?: string | null;
  subjectColor?: string;
  subject?: {
    name?: string;
    color?: string;
  };
}

interface ApiSubject {
  id: string;
  name: string;
  importance?: string;
  priority?: string;
  color?: string | null;
  topics?: ApiTopic[];
  _count?: {
    topics: number;
  };
}

function PlannerContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loading, setLoading] = useState(true);
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
        const subjectsData: ApiSubject[] = subjectsJson.data || [];
        setSubjects(subjectsData);

        const extractedTopics = subjectsData.flatMap((sub) =>
          (sub.topics || []).map((t) => ({
            ...t,
            subjectName: sub.name,
            subjectColor: sub.color || t.subjectColor || t.subject?.color,
          })),
        );

        if (extractedTopics.length > 0) {
          setTopics(extractedTopics as unknown as Topic[]);
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
    }
  }

  // 🎣 Carregamento inicial
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const subjectsRes = await fetch(`/api/edital?mode=subjects`, {
          cache: "no-store",
        });
        if (!subjectsRes.ok)
          throw new Error("Falha ao carregar os dados do banco.");

        const subjectsJson = await subjectsRes.json();

        if (!isMounted) return;

        const subjectsData: ApiSubject[] = subjectsJson.data || [];
        setSubjects(subjectsData);

        const extractedTopics = subjectsData.flatMap((sub) =>
          (sub.topics || []).map((t) => ({
            ...t,
            subjectName: sub.name,
            subjectColor: sub.color || t.subjectColor || t.subject?.color,
          })),
        );

        setTopics(extractedTopics as unknown as Topic[]);
      } catch (err: unknown) {
        console.error(
          err instanceof Error ? err.message : "Erro desconhecido ao carregar",
        );
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

  // ✅ CORREÇÃO: Lê 'item.subjectName' prioritariamente antes de tentar 'item.subject?.name' ou fallback "Geral"
  const mappedTopicsForView = topics.map((t) => {
    const item = t as unknown as ApiTopic;
    return {
      id: item.id,
      title: item.title,
      subjectName: item.subjectName || item.subject?.name || "Geral",
      subjectColor: item.subjectColor || item.subject?.color,
      firstStudy: item.firstStudy,
      performance: item.performance,
      lastRev: item.lastRev,
      nextRev: item.nextRev,
      quizId:
        typeof item.quizId === "string" && item.quizId.trim().length > 0
          ? item.quizId
          : null,
    };
  });

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
                className="flex items-center justify-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.15)]"
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

        {/* Header de Métricas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-linear-to-r from-[#090d16] via-[#0c1222] to-[#090d16] border border-white/10 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
              {
                topics.filter(
                  (t) => t.firstStudy && t.firstStudy !== "Pendente",
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
                  (acc: number, t) => acc + (t.performance || 0),
                  0,
                ) / (topics.length || 1),
              )}
              %
            </span>
          </div>
        </div>

        {/* GUIA DIDÁTICO / EMPTY STATE QUANDO NÃO HÁ MATÉRIAS */}
        {!loading && subjects.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-linear-to-br from-[#090d19] via-[#050812] to-[#020409] p-6 md:p-8 shadow-2xl">
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative z-10 max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
                <Sparkles size={14} className="animate-pulse" />
                <span>Como cadastrar seu Edital em segundos</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-tight md:text-2xl">
                  Importe as matérias do seu Concurso com IA
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Não perca tempo criando tópico por tópico manualmente. Você só
                  precisa copiar o texto do edital em PDF e colar no Synapse.
                </p>
              </div>

              {/* Passos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-indigo-400">
                    <BookOpen size={18} />
                    <span className="font-mono text-xs font-black text-slate-500">
                      01
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Abra seu Edital PDF
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Vá até a seção de <strong>Conteúdo Programático</strong> ou{" "}
                    <strong>Conhecimentos Específicos</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-cyan-400">
                    <Copy size={18} />
                    <span className="font-mono text-xs font-black text-slate-500">
                      02
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Copie o Texto Bruto
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Selecione e copie todo o bloco de disciplinas sem se
                    preocupar com formatação.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400">
                    <Sparkles size={18} />
                    <span className="font-mono text-xs font-black text-slate-500">
                      03
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    A IA Mapeia Tudo
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Cole no Synapse! Nossa IA extrai matérias, organiza tópicos
                    e gera o plano de estudos.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <UploadCloud size={16} />
                  <span>Importar meu Edital Agora</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabela do Planner */}
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={16} />
            <span className="text-xs text-slate-500">Carregando dados...</span>
          </div>
        ) : (
          subjects.length > 0 && (
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
          )
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
          onImportSuccess={async () => {
            await refreshData();
          }}
        />
      )}
    </div>
  );
}

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
