"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Zap,
  Brain,
  Scale,
  Headphones,
  Coins,
  Clock,
  Award,
  HelpCircle,
  Smartphone,
  ArrowRight,
  X,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { playUiSound } from "@/lib/sensory/audio-feedback";

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPwaModal: () => void;
}

export function CommandMenu({ isOpen, onClose, onOpenPwaModal }: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigateTo = (href: string) => {
    onClose();
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = href;
    }
  };

  const COMMANDS: CommandItem[] = [
    {
      id: "start",
      title: "Começar Gratuitamente",
      category: "Ação Rápida",
      icon: Zap,
      action: () => navigateTo("/login"),
      badge: "Grátis",
    },
    {
      id: "pricing",
      title: "Ver Planos & Destravar o Synapse Pro",
      category: "Planos",
      icon: Sparkles,
      action: () => navigateTo("#planos"),
      badge: "R$ 29,90/mês",
    },
    {
      id: "curva",
      title: "Laboratório da Curva de Retenção FSRS",
      category: "Neurociência",
      icon: Brain,
      action: () => navigateTo("#metodo"),
    },
    {
      id: "comparativo",
      title: "Matriz Comparativa vs. Cursinhos & Anki",
      category: "Decisão",
      icon: Scale,
      action: () => navigateTo("#comparativo"),
    },
    {
      id: "audio",
      title: "Arsenal de Áudio Neural no Trânsito",
      category: "Recursos",
      icon: Headphones,
      action: () => navigateTo("#arsenal"),
    },
    {
      id: "roi",
      title: "Calculadora do Salário da Posse (ROI)",
      category: "Finanças",
      icon: Coins,
      action: () => navigateTo("#custo-oportunidade"),
    },
    {
      id: "tempo",
      title: "Simulador de Horas Perdidas no Deslocamento",
      category: "Produtividade",
      icon: Clock,
      action: () => navigateTo("#calculadora-tempo"),
    },
    {
      id: "depoimentos",
      title: "Muro de Prova Social • Concurseiros Aprovados",
      category: "Resultados",
      icon: Award,
      action: () => navigateTo("#depoimentos"),
    },
    {
      id: "pwa",
      title: "Como Instalar Synapse no Celular (iPhone / Android)",
      category: "Mobile",
      icon: Smartphone,
      action: () => {
        onClose();
        onOpenPwaModal();
      },
      badge: "PWA",
    },
    {
      id: "faq",
      title: "Perguntas Frequentes (FAQ)",
      category: "Suporte",
      icon: HelpCircle,
      action: () => navigateTo("#faq"),
    },
  ];

  const filteredCommands = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isOpen]);

  // Navegação por teclado (Cima, Baixo, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        playUiSound("slider");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        playUiSound("slider");
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          triggerHaptic("medium");
          playUiSound("success");
          selected.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Command Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-xl rounded-2xl bg-[#070b14] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 z-10 overflow-hidden flex flex-col"
        >
          {/* Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-900/50">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Digite um comando ou navegue..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-hidden font-medium"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Commands */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum comando encontrado para "{query}".
              </div>
            ) : (
              filteredCommands.map((cmd, index) => {
                const isSelected = index === selectedIndex;
                const Icon = cmd.icon;

                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      playUiSound("success");
                      cmd.action();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600/30 via-cyan-600/20 to-transparent border border-cyan-500/40 text-white"
                        : "text-slate-300 hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-white/[0.04] text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-snug">{cmd.title}</div>
                        <div className="text-[10px] font-mono text-slate-500">{cmd.category}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cmd.badge && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-cyan-300 border border-white/10">
                          {cmd.badge}
                        </span>
                      )}
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>↑↓ para navegar</span>
              <span>•</span>
              <span>↵ para selecionar</span>
            </div>
            <span>ESC para sair</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
