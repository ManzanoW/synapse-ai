"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, BookOpen, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export interface PlannerTopic {
  id: string;
  title: string;
  subjectName: string;
  firstStudy?: string;
  performance?: number;
  lastRev?: string | Date | null;
  nextRev?: string | Date | null;
}

export interface PlannerSubject {
  id: string;
  name: string;
}

interface PlannerViewProps {
  topics: PlannerTopic[];
  subjects: PlannerSubject[];
  searchQuery?: string;
  onReviewClick?: (topicId: string) => void;
  onDeleteTopic?: (topicId: string) => Promise<void> | void;
  onDeleteSubject?: (subjectIdOrName: string) => Promise<void> | void; // 👈 Adicionado
}

const INITIAL_TOPICS_PER_SUBJECT = 5;

export function PlannerView({
  topics,
  subjects,
  searchQuery = "",
  onReviewClick,
  onDeleteTopic,
  onDeleteSubject,
}: PlannerViewProps) {
  // Estado para exclusão de Matéria
  const [subjectToDelete, setSubjectToDelete] = useState<{
    id?: string;
    name: string;
    count: number;
  } | null>(null);

  // Estado para exclusão de Tópico
  const [topicToDelete, setTopicToDelete] = useState<PlannerTopic | null>(null);

  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>("ALL");
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Handler de Exclusão de Tópico
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

  // Handler de Exclusão de Matéria
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

  // Agrupamento e busca em tempo real
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
        if (!groups[subName]) {
          groups[subName] = [];
        }
        groups[subName].push(topic);
      }
    });

    return groups;
  }, [topics, searchQuery]);

  const toggleSubject = (subjectName: string) => {
    setOpenSubjects((prev) => {
      const isCurrentlyOpen = prev[subjectName] ?? false;
      return {
        ...prev,
        [subjectName]: !isCurrentlyOpen,
      };
    });
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

  const availableSubjectNames = Object.keys(groupedData).filter(
    (subjectName) => {
      if (selectedSubjectFilter === "ALL") return true;
      return subjectName === selectedSubjectFilter;
    },
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Barra de Filtro por Matéria */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#090d16] p-4 rounded-2xl border border-slate-800/60 shadow-lg">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Filtrar Matéria:
          </label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
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

        <span className="text-xs text-slate-500">
          Exibindo{" "}
          <strong className="text-slate-300">
            {availableSubjectNames.length}
          </strong>{" "}
          disciplinas
        </span>
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

            const limit = isSearching
              ? subjectTopics.length
              : visibleCounts[subjectName] || INITIAL_TOPICS_PER_SUBJECT;

            const displayedTopics = subjectTopics.slice(0, limit);
            const hasMore = !isSearching && subjectTopics.length > limit;

            return (
              <div
                key={subjectName}
                className="bg-[#090d16] border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
              >
                {/* Header do Acordeão */}
                <button
                  type="button"
                  onClick={() => toggleSubject(subjectName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        {subjectName}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {subjectTopics.length}{" "}
                        {subjectTopics.length === 1 ? "tópico" : "tópicos"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Botão para Deletar a Matéria Inteira */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        // Procura se existe uma matéria cadastrada com esse nome para obter o ID real
                        const foundSub = subjects.find(
                          (s) =>
                            s.name.trim().toLowerCase() ===
                            subjectName.trim().toLowerCase(),
                        );

                        setSubjectToDelete({
                          id: foundSub?.id, // Envia o ID se existir
                          name: subjectName, // Mantém o nome para exibição no modal
                          count: subjectTopics.length,
                        });
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Matéria"
                    >
                      <Trash2 size={15} />
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-900">
                      {isOpen ? "Ocultar" : "Expandir"}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Conteúdo Expandível */}
                {isOpen && (
                  <div className="p-4 pt-0 space-y-2 border-t border-slate-800/40 mt-1">
                    {displayedTopics.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center hover:border-indigo-500/20 transition-all"
                      >
                        <div className="lg:col-span-5">
                          <h4 className="text-xs font-medium text-slate-300">
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

                          {/* Botão de excluir tópico */}
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

                    {/* Botão Ver Mais */}
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dinâmico (Trata deleção de Tópico OU de Matéria) */}
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
