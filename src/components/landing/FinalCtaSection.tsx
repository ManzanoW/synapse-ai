"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-[#030712]">
      {/* Dramatic Cosmic Portal Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[600px] sm:w-[900px] h-[350px] sm:h-[450px] bg-gradient-to-r from-indigo-600/20 via-violet-600/25 to-cyan-500/20 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-8 overflow-hidden">
          {/* Top Glow Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-cyan-300 text-xs font-mono font-bold">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>O Portal para o Seu Novo Cargo</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Sua posse não depende de sorte.{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300 bg-clip-text text-transparent">
              Começa com uma decisão agora.
            </span>
          </h2>

          {/* Sub-headline */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Abandone o desespero de revisões desorganizadas e cronogramas arcaicos. Estude com rigor de banca examinadora, motor FSRS e áudio neural no bolso.
          </p>

          {/* CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto relative group inline-flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-2xl font-black text-sm sm:text-base text-white overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl" />
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-200 animate-pulse" />
                <span>Começar Gratuitamente</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Micro Trust */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sem necessidade de cartão
            </span>
            <span className="text-slate-600">•</span>
            <span>Acesso imediato ao Cockpit</span>
            <span className="text-slate-600">•</span>
            <span>Cotas diárias renovadas à meia-noite</span>
          </div>
        </div>
      </div>
    </section>
  );
}
