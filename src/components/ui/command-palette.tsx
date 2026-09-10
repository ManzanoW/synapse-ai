"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Layers,
  FileStack,
  TrendingUp,
  Trophy,
  UserCircle2,
  Sparkles,
  BookOpen,
  Zap,
  ArrowRight,
  Command,
  X,
  Clock,
  HelpCircle,
} from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  color?: string | null;
  topicsCount?: number;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeColor?: string;
  category: "Páginas" | "Ações Rápidas" | "Minhas Disciplinas";
  href: string;
  keywords?: string[];
  action?: () => void;
}

const STATIC_PAGES: Omit<PaletteItem, "id">[] = [
  {
    title: "Dashboard",
    subtitle: "Visão geral da jornada, XP e estatísticas",
    icon: LayoutDashboard,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    category: "Páginas",
    href: "/dashboard",
    keywords: ["home", "inicio", "xp", "streak", "painel"],
  },
  {
    title: "Cronograma Semanal",
    subtitle: "Ciclos de estudo e balanceamento adaptativo",
    icon: Sparkles,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    category: "Páginas",
    href: "/week",
    keywords: ["semana", "remanejamento", "planejamento", "agenda", "dias"],
  },
  {
    title: "Edital Verticalizado",
    subtitle: "Acompanhamento detalhado de tópicos e SM-2",
    icon: FileSpreadsheet,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    category: "Páginas",
    href: "/edital",
    keywords: ["conteudos", "materias", "topicos", "disciplinas", "concurso"],
  },
  {
    title: "Flashcards & Decks",
    subtitle: "Prática com repetição espaçada ativa",
    icon: Layers,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    category: "Páginas",
    href: "/flashcards",
    keywords: ["cards", "anki", "memorizacao", "baralhos", "revisao"],
  },
  {
    title: "Banco de Provas & Questões",
    subtitle: "Simulados por banca e questões geradas por IA",
    icon: FileStack,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    category: "Páginas",
    href: "/questions",
    keywords: ["simulado", "quiz", "exercicios", "gabarito", "cebraspe", "fgv"],
  },
  {
    title: "Analytics & Performance",
    subtitle: "Métricas de retenção, precisão e progresso",
    icon: TrendingUp,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    category: "Páginas",
    href: "/performance",
    keywords: ["graficos", "estatisticas", "desempenho", "taxa", "tempo"],
  },
  {
    title: "Hall de Conquistas",
    subtitle: "Badges desbloqueadas, patentes e recompensas",
    icon: Trophy,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15 border-amber-500/30",
    category: "Páginas",
    href: "/achievements",
    badge: "XP",
    badgeColor: "text-amber-300 bg-amber-500/20 border-amber-500/30",
    keywords: ["medalhas", "badges", "niveis", "recompensas"],
  },
  {
    title: "Calendário de Revisões",
    subtitle: "Datas previstas pelo algoritmo SM-2",
    icon: CalendarDays,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    category: "Páginas",
    href: "/calendar",
    keywords: ["datas", "mes", "agenda", "agendamento"],
  },
  {
    title: "Meu Perfil",
    subtitle: "Configurações de conta e metas de estudo",
    icon: UserCircle2,
    iconColor: "text-slate-300",
    iconBg: "bg-slate-800/60 border-slate-700/60",
    category: "Páginas",
    href: "/profile",
    keywords: ["usuario", "configuracoes", "senha", "dados", "email"],
  },
];

