"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Search,
  Filter,
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
import { PageSpotlightBanner, useSpotlight, SpotlightTriggerButton } from "@/components/onboarding/PageSpotlightBanner";
import { useSearchParams } from "next/navigation";
import { triggerHaptic } from "@/lib/sensory/haptics";


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
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
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
  const editalSpotlight = useSpotlight("synapse_spotlight_edital_v1");
  const [manualSpotlightOpen, setManualSpotlightOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsActionsOpen(false);
      }
    }
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
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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

        setTopics(extractedTopics as unknown as Topic[]);
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  // Sincronização em tempo real quando um edital ou matéria é carregado em qualquer lugar
  useEffect(() => {
    const handleEditalSync = () => {
      refreshData();
    };
    window.addEventListener("synapse-edital-updated", handleEditalSync);
    return () => {
      window.removeEventListener("synapse-edital-updated", handleEditalSync);
    };
  }, []);

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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("synapse-edital-updated"));
      }
      await refreshData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  async function handleReviewSubmission(grade: "Bom" | "Difícil" | "Errei") {
    if (!activeReviewTopic) return;
    triggerHaptic(grade === "Errei" ? "warning" : "success");
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
      toast.error(err instanceof Error ? err.message : "Falha na requisição");
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
      toast.error(err instanceof Error ? err.message : "Falha ao deletar tópico");
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
      toast.error(err instanceof Error ? err.message : "Falha ao deletar matéria");
    }
  }

  const allMappedTopics = topics.map((t) => {
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

  const mappedTopicsForView = filterPendingOnly
    ? allMappedTopics.filter(
        (t) =>
          !t.firstStudy ||
          t.firstStudy === "Pendente" ||
          (t.performance ?? 0) < 100,
      )
    : allMappedTopics;

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
              {subjects.length > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {topics.length} tópicos • {subjects.length} matérias
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mapeamento programático com controle de relevância, ciclos de
              revisão e árvore de domínio.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SpotlightTriggerButton
              onClick={() => {
                setManualSpotlightOpen(!manualSpotlightOpen);
                editalSpotlight.toggle();
              }}
              label="Como Funciona?"
              accentColor="indigo"
            />
            <Link
              href="/week"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
              title="Ir para o Cronograma Semanal de Estudos"
            >
              <CalendarDays size={13} className="text-cyan-400" />
              <span>Cronograma Semanal</span>
            </Link>
          </div>
        </div>

        {/* GUIA PASSO A PASSO / TOUR DO EDITAL */}
        <PageSpotlightBanner
          storageKey="synapse_spotlight_edital_v1"
          externalIsOpen={editalSpotlight.isOpen && (subjects.length > 0 || manualSpotlightOpen)}
          onClose={() => {
            setManualSpotlightOpen(false);
            editalSpotlight.dismiss();
          }}
          badgeText="Guia do Edital Verticalizado"
          title="Como funciona o Edital Verticalizado:"
          description="Organize cada linha do conteúdo oficial da sua prova para direcionar seu ciclo de estudos com clareza:"
          accentColor="indigo"
          primaryActionLabel="Entendido"
          steps={[
            {
              icon: <BookOpen className="w-4 h-4" />,
              title: "1. Acompanhe seu Progresso por Matéria",
              description:
                "Visualize todos os tópicos exigidos no concurso com status de estudo, taxa de acerto e ciclo de revisão espaçada.",
              tag: "Visão Geral",
            },
            {
              icon: <Scale className="w-4 h-4" />,
              title: "2. Calibre os Pesos da sua Banca",
              description:
                "Defina o peso e a relevância de cada disciplina para o algoritmo priorizar as matérias de maior impacto na sua nota.",
              tag: "Estratégia",
            },
            {
              icon: <Printer className="w-4 h-4" />,
              title: "3. Imprima ou Importe Novo Edital",
              description:
                "Gere seu Edital A4 para colar na parede ou importe o PDF oficial da sua banca.",
              tag: "Prático & Físico",
            },
          ]}
        />

        {/* Command Bar Consolidada (Linear / macOS Style) - Exibida apenas quando há matérias para pesquisar/gerenciar */}
        {!loading && subjects.length > 0 && (
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
              <div role="tablist" aria-label="Modo de visualização do edital" className="inline-flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "table"}
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
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
                  role="tab"
                  aria-selected={viewMode === "skill-tree"}
                  onClick={() => setViewMode("skill-tree")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500 ${
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

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Selecione um edital por carreira ou importe seu concurso"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Carreiras Prontas</span>
                <span className="sm:hidden">Carreiras</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                title="Exportar Folha A4 Imprimível do Edital para colar na parede"
              >
                <Printer size={14} className="text-cyan-400" />
                <span className="hidden sm:inline">Imprimir Edital A4 (Parede)</span>
                <span className="sm:hidden">Imprimir A4</span>
              </button>

              <div className="relative z-30" ref={actionsMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isActionsOpen}
                  aria-label="Mais opções do edital"
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className={`flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
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
                  <div
                    role="menu"
                    aria-label="Mais ações do edital"
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090d16] border border-slate-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsCalibrateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-colors text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Scale size={14} className="text-amber-400" />
                      <span>Calibrar Pesos Oficiais</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsActionsOpen(false);
                        setIsPrintModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      <Printer size={14} className="text-cyan-400" />
                      <span>Imprimir Edital (Checklist A4)</span>
                    </button>

                    <Link
                      href="/trilhas"
                      role="menuitem"
                      onClick={() => setIsActionsOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <BookOpen size={14} className="text-indigo-400" />
                      <span>Abrir Trilha & Teorias</span>
                    </Link>

                  </div>
                )}
              </div>

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
        )}

        {/* Header de Métricas Globais (Cards de KPIs Executivos) - Exibido apenas quando há disciplinas cadastradas */}
        {!loading && subjects.length > 0 && (
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
                      Baseado no histórico de revisões e simulados resolvidos
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* DIRETÓRIO EXECUTIVO DE EDITAIS (ESTRUTURA SPLIT-PANE + IDENTIDADE SYNAPSE AI) */}
        {!loading && subjects.length === 0 && (
          <div className="space-y-5 pt-2">
            {/* Barra de Ação Primária com Identidade Synapse AI */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-y border-slate-800/80 py-4">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Selecione uma Grade Oficial ou Importe seu Documento
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha a carreira ao lado para carregar as disciplinas com pesos calibrados ou envie o PDF do seu concurso.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-950/50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <UploadCloud size={14} />
                  <span>Importar PDF / Diário Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Disciplina Manual</span>
                </button>
              </div>
            </div>

            {/* Diretório Split-Pane de Carreiras e Editais */}
            <StarterEditalSelector
              onSuccess={() => refreshData()}
              showCustomLink={false}
              hideHeader={true}
            />
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
          title="Registrar Avaliação de Revisão"
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
                type="button"
                disabled={submitting}
                onClick={() => handleReviewSubmission("Bom")}
                className="flex flex-col items-center justify-center gap-2 p-3.5 min-h-[56px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <CheckCircle2 size={22} />
                <span>Bom</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReviewSubmission("Difícil")}
                className="flex flex-col items-center justify-center gap-2 p-3.5 min-h-[56px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <AlertCircle size={22} />
                <span>Difícil</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReviewSubmission("Errei")}
                className="flex flex-col items-center justify-center gap-2 p-3.5 min-h-[56px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-400"
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
