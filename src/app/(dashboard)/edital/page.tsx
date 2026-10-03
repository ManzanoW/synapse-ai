"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Scale,
  CalendarDays,
  Printer,
  MoreHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import PendingSubjects from "./PendingSubjects";
import { Topic } from "@/types";
import { ImportEditalModal } from "@/components/edital/import-edital-modal";
import { CalibrateWeightsModal } from "@/components/edital/calibrate-weights-modal";
import { PrintableEditalModal } from "@/components/edital/PrintableEditalModal";
import { PlannerView } from "@/components/edital/planner-table";
import { EditalSkillTree } from "@/components/edital/edital-skill-tree";
import { NewContentModal } from "@/components/create-subject-modal";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StarterEditalSelector } from "@/components/edital/StarterEditalSelector";
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
  weight?: number;
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
  // Modal de Calibrar Pesos
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  // Modal de Impressão do Edital Verticalizado
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  // Modo de visualização: Tabela vs Árvore RPG
  const [viewMode, setViewMode] = useState<"table" | "skill-tree">("table");
  // Menu de Mais Ações
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(event.target as Node)
      ) {
        setIsActionsOpen(false);
      }
    }
    if (isActionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionsOpen]);

  // Auto-abrir modal de importação se vier do dashboard com ?import=true
  useEffect(() => {
    if (searchParams.get("import") === "true") {
      setIsImportModalOpen(true);
    }
  }, [searchParams]);

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

  async function handleCreateTopic(data: {
    title: string;
    subjectName: string;
    weight: string;
  }) {
    try {
      const parsedWeight = parseFloat(data.weight.split("/")[0]) || 5.0;
      const response = await fetch("/api/edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          title: data.title,
          subjectName: data.subjectName,
          relevance: data.weight,
          weight: parsedWeight,
        }),
      });

      if (!response.ok) throw new Error("Erro ao criar novo conteúdo.");

      setIsCreateModalOpen(false);
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

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
    <div className="min-h-screen bg-[#030712] text-slate-100 p-3.5 sm:p-6 font-sans antialiased relative">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        {/* Header com Breadcrumb Executivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors flex items-center gap-1 group"
              >
                <ArrowLeft
                  size={13}
                  className="transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-white"
                />
                <span>Dashboard</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 font-medium">
                Edital Verticalizado
              </span>
            </nav>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Edital Verticalizado
              </h1>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {topics.length} tópicos • {subjects.length} matérias
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mapeamento programático com controle de relevância, ciclos de
              revisão e árvore de domínio.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/week"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="Ir para o Cronograma Semanal de Estudos"
            >
              <CalendarDays size={13} className="text-cyan-400" />
              <span>Cronograma Semanal</span>
            </Link>
          </div>
        </div>

        {/* Command Bar Consolidada (Linear / macOS Style) */}
        <div className="relative z-30 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[#090d16]/90 border border-slate-800/80 p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar tópico ou matéria..."
              className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded-md cursor-pointer"
                title="Limpar busca"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Mode & Actions Group */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            {subjects.length > 0 && (
              <div className="inline-flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "table"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Exibir edital em formato de tabela"
                >
                  <BookOpen size={13} />
                  <span>Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("skill-tree")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "skill-tree"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm shadow-cyan-500/25"
                      : "text-slate-400 hover:text-cyan-300"
                  }`}
                  title="Exibir edital em formato de Árvore de Domínio RPG"
                >
                  <Sparkles
                    size={13}
                    className={
                      viewMode === "skill-tree"
                        ? "text-cyan-300"
                        : "text-slate-400"
                    }
                  />
                  <span>Árvore RPG</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                    NOVO
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
              title="Escolha uma carreira pronta ou gere uma personalizada com IA"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Carreiras & IA</span>
              <span className="sm:hidden">Carreiras</span>
            </button>

            {subjects.length > 0 && (
              <div className="relative z-30" ref={actionsMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className={`flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                    isActionsOpen
                      ? "border-indigo-500/50 bg-slate-800 text-white"
                      : "border-slate-800"
                  }`}
                  title="Opções de impressão, calibração e exportação"
                >
                  <MoreHorizontal size={14} />
                  <span className="hidden md:inline">Mais Ações</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      isActionsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isActionsOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090d16] border border-slate-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsCalibrateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Scale size={14} className="text-amber-400" />
                      <span>Calibrar Pesos Oficiais</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsPrintModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Printer size={14} className="text-cyan-400" />
                      <span>Imprimir Edital (Checklist A4)</span>
                    </button>

                    <Link
                      href="/week"
                      onClick={() => setIsActionsOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors text-left cursor-pointer"
                    >
                      <CalendarDays size={14} className="text-emerald-400" />
                      <span>Distribuir no Cronograma</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Novo conteúdo</span>
            </button>
          </div>
        </div>

        {/* Header de Métricas Globais (Cards de KPIs Executivos) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#090d16]/90 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Avanço no Edital
              </span>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {Math.round(
                  (topics.filter(
                    (t) => t.firstStudy && t.firstStudy !== "Pendente",
                  ).length /
                    (topics.length || 1)) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {
                  topics.filter(
                    (t) => t.firstStudy && t.firstStudy !== "Pendente",
                  ).length
                }
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {topics.length} tópicos concluídos
              </span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (topics.filter(
                        (t) => t.firstStudy && t.firstStudy !== "Pendente",
                      ).length /
                        (topics.length || 1)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-[#090d16]/90 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Disciplinas
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Mapeadas
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {subjects.length}
              </span>
              <span className="text-xs text-slate-500">
                disciplinas ativas no plano
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 truncate">
              {subjects
                .slice(0, 3)
                .map((s) => s.name)
                .join(" • ")}
              {subjects.length > 3 ? ` +${subjects.length - 3}` : ""}
            </p>
          </div>

          <div className="bg-[#090d16]/90 border border-slate-800/80 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            {(() => {
              const avgPerf = Math.round(
                topics.reduce(
                  (acc: number, t) => acc + (t.performance || 0),
                  0,
                ) / (topics.length || 1),
              );
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Desempenho Geral
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        avgPerf >= 70
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : avgPerf >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {avgPerf >= 70
                        ? "Forte"
                        : avgPerf >= 50
                          ? "Em Evolução"
                          : "Reforço"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {avgPerf}%
                    </span>
                    <span className="text-xs text-slate-500">
                      média em questões e revisões
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    Baseado no histórico SM-2 e simulados resolvidos
                  </p>
                </>
              );
            })()}
          </div>
        </div>

        {/* GUIA DIDÁTICO QUANDO NÃO HÁ MATÉRIAS */}
        {!loading && subjects.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-linear-to-br from-[#090d19] via-[#050812] to-[#020409] p-5 sm:p-8 shadow-2xl">
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative z-10 max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
                <Sparkles size={14} className="animate-pulse" />
                <span>Como cadastrar seu Edital em segundos</span>
              </div>

              <div>
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  Importe as matérias do seu Concurso com IA
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Não perca tempo criando tópico por tópico manualmente. Você só
                  precisa copiar o texto do edital em PDF e colar no Synapse.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-indigo-400">
                    <BookOpen size={16} />
                    <span className="font-mono text-xs font-black text-slate-500">
                      01
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Abra seu Edital PDF
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Vá até a seção de Conteúdo Programático.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-cyan-400">
                    <Copy size={16} />
                    <span className="font-mono text-xs font-black text-slate-500">
                      02
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Copie o Texto Bruto
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Copie todo o bloco de disciplinas sem formatar.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400">
                    <Sparkles size={16} />
                    <span className="font-mono text-xs font-black text-slate-500">
                      03
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    A IA Mapeia Tudo
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Cole no Synapse para gerar seu plano.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 text-xs font-extrabold text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <UploadCloud size={16} />
                  <span>Importar meu Edital em PDF / Texto</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* MODELOS PRONTOS EM 1 CLIQUE */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Ou Escolha um Modelo Pronto por Carreira (1 Clique):
                  </span>
                </div>
                <StarterEditalSelector
                  onSuccess={() => refreshData()}
                  showCustomLink={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabela do Planner ou Árvore de Domínio RPG */}
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-indigo-500" size={16} />
            <span className="text-xs text-slate-500">Carregando dados...</span>
          </div>
        ) : (
          subjects.length > 0 && (
            viewMode === "skill-tree" ? (
              <EditalSkillTree
                subjects={subjects}
                topics={mappedTopicsForView}
                onReviewClick={(topicId) => {
                  const found = topics.find((t) => t.id === topicId);
                  if (found) {
                    setActiveReviewTopic(found);
                    setPerformanceValue(found.performance || 100);
                  }
                }}
              />
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
                onSubjectUpdated={refreshData}
              />
            )
          )
        )}
      </div>

      <NewContentModal
        isOpen={isCreateModalOpen}
        subjects={subjects}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTopic}
      />

      {/* 📱 REVISÃO SM-2 EM BOTTOM SHEET NO MOBILE */}
      {activeReviewTopic && (
        <BottomSheet
          isOpen={!!activeReviewTopic}
          onClose={() => setActiveReviewTopic(null)}
          title="Registrar Avaliação SM-2"
        >
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400">
                {activeReviewTopic.subject?.name || "Geral"}
              </span>
              <h2 className="text-base font-bold text-slate-100">
                {activeReviewTopic.title}
              </h2>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
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
                className="w-full accent-indigo-500 bg-slate-950 rounded-lg h-2 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                disabled={submitting}
                onClick={() => handleReviewSubmission("Bom")}
                className="flex flex-col items-center justify-center gap-2 p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 size={22} />
                <span>Bom</span>
              </button>
              <button
                disabled={submitting}
                onClick={() => handleReviewSubmission("Difícil")}
                className="flex flex-col items-center justify-center gap-2 p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                <AlertCircle size={22} />
                <span>Difícil</span>
              </button>
              <button
                disabled={submitting}
                onClick={() => handleReviewSubmission("Errei")}
                className="flex flex-col items-center justify-center gap-2 p-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                <XCircle size={22} />
                <span>Errei</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {isImportModalOpen && (
        <ImportEditalModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={async () => {
            await refreshData();
          }}
        />
      )}

      <CalibrateWeightsModal
        isOpen={isCalibrateModalOpen}
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          weight: s.weight,
          topicsCount: s._count?.topics || s.topics?.length || 0,
        }))}
        onClose={() => setIsCalibrateModalOpen(false)}
        onSuccess={async () => {
          await refreshData();
        }}
      />

      <PrintableEditalModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        subjects={subjects}
        topics={mappedTopicsForView}
      />
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
