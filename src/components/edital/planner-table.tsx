"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Trash2,
  ChevronsUpDown,
  Sparkles,
  Play,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export interface PlannerTopic {
  id: string;
  title: string;
  subjectName: string;
  subjectColor?: string | null;
  firstStudy?: string;
  performance?: number;
  lastRev?: string | Date | null;
  nextRev?: string | Date | null;
  quizId?: string | null;
}

export interface PlannerSubject {
  id: string;
  name: string;
  color?: string | null;
}

export type SortOption =
  "NAME_ASC" | "NAME_DESC" | "PROGRESS_DESC" | "PROGRESS_ASC" | "TOPICS_DESC";

interface PlannerViewProps {
  topics: PlannerTopic[];
  subjects: PlannerSubject[];
  searchQuery?: string;
  targetSubjectId?: string | null;
  onReviewClick?: (topicId: string) => void;
  onDeleteTopic?: (topicId: string) => Promise<void> | void;
  onDeleteSubject?: (subjectIdOrName: string) => Promise<void> | void;
}

const INITIAL_TOPICS_PER_SUBJECT = 5;

export function PlannerView({
  topics,
  subjects,
  searchQuery = "",
  targetSubjectId,
  onReviewClick,
  onDeleteTopic,
  onDeleteSubject,
}: PlannerViewProps) {
  const [subjectToDelete, setSubjectToDelete] = useState<{
    id?: string;
    name: string;
    count: number;
  } | null>(null);

  const [topicToDelete, setTopicToDelete] = useState<PlannerTopic | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NAME_ASC");

  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeleteTopic = async () => {
    if (!topicToDelete || !onDeleteTopic) return;
    try {
      setIsDeleting(true);
      await onDeleteTopic(topicToDelete.id);
    } finally {
      setIsDeleting(false);
      setTopicToDelete(null);
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete || !onDeleteSubject) return;
    try {
      setIsDeleting(true);
      const target = subjectToDelete.id || subjectToDelete.name;
      await onDeleteSubject(target);
    } finally {
      setIsDeleting(false);
      setSubjectToDelete(null);
    }
  };

  const groupedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const groups: Record<string, PlannerTopic[]> = {};

    topics.forEach((topic) => {
      const subName = topic.subjectName || "Geral";
      const topicStatus = topic.firstStudy || "Pendente";

      const matchesSearch =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        subName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDENTE" &&
          (topicStatus === "Pendente" || !topic.firstStudy)) ||
        (statusFilter === "EM_REVISAO" &&
          (topicStatus === "Em Revisão" || topicStatus === "Em Estudo")) ||
        (statusFilter === "CONCLUIDO" && topicStatus === "Concluído") ||
        (statusFilter === "WITH_QUIZ" && Boolean(topic.quizId));

      if (matchesSearch && matchesStatus) {
        if (!groups[subName]) groups[subName] = [];
        groups[subName].push(topic);
      }
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    });

    return groups;
  }, [topics, searchQuery, statusFilter]);

  const sortedSubjectNames = useMemo(() => {
    const names = Object.keys(groupedData).filter((subjectName) => {
      if (selectedSubjectFilter === "ALL") return true;
      return subjectName === selectedSubjectFilter;
    });

    return names.sort((a, b) => {
      const topicsA = groupedData[a] || [];
      const topicsB = groupedData[b] || [];

      const completedA = topicsA.filter(
        (t) => t.firstStudy && t.firstStudy !== "Pendente",
      ).length;
      const completedB = topicsB.filter(
        (t) => t.firstStudy && t.firstStudy !== "Pendente",
      ).length;

      const progressA =
        topicsA.length > 0 ? (completedA / topicsA.length) * 100 : 0;
      const progressB =
        topicsB.length > 0 ? (completedB / topicsB.length) * 100 : 0;

      switch (sortBy) {
        case "NAME_DESC":
          return b.localeCompare(a, "pt-BR");
        case "PROGRESS_DESC":
          return progressB - progressA;
        case "PROGRESS_ASC":
          return progressA - progressB;
        case "TOPICS_DESC":
          return topicsB.length - topicsA.length;
        case "NAME_ASC":
        default:
          return a.localeCompare(b, "pt-BR");
      }
    });
  }, [groupedData, selectedSubjectFilter, sortBy]);

  const toggleAllSubjects = () => {
    const areAllOpen = sortedSubjectNames.every((name) => openSubjects[name]);
    const newState: Record<string, boolean> = {};
    sortedSubjectNames.forEach((name) => {
      newState[name] = !areAllOpen;
    });
    setOpenSubjects(newState);
  };

  const toggleSubject = (subjectName: string) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [subjectName]: !(prev[subjectName] ?? false),
    }));
  };

  const showMoreTopics = (subjectName: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [subjectName]: (prev[subjectName] || INITIAL_TOPICS_PER_SUBJECT) + 5,
    }));
  };

  const getStatusColor = (status?: string) => {
    if (status === "Concluído" || status === "Em Revisão")
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    return "text-slate-400 bg-slate-900/60 border-slate-800";
  };

  const isSearching = searchQuery.trim().length > 0 || statusFilter !== "ALL";

  React.useEffect(() => {
    if (!targetSubjectId || subjects.length === 0) return;

    const matchedSubject = subjects.find((s) => s.id === targetSubjectId);

    if (matchedSubject) {
      const subjectName = matchedSubject.name;

      const timerState = setTimeout(() => {
        setOpenSubjects((prev) => ({
          ...prev,
          [subjectName]: true,
        }));
      }, 50);

      const timerScroll = setTimeout(() => {
        const element = document.getElementById(
          `subject-card-${matchedSubject.id}`,
        );

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);

      return () => {
        clearTimeout(timerState);
        clearTimeout(timerScroll);
      };
    }
  }, [targetSubjectId, subjects]);

  return (
    <div className="space-y-4 font-sans">
      {/* 🟢 BARRA DE CONTROLADORES FLOATING GLASS RESPONSIVA */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#090d16]/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
          {/* Filtro por Matéria */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-indigo-500">
            <Filter size={13} className="text-indigo-400 shrink-0" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#090d16] text-slate-200">
                Todas Matérias ({Object.keys(groupedData).length})
              </option>
              {Object.keys(groupedData).map((subName) => (
                <option
                  key={subName}
                  value={subName}
                  className="bg-[#090d16] text-slate-200"
                >
                  {subName} ({groupedData[subName].length})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status do Tópico */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-indigo-500">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#090d16] text-slate-200">
                Todos os Status
              </option>
              <option value="PENDENTE" className="bg-[#090d16] text-slate-200">
                Apenas Pendentes
              </option>
              <option
                value="EM_REVISAO"
                className="bg-[#090d16] text-slate-200"
              >
                Em Revisão / Estudo
              </option>
              <option value="WITH_QUIZ" className="bg-[#090d16] text-slate-200">
                Com Simulado
              </option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-indigo-500">
            <ArrowUpDown size={13} className="text-indigo-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-transparent text-slate-200 text-xs outline-none cursor-pointer font-medium"
            >
              <option value="NAME_ASC" className="bg-[#090d16] text-slate-200">
                Ordem (A-Z)
              </option>
              <option value="NAME_DESC" className="bg-[#090d16] text-slate-200">
                Ordem (Z-A)
              </option>
              <option
                value="PROGRESS_DESC"
                className="bg-[#090d16] text-slate-200"
              >
                Maior Progresso
              </option>
              <option
                value="PROGRESS_ASC"
                className="bg-[#090d16] text-slate-200"
              >
                Menor Progresso
              </option>
              <option
                value="TOPICS_DESC"
                className="bg-[#090d16] text-slate-200"
              >
                Mais Tópicos
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end pt-1 lg:pt-0">
          <button
            onClick={toggleAllSubjects}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
          >
            <ChevronsUpDown size={14} />
            <span>Expandir / Ocultar Tudo</span>
          </button>

          <span className="text-xs text-slate-400">
            <strong className="text-white font-bold">
              {sortedSubjectNames.length}
            </strong>{" "}
            disciplinas
          </span>
        </div>
      </div>

      {/* 🟢 LISTA DE DISCIPLINAS PREMIUM */}
      <div className="space-y-3">
        {sortedSubjectNames.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-xs text-slate-400 bg-[#090d16]/40 backdrop-blur-xs">
            Nenhum tópico ou matéria encontrado com os filtros selecionados.
          </div>
        ) : (
          sortedSubjectNames.map((subjectName) => {
            const subjectTopics = groupedData[subjectName];
            const isOpen = isSearching ? true : !!openSubjects[subjectName];

            const matchedSubject = subjects.find(
              (s) =>
                s.name.trim().toLowerCase() ===
                subjectName.trim().toLowerCase(),
            );
            const subColor =
              matchedSubject?.color ||
              subjectTopics[0]?.subjectColor ||
              "#3B82F6";

            const completedTopics = subjectTopics.filter(
              (t) => t.firstStudy && t.firstStudy !== "Pendente",
            ).length;
            const progressPercent = Math.round(
              (completedTopics / subjectTopics.length) * 100,
            );

            const limit = isSearching
              ? subjectTopics.length
              : visibleCounts[subjectName] || INITIAL_TOPICS_PER_SUBJECT;

            const displayedTopics = subjectTopics.slice(0, limit);
            const hasMore = !isSearching && subjectTopics.length > limit;

            const radius = 14;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset =
              circumference - (progressPercent / 100) * circumference;

            return (
              <div
                key={subjectName}
                id={
                  matchedSubject
                    ? `subject-card-${matchedSubject.id}`
                    : undefined
                }
                className="bg-linear-to-br from-[#090d16] via-[#0b101c] to-[#060911] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 relative group shadow-xl"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 z-10"
                  style={{
                    backgroundColor: subColor,
                    boxShadow: `0 0 15px ${subColor}`,
                  }}
                />

                {/* Header do Acordeão */}
                <button
                  type="button"
                  onClick={() => toggleSubject(subjectName)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 pl-4 sm:pl-5 hover:bg-white/2 transition-colors cursor-pointer text-left gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className="p-2 sm:p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${subColor}15`,
                        border: `1px solid ${subColor}35`,
                        color: subColor,
                        boxShadow: `0 0 15px ${subColor}15`,
                      }}
                    >
                      <BookOpen size={16} />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight group-hover:text-white transition-colors">
                        {subjectName}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        {subjectTopics.length}{" "}
                        {subjectTopics.length === 1 ? "tópico" : "tópicos"}
                        {progressPercent === 100 && (
                          <span className="ml-2 text-[9px] sm:text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                            ✓ Concluída
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                    <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="18"
                          cy="18"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-white/5"
                          fill="transparent"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r={radius}
                          stroke={subColor}
                          strokeWidth="2.5"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute text-[8px] sm:text-[9px] font-mono font-bold text-slate-300">
                        {progressPercent}%
                      </span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubjectToDelete({
                          id: matchedSubject?.id,
                          name: subjectName,
                          count: subjectTopics.length,
                        });
                      }}
                      className="p-1.5 sm:p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Excluir Matéria"
                    >
                      <Trash2 size={15} />
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors">
                      <span>{isOpen ? "Ocultar" : "Expandir"}</span>
                      {isOpen ? (
                        <ChevronDown size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Conteúdo Expandível dos Tópicos */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out box-border"
                  style={{
                    maxHeight: isOpen ? "3500px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    borderTop: isOpen
                      ? "1px solid rgba(255, 255, 255, 0.08)"
                      : "1px solid transparent",
                  }}
                >
                  <div className="p-2.5 sm:p-4 space-y-2 bg-black/20">
                    {displayedTopics.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white/2 border border-white/5 hover:border-white/15 rounded-xl p-3 flex flex-col lg:grid lg:grid-cols-12 gap-3 items-start lg:items-center hover:bg-white/4 transition-all"
                      >
                        {/* Linha 1 no Mobile: Título + Badge Status */}
                        <div className="w-full lg:col-span-4 flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: subColor,
                                boxShadow: `0 0 6px ${subColor}`,
                              }}
                            />
                            <h4 className="text-xs font-semibold text-slate-200 truncate">
                              {t.title}
                            </h4>
                          </div>

                          <span
                            className={`lg:hidden text-[9px] px-2 py-0.5 rounded-md border font-semibold shrink-0 ${getStatusColor(
                              t.firstStudy,
                            )}`}
                          >
                            {t.firstStudy || "Pendente"}
                          </span>
                        </div>

                        {/* Coluna Desktop: Status */}
                        <div className="hidden lg:flex lg:col-span-2 justify-center">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-md border font-semibold ${getStatusColor(
                              t.firstStudy,
                            )}`}
                          >
                            {t.firstStudy || "Pendente"}
                          </span>
                        </div>

                        {/* Linha 2 no Mobile / Colunas Desktop: Metadados */}
                        <div className="flex items-center justify-between w-full lg:w-auto lg:col-span-3 text-[11px] text-slate-400 font-medium">
                          <span className="lg:hidden text-slate-500 text-[10px]">
                            Desempenho / Próx. Revisão:
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-300">
                              {t.performance ?? 0}%
                            </span>
                            <span>
                              {t.nextRev
                                ? `Rev: ${new Date(
                                    t.nextRev,
                                  ).toLocaleDateString("pt-BR")}`
                                : "--"}
                            </span>
                          </div>
                        </div>

                        {/* Linha 3 no Mobile / Coluna Desktop: Botões de Ação Ampliados */}
                        <div className="w-full lg:col-span-3 flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t border-white/5 lg:border-none">
                          {t.quizId ? (
                            <Link
                              href={`/questions?quizId=${t.quizId}`}
                              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/15 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 active:scale-95 transition-all shadow-md shadow-emerald-500/10"
                            >
                              <Play
                                size={13}
                                className="text-emerald-400 fill-emerald-400"
                              />
                              <span>Simulado</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/questions?subjectId=${encodeURIComponent(
                                subjectName,
                              )}&topicId=${t.id}`}
                              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500/15 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 active:scale-95 transition-all shadow-md shadow-indigo-500/10"
                            >
                              <Sparkles size={13} className="text-indigo-400" />
                              <span>Praticar IA</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => onReviewClick && onReviewClick(t.id)}
                            className="flex-1 lg:flex-none px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer text-center"
                          >
                            {t.firstStudy === "Pendente" || !t.firstStudy
                              ? "1º Estudo"
                              : "Revisar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setTopicToDelete(t)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Excluir tópico"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {hasMore && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => showMoreTopics(subjectName)}
                          className="w-full sm:w-auto text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all py-2 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/20 cursor-pointer active:scale-95"
                        >
                          + Mostrar mais 5 tópicos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={!!topicToDelete || !!subjectToDelete}
        title={
          subjectToDelete
            ? `Remover Matéria: ${subjectToDelete.name}`
            : "Remover Tópico"
        }
        description={
          subjectToDelete
            ? `Tem certeza que deseja remover "${subjectToDelete.name}" e seus ${subjectToDelete.count} tópicos? Esta ação não pode ser desfeita.`
            : topicToDelete
              ? `Tem certeza que deseja remover "${topicToDelete.title}"?`
              : ""
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
        onConfirm={
          subjectToDelete
            ? handleConfirmDeleteSubject
            : handleConfirmDeleteTopic
        }
        onClose={() => {
          setTopicToDelete(null);
          setSubjectToDelete(null);
        }}
      />
    </div>
  );
}
