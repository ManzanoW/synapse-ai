"use client";

import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#020408] text-slate-400 text-xs py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Coluna 1: Marca & Propósito */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-cyan-500/10 border border-indigo-500/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Synapse <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">AI</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              O primeiro copiloto cognitivo para concurseiros de alta performance. Motor FSRS, redação discursiva calibrada por banca e áudio neural hands-free.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistemas & Servidores Operacionais (99.98% Uptime)</span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 block">
              Navegação
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#metodo" className="hover:text-white transition-colors">
                  O Método (Arcaico vs. Synapse)
                </a>
              </li>
              <li>
                <a href="#cockpit" className="hover:text-white transition-colors">
                  Cockpit em Ação
                </a>
              </li>
              <li>
                <a href="#arsenal" className="hover:text-white transition-colors">
                  Arsenal Cognitivo (Bento Grid)
                </a>
              </li>
              <li>
                <a href="#fluxo" className="hover:text-white transition-colors">
                  Como Funciona (3 Passos)
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-white transition-colors">
                  Planos & Preços
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Perguntas Frequentes
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Recursos Cognitivos */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 block">
              Recursos de Elite
            </span>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400 hover:text-white transition-colors">
                Motor FSRS (Estabilidade de Memória)
              </li>
              <li className="text-slate-400 hover:text-white transition-colors">
                Corretor Discursivo Cebraspe, FGV e FCC
              </li>
              <li className="text-slate-400 hover:text-white transition-colors">
                Modo Áudio Hands-Free (Bluetooth & Lockscreen)
              </li>
              <li className="text-slate-400 hover:text-white transition-colors">
                Scanner OCR de Apostilas com Gemini Vision
              </li>
              <li className="text-slate-400 hover:text-white transition-colors">
                Caderno de Erros com Taxonomia Cognitiva
              </li>
              <li className="text-slate-400 hover:text-white transition-colors">
                Preditor de Aprovação & Corte de Concursos
              </li>
            </ul>
          </div>

          {/* Coluna 4: Legal & Acesso */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 block">
              Acesso & Segurança
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold">
                  Entrar na Plataforma →
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Política de Privacidade (LGPD)
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Segurança & Criptografia
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Synapse AI. Todos os direitos reservados.
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Desenvolvido com foco obsessivo em neurociência por</span>
            <a
              href="https://my-portfolio-beta-flax-uo1wwytg9x.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-cyan-300 underline transition-colors"
            >
              João Vytor
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
