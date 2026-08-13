"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Sparkles,
  Wand2,
  AlertCircle,
  BookOpen,
  Target,
  FileText,
  Layers,
  Palette,
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
  { label: "Índigo", value: "bg-indigo-500", border: "border-indigo-400", glow: "shadow-indigo-500/20" },
  { label: "Púrpura", value: "bg-purple-500", border: "border-purple-400", glow: "shadow-purple-500/20" },
  { label: "Ciano", value: "bg-cyan-500", border: "border-cyan-400", glow: "shadow-cyan-500/20" },
  { label: "Esmeralda", value: "bg-emerald-500", border: "border-emerald-400", glow: "shadow-emerald-500/20" },
  { label: "Rosa", value: "bg-rose-500", border: "border-rose-400", glow: "shadow-rose-500/20" },
  { label: "Âmbar", value: "bg-amber-500", border: "border-amber-400", glow: "shadow-amber-500/20" },
];

export default function CreateDeckModal({
  onClose,
  onSuccess,
}: CreateDeckModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Parâmetros da IA
  const [name, setName] = useState("");
  const [materia, setMateria] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [fonteConteudo, setFonteConteudo] = useState<"banca" | "texto" | "pdf">("banca");
  const [content, setContent] = useState("");
  const [dificuldade, setDificuldade] = useState("MÉDIA");
  const [qtdCards, setQtdCards] = useState("10");
  const [color, setColor] = useState("bg-indigo-500");

  // Dados das matérias e tópicos carregados do banco/edital
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Carrega matérias e tópicos dinamicamente do edital
  useEffect(() => {
    fetch("/api/edital?mode=subjects")
      .then((res) => res.json())
      .then((json) => {
        const loadedSubjects: SubjectItem[] = json.data || [];
        setSubjects(loadedSubjects);
      })
      .catch((err) => console.error("Erro ao carregar matérias:", err));
  }, []);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  // Lista de tópicos filtrada com base na matéria selecionada
  const currentSubjectObj = subjects.find(
    (s) =>
      s.id === materia ||
      s.name.trim().toLowerCase() === materia.trim().toLowerCase()
  );
  const availableTopics = currentSubjectObj?.topics || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || materia || "Novo Baralho",
          materia,
          topicId: selectedTopicId || null,
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
          data.message || data.error || "Erro ao processar conteúdo com IA. Tente novamente."
        );
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setError("Falha na conexão com o servidor. Verifique sua rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-[#070b14] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] backdrop-blur-2xl my-8 text-slate-100 font-sans select-none">
        
        {/* Glow de Fundo Sutil */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold tracking-wider uppercase">
              <Sparkles size={12} /> Gerador IA
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Criar Baralho com IA
            </h2>
            <p className="text-xs text-slate-400">
              Configure o escopo e o motor neural para sintetizar seus flashcards.
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

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* TÍTULO DO BARALHO */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <FileText size={13} className="text-indigo-400" />
              Título do Baralho
            </label>
            <input
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arquitetura de Software, Direito Penal..."
              className="w-full bg-[#0a0f1d] border border-white/10 focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* MATÉRIA PRINCIPAL E TÓPICO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <BookOpen size={13} className="text-indigo-400" />
                Matéria Principal
              </label>
              <select
                disabled={loading}
                value={materia}
                onChange={(e) => {
                  setMateria(e.target.value);
                  setSelectedTopicId("");
                }}
                className="w-full bg-[#0a0f1d] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-3 text-xs text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
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
              <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <Target size={13} className="text-indigo-400" />
                Tópico Específico (Opcional)
              </label>
              <select
                disabled={loading || !materia}
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-3 text-xs text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50"
              >
                <option value="">Todos os Tópicos da Matéria</option>
                {availableTopics.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ORIGEM DO CONTEÚDO DA IA */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
              Origem do Conteúdo da IA
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#0a0f1d] border border-white/10 rounded-2xl">
              <button
                type="button"
                disabled={loading}
                onClick={() => setFonteConteudo("banca")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  fonteConteudo === "banca"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Matéria / Edital
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setFonteConteudo("texto")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  fonteConteudo === "texto"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Colar Texto / Lei
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setFonteConteudo("pdf")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  fonteConteudo === "pdf"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Upload de PDF
              </button>
            </div>

            {fonteConteudo === "texto" && (
              <textarea
                rows={3}
                disabled={loading}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole aqui o resumo, legislação, lei seca ou anotações..."
                className="w-full bg-[#0a0f1d] border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors mt-2 resize-none disabled:opacity-50"
              />
            )}
          </div>

          {/* NÍVEL DE PROFUNDIDADE */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
              Nível de Profundidade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["FÁCIL", "MÉDIA", "DIFÍCIL", "SINTÉTICO"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={loading}
                  onClick={() => setDificuldade(lvl)}
                  className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                    dificuldade === lvl
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      : "bg-[#0a0f1d] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* VOLUME DE FLASHCARDS & COR DO BARALHO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantidade */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <Layers size={13} className="text-indigo-400" />
                Volume de Cards
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["5", "10", "15", "20"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => setQtdCards(q)}
                    className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      qtdCards === q
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-[#0a0f1d] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {q} Q
                  </button>
                ))}
              </div>
            </div>

            {/* Cor do Baralho */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <Palette size={13} className="text-indigo-400" />
                Cor do Baralho
              </label>
              <div className="flex items-center gap-2.5 py-1">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      disabled={loading}
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.value} transition-all relative flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? `ring-2 ring-white ring-offset-2 ring-offset-[#070b14] scale-110 ${c.glow}`
                          : "opacity-60 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTÃO DE ENVIO */}
          <button
            disabled={loading || !name}
            type="submit"
            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" size={16} />
                <span>Sintetizando Flashcards...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Gerar Flashcards por IA</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
