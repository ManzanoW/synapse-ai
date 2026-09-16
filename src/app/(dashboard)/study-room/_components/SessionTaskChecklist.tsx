"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from "lucide-react";

export interface SessionTask {
  id: string;
  text: string;
  completed: boolean;
}

interface SessionTaskChecklistProps {
  tasks: SessionTask[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function SessionTaskChecklist({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: SessionTaskChecklistProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddTask(inputText.trim());
    setInputText("");
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ListTodo size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Micro-Metas do Bloco
            </h3>
            <p className="text-xs text-slate-400">
              O que você vai dominar nesta sessão?
            </p>
          </div>
        </div>

        {tasks.length > 0 && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {completedCount}/{tasks.length} concluídas
          </span>
        )}
      </div>

      {/* Input de Adicionar Tarefa */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ex: Resolver 15 questões de Atos Administrativos..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </form>

      {/* Lista de Tarefas */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs italic">
            Nenhuma meta definida ainda. Defina uma micro-meta clara para manter foco laser.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                task.completed
                  ? "bg-slate-950/30 border-slate-800/40 text-slate-500"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-200"
              }`}
            >
              <button
                onClick={() => onToggleTask(task.id)}
                className="flex items-center gap-2.5 text-left flex-1 min-w-0"
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
                onClick={() => onDeleteTask(task.id)}
                className="text-slate-600 hover:text-rose-400 p-1 transition-colors shrink-0"
                title="Remover meta"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
