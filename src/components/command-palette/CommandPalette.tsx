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
  BarChart3,
  Scale,
  Mic,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  ArrowRight,
  Headphones,
  CalendarDays,
  Flame,
  Brain,
  Activity,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAudio } from "@/contexts/AudioContext";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { isLawFocused } from "@/lib/career-utils";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navegação" | "Ações Rápidas" | "Carreiras Jurídicas";
  icon: React.ElementType;
  badge?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  user?: {
    careerFocus?: string | null;
    targetRole?: string | null;
  } | null;
}

export function CommandPalette({ user }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      playChime();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, playChime]);

  const navigateTo = (path: string) => {
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
        title: "Flashcards FSRS & Baralhos",
        subtitle: "Repetição espaçada com algoritmo de alta retenção",
        category: "Navegação",
        icon: Layers,
        action: () => navigateTo("/flashcards/decks"),
        keywords: ["flashcards", "anki", "memorizacao", "decks", "baralho"],
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
        title: "Calendário de Revisões SM-2",
        subtitle: "Mapa de calor temporal das suas revisões agendadas",
        category: "Navegação",
        icon: CalendarDays,
        action: () => navigateTo("/calendar"),
        keywords: ["calendario", "agenda", "revisoes", "datas"],
      },
      {
        id: "nav-performance",
        title: "Inteligência Cognitiva & Desempenho",
        subtitle: "Gráficos de maturidade FSRS e acertos por disciplina",
        category: "Navegação",
        icon: BarChart3,
        action: () => navigateTo("/performance"),
        keywords: ["metricas", "desempenho", "graficos", "estatisticas", "retencao"],
      },
      {
        id: "nav-mindmaps",
        title: "Hub de Mapas Mentais & Mnemônicos",
        subtitle: "Esquematizações conceituais e macetes de bancas com IA",
        category: "Navegação",
        icon: Brain,
        badge: "IA",
        action: () => navigateTo("/mapas-mentais"),
        keywords: ["mapa mental", "mnemonicos", "esquema", "resumo", "arvore", "visual", "macetes"],
      },

      // AÇÕES RÁPIDAS
      {
        id: "action-monte-carlo",
        title: "Executar Raio-X Monte Carlo (1.000x)",
        subtitle: "Simulação estocástica de nota e matriz de custo de oportunidade",
        category: "Ações Rápidas",
        icon: Activity,
        badge: "Preditivo",
        action: () => navigateTo("/performance"),
        keywords: ["monte carlo", "raio x", "risco", "probabilidade", "corte", "chance", "aprovacao"],
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
          subtitle: "Precedentes do STF/STJ, pegadinhas de bancas e flashcards FSRS",
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
        }
      );
    }

    return list;
  }, [hasLaw, theme, isMuted, toggleTheme, toggleMute, playClick, playChime]);

  // Filtragem
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [items, query]);

  // Navegação via setas
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
      triggerHaptic("light");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(filteredItems.length - 1, 0) : prev - 1
      );
      triggerHaptic("light");
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) current.action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 font-sans">
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
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <Search className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="O que você deseja fazer ou acessar? (ex: Redação, Flashcards, Tema...)"
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md">
                ESC
              </kbd>
            </div>

            {/* Lista de Resultados */}
            <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/[0.04]">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
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
                                isSelected ? "text-white" : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${
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
                                isSelected ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
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
                            isSelected ? "translate-x-0.5 text-white" : "opacity-0"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Nenhum comando ou página encontrado para &quot;{query}&quot;.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tente buscar por termos como <em>Redação</em>, <em>Flashcards</em>, <em>Ligas</em> ou <em>Tema</em>.
                  </p>
                </div>
              )}
            </div>

            {/* Footer com Dicas de Atalho */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
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
  );
}
