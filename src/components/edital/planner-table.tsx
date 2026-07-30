"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Trash2,
  ChevronsUpDown,
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
}

export interface PlannerSubject {
  id: string;
  name: string;
  color?: string | null;
}

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
      const matchesSearch =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        subName.toLowerCase().includes(query);

      if (matchesSearch) {
        if (!groups[subName]) groups[subName] = [];
        groups[subName].push(topic);
      }
    });

    return groups;
  }, [topics, searchQuery]);

  const availableSubjectNames = Object.keys(groupedData).filter(
    (subjectName) => {
      if (selectedSubjectFilter === "ALL") return true;
      return subjectName === selectedSubjectFilter;
    },
  );

  // Métricas Globais para a Barra Topo
  const totalTopics = topics.length;
  const totalCompleted = topics.filter(
    (t) => t.firstStudy && t.firstStudy !== "Pendente",
  ).length;
  const globalProgress =
    totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  const toggleAllSubjects = () => {
    const areAllOpen = availableSubjectNames.every(
      (name) => openSubjects[name],
    );
    const newState: Record<string, boolean> = {};
    availableSubjectNames.forEach((name) => {
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
      return "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
    return "text-slate-500 bg-slate-950 border-slate-900";
  };

  const isSearching = searchQuery.trim().length > 0;

  React.useEffect(() => {
    if (!targetSubjectId || subjects.length === 0) return;

    const matchedSubject = subjects.find((s) => s.id === targetSubjectId);

    if (matchedSubject) {
      const subjectName = matchedSubject.name;

      // 1. Primeiro abre o acordeão
      const timerState = setTimeout(() => {
        setOpenSubjects((prev) => ({
          ...prev,
          [subjectName]: true,
        }));
      }, 50);

      // 2. Espera a animação de abertura do DOM e rola a tela até o elemento
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
      {/* Barra de Filtro e Métricas Globais */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#090d16] p-4 rounded-2xl border border-slate-800/60 shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Filtrar Matéria:
          </label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">
              Todas as Matérias ({Object.keys(groupedData).length})
            </option>
            {Object.keys(groupedData).map((subName) => (
              <option key={subName} value={subName}>
                {subName} ({groupedData[subName].length})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
          {/* Progresso Geral */}
          <div className="hidden md:flex items-center gap-2 border-r border-slate-800/80 pr-4">
            <span className="text-xs text-slate-400 font-medium">
              Progresso Geral:
            </span>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {globalProgress}%
            </span>
          </div>

          <button
            onClick={toggleAllSubjects}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80 transition-colors cursor-pointer"
          >
            <ChevronsUpDown size={14} />
            <span>Expandir / Ocultar Tudo</span>
          </button>

          <span className="text-xs text-slate-500">
            <strong className="text-slate-300">
              {availableSubjectNames.length}
            </strong>{" "}
            disciplinas
          </span>
        </div>
      </div>

      {/* Lista de Acordeões por Disciplina */}
      <div className="space-y-3">
        {availableSubjectNames.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
            {isSearching
              ? `Nenhum tópico encontrado para "${searchQuery}".`
              : "Nenhum tópico cadastrado."}
          </div>
        ) : (
          availableSubjectNames.map((subjectName) => {
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

            return (
              <div
                key={subjectName}
                id={
                  matchedSubject
                    ? `subject-card-${matchedSubject.id}`
                    : undefined
                }
                className="bg-[#090d16] border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 relative group hover:border-slate-700/80"
              >
                {/* 🌟 Barra Neon Sem Interferir no Fluxo do Layout */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 z-10"
                  style={{
                    backgroundColor: subColor,
                    boxShadow: `0 0 10px ${subColor}80`,
                  }}
                />

                {/* Header do Acordeão */}
                <button
                  type="button"
                  onClick={() => toggleSubject(subjectName)}
                  className="w-full flex items-center justify-between p-4 pl-5 hover:bg-slate-900/30 transition-colors cursor-pointer text-left gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${subColor}15`,
                        border: `1px solid ${subColor}35`,
                        color: subColor,
                        boxShadow: `0 0 12px ${subColor}10`,
                      }}
                    >
                      <BookOpen size={16} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-slate-100 truncate tracking-tight group-hover:text-white">
                        {subjectName}
                      </h3>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          {subjectTopics.length}{" "}
                          {subjectTopics.length === 1 ? "tópico" : "tópicos"}
                        </span>

                        <span className="text-slate-700 text-[10px]">•</span>

                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                            <div
                              className="h-full transition-all duration-500 rounded-full"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor: subColor,
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-mono font-bold"
                            style={{
                              color: progressPercent > 0 ? subColor : "#64748b",
                            }}
                          >
                            {progressPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubjectToDelete({
                          id: matchedSubject?.id,
                          name: subjectName,
                          count: subjectTopics.length,
                        });
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Matéria"
                    >
                      <Trash2 size={15} />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                      <span>{isOpen ? "Ocultar" : "Expandir"}</span>
                      {isOpen ? (
                        <ChevronDown size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Conteúdo Expandível Isolado */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out box-border"
                  style={{
                    maxHeight: isOpen ? "2000px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    borderTop: isOpen
                      ? "1px solid rgba(30, 41, 59, 0.4)"
                      : "1px solid transparent",
                  }}
                >
                  <div className="p-4 space-y-2">
                    {displayedTopics.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center hover:border-slate-800 transition-all box-border"
                      >
                        <div className="lg:col-span-5 flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: subColor }}
                          />
                          <h4 className="text-xs font-medium text-slate-300 truncate">
                            {t.title}
                          </h4>
                        </div>

                        <div className="lg:col-span-2 flex justify-start lg:justify-center">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-md border font-medium ${getStatusColor(
                              t.firstStudy,
                            )}`}
                          >
                            {t.firstStudy || "Pendente"}
                          </span>
                        </div>

                        <div className="lg:col-span-1 flex justify-start lg:justify-center">
                          <span className="text-xs font-mono text-slate-400">
                            {t.performance ?? 0}%
                          </span>
                        </div>

                        <div className="lg:col-span-2 flex justify-start lg:justify-center text-[11px] text-slate-500">
                          {t.nextRev
                            ? `Rev: ${new Date(t.nextRev).toLocaleDateString("pt-BR")}`
                            : "--"}
                        </div>

                        <div className="lg:col-span-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onReviewClick && onReviewClick(t.id)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                          >
                            {t.firstStudy === "Pendente" || !t.firstStudy
                              ? "1º Estudo"
                              : "Revisar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setTopicToDelete(t)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Excluir tópico"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {hasMore &&
                      (() => {
                        const remainingCount = subjectTopics.length - limit;
                        const nextIncrement = Math.min(5, remainingCount);

                        return (
                          <div className="text-center pt-2">
                            <button
                              type="button"
                              onClick={() => showMoreTopics(subjectName)}
                              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors py-1 px-3 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg border border-indigo-500/10 cursor-pointer"
                            >
                              + Mostrar mais {nextIncrement}{" "}
                              {nextIncrement === 1 ? "tópico" : "tópicos"} de{" "}
                              {subjectName}
                            </button>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dinâmico */}
      <ConfirmModal
        isOpen={!!topicToDelete || !!subjectToDelete}
        title={
          subjectToDelete
            ? `Remover Matéria: ${subjectToDelete.name}`
            : "Remover Tópico"
        }
        description={
          subjectToDelete
            ? `Tem certeza que deseja remover a matéria "${subjectToDelete.name}" e TODOS os seus ${subjectToDelete.count} tópicos cadastrados? Essa ação é irreversível.`
            : topicToDelete
              ? `Tem certeza que deseja remover "${topicToDelete.title}"? Esta ação removerá o progresso e o histórico de revisões deste tópico.`
              : ""
        }
        confirmText={
          subjectToDelete ? "Excluir Matéria Toda" : "Excluir Tópico"
        }
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
