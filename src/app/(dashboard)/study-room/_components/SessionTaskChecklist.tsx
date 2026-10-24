"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ListTodo,
  Download,
  BookOpenCheck,
  Sparkles,
  Loader2,
} from "lucide-react";

export interface SessionTask {
  id: string;
  text: string;
  completed: boolean;
  topicId?: string;
  syncedToEdital?: boolean;
}

export interface StudyRoomTopicOption {
  id: string;
  title: string;
  firstStudy: string;
  nextRev: string | null;
  performance: number;
}

interface SessionTaskChecklistProps {
  tasks: SessionTask[];
  subjectName?: string;
  availableTopics?: StudyRoomTopicOption[];
  onAddTask: (text: string, topicId?: string) => void;
  onImportPendingTopics?: () => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSyncTopicToEdital?: (taskId: string, topicId: string) => Promise<void>;
  syncingTaskId?: string | null;
}

export function SessionTaskChecklist({
  tasks,
  subjectName,
  availableTopics = [],
  onAddTask,
  onImportPendingTopics,
  onToggleTask,
  onDeleteTask,
  onSyncTopicToEdital,
  syncingTaskId = null,
}: SessionTaskChecklistProps) {
  const [inputText, setInputText] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddTask(inputText.trim());
    setInputText("");
  };

  const handleAddSelectedTopic = () => {
    if (!selectedTopicId) return;
    const topic = availableTopics.find((t) => t.id === selectedTopicId);
    if (!topic) return;
    onAddTask(`Estudar/Revisar: ${topic.title}`, topic.id);
    setSelectedTopicId("");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingEditalTopicsCount = availableTopics.filter(
    (t) => t.firstStudy !== "Concluido" || (t.nextRev && new Date(t.nextRev) <= new Date()),
  ).length;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ListTodo size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Micro-Metas do Bloco
            </h3>
            <p className="text-xs text-slate-400">
              {subjectName
                ? `Sincronizado com ${subjectName}`
                : "O que você vai dominar nesta sessão?"}
            </p>
          </div>
        </div>

        {tasks.length > 0 && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            {completedCount}/{tasks.length} concluídas
          </span>
        )}
      </div>

      {/* Integração Edital -> Pomodoro */}
      {availableTopics.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Tópicos do Edital ({availableTopics.length})</span>
            </span>

            {onImportPendingTopics && pendingEditalTopicsCount > 0 && (
              <button
                type="button"
                onClick={onImportPendingTopics}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title="Importar automaticamente até 3 tópicos pendentes ou com revisão vencida desta matéria"
              >
                <Download size={12} />
                <span>Puxar Pendentes ({pendingEditalTopicsCount})</span>
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              aria-label="Escolher tópico do edital para a sessão"
              className="flex-1 min-w-0 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
            >
              <option value="">Escolher tópico específico do edital...</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstStudy === "Concluido" ? "✓ " : "⏳ "}
                  {t.title} ({t.firstStudy})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSelectedTopic}
              disabled={!selectedTopicId}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shrink-0 transition-all cursor-pointer"
            >
              Vincular
            </button>
          </div>
        </div>
      )}

      {/* Input de Adicionar Tarefa Livre */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ou digite uma meta livre..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </form>

      {/* Lista de Tarefas */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs italic">
            Nenhuma meta definida ainda. Puxe tópicos do seu edital ou defina uma micro-meta para manter foco laser.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all ${
                task.completed
                  ? "bg-slate-950/30 border-emerald-500/20 text-slate-400"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                >
                  {task.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={16} className="text-slate-500 shrink-0 hover:text-indigo-400" />
                  )}
                  <span
                    className={`text-xs truncate ${
                      task.completed ? "line-through text-slate-500" : ""
                    }`}
                  >
                    {task.text}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="text-slate-600 hover:text-rose-400 p-1 transition-colors shrink-0 cursor-pointer"
                  title="Remover meta"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Badge/Botão de Sincronização com o Edital Verticalizado */}
              {task.topicId && (
                <div className="flex items-center justify-between pl-6 pt-0.5">
                  <span className="text-[10px] font-mono text-indigo-400/90 flex items-center gap-1">
                    <BookOpenCheck size={11} />
                    Vinculado ao Edital
                  </span>

                  {task.syncedToEdital ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      ✓ Concluído no Edital
                    </span>
                  ) : (
                    onSyncTopicToEdital && (
                      <button
                        type="button"
                        onClick={() => onSyncTopicToEdital(task.id, task.topicId!)}
                        disabled={syncingTaskId === task.id}
                        className="text-[10px] font-semibold text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 px-2 py-0.5 rounded-full transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {syncingTaskId === task.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Sincronizando...</span>
                          </>
                        ) : (
                          <span>Marcar Concluído no Edital ✓</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
