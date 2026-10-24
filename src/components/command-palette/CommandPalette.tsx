// src/components/command-palette/CommandPalette.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  HelpCircle,
  BookOpen,
  Calendar,
  Layers,
  PenTool,
  Trophy,
  Award,
  BarChart3,
  Scale,
  Mic,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Zap,
  ArrowRight,
  Headphones,
  CalendarDays,
  Brain,
  Activity,
  UploadCloud,
  ShieldCheck,
  LifeBuoy,
  Keyboard,
  FileEdit,
  FileText,
  Camera,
  ScrollText,
  Swords,
  Target,
  X,
  Smartphone,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAudio } from "@/contexts/AudioContext";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { isLawFocused } from "@/lib/career-utils";
import { PDFExamImporterModal } from "@/components/exam-importer/PDFExamImporterModal";
import { PocketSummaryModal } from "@/components/summary/PocketSummaryModal";
import { PrecedentDuelModal } from "@/app/(dashboard)/jurisprudencia/_components/PrecedentDuelModal";

interface EditalTopicSummary {
  id: string;
  title: string;
  firstStudy?: string | null;
}

interface EditalSubjectSummary {
  id: string;
  name: string;
  topics?: EditalTopicSummary[];
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category:
    | "Recentes"
    | "Navegação"
    | "Seu Edital"
    | "Ações Rápidas"
    | "Carreiras Jurídicas";
  icon: React.ElementType;
  badge?: string;
  action: () => void;
  keywords?: string[];
  quickActions?: {
    label: string;
    path: string;
  }[];
}

interface CommandPaletteProps {
  user?: {
    careerFocus?: string | null;
    targetRole?: string | null;
  } | null;
}

