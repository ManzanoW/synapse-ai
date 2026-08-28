"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Loader2,
  Sparkles,
  Wand2,
  AlertCircle,
  BookOpen,
  Target,
  Layers,
  Palette,
  ArrowRight,
} from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  topics?: { id: string; title: string }[];
}

interface CreateDeckModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const COLOR_OPTIONS = [
  {
    label: "Índigo",
    value: "bg-indigo-500",
    border: "border-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  {
    label: "Púrpura",
    value: "bg-purple-500",
    border: "border-purple-400",
    glow: "shadow-purple-500/20",
  },
  {
    label: "Ciano",
    value: "bg-cyan-500",
    border: "border-cyan-400",
    glow: "shadow-cyan-500/20",
  },
  {
    label: "Esmeralda",
    value: "bg-emerald-500",
    border: "border-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  {
    label: "Rosa",
    value: "bg-rose-500",
    border: "border-rose-400",
    glow: "shadow-rose-500/20",
  },
  {
    label: "Âmbar",
    value: "bg-amber-500",
    border: "border-amber-400",
    glow: "shadow-amber-500/20",
  },
];

export default function CreateDeckModal({
  onClose,
  onSuccess,
}: CreateDeckModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [materia, setMateria] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">(
    "banca",
  );
  const [content, setContent] = useState("");
  const [dificuldade, setDificuldade] = useState("MÉDIA");
  const [qtdCards, setQtdCards] = useState("10");
  const [color, setColor] = useState("bg-[#00f2fe]");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(true);

  useEffect(() => {
    fetch("/api/edital?mode=subjects")
      .then((res) => res.json())
      .then((json) => {
        const rawSubjects: SubjectItem[] = json.data || [];
        const uniqueSubjectsMap = new Map<string, SubjectItem>();

        rawSubjects.forEach((sub) => {
          const nameKey = sub.name.trim();
          if (uniqueSubjectsMap.has(nameKey)) {
            const existing = uniqueSubjectsMap.get(nameKey)!;
            const combinedTopics = [
              ...(existing.topics || []),
              ...(sub.topics || []),
            ];
            const uniqueTopics = Array.from(
              new Map(combinedTopics.map((t) => [t.id, t])).values(),
            );
            existing.topics = uniqueTopics;
          } else {
            uniqueSubjectsMap.set(nameKey, {
              ...sub,
              name: nameKey,
              topics: sub.topics ? [...sub.topics] : [],
            });
          }
        });

        setSubjects(Array.from(uniqueSubjectsMap.values()));
      })
      .catch((err) => console.error("Erro ao carregar matérias:", err))
      .finally(() => setIsFetchLoading(false));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  const currentSubjectObj = subjects.find(
    (s) =>
      s.id === materia ||
      s.name.trim().toLowerCase() === materia.trim().toLowerCase(),
  );
  const availableTopics = currentSubjectObj?.topics || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjects.length === 0) return;
    if (!materia) {
      setError("Por favor, selecione a matéria principal para o baralho.");
      return;
    }

    setLoading(true);
    setError(null);

    const selectedTopicObj = availableTopics.find(
      (t) => t.id === selectedTopicId,
    );
    const topicoNome = selectedTopicObj ? selectedTopicObj.title : null;

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: materia,
          materia,
          topicId: selectedTopicId || null,
          topicName: topicoNome,
          fonteConteudo,
          content: fonteConteudo === "texto" ? content : undefined,
          dificuldade,
          qtdCards: parseInt(qtdCards, 10),
          color,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(
          data.message ||
            data.error ||
            "Erro ao processar conteúdo com IA. Tente novamente.",
        );
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setError("Falha na conexão com o servidor. Verifique sua rede.");
    } finally {
      setLoading(false);
    }
  };

  const hasNoSubjects = subjects.length === 0 && !isFetchLoading;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-[#070b14] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-2xl my-auto text-slate-100 font-sans select-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold tracking-wider uppercase">
              <Sparkles size={12} /> Gerador IA
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Criar Baralho com IA
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Configure o escopo para sintetizar seus flashcards.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isFetchLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <Loader2 size={20} className="animate-spin text-indigo-500" />
            <span>Acessando mapeamento de disciplinas...</span>
          </div>
        ) : hasNoSubjects ? (
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-4 py-8">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Nenhuma matéria cadastrada
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Cadastre as disciplinas na aba Edital para desbloquear a síntese
                automática.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/edital"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold px-4 py-2.5 rounded-xl transition-all"
              >
                <BookOpen size={13} />
                <span>Ir para Editais</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-400" />
                  Matéria Principal
                </label>
                <select
                  required
                  disabled={loading}
                  value={materia}
                  onChange={(e) => {
                    setMateria(e.target.value);
                    setSelectedTopicId("");
                  }}
                  className="w-full bg-slate-950 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">Selecione uma matéria...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <Target size={13} className="text-indigo-400" />
                  Tópico (Opcional)
                </label>
                <select
                  disabled={loading || !materia}
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">Todos os Tópicos</option>
                  {availableTopics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
                Origem do Conteúdo
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-white/10 rounded-xl">
                {[
                  { id: "banca", label: "Edital" },
                  { id: "texto", label: "Texto" },
                  { id: "pdf", label: "PDF" },
                ].map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setFonteConteudo(src.id as "banca" | "texto" | "pdf")
                    }
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${fonteConteudo === src.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"}`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>

              {fonteConteudo === "texto" && (
                <textarea
                  rows={2}
                  disabled={loading}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Cole o resumo, lei seca ou anotações..."
                  className="w-full bg-slate-950 border border-white/10 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors mt-2 resize-none disabled:opacity-50"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
                Profundidade
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {["FÁCIL", "MÉDIA", "DIFÍCIL", "RESUMIDO"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={loading}
                    onClick={() => setDificuldade(lvl)}
                    className={`py-2 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${dificuldade === lvl ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]" : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-indigo-400" />
                  Volume de Cards
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["5", "10", "15", "20"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={loading}
                      onClick={() => setQtdCards(q)}
                      className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${qtdCards === q ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <Palette size={13} className="text-indigo-400" />
                  Cor do Baralho
                </label>
                <div className="flex items-center gap-2 py-1.5">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = color === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        disabled={loading}
                        onClick={() => setColor(c.value)}
                        className={`w-6 h-6 rounded-full ${c.value} transition-all relative flex items-center justify-center cursor-pointer ${isSelected ? `ring-2 ring-white ring-offset-2 ring-offset-[#070b14] scale-110 ${c.glow}` : "opacity-60 hover:opacity-100"}`}
                        title={c.label}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              disabled={loading || !materia}
              type="submit"
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={16} />
                  <span>Sintetizando Cards...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Gerar Flashcards por IA</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
