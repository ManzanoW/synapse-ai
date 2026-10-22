"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard,
  X,
  Search,
  Compass,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Navegação" | "Questões & Provas" | "Flashcards FSRS" | "Produtividade";
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  // Navegação
  { keys: ["Ctrl", "K"], description: "Abrir Busca Global & Comandos Rápidos", category: "Navegação" },
  { keys: ["?"], description: "Abrir este Guia de Atalhos de Teclado", category: "Navegação" },
  { keys: ["G", "D"], description: "Ir direto para o Dashboard Inicial", category: "Navegação" },
  { keys: ["G", "Q"], description: "Ir para o Banco de Questões & Simulados", category: "Navegação" },
  { keys: ["G", "F"], description: "Ir para Flashcards & Baralhos", category: "Navegação" },
  { keys: ["G", "E"], description: "Ir para o Edital Esquematizado", category: "Navegação" },
  { keys: ["G", "L"], description: "Ir para a Lei Seca Interativa", category: "Navegação" },
  { keys: ["G", "C"], description: "Ir para o Cronograma de Ciclos da Semana", category: "Navegação" },
  { keys: ["G", "J"], description: "Ir para o Hub de Jurisprudência (STF/STJ)", category: "Navegação" },
  { keys: ["G", "N"], description: "Ir para o Caderno de Erros Ativo", category: "Navegação" },

  // Questões & Provas
  { keys: ["A", "B", "C", "D", "E"], description: "Marcar alternativa correspondente (1 a 5)", category: "Questões & Provas" },
  { keys: ["C", "E"], description: "Marcar Certo ou Errado (Padrão Cebraspe)", category: "Questões & Provas" },
  { keys: ["Enter"], description: "Confirmar resposta da questão", category: "Questões & Provas" },
  { keys: ["Espaço"], description: "Avançar para a próxima questão do simulado", category: "Questões & Provas" },
  { keys: ["F"], description: "Sinalizar questão para revisar depois (Flag)", category: "Questões & Provas" },
  { keys: ["O"], description: "Abrir Folha Óptica de Respostas (Gabarito)", category: "Questões & Provas" },

  // Flashcards FSRS
  { keys: ["Espaço"], description: "Virar o cartão e revelar o verso / resposta", category: "Flashcards FSRS" },
  { keys: ["1"], description: "Avaliar retenção: Errei (Repetir agora)", category: "Flashcards FSRS" },
  { keys: ["2"], description: "Avaliar retenção: Difícil (Intervalo curto)", category: "Flashcards FSRS" },
  { keys: ["3"], description: "Avaliar retenção: Bom (Intervalo ótimo)", category: "Flashcards FSRS" },
  { keys: ["4"], description: "Avaliar retenção: Fácil (Intervalo longo)", category: "Flashcards FSRS" },

  // Produtividade
  { keys: ["Alt", "N"], description: "Abrir Bloco de Rascunho Rápido Flutuante", category: "Produtividade" },
  { keys: ["Z"], description: "Ativar / Desativar Modo Zen de Estudo Focado", category: "Produtividade" },
  { keys: ["Esc"], description: "Fechar qualquer modal, gaveta ou overlay ativo", category: "Produtividade" },
];

export function KeyboardShortcutsModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [pendingKeyG, setPendingKeyG] = useState(false);

  const handleOpen = useCallback(() => {
    triggerHaptic("light");
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    triggerHaptic("light");
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  // Escuta atalhos globais de teclado
  useEffect(() => {
    let gTimeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora atalhos se o foco estiver em campos de digitação
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      // Pressionar ? (Shift + /)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        triggerHaptic("light");
        return;
      }

      // Pressionar Esc para fechar
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
        return;
      }

      // Sequência 'G then <Letra>' para salto rápido
      const keyUpper = e.key.toUpperCase();
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (keyUpper === "G") {
          setPendingKeyG(true);
          if (gTimeout) clearTimeout(gTimeout);
          gTimeout = setTimeout(() => setPendingKeyG(false), 1200);
          return;
        }

        if (pendingKeyG) {
          setPendingKeyG(false);
          if (gTimeout) clearTimeout(gTimeout);

          triggerHaptic("medium");
          switch (keyUpper) {
            case "D":
              router.push("/dashboard");
              break;
            case "Q":
              router.push("/questions");
              break;
            case "F":
              router.push("/flashcards");
              break;
            case "E":
              router.push("/edital");
              break;
            case "L":
              router.push("/lei-seca");
              break;
            case "C":
              router.push("/week");
              break;
            case "J":
              router.push("/jurisprudencia");
              break;
            case "N":
              router.push("/notebook");
              break;
            default:
              break;
          }
        }
      }
    };

    const handleCustomTrigger = () => handleOpen();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-keyboard-shortcuts", handleCustomTrigger);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-keyboard-shortcuts", handleCustomTrigger);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [isOpen, pendingKeyG, router, handleOpen, handleClose]);

  const categories = useMemo(
    () => ["all", "Navegação", "Questões & Provas", "Flashcards FSRS", "Produtividade"],
    []
  );

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS_DATA.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-shortcuts-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-indigo-500/30 bg-[#070b14] shadow-2xl shadow-indigo-950/50 overflow-hidden font-sans text-slate-100"
          >
            {/* Topo do Modal */}
            <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-6 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-400">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h3 id="keyboard-shortcuts-title" className="text-base font-bold text-white flex items-center gap-2">
                    Atalhos de Teclado
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Superhuman Mode
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Navegue e estude na velocidade do pensamento sem tocar no mouse
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar atalhos de teclado"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Barra de Filtro e Categorias */}
            <div className="p-4 sm:px-6 border-b border-white/5 bg-slate-950/40 space-y-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Filtrar atalhos por ação ou tecla..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setActiveCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {cat === "all" ? "Todos os Atalhos" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Atalhos */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 custom-scrollbar max-h-[50vh]">
              {filteredShortcuts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Nenhum atalho encontrado para &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredShortcuts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/80 transition-colors"
                  >
                    <span className="text-xs text-slate-200 font-medium pr-4">
                      {item.description}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="min-w-[26px] h-6 px-2 inline-flex items-center justify-center rounded-lg border border-indigo-500/30 bg-slate-950/80 font-mono text-[11px] font-bold text-indigo-300 shadow-xs">
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && item.keys.length <= 2 && (
                            <span className="text-[10px] text-slate-600 font-mono">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé Informativo */}
            <div className="p-3.5 sm:px-6 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] font-bold text-white">?</kbd> a qualquer momento para reabrir</span>
              </span>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
