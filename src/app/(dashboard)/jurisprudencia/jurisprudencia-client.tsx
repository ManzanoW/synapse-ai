"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import {
  Scale,
  Search,
  Sparkles,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  BookmarkCheck,
  HelpCircle,
  Loader2,
  ExternalLink,
  Gavel,
  X,
  ArrowRight,
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Headphones,
  Square,
  Printer,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  type JurisprudenceItem,
  CURATED_JURISPRUDENCE,
} from "@/lib/jurisprudence-data";
import {
  searchJurisprudenceAction,
  createJurisprudenceFlashcardAction,
} from "@/actions/jurisprudence-actions";
import { updateUserCareerFocusAction } from "@/actions/edital-templates-actions";
import { enableLawModuleInTargetRole } from "@/lib/career-utils";
import { PrintableJurisprudenceModal } from "./_components/PrintableJurisprudenceModal";

interface JurisprudenciaClientProps {
  initialItems: JurisprudenceItem[];
  isLawUser?: boolean;
  userCareer?: string;
  userRole?: string;
}

export default function JurisprudenciaClient({
  initialItems,
  isLawUser = true,
  userCareer = "Concurso Geral",
  userRole = "Concurso Geral",
}: JurisprudenciaClientProps) {
  // Estado local para permitir desbloqueio em tempo real caso o usuário ative o módulo
  const [hasLawAccess, setHasLawAccess] = useState(isLawUser);
  const [isActivatingLaw, setIsActivatingLaw] = useState(false);

  // Estados principais do Hub
  const [items, setItems] = useState<JurisprudenceItem[]>(initialItems || CURATED_JURISPRUDENCE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTribunal, setSelectedTribunal] = useState<string>("TODOS");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("TODAS");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(items[0]?.id || null);
  const [isSearching, startSearchTransition] = useTransition();

  // Estados de feedback por card
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Record<string, boolean>>({});
  const [savingFlashcardId, setSavingFlashcardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  // Estados do Simulador de Pegadinha da Banca
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<Record<string, boolean>>({});

  // Estados de Reprodução de Áudio (Audiolivro de Jurisprudência)
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);

  // Estados de Favoritos / Meus Julgados Salvos & Impressão
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"ALL" | "SAVED">("ALL");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Carrega favoritos salvos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("synapse_jurisprudence_bookmarks");
      if (stored) {
        setBookmarkedIds(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleToggleBookmark = (item: JurisprudenceItem) => {
    setBookmarkedIds((prev) => {
      const updated = { ...prev, [item.id]: !prev[item.id] };
      try {
        localStorage.setItem("synapse_jurisprudence_bookmarks", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Limpeza de síntese de voz no desmonte do componente
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Seleção da melhor voz neural em português do Brasil
  const getBestPtBrVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const preferred = ["Google português do Brasil", "Francisca", "Antonio", "Luciana", "Maria", "Letícia"];
    for (const name of preferred) {
      const match = voices.find(
        (v) => (v.lang.includes("pt-BR") || v.lang.includes("pt_BR")) && v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (match) return match;
    }

    const ptBrVoice = voices.find((v) => v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
    if (ptBrVoice) return ptBrVoice;

    return voices.find((v) => v.lang.startsWith("pt")) || null;
  }, []);

  // Parar áudio
  const handleStopAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingCardId(null);
    setIsAudioPaused(false);
  }, []);

  // Alternar Play / Pause / Troca de Card
  const handleToggleAudio = useCallback(
    (item: JurisprudenceItem) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        alert("Seu navegador não possui suporte para síntese de voz nativa.");
        return;
      }

      // Se o card clicado já é o que está ativo
      if (playingCardId === item.id) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsAudioPaused(false);
        } else if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          setIsAudioPaused(true);
        } else {
          handleStopAudio();
        }
        return;
      }

      // Caso seja um novo card
      window.speechSynthesis.cancel();
      setPlayingCardId(item.id);
      setIsAudioPaused(false);

      const textParts = [
        `${item.tribunal}. ${item.numero}. ${item.titulo}.`,
        `Disciplina: ${item.disciplina}. Assunto: ${item.assunto}.`,
        `Tese fixada pela Corte: ${item.teseResumida}.`,
        `Alerta de pegadinha da banca examinadora: ${item.pegadinhaBanca}.`,
      ];
      if (item.casoPratico) {
        textParts.push(`Exemplo prático de prova: ${item.casoPratico}`);
      }

      const speechText = textParts.join(" ");
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voice = getBestPtBrVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setPlayingCardId(null);
        setIsAudioPaused(false);
      };

      utterance.onerror = () => {
        setPlayingCardId(null);
        setIsAudioPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [playingCardId, getBestPtBrVoice, handleStopAudio]
  );

  // Ativação do Módulo de Direito para usuários de outras áreas
  const handleEnableLawModule = async () => {
    try {
      setIsActivatingLaw(true);
      const newRole = enableLawModuleInTargetRole(userRole);
      const res = await updateUserCareerFocusAction({
        targetRole: newRole,
        careerFocus: userCareer,
      });

      if (res.success) {
        setHasLawAccess(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("career-updated"));
        }
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err) {
      console.error("Erro ao ativar módulo de direito:", err);
    } finally {
      setIsActivatingLaw(false);
    }
  };

  const tribunais = ["TODOS", "STF", "STJ", "TST"];
  const disciplinas = [
    "TODAS",
    "Direito Constitucional",
    "Direito Administrativo",
    "Direito Penal",
    "Direito Processual Penal",
    "Direito Tributário",
    "Direito Civil",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startSearchTransition(async () => {
      const res = await searchJurisprudenceAction({
        query: searchQuery,
        tribunal: selectedTribunal,
        disciplina: selectedDisciplina,
      });

      if (res.success && res.data) {
        setItems(res.data);
        if (res.data.length > 0) {
          setExpandedCardId(res.data[0].id);
        }
      }
    });
  };

  const handleFilterChange = (tribunal: string, disciplina: string) => {
    setSelectedTribunal(tribunal);
    setSelectedDisciplina(disciplina);

    startSearchTransition(async () => {
      const res = await searchJurisprudenceAction({
        query: searchQuery,
        tribunal,
        disciplina,
      });

      if (res.success && res.data) {
        setItems(res.data);
      }
    });
  };

  const handleCreateFlashcard = async (item: JurisprudenceItem) => {
    if (savingFlashcardId || savedFlashcardIds[item.id]) return;

    setSavingFlashcardId(item.id);
    try {
      const res = await createJurisprudenceFlashcardAction({
        front: item.flashcardFrente,
        back: item.flashcardVerso,
        details: `${item.numero} (${item.tribunal})\n\n${item.teseResumida}\n\n🚨 Pegadinha da Banca: ${item.pegadinhaBanca}`,
        disciplina: item.disciplina,
      });

      if (res.success) {
        setSavedFlashcardIds((prev) => ({ ...prev, [item.id]: true }));
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      } else {
        alert(res.error || "Erro ao salvar flashcard.");
      }
    } catch {
      alert("Erro ao salvar flashcard.");
    } finally {
      setSavingFlashcardId(null);
    }
  };

  const handleCopyText = (item: JurisprudenceItem) => {
    const text = `${item.numero} (${item.tribunal}) - ${item.titulo}\nDISCIPLINA: ${item.disciplina} | ASSUNTO: ${item.assunto}\n\nTESE:\n${item.teseResumida}\n\nPEGADINHA DA BANCA:\n${item.pegadinhaBanca}\n\nCASO PRÁTICO:\n${item.casoPratico}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnswerDrill = (itemId: string, optionId: string) => {
    if (confirmedAnswers[itemId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [itemId]: optionId }));
  };

  const handleConfirmDrill = (item: JurisprudenceItem) => {
    if (!selectedAnswers[item.id] || !item.drillQuestion) return;
    setConfirmedAnswers((prev) => ({ ...prev, [item.id]: true }));

    const isCorrect = selectedAnswers[item.id] === item.drillQuestion.correctAnswer;
    if (isCorrect) {
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.65 },
          colors: ["#10B981", "#34D399", "#F59E0B"],
        });
      } catch {}
    }
  };

  // =========================================================================
  // GATEKEEPER ESTRITO: EXIBIDO QUANDO O USUÁRIO NÃO TEM FOCO EM DIREITO
  // =========================================================================
  if (!hasLawAccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-xl shadow-amber-500/10">
            <Scale className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Módulo Jurídico Exclusivo
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Acesso Restrito às Carreiras de Direito
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Seu foco de estudos atual está configurado para{" "}
              <strong className="text-slate-900 dark:text-white font-bold">{userCareer}</strong>.
              O Raio-X de Jurisprudência & Súmulas com IA é reservado para carreiras jurídicas e de tribunais (Magistratura, Ministério Público, Defensoria, Procuradorias, Delegado e OAB).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-4 text-xs text-slate-600 dark:text-slate-400 text-left space-y-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
              Ao ativar o Módulo de Direito, você desbloqueia:
            </span>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Teses e Súmulas Vinculantes do STF e STJ traduzidas para concursos.</li>
              <li>Simulador de Pegadinhas das Bancas examinadoras (Cebraspe, FGV, FCC).</li>
              <li>Gerador de Flashcards FSRS automáticos a partir dos julgados.</li>
              <li>Acesso ao Simulador de Prova Oral com IA e áudio.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleEnableLawModule}
              disabled={isActivatingLaw}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm px-6 py-3.5 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isActivatingLaw ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" />
              )}
              <span>{isActivatingLaw ? "Ativando Módulo..." : "⚖️ Ativar Foco em Direito & Desbloquear"}</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-sm px-5 py-3.5 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // HUB COMPLETO DE JURISPRUDÊNCIA & SÚMULAS (USUÁRIOS DE DIREITO)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#02050e] text-slate-900 dark:text-slate-100 p-3 sm:p-8 font-sans antialiased relative selection:bg-indigo-500/30 transition-colors">
      {/* Luz ambiente neon */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative">
        {/* ================= HERO HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Raio-X de Jurisprudência & Súmulas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 tracking-wider">
                  Vade Mecum IA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
                Teses e Súmulas do STF e STJ traduzidas para concursos, com divergências e alertas de pegadinhas das bancas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 dark:text-indigo-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Exportar Caderno (PDF)</span>
            </button>

            <Link
              href="/questions"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95"
            >
              <HelpCircle size={15} className="text-amber-500" />
              <span>Resolver Questões</span>
            </Link>
          </div>
        </div>

        {/* ================= BARRA DE PESQUISA & FILTROS ================= */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/70 p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por tema, número da súmula (ex: SV 13, Súmula 599, busca pessoal) ou assunto..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:border-indigo-500/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} className="text-amber-300" />
              )}
              <span className="hidden sm:inline">Pesquisar com IA</span>
            </button>
          </form>

          {/* Filtros em Pílulas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
            {/* Tribunais */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
                <Gavel size={12} /> Tribunal:
              </span>
              {tribunais.map((trib) => (
                <button
                  key={trib}
                  type="button"
                  onClick={() => handleFilterChange(trib, selectedDisciplina)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTribunal === trib
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {trib}
                </button>
              ))}
            </div>

            {/* Disciplinas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
                <Filter size={12} /> Matéria:
              </span>
              {disciplinas.map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => handleFilterChange(selectedTribunal, disc)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedDisciplina === disc
                      ? "bg-blue-600/20 border border-blue-500/40 text-blue-700 dark:text-blue-200 font-bold"
                      : "bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/5"
                  }`}
                >
                  {disc === "TODAS" ? "Todas" : disc.replace("Direito ", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= ABAS: TODOS OS JULGADOS vs MEUS JULGADOS SALVOS ================= */}
        {(() => {
          const bookmarkedCount = Object.keys(bookmarkedIds).filter((id) => bookmarkedIds[id]).length;
          const displayedItems = activeTab === "SAVED"
            ? items.filter((it) => Boolean(bookmarkedIds[it.id]))
            : items;

          return (
            <>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("ALL")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "ALL"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-white"
                  }`}
                >
                  Todos os Julgados ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("SAVED")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "SAVED"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-white"
                  }`}
                >
                  <BookmarkCheck size={14} className={activeTab === "SAVED" ? "fill-slate-950" : ""} />
                  <span>Meus Julgados Salvos ({bookmarkedCount})</span>
                </button>
              </div>

              {/* ================= LISTA DE SÚMULAS & PRECEDENTES ================= */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {displayedItems.length} {displayedItems.length === 1 ? "Precedente Exibido" : "Precedentes Exibidos"}
                  </span>
                </div>

                {displayedItems.length === 0 && !isSearching && (
                  <div className="p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/40 text-center space-y-3">
                    <Scale size={32} className="mx-auto text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      {activeTab === "SAVED"
                        ? "Nenhum julgado salvo nos favoritos ainda."
                        : "Nenhum precedente localizado com esses filtros."}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                      {activeTab === "SAVED"
                        ? "Clique no ícone de marcador em qualquer julgado para adicioná-lo aos seus favoritos e gerar seu Caderno de Véspera!"
                        : "Digite um tema no campo de busca acima e clique em 'Pesquisar com IA' para sintetizar o entendimento das Cortes Superiores."}
                    </p>
                  </div>
                )}

                {displayedItems.map((item) => {
            const isExpanded = expandedCardId === item.id;
            const isSavedCard = Boolean(savedFlashcardIds[item.id]);
            const isSavingCard = savingFlashcardId === item.id;
            const isOriginalShown = Boolean(showOriginalMap[item.id]);
            const isDrillOpen = activeDrillId === item.id;
            const userChoice = selectedAnswers[item.id];
            const isDrillConfirmed = Boolean(confirmedAnswers[item.id]);
            const isAnswerCorrect =
              isDrillConfirmed && userChoice === item.drillQuestion?.correctAnswer;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "border-indigo-500/50 bg-white dark:bg-slate-950/90 shadow-2xl backdrop-blur-2xl ring-1 ring-indigo-500/20"
                    : "border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                {/* CABEÇALHO DO CARD */}
                <div
                  onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                  className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Tribunal Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          item.tribunal === "STF"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : item.tribunal === "STJ"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {item.tribunal}
                      </span>

                      {/* Número do Precedente */}
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {item.numero}
                      </span>

                      {/* Disciplina */}
                      <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                        {item.disciplina} • {item.assunto}
                      </span>

                      {item.isCustomGenerated && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Sintetizado por IA
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {item.titulo}
                    </h3>

                    {/* Resumo quando recolhido */}
                    {!isExpanded && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.teseResumida}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAudio(item);
                      }}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        playingCardId === item.id
                          ? isAudioPaused
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 animate-pulse border border-indigo-400"
                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-500/20"
                      }`}
                      title={
                        playingCardId === item.id
                          ? isAudioPaused
                            ? "Continuar áudio"
                            : "Pausar áudio"
                          : "Ouvir Tese & Pegadinha com Voz Neural"
                      }
                    >
                      {playingCardId === item.id ? (
                        isAudioPaused ? <Play size={15} /> : <Pause size={15} />
                      ) : (
                        <Volume2 size={15} />
                      )}
                      <span className="hidden sm:inline text-[11px]">
                        {playingCardId === item.id
                          ? isAudioPaused
                            ? "Pausado"
                            : "Ouvindo..."
                          : "Ouvir"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(item);
                      }}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        bookmarkedIds[item.id]
                          ? "bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 shadow-xs"
                          : "bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 border border-transparent"
                      }`}
                      title={bookmarkedIds[item.id] ? "Remover dos favoritos" : "Salvar julgado nos favoritos"}
                    >
                      <BookmarkCheck
                        size={15}
                        className={bookmarkedIds[item.id] ? "fill-amber-500 dark:fill-amber-300" : ""}
                      />
                    </button>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* CORPO EXPANDIDO (RAIO-X DETALHADO) */}
                {isExpanded && (
                  <div className="px-5 pb-6 sm:px-6 space-y-4 pt-1 border-t border-slate-100 dark:border-white/[0.06] animate-fade-in">
                    {/* 1. Tese Traduzida */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        <BookOpen size={14} />
                        <span>Tese Fixada (Linguagem Direta)</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-xs sm:text-[13px] text-slate-800 dark:text-zinc-200 leading-relaxed font-serif">
                        {item.teseResumida}
                      </div>
                    </div>

                    {/* Botão Ver Texto Oficial da Ementa */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setShowOriginalMap((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>{isOriginalShown ? "Ocultar redação oficial" : "Ver redação oficial / ementa literal"}</span>
                      </button>

                      {isOriginalShown && (
                        <div className="mt-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-zinc-400 font-mono leading-relaxed">
                          {item.teseOriginal}
                        </div>
                      )}
                    </div>

                    {/* 2. Divergência ou Evolução Jurisprudencial */}
                    {item.divergenciaOuEvolucao && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                          <Scale size={14} />
                          <span>Divergência das Cortes & Evolução</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 text-xs text-slate-800 dark:text-zinc-300 leading-relaxed">
                          {item.divergenciaOuEvolucao}
                        </div>
                      </div>
                    )}

                    {/* 3. 🚨 Alerta de Pegadinha da Banca */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        <AlertTriangle size={14} />
                        <span>Como as Bancas Examinadoras Cobram (Alerta de Pegadinha)</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-[13px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
                        {item.pegadinhaBanca}
                      </div>
                    </div>

                    {/* 4. Caso Prático Contextualizado */}
                    {item.casoPratico && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          <FileText size={14} />
                          <span>Exemplo Prático (Situação Hipotética de Prova)</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                          &quot;{item.casoPratico}&quot;
                        </div>
                      </div>
                    )}

                    {/* ================= SIMULADOR DE PEGADINHA DA BANCA ================= */}
                    {item.drillQuestion && (
                      <div className="pt-2">
                        {!isDrillOpen ? (
                          <button
                            type="button"
                            onClick={() => setActiveDrillId(item.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 text-xs font-extrabold text-amber-700 dark:text-amber-400 transition-all cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Simular Questão de Banca ({item.drillQuestion.banca}) ➔</span>
                          </button>
                        ) : (
                          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/[0.03] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <Gavel className="h-3.5 w-3.5" />
                                Questão Desafio • Banca {item.drillQuestion.banca}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveDrillId(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                              >
                                Fechar
                              </button>
                            </div>

                            <p className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                              {item.drillQuestion.enunciado}
                            </p>

                            <div className="space-y-2">
                              {item.drillQuestion.options.map((opt) => {
                                const isSelected = userChoice === opt.id;
                                const isCorrectChoice = opt.id === item.drillQuestion!.correctAnswer;

                                let optClasses =
                                  "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 hover:border-slate-300";

                                if (isDrillConfirmed) {
                                  if (isCorrectChoice) {
                                    optClasses =
                                      "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold";
                                  } else if (isSelected && !isCorrectChoice) {
                                    optClasses =
                                      "border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-300 line-through";
                                  }
                                } else if (isSelected) {
                                  optClasses =
                                    "border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold";
                                }

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleAnswerDrill(item.id, opt.id)}
                                    disabled={isDrillConfirmed}
                                    className={`w-full text-left p-3 rounded-2xl border text-xs leading-relaxed transition-all flex items-start gap-3 cursor-pointer ${optClasses}`}
                                  >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 font-bold text-[10px]">
                                      {opt.id}
                                    </span>
                                    <span>{opt.text}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {!isDrillConfirmed ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmDrill(item)}
                                disabled={!userChoice}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Confirmar Gabarito</span>
                              </button>
                            ) : (
                              <div
                                className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                                  isAnswerCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                                    : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 font-black">
                                  {isAnswerCorrect ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      <span>Excelente! Você dominou a pegadinha da banca.</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                      <span>Atenção à armadilha da banca examinadora:</span>
                                    </>
                                  )}
                                </div>
                                <p>{item.drillQuestion.explanation}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* BARRA DE AÇÕES INFERIORES */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyText(item)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedId === item.id ? "Tese Copiada!" : "Copiar Tese"}</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Botão Ouvir Tese com Voz Neural */}
                        <button
                          type="button"
                          onClick={() => handleToggleAudio(item)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            playingCardId === item.id
                              ? isAudioPaused
                                ? "border-amber-500/40 bg-amber-500/20 text-amber-400"
                                : "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 animate-pulse"
                              : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          {playingCardId === item.id ? (
                            isAudioPaused ? <Play size={13} /> : <Pause size={13} />
                          ) : (
                            <Volume2 size={13} className="text-indigo-400" />
                          )}
                          <span>
                            {playingCardId === item.id
                              ? isAudioPaused
                                ? "Continuar Áudio"
                                : "Pausar Áudio"
                              : "Ouvir Tese & Pegadinha"}
                          </span>
                        </button>

                        {/* Botão Criar Flashcard FSRS */}
                        <button
                          type="button"
                          onClick={() => handleCreateFlashcard(item)}
                          disabled={isSavedCard || isSavingCard}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSavedCard
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "border-indigo-500/30 bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 cursor-pointer active:scale-95"
                          }`}
                        >
                          {isSavingCard ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isSavedCard ? (
                            <BookmarkCheck size={13} className="text-emerald-500" />
                          ) : (
                            <Layers size={13} />
                          )}
                          <span>
                            {isSavedCard ? "Flashcard FSRS Salvo" : "Criar Flashcard desta Tese"}
                          </span>
                        </button>

                        {/* Botão Treinar Questões da Disciplina */}
                        <Link
                          href={`/questions?materia=${encodeURIComponent(item.disciplina)}`}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95"
                        >
                          <HelpCircle size={13} />
                          <span>Praticar Questões</span>
                          <ExternalLink size={11} className="opacity-70" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  })()}

        {/* MINI-PLAYER FLUTUANTE DE JURISPRUDÊNCIA */}
        {playingCardId && (() => {
          const currentItem = items.find((i) => i.id === playingCardId);
          if (!currentItem) return null;

          return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto bg-slate-950/95 border border-indigo-500/50 shadow-2xl shadow-indigo-950/70 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-2xl text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shrink-0">
                  <Headphones size={18} className="animate-pulse text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                      {currentItem.tribunal} • {currentItem.numero}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {isAudioPaused ? "Em Pausa" : "Narrando..."}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                    {currentItem.titulo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAudio(currentItem)}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
                  title={isAudioPaused ? "Continuar" : "Pausar"}
                >
                  {isAudioPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleStopAudio}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Parar e Fechar"
                >
                  <Square size={16} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* MODAL DE IMPRESSÃO DO CADERNO DE VÉSPERA (PDF) */}
      <PrintableJurisprudenceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        items={activeTab === "SAVED" ? items.filter((it) => Boolean(bookmarkedIds[it.id])) : items}
        tribunal={selectedTribunal}
        disciplina={selectedDisciplina}
      />
    </div>
  );
}
