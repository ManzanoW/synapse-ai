"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  UploadCloud,
  Plus,
  ChevronDown,
  History,
  Calendar,
  Menu,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import PendingSubjects from "./PendingSubjects";
import { Topic } from "@/types";
import FlashcardModal from "@/components/flashcards/FlashcardModal";

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

  // Form de Criação
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newRelevance, setNewRelevance] = useState("5/10");
  const [performanceValue, setPerformanceValue] = useState<number>(100);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/planner?mode=${viewMode}`);
      if (!response.ok) throw new Error("Falha ao carregar os dados do banco.");
      const json = await response.json();

      if (viewMode === "topics") {
        setTopics(json.data || []);
      } else {
        setSubjects(json.data || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    const doFetch = async () => {
      try {
        const response = await fetch(`/api/planner?mode=${viewMode}`);
        if (!response.ok) throw new Error("Falha ao carregar os dados.");
        const json = await response.json();

        if (isMounted) {
          if (viewMode === "topics") {
            setTopics(json.data || []);
          } else {
            setSubjects(json.data || []);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      isMounted = false;
    };
  }, [viewMode]);

  // 📝 Criação de Novo Tópico/Matéria no Banco
  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newSubjectName.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE", // Flag para o back-end saber que é uma criação
          title: newTitle,
          subjectName: newSubjectName,
          relevance: newRelevance,
        }),
      });

      if (!response.ok) throw new Error("Erro ao criar novo conteúdo.");

      // Limpa formulário e fecha modal
      setNewTitle("");
      setNewSubjectName("");
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSubmitting(false);
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
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha na requisição");
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "Concluído" || status === "Em Revisão")
      return "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
    return "text-slate-500 bg-slate-950 border-slate-900";
  };

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${viewMode === "topics" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Tópicos
              </button>
              <button
                onClick={() => setViewMode("subjects")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${viewMode === "subjects" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
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
              <button className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 text-xs font-medium px-4 py-2 rounded-xl transition-colors">
                <UploadCloud size={14} className="text-indigo-400" />
                <span>Importar Edital</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10"
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
          <div className="space-y-3">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="col-span-4 text-left">Conteúdo</div>
              <div className="col-span-2 text-center">1º Estudo</div>
              <div className="col-span-1 text-center">Desemp.</div>
              <div className="col-span-2 text-center">Última Rev.</div>
              <div className="col-span-1 text-center">Próx. Rev.</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-indigo-500" size={16} />
                <span className="text-xs text-slate-500">
                  Buscando do Supabase...
                </span>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                Nenhum tópico cadastrado no momento. Clique em &quot;+ Novo
                conteúdo&quot; para testar!
              </div>
            ) : (
              filteredTopics.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#090d16] border border-slate-800/60 rounded-xl p-5 grid grid-cols-12 gap-4 items-center hover:border-indigo-500/30 transition-all"
                >
                  {/* COLUNA 1: Título e Matéria (4) */}
                  <div className="col-span-4 flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">
                      {t.title}
                    </h3>
                    <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-full w-fit">
                      {t.subject?.name}
                    </span>
                  </div>

                  {/* COLUNA 2: 1º Estudo (2) */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`text-[11px] px-3 py-1 rounded-md border font-medium ${getStatusColor(t.firstStudy)}`}
                    >
                      {t.firstStudy}
                    </span>
                  </div>

                  {/* COLUNA 3: Desempenho (1) */}
                  <div className="col-span-1 flex justify-center">
                    <span className="text-xs font-mono text-slate-400">
                      {t.performance}%
                    </span>
                  </div>

                  {/* COLUNA 4: Última Revisão (2) - O QUE FALTAVA */}
                  <div className="col-span-2 flex justify-center text-xs text-slate-500">
                    {t.lastRev
                      ? new Date(t.lastRev).toLocaleDateString("pt-BR")
                      : "--"}
                  </div>

                  {/* COLUNA 5: Próxima Revisão (1) */}
                  <div className="col-span-1 flex justify-center text-xs text-slate-500">
                    {t.nextRev
                      ? new Date(t.nextRev).toLocaleDateString("pt-BR")
                      : "--"}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-3">
                    {t.flashcards && t.flashcards.length > 0 && (
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                        {t.flashcards.length} cards
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setActiveReviewTopic(t);
                        setPerformanceValue(t.performance || 100);
                      }}
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-md shadow-indigo-600/10"
                    >
                      {t.firstStudy === "Pendente" ? "1º Estudo" : "Revisar"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Renderização de Matérias */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Matéria</div>
              <div className="col-span-9 text-right">Tópicos Relacionados</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-indigo-500" size={16} />{" "}
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
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateTopic}
            className="bg-[#090d16] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Adicionar Novo Conteúdo
              </h2>
              <p className="text-xs text-slate-400">
                Insira as informações do edital para indexar no Planner.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Nome do Tópico / Conteúdo:
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Teoria da Enfermagem, Crase, Equações..."
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Matéria Relacionada:
              </label>
              <input
                type="text"
                required
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Ex: Enfermagem, Português, Matemática..."
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                Relevância / Peso no Edital:
              </label>
              <select
                value={newRelevance}
                onChange={(e) => setNewRelevance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="1/10">1/10 - Muito Baixa</option>
                <option value="3/10">3/10 - Baixa</option>
                <option value="5/10">5/10 - Média</option>
                <option value="7/10">7/10 - Alta</option>
                <option value="9/10">9/10 - Altíssima</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                <span>Salvar Conteúdo</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
    </div>
  );
}