export function CommandPalette({ user }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPdfImporterOpen, setIsPdfImporterOpen] = useState(false);
  const [isPocketSummaryOpen, setIsPocketSummaryOpen] = useState(false);
  const [isPrecedentDuelOpen, setIsPrecedentDuelOpen] = useState(false);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const [editalSubjects, setEditalSubjects] = useState<EditalSubjectSummary[]>([]);
  const editalLoadedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute } = useAudio();
  const { playClick, playChime } = useSound();

  const hasLaw = isLawFocused(user?.careerFocus, user?.targetRole);

  // Escuta atalhos de teclado globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K ou Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        triggerHaptic("light");
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
      triggerHaptic("light");
    };

    const handleOpenPdfImporter = () => {
      setIsOpen(false);
      setIsPdfImporterOpen(true);
      triggerHaptic("light");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);
    window.addEventListener("open-pdf-importer", handleOpenPdfImporter);
    const handleOpenPocketSummary = () => {
      setIsOpen(false);
      setIsPocketSummaryOpen(true);
      triggerHaptic("light");
    };

    const handleOpenPrecedentDuel = () => {
      setIsOpen(false);
      setIsPrecedentDuelOpen(true);
      triggerHaptic("light");
    };

    window.addEventListener("open-pocket-summary", handleOpenPocketSummary);
    window.addEventListener("open-precedent-duel", handleOpenPrecedentDuel);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
      window.removeEventListener("open-pdf-importer", handleOpenPdfImporter);
      window.removeEventListener("open-pocket-summary", handleOpenPocketSummary);
      window.removeEventListener("open-precedent-duel", handleOpenPrecedentDuel);
    };
  }, [isOpen]);

  // Foco no input ao abrir + carregamento sob demanda das matérias/tópicos do Edital
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      playChime();
      setTimeout(() => inputRef.current?.focus(), 50);
      if (typeof window !== "undefined") {
        try {
          const saved = JSON.parse(
            localStorage.getItem("synapse_recent_commands") || "[]",
          );
          setRecentCommandIds(Array.isArray(saved) ? saved : []);
        } catch {}
      }

      if (!editalLoadedRef.current) {
        editalLoadedRef.current = true;
        fetch("/api/edital")
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => {
            if (json && Array.isArray(json.data)) {
              setEditalSubjects(json.data);
            }
          })
          .catch(() => {
            editalLoadedRef.current = false;
          });
      }
    }
  }, [isOpen, playChime]);

  const recordRecent = (id: string) => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(
          localStorage.getItem("synapse_recent_commands") || "[]",
        );
        const updated = [id, ...saved.filter((x: string) => x !== id)].slice(
          0,
          5,
        );
        localStorage.setItem(
          "synapse_recent_commands",
          JSON.stringify(updated),
        );
        setRecentCommandIds(updated);
      } catch {}
    }
  };

  const navigateTo = (path: string, id?: string) => {
    if (id) recordRecent(id);
    playClick();
    triggerHaptic("medium");
    setIsOpen(false);
    router.push(path);
  };

  // Itens da Command Palette
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // NAVEGAÇÃO PRINCIPAL
      {
        id: "nav-dashboard",
        title: "Dashboard Principal",
        subtitle: "Visão geral, metas e métricas diárias",
        category: "Navegação",
        icon: LayoutDashboard,
        action: () => navigateTo("/dashboard"),
        keywords: ["home", "inicio", "painel", "resumo"],
      },
      {
        id: "nav-questions",
        title: "Banco de Questões & Simulados",
        subtitle: "Resolução ativa com filtros por banca e cargo",
        category: "Navegação",
        icon: HelpCircle,
        action: () => navigateTo("/questions"),
        keywords: ["questoes", "simulado", "exercicios", "treino", "banca"],
      },
      {
        id: "nav-notebook",
        title: "Caderno de Erros Inteligente",
        subtitle: "Diagnóstico dos seus pontos cegos e armadilhas",
        category: "Navegação",
        icon: BookOpen,
        action: () => navigateTo("/notebook"),
        keywords: ["erros", "revisao", "caderno", "falhas", "pontos cegos"],
      },
      {
        id: "nav-week",
        title: "Cronograma Semanal & D-Day",
        subtitle: "Planejamento adaptativo calibrado com seu edital",
        category: "Navegação",
        icon: Calendar,
        action: () => navigateTo("/week"),
        keywords: ["semana", "cronograma", "agenda", "d-day", "planejamento"],
      },
      {
        id: "nav-flashcards",
        title: "Cartões de Memória & Baralhos",
        subtitle: "Repetição espaçada inteligente para você não esquecer a matéria",
        category: "Navegação",
        icon: Layers,
        action: () => navigateTo("/flashcards/decks"),
        keywords: ["flashcards", "cartoes", "memorizacao", "decks", "baralho"],
      },
      {
        id: "nav-redacao",
        title: "Simulador de Redação com Espelho Oficial",
        subtitle: "Correção de discursivas com IA e folha A4 em PDF",
        category: "Navegação",
        icon: PenTool,
        badge: "IA",
        action: () => navigateTo("/redacao"),
        keywords: ["redacao", "discursiva", "espelho", "tema", "texto", "cebraspe"],
      },
      {
        id: "nav-achievements",
        title: "Galeria de Conquistas & Distintivos",
        subtitle: "20 medalhas desbloqueáveis, marcos de consistência e raridades",
        category: "Navegação",
        icon: Award,
        badge: "20 BADGES",
        action: () => navigateTo("/achievements"),
        keywords: ["conquistas", "medalhas", "distintivos", "trofeus", "badges", "achievements", "recompensas"],
      },
      {
        id: "nav-leaderboard",
        title: "Ligas Semanais & Desafios da Semana",
        subtitle: "Suba de divisão (Bronze a Diamante) e conquiste o Baú Semanal",
        category: "Navegação",
        icon: Trophy,
        badge: "D30",
        action: () => navigateTo("/leaderboard"),
        keywords: ["ligas", "ranking", "diamante", "xp", "conquistas", "desafios"],
      },
      {
        id: "nav-calendar",
        title: "Calendário de Revisões",
        subtitle: "Mapa visual das suas revisões agendadas para os próximos dias",
        category: "Navegação",
        icon: CalendarDays,
        action: () => navigateTo("/calendar"),
        keywords: ["calendario", "agenda", "revisoes", "datas"],
      },
      {
        id: "nav-performance",
        title: "Meu Desempenho & Estatísticas",
        subtitle: "Gráficos de memorização, matérias vencidas e taxa de acertos",
        category: "Navegação",
        icon: BarChart3,
        action: () => navigateTo("/performance"),
        keywords: ["metricas", "desempenho", "graficos", "estatisticas", "retencao"],
      },
      {
        id: "nav-lei-seca",
        title: "Lei Seca Interativa (Active Recall)",
        subtitle: "Ocultamento gradual de prazos e palavras-chave de artigos de lei",
        category: "Navegação",
        icon: ScrollText,
        badge: "NOVO",
        action: () => navigateTo("/lei-seca"),
        keywords: ["lei seca", "artigos", "cf88", "lei 8112", "active recall", "cloze", "leis"],
      },
      {
        id: "nav-mindmaps",
        title: "Mapas Mentais & Macetes",
        subtitle: "Esquemas simples e macetes das principais bancas examinadoras",
        category: "Navegação",
        icon: Brain,
        badge: "IA",
        action: () => navigateTo("/mapas-mentais"),
        keywords: ["mapa mental", "mnemonicos", "esquema", "resumo", "arvore", "visual", "macetes"],
      },

      // UTILITÁRIOS GLOBAIS
      {
        id: "action-keyboard-shortcuts",
        title: "Atalhos de Teclado & Modo Superhuman",
        subtitle: "Veja todos os comandos e atalhos rápidos (Pressione ?)",
        category: "Ações Rápidas",
        icon: Keyboard,
        badge: "?",
        action: () => {
          recordRecent("action-keyboard-shortcuts");
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"));
        },
        keywords: ["atalhos", "teclado", "shortcuts", "comandos", "ajuda", "?"],
      },
      {
        id: "action-quick-scratchpad",
        title: "Abrir Bloco de Rascunho Rápido",
        subtitle: "Anote regras, fórmulas e cálculos em qualquer tela (Alt+N)",
        category: "Ações Rápidas",
        icon: FileEdit,
        badge: "Alt+N",
        action: () => {
          recordRecent("action-quick-scratchpad");
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("open-quick-scratchpad"));
        },
        keywords: ["rascunho", "notas", "bloco", "anotacoes", "scratchpad", "calculo", "mnemonico"],
      },

      // AÇÕES RÁPIDAS
      {
        id: "action-rescue-week",
        title: "Salvar Minha Semana (Modo Resgate IA)",
        subtitle: "Redistribua matérias atrasadas pelos dias restantes sem culpa",
        category: "Ações Rápidas",
        icon: LifeBuoy,
        badge: "Resgate",
        action: () => navigateTo("/week"),
        keywords: ["resgate", "semana", "atrasado", "salvar", "rebalancear", "cronograma", "imprevisto"],
      },
      {
        id: "action-handwritten-essay",
        title: "Corretor de Discursiva via Foto (OCR)",
        subtitle: "Envie foto da sua folha de 30 linhas para nota oficial de banca",
        category: "Ações Rápidas",
        icon: Camera,
        badge: "Discursiva",
        action: () => navigateTo("/redacao"),
        keywords: ["redacao foto", "manuscrita", "discursiva foto", "camera", "caligrafia", "folha"],
      },
      {
        id: "action-pocket-summary",
        title: "Folha de Véspera em PDF de Bolso 📑",
        subtitle: "Prazos fatais, mnemônicos e pegadinhas diagramados para dobrar e levar para a prova",
        category: "Ações Rápidas",
        icon: FileText,
        badge: "PDF A4",
        action: () => {
          setIsOpen(false);
          setIsPocketSummaryOpen(true);
        },
        keywords: ["folha de vespera", "pdf de bolso", "resumo", "prazos", "mnemonicos", "pegadinhas", "reta final", "imprimir"],
      },
      {
        id: "action-precedent-duel",
        title: "Duelo de Precedentes STF/STJ ⚔️",
        subtitle: "Casos práticos interativos: julgue teses do STF e STJ antes da prova",
        category: "Ações Rápidas",
        icon: Swords,
        badge: "Duelo",
        action: () => {
          setIsOpen(false);
          setIsPrecedentDuelOpen(true);
        },
        keywords: ["duelo", "precedentes", "stf", "stj", "jurisprudencia", "casos praticos", "teses"],
      },
      {
        id: "action-import-pdf",
        title: "Importar Prova em PDF (OCR de Banca)",
        subtitle: "Dissecação automática com IA multimodal para simulado interativo",
        category: "Ações Rápidas",
        icon: UploadCloud,
        badge: "Multimodal",
        action: () => {
          setIsOpen(false);
          setIsPdfImporterOpen(true);
          triggerHaptic("medium");
        },
        keywords: ["pdf", "prova", "banca", "importar", "ocr", "caderno", "questoes pdf", "enunciado"],
      },
      {
        id: "action-redemption-exam",
        title: "Treinar Questões que Errei (Caderno de Erros)",
        subtitle: "Resolva questões similares para não errar mais as mesmas pegadinhas",
        category: "Ações Rápidas",
        icon: ShieldCheck,
        badge: "Prática",
        action: () => navigateTo("/notebook"),
        keywords: ["erros", "caderno de erros", "questoes", "treinar erros", "superar"],
      },
      {
        id: "action-monte-carlo",
        title: "Calcular Previsão de Aprovação 🎯",
        subtitle: "Cálculo estatístico com mais de 1.000 cenários de prova",
        category: "Ações Rápidas",
        icon: Activity,
        badge: "Previsão",
        action: () => navigateTo("/performance"),
        keywords: ["monte carlo", "previsao", "probabilidade", "corte", "chance", "aprovacao"],
      },
      {
        id: "action-quick-simulado",
        title: "Iniciar Simulado Rápido de 10 Questões",
        subtitle: "Gera um simulado expresso em 1 clique",
        category: "Ações Rápidas",
        icon: Zap,
        badge: "Expresso",
        action: () => navigateTo("/questions?mode=express"),
        keywords: ["simulado rapido", "treinar agora", "10 questoes", "expresso"],
      },
      {
        id: "action-install-pwa",
        title: "Instalar Aplicativo (PWA Mobile & Desktop)",
        subtitle: "Acesse em tela cheia com ícone no celular e estudos sem distrações",
        category: "Ações Rápidas",
        icon: Smartphone,
        badge: "PWA",
        action: () => {
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent("open-pwa-install"));
        },
        keywords: ["pwa", "instalar", "app", "aplicativo", "celular", "mobile", "icone", "download"],
      },
      {
        id: "action-audio-study",
        title: "Estudo Hands-Free (Fones de Ouvido)",
        subtitle: "Revisão por áudio contínuo para academia, trânsito ou caminhada",
        category: "Ações Rápidas",
        icon: Headphones,
        badge: "Áudio",
        action: () => {
          navigateTo("/flashcards/decks");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("open-audio-study"));
          }, 300);
        },
        keywords: ["audio", "fone", "ouvir", "transito", "academia", "hands-free", "podcast"],
      },
      {
        id: "action-toggle-theme",
        title: `Alternar Tema (Atualmente: ${theme === "dark" ? "Escuro" : "Claro"})`,
        subtitle: "Alterne instantaneamente entre Modo Claro Stripe e Dark Cyberpunk",
        category: "Ações Rápidas",
        icon: theme === "dark" ? Sun : Moon,
        action: () => {
          playClick();
          triggerHaptic("medium");
          toggleTheme();
          setIsOpen(false);
        },
        keywords: ["tema", "modo claro", "modo escuro", "light", "dark"],
      },
      {
        id: "action-toggle-sound",
        title: isMuted ? "Ativar Efeitos Sonoros" : "Silenciar Efeitos Sonoros",
        subtitle: "Controle de bips harmônicos e feedback sensorial",
        category: "Ações Rápidas",
        icon: isMuted ? VolumeX : Volume2,
        action: () => {
          triggerHaptic("light");
          toggleMute();
          if (isMuted) playChime();
          setIsOpen(false);
        },
        keywords: ["som", "audio", "mutar", "efeitos", "silencio"],
      },
    ];

    // MÓDULOS DE DIREITO (SOMENTE SE O USUÁRIO TIVER FOCO JURÍDICO)
    if (hasLaw) {
      list.push(
        {
          id: "law-jurisprudencia",
          title: "Hub de Jurisprudência & Súmulas com IA",
          subtitle: "Precedentes do STF/STJ, pegadinhas de bancas e cartões de memória",
          category: "Carreiras Jurídicas",
          icon: Scale,
          badge: "Direito",
          action: () => navigateTo("/jurisprudencia"),
          keywords: ["sumulas", "jurisprudencia", "stf", "stj", "direito", "pegadinhas"],
        },
        {
          id: "law-prova-oral",
          title: "Simulador de Prova Oral com IA",
          subtitle: "Arguição e sustentação em tempo real com bancas examinadoras",
          category: "Carreiras Jurídicas",
          icon: Mic,
          badge: "Direito",
          action: () => navigateTo("/prova-oral"),
          keywords: ["oral", "prova oral", "arguicao", "magistratura", "defensoria", "delegado"],
        },
      );
    }

    // MATÉRIAS E TÓPICOS DO EDITAL DO ALUNO (BUSCA DIRETA NO CTRL+K)
    for (const subject of editalSubjects) {
      const subjectTopics = subject.topics || [];
      const doneTopics = subjectTopics.filter(
        (t) => t.firstStudy && t.firstStudy !== "Pendente",
      ).length;

      list.push({
        id: `edital-sub-${subject.id}`,
        title: subject.name,
        subtitle: `Matéria do Edital • ${doneTopics}/${subjectTopics.length} tópicos estudados`,
        category: "Seu Edital",
        icon: BookOpen,
        badge: "Matéria",
        action: () =>
          navigateTo(
            `/questions?subjectId=${encodeURIComponent(subject.name)}&autoStart=true`,
            `edital-sub-${subject.id}`,
          ),
        keywords: ["edital", "materia", "disciplina", subject.name],
        quickActions: [
          {
            label: "⏱️ Pomodoro",
            path: `/study-room?subjectId=${encodeURIComponent(subject.id)}&subject=${encodeURIComponent(subject.name)}`,
          },
          {
            label: "🎯 Questões",
            path: `/questions?subjectId=${encodeURIComponent(subject.name)}&autoStart=true`,
          },
        ],
      });

      for (const topic of subjectTopics) {
        const isStudied = topic.firstStudy && topic.firstStudy !== "Pendente";
        list.push({
          id: `edital-top-${topic.id}`,
          title: topic.title,
          subtitle: `${subject.name} • ${isStudied ? "Estudado" : "Pendente no Edital"}`,
          category: "Seu Edital",
          icon: Target,
          badge: isStudied ? "Concluído" : "Pendente",
          action: () =>
            navigateTo(
              `/questions?subjectId=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(topic.title)}&topicId=${encodeURIComponent(topic.id)}&autoStart=true`,
              `edital-top-${topic.id}`,
            ),
          keywords: [
            "topico",
            "edital",
            "assunto",
            subject.name,
            topic.title,
          ],
          quickActions: [
            {
              label: "⏱️ Pomodoro",
              path: `/study-room?subjectId=${encodeURIComponent(subject.id)}&subject=${encodeURIComponent(subject.name)}&topicId=${encodeURIComponent(topic.id)}&topic=${encodeURIComponent(topic.title)}`,
            },
            {
              label: "🗺️ Mapa",
              path: `/mapas-mentais?subject=${encodeURIComponent(subject.name)}&topic=${encodeURIComponent(topic.title)}&autoGenerate=true`,
            },
          ],
        });
      }
    }

    return list;
  }, [
    hasLaw,
    theme,
    isMuted,
    toggleTheme,
    toggleMute,
    playClick,
    playChime,
    editalSubjects,
  ]);

  // Filtragem
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      const staticAndTopEdital = items.filter(
        (it) => it.category !== "Seu Edital",
      );
      const topEditalSubjects = items
        .filter((it) => it.category === "Seu Edital" && it.id.startsWith("edital-sub-"))
        .slice(0, 4);
      const baseList = [...staticAndTopEdital, ...topEditalSubjects];

      if (recentCommandIds.length > 0) {
        const recentItems = recentCommandIds
          .map((rId) => items.find((it) => it.id === rId))
          .filter(Boolean) as CommandItem[];

        const recentsWithCategory = recentItems.map((it) => ({
          ...it,
          category: "Recentes" as const,
        }));

        const restItems = baseList.filter(
          (it) => !recentCommandIds.includes(it.id),
        );
        return [...recentsWithCategory, ...restItems];
      }
      return baseList;
    }
    const q = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [items, query, recentCommandIds]);

  // Navegação via setas
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
      triggerHaptic("light");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(filteredItems.length - 1, 0) : prev - 1,
      );
      triggerHaptic("light");
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        recordRecent(current.id);
        current.action();
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-24 p-3 pb-[max(env(safe-area-inset-bottom),1rem)] font-sans">
            {/* Backdrop com blur sofisticado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-all"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-xl bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header com Input de Busca */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <Search
                  className="text-slate-400 dark:text-slate-500 shrink-0"
                  size={18}
                />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Busque páginas, ações ou qualquer matéria/tópico do seu edital..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md">
                  ESC
                </kbd>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsOpen(false);
                  }}
                  aria-label="Fechar paleta de comandos"
                  className="sm:hidden p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lista de Resultados */}
              <div className="max-h-[50vh] sm:max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          recordRecent(item.id);
                          item.action();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between gap-3 px-3 py-3 sm:py-2.5 min-h-[46px] rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 transition-colors ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isSelected
                                    ? "text-white"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border shrink-0 ${
                                    isSelected
                                      ? "bg-white/20 text-white border-white/30"
                                      : "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p
                                className={`text-[11px] truncate ${
                                  isSelected
                                    ? "text-indigo-100"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.quickActions && item.quickActions.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1 mr-1">
                              {item.quickActions.map((qa) => (
                                <button
                                  key={qa.label}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateTo(qa.path, item.id);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-white/20 hover:bg-white/30 text-white border-white/30"
                                      : "bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/15 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                                  }`}
                                >
                                  {qa.label}
                                </button>
                              ))}
                            </div>
                          )}
                          <span
                            className={`text-[10px] font-medium hidden sm:inline ${
                              isSelected ? "text-indigo-100" : "text-slate-400"
                            }`}
                          >
                            {item.category}
                          </span>
                          <ArrowRight
                            size={13}
                            className={`transition-transform ${
                              isSelected
                                ? "translate-x-0.5 text-white"
                                : "opacity-0"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Nenhum comando ou tópico encontrado para &quot;{query}
                      &quot;.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tente buscar por matérias do seu edital,{" "}
                      <em>Redação</em>, <em>Flashcards</em> ou <em>Ligas</em>.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer com Dicas de Atalho */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="sm:hidden font-medium text-slate-400">
                  Toque para selecionar
                </span>
                <div className="hidden sm:flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded">
                      ↓
                    </kbd>{" "}
                    Navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded">
                      ↵
                    </kbd>{" "}
                    Abrir
                  </span>
                </div>
                <span className="font-mono text-indigo-500 dark:text-indigo-400 font-bold">
                  Synapse Command AI
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Global de Importação de Provas em PDF */}
      <PDFExamImporterModal
        isOpen={isPdfImporterOpen}
        onClose={() => setIsPdfImporterOpen(false)}
      />

      {/* Modal de Folha de Véspera em PDF de Bolso */}
      <PocketSummaryModal
        isOpen={isPocketSummaryOpen}
        onClose={() => setIsPocketSummaryOpen(false)}
        targetRole={user?.targetRole || undefined}
      />

      {/* Modal de Duelo de Precedentes STF/STJ */}
      <PrecedentDuelModal
        isOpen={isPrecedentDuelOpen}
        onClose={() => setIsPrecedentDuelOpen(false)}
      />
    </>
  );
}
