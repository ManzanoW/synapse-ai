"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Sparkles,
  RefreshCw,
  FolderSync,
  Layers,
  Mic,
  BookmarkCheck,
} from "lucide-react";

interface LocalDataCounts {
  mindmapsCount: number;
  oralExamsCount: number;
  bookmarksCount: number;
  estimatedSizeKb: number;
}

interface SynapseBackupPayload {
  synapseBackupVersion: string;
  exportedAt: string;
  client: string;
  data: {
    synapse_saved_mindmaps?: unknown[];
    synapse_oral_exam_history?: unknown[];
    synapse_jurisprudence_bookmarks?: Record<string, boolean>;
    synapse_study_room_subject?: string;
  };
}

export function LocalDataBackupCard() {
  const [counts, setCounts] = useState<LocalDataCounts>({
    mindmapsCount: 0,
    oralExamsCount: 0,
    bookmarksCount: 0,
    estimatedSizeKb: 0,
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateCounts = () => {
    try {
      const rawMindmaps = localStorage.getItem("synapse_saved_mindmaps");
      const rawOral = localStorage.getItem("synapse_oral_exam_history");
      const rawBookmarks = localStorage.getItem("synapse_jurisprudence_bookmarks");

      const mindmaps = rawMindmaps ? JSON.parse(rawMindmaps) : [];
      const oral = rawOral ? JSON.parse(rawOral) : [];
      const bookmarks = rawBookmarks ? JSON.parse(rawBookmarks) : {};

      const totalChars =
        (rawMindmaps?.length || 0) +
        (rawOral?.length || 0) +
        (rawBookmarks?.length || 0);
      const estimatedSizeKb = Math.max(1, Math.round(totalChars / 1024));

      setCounts({
        mindmapsCount: Array.isArray(mindmaps) ? mindmaps.length : 0,
        oralExamsCount: Array.isArray(oral) ? oral.length : 0,
        bookmarksCount:
          typeof bookmarks === "object" && bookmarks !== null
            ? Object.keys(bookmarks).length
            : 0,
        estimatedSizeKb,
      });
    } catch {
      // Falha silenciosa caso o storage esteja bloqueado
    }
  };

  useEffect(() => {
    calculateCounts();
  }, []);

  const handleExportBackup = () => {
    try {
      setIsProcessing(true);
      const rawMindmaps = localStorage.getItem("synapse_saved_mindmaps");
      const rawOral = localStorage.getItem("synapse_oral_exam_history");
      const rawBookmarks = localStorage.getItem("synapse_jurisprudence_bookmarks");
      const rawSubject = localStorage.getItem("synapse_study_room_subject");

      const payload: SynapseBackupPayload = {
        synapseBackupVersion: "1.0",
        exportedAt: new Date().toISOString(),
        client: "Synapse AI Platform",
        data: {
          synapse_saved_mindmaps: rawMindmaps ? JSON.parse(rawMindmaps) : [],
          synapse_oral_exam_history: rawOral ? JSON.parse(rawOral) : [],
          synapse_jurisprudence_bookmarks: rawBookmarks ? JSON.parse(rawBookmarks) : {},
          synapse_study_room_subject: rawSubject || undefined,
        },
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const todayStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `synapse-backup-${todayStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: "success",
        message: "Backup exportado com sucesso! Arquivo JSON salvo no dispositivo.",
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "Erro ao gerar arquivo de backup. Tente novamente.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Partial<SynapseBackupPayload>;

        if (!parsed.data || typeof parsed.data !== "object") {
          throw new Error("Formato de backup inválido.");
        }

        let restoredItems = 0;

        // 1. Mapas Mentais
        if (Array.isArray(parsed.data.synapse_saved_mindmaps)) {
          const currentMindmapsRaw = localStorage.getItem("synapse_saved_mindmaps");
          const currentMindmaps = currentMindmapsRaw ? JSON.parse(currentMindmapsRaw) : [];
          // Mescla sem duplicar por ID
          const existingIds = new Set(currentMindmaps.map((m: { id?: string }) => m.id));
          const toAdd = parsed.data.synapse_saved_mindmaps.filter(
            (m: unknown) => {
              const item = m as { id?: string };
              return !item.id || !existingIds.has(item.id);
            }
          );
          const merged = [...currentMindmaps, ...toAdd];
          localStorage.setItem("synapse_saved_mindmaps", JSON.stringify(merged));
          restoredItems += parsed.data.synapse_saved_mindmaps.length;
        }

        // 2. Sabatinas Prova Oral
        if (Array.isArray(parsed.data.synapse_oral_exam_history)) {
          const currentOralRaw = localStorage.getItem("synapse_oral_exam_history");
          const currentOral = currentOralRaw ? JSON.parse(currentOralRaw) : [];
          const existingIds = new Set(currentOral.map((o: { id?: string }) => o.id));
          const toAdd = parsed.data.synapse_oral_exam_history.filter(
            (o: unknown) => {
              const item = o as { id?: string };
              return !item.id || !existingIds.has(item.id);
            }
          );
          const merged = [...currentOral, ...toAdd];
          localStorage.setItem("synapse_oral_exam_history", JSON.stringify(merged));
          restoredItems += parsed.data.synapse_oral_exam_history.length;
        }

        // 3. Jurisprudência Bookmarks
        if (
          parsed.data.synapse_jurisprudence_bookmarks &&
          typeof parsed.data.synapse_jurisprudence_bookmarks === "object"
        ) {
          const currentBookmarksRaw = localStorage.getItem("synapse_jurisprudence_bookmarks");
          const currentBookmarks = currentBookmarksRaw ? JSON.parse(currentBookmarksRaw) : {};
          const merged = { ...currentBookmarks, ...parsed.data.synapse_jurisprudence_bookmarks };
          localStorage.setItem("synapse_jurisprudence_bookmarks", JSON.stringify(merged));
          restoredItems += Object.keys(parsed.data.synapse_jurisprudence_bookmarks).length;
        }

        // 4. Sala de Estudos
        if (parsed.data.synapse_study_room_subject) {
          localStorage.setItem(
            "synapse_study_room_subject",
            parsed.data.synapse_study_room_subject
          );
        }

        calculateCounts();
        setFeedback({
          type: "success",
          message: `Restauração concluída! ${restoredItems} registros locais foram integrados com sucesso.`,
        });
      } catch (err) {
        console.error("Erro ao importar backup:", err);
        setFeedback({
          type: "error",
          message: "O arquivo selecionado não é um backup Synapse AI válido.",
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setFeedback({
        type: "error",
        message: "Falha na leitura do arquivo.",
      });
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-6 space-y-5 backdrop-blur-xl md:col-span-2">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HardDrive size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Central de Backup & Portabilidade de Dados
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                JSON v1.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Faça cópias de segurança locais e migre seus mapas mentais, sabatinas orais e favoritos entre navegadores.
            </p>
          </div>
        </div>

        {/* Botão de atualização rápida */}
        <button
          onClick={calculateCounts}
          className="self-start sm:self-center text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 transition-colors"
          title="Recalcular itens locais"
        >
          <RefreshCw size={13} className={isProcessing ? "animate-spin" : ""} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Grid de Resumo dos Dados Locais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers size={16} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Mapas Mentais Salvos</span>
            <span className="text-base font-bold text-white font-mono">
              {counts.mindmapsCount} mapa(s)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
            <Mic size={16} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Sabatinas Prova Oral</span>
            <span className="text-base font-bold text-white font-mono">
              {counts.oralExamsCount} avaliação(ões)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <BookmarkCheck size={16} />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Jurisprudência Favorita</span>
            <span className="text-base font-bold text-white font-mono">
              {counts.bookmarksCount} julgado(s)
            </span>
          </div>
        </div>
      </div>

      {/* Feedback contextual */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : feedback.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Ações de Exportação e Importação */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={handleExportBackup}
          disabled={isProcessing}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 border border-indigo-400/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Download size={15} />
          <span>Exportar Dados (.JSON)</span>
        </button>

        <label className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-bold text-xs border border-slate-700/80 transition-all active:scale-95 cursor-pointer disabled:opacity-50">
          <Upload size={15} className="text-indigo-400" />
          <span>Restaurar / Importar Backup</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
            disabled={isProcessing}
          />
        </label>
      </div>
    </div>
  );
}
