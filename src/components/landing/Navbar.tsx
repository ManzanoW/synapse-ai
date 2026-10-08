"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "O Método", href: "#metodo" },
    { label: "Cockpit", href: "#cockpit" },
    { label: "Arsenal Cognitivo", href: "#arsenal" },
    { label: "Como Funciona", href: "#fluxo" },
    { label: "Comparativo", href: "#comparativo" },
    { label: "Planos", href: "#planos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,border-color,padding,box-shadow] duration-300 ease-out ${
          scrolled
            ? "bg-[#030712]/85 backdrop-blur-xl border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-3.5"
            : "bg-transparent border-white/0 py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Synapse AI */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-hidden"
              aria-label="Synapse AI - Página Inicial"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-cyan-500/10 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] group-hover:border-indigo-400 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all">
                <div className="w-5 h-5 text-indigo-400 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
                </div>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
              </div>

              <div className="flex items-baseline gap-1 select-none">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Synapse
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                  AI
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse ml-0.5" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 px-3 py-1.5 rounded-full bg-[#030712]/40 border border-white/10 backdrop-blur-md">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-xs lg:text-sm font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] rounded-full transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                Entrar
              </Link>

              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/30 hover:border-indigo-300/50 shadow-md shadow-indigo-950/50 transition-all duration-200 focus:outline-hidden"
              >
                <span>Começar Grátis</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600/80 border border-indigo-400/30"
              >
                Entrar
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[65px] z-40 md:hidden bg-[#030712]/95 backdrop-blur-2xl border-b border-white/[0.08] p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 shadow-lg shadow-indigo-500/25"
              >
                Criar Conta Gratuita
              </Link>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sem necessidade de cartão • Acesso imediato</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
