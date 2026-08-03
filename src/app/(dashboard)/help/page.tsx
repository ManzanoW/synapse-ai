'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Sparkles,
  Search,
  ChevronDown,
  Brain,
  Calendar,
  Layers,
  MessageSquare,
  ExternalLink,
  Zap,
} from 'lucide-react';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0); // Primeiro item aberto por padrão

  const faqs = [
    {
      q: 'Como funciona o algoritmo de repetição espaçada (SM-2)?',
      a: 'O Synapse AI utiliza o algoritmo SM-2 customizado. Ele calcula o intervalo ideal para reagendar seus flashcards e tópicos baseado na sua nota (Errei, Difícil, Bom, Fácil). O objetivo é apresentar o conteúdo momentos antes de a curva do esquecimento agir no seu cérebro.',
      category: 'Algoritmo',
      icon: Brain,
    },
    {
      q: 'Qual a diferença entre Cronograma Semanal e Ciclo de Estudos?',
      a: 'No Cronograma Semanal, as matérias são fixadas em dias específicos da semana. No Ciclo de Estudos Dinâmico, as matérias giram em blocos sequenciais (ex: Bloco 1 ao 12), permitindo que você retome os estudos exatamente de onde parou, mesmo que tenha faltado algum dia.',
      category: 'Cronograma',
      icon: Calendar,
    },
    {
      q: 'Como gerar flashcards e simulados com Inteligência Artificial?',
      a: 'Acesse o módulo de Edital ou Cards, selecione a disciplina desejada e clique em "Gerar via IA". Nosso cérebro artificial sintetizará o conteúdo do edital e criará automaticamente pares de pergunta/resposta otimizados para fixação.',
      category: 'IA',
      icon: Sparkles,
    },
    {
      q: 'Como recalcular as horas semanais de estudo?',
      a: 'Você pode alterar sua meta semanal a qualquer momento. Acesse a página do Cronograma (/week) e clique em "Editar Configurações". Defina sua nova carga horária e dias ativos para que o sistema rebalanceie os pesos de cada disciplina.',
      category: 'Ajustes',
      icon: Layers,
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 md:p-10 font-sans antialiased space-y-8 max-w-5xl mx-auto">
      {/* NAVEGAÇÃO SUPERIOR */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 group backdrop-blur-md"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-1 text-indigo-400"
          />
          <span>Voltar para a Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400/80 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <HelpCircle size={13} className="text-indigo-400 animate-pulse" />
          <span>Central de Conhecimento</span>
        </div>
      </div>

      {/* 🚀 HERO BANNER - CENTRO DE AJUDA */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-950/80 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Suporte Inteligente</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Como podemos ajudar o seu{' '}
            <span className="bg-linear-to-r from-indigo-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              estudo hoje?
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Aprenda a otimizar o uso da inteligência artificial, ajustar seus ciclos de repetição e dominar a plataforma.
          </p>

          {/* BARRA DE PESQUISA */}
          <div className="pt-2 relative max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar dúvida ou funcionalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* 🧭 ATALHOS RÁPIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/flashcards"
          className="p-5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl flex items-center gap-4 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Flashcards SM-2
            </h3>
            <span className="text-xs text-slate-400 block mt-0.5">
              Revisões espaçadas
            </span>
          </div>
        </Link>

        <Link
          href="/week"
          className="p-5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl flex items-center gap-4 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Ciclos de Estudo
            </h3>
            <span className="text-xs text-slate-400 block mt-0.5">
              Ajuste de carga diária
            </span>
          </div>
        </Link>

        <Link
          href="/edital"
          className="p-5 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl backdrop-blur-xl flex items-center gap-4 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Gestão de Edital
            </h3>
            <span className="text-xs text-slate-400 block mt-0.5">
              Mapeamento de tópicos
            </span>
          </div>
        </Link>
      </div>

      {/* ❓ LISTA DE ACCORDION FAQ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            Perguntas Frequentes
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredFaqs.length} artigos encontrados
          </span>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            Nenhuma dúvida encontrada para &quot;{searchTerm}&quot;.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const IconComponent = faq.icon;

              return (
                <div
                  key={index}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden backdrop-blur-xl ${
                    isOpen
                      ? 'bg-slate-900/80 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                      : 'bg-[#090d16] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 pr-4">
                      <div className={`p-2 rounded-xl shrink-0 ${isOpen ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/60 text-slate-400'}`}>
                        <IconComponent size={18} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-200">
                        {faq.q}
                      </h3>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`text-slate-500 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40 pl-14">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✉️ BANNER DE CONTATO/SUPORTE DEDICADO */}
      <div className="p-6 bg-linear-to-r from-slate-900/90 via-slate-950 to-indigo-950/40 border border-slate-800/80 rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Ainda tem dúvidas ou sugestões?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nossa equipe técnica e pedagógica pode te ajudar a configurar seu plano.
            </p>
          </div>
        </div>

        <a
          href="mailto:suporte@synapseai.com"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 shrink-0 active:scale-95"
        >
          <span>Falar com o Suporte</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