const STATIC_ACTIONS: Omit<PaletteItem, "id">[] = [
  {
    title: "Gerar Simulado com IA",
    subtitle: "Criar novo simulado instantâneo com questões inéditas",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/30",
    badge: "IA",
    badgeColor: "text-amber-300 bg-amber-500/20 border-amber-500/40",
    category: "Ações Rápidas",
    href: "/questions",
    keywords: ["gerar", "novo simulado", "quiz", "inteligencia artificial"],
  },
  {
    title: "Importar ou Estruturar Edital",
    subtitle: "Carregar matérias e tópicos via texto ou arquivo",
    icon: FileSpreadsheet,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/30",
    category: "Ações Rápidas",
    href: "/edital",
    keywords: ["adicionar materia", "importar", "novo edital", "pdf"],
  },
  {
    title: "Revisar Pendências de Hoje",
    subtitle: "Acessar os tópicos urgentes agendados para hoje",
    icon: Clock,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/30",
    badge: "SM-2",
    badgeColor: "text-rose-300 bg-rose-500/20 border-rose-500/40",
    category: "Ações Rápidas",
    href: "/edital",
    keywords: ["pendencias", "urgente", "hoje", "revisao diaria"],
  },
  {
    title: "Criar Novo Flashcard",
    subtitle: "Adicionar conceito de pergunta e resposta rápida",
    icon: Layers,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/30",
    category: "Ações Rápidas",
    href: "/flashcards",
    keywords: ["novo card", "memorizar", "adicionar deck"],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Carrega matérias dinamicamente quando a paleta é aberta
  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoadingSubjects(true);
      const res = await fetch("/api/edital?mode=subjects");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setSubjects(
            json.data.map(
              (sub: {
                id: string;
                name: string;
                color?: string;
                _count?: { topics?: number };
              }) => ({
                id: sub.id,
                name: sub.name,
                color: sub.color || "#6366f1",
                topicsCount: sub._count?.topics ?? 0,
              }),
            ),
          );
        }
      }
    } catch (err) {
      console.error("Erro ao carregar matérias na command palette:", err);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  // Atalho global Cmd+K e Ctrl+K + Suporte a Custom Event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setSelectedIndex(0);
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => {
      setQuery("");
      setSelectedIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, []);

  // Efeito ao abrir a paleta
  useEffect(() => {
    if (isOpen) {
      const fetchTimeout = setTimeout(() => {
        void fetchSubjects();
      }, 0);
      // Foca no input após animação de montagem
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(fetchTimeout);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, fetchSubjects]);

  // Lista consolidada de itens pesquisáveis
  const allItems: PaletteItem[] = useMemo(() => {
    const pages: PaletteItem[] = STATIC_PAGES.map((p, i) => ({
      ...p,
      id: `page-${i}`,
    }));

    const actions: PaletteItem[] = STATIC_ACTIONS.map((a, i) => ({
      ...a,
      id: `action-${i}`,
    }));

    const subjectItems: PaletteItem[] = subjects.map((sub) => ({
      id: `subject-${sub.id}`,
      title: sub.name,
      subtitle: sub.topicsCount
        ? `${sub.topicsCount} tópicos no edital • Ver matéria`
        : "Visualizar matéria no Edital",
      icon: BookOpen,
      iconColor: "text-white",
      iconBg: "bg-white/10 border-white/15",
      category: "Minhas Disciplinas",
      href: `/edital?subjectId=${sub.id}`,
      keywords: ["materia", "disciplina", sub.name.toLowerCase()],
    }));

    return [...actions, ...pages, ...subjectItems];
  }, [subjects]);

  // Filtra itens com base na query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;

    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) =>
        k.toLowerCase().includes(q),
      );
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [allItems, query]);

  // Rola suavemente o item ativo para visibilidade no scroll
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-palette-index="${selectedIndex}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      setIsOpen(false);
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [router],
  );

  // Navegação via teclado na lista
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    }
  };

  // Agrupamento por categoria para renderização com títulos de seção
  const groupedSections = useMemo(() => {
    const groups: Record<string, { item: PaletteItem; index: number }[]> = {};
    filteredItems.forEach((item, index) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push({ item, index });
    });
    return groups;
  }, [filteredItems]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4">
          {/* Backdrop Escuro com Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#090d16]/95 shadow-[0_0_50px_rgba(99,102,241,0.2)] backdrop-blur-2xl text-slate-100 flex flex-col max-h-[80vh]"
          >
            {/* Glow Superior Neon */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-500/80 to-transparent" />
            <div className="pointer-events-none absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl" />
            <div className="pointer-events-none absolute -top-16 -right-16 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl" />

            {/* Input de Busca */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/2">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Buscar páginas, matérias, simulados ou ações..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder:text-slate-500 outline-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedIndex(0);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg shrink-0">
                <span>ESC</span>
              </div>
            </div>

            {/* Lista de Resultados */}
            <div
              ref={listRef}
              className="overflow-y-auto p-2 space-y-4 max-h-[60vh] custom-scrollbar"
            >
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <HelpCircle
                    size={28}
                    className="mx-auto text-slate-600 mb-2"
                  />
                  <p className="text-sm font-semibold text-slate-300">
                    Nenhum resultado para &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-slate-500">
                    Tente buscar por &ldquo;Simulado&rdquo;,
                    &ldquo;Edital&rdquo;, &ldquo;Cards&rdquo; ou o nome de uma
                    disciplina.
                  </p>
                </div>
              ) : (
                Object.entries(groupedSections).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                      {category}
                    </div>

                    <div className="space-y-1">
                      {items.map(({ item, index }) => {
                        const Icon = item.icon;
                        const isSelected = index === selectedIndex;

                        return (
                          <div
                            key={item.id}
                            data-palette-index={index}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md shadow-indigo-950/30"
                                : "hover:bg-white/4 border border-transparent text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform ${
                                  item.iconBg || "bg-white/5 border-white/10"
                                } ${isSelected ? "scale-105" : ""}`}
                              >
                                <Icon
                                  size={16}
                                  className={
                                    item.iconColor || "text-indigo-400"
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-100 group-hover:text-white truncate">
                                    {item.title}
                                  </span>

                                  {item.badge && (
                                    <span
                                      className={`text-[9px] font-extrabold uppercase font-mono px-1.5 py-0.2 rounded-md border ${
                                        item.badgeColor ||
                                        "text-indigo-300 bg-indigo-500/20 border-indigo-500/30"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>

                                {item.subtitle && (
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 text-slate-500 group-hover:text-slate-300">
                              {isSelected ? (
                                <div className="flex items-center gap-1 font-mono text-[10px] text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                                  <span>Ir</span>
                                  <ArrowRight size={10} />
                                </div>
                              ) : (
                                <ArrowRight
                                  size={14}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé Informativo */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-white/2 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    ↓
                  </kbd>
                  <span>Navegar</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    ↵
                  </kbd>
                  <span>Selecionar</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-indigo-400">
                <Command size={11} />
                <span>Synapse Command</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
