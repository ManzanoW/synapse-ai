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
  Compass,
  Sliders,
  RotateCcw,
  PenTool,
  ShieldAlert,
  Headphones,
  CheckCircle2,
  Target,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tag: string;
}

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [openFaq, setOpenFaq] = useState<number | null>(0); // Primeiro item aberto por padrão

  const faqs: FaqItem[] = [
    {
      q: 'Estou começando agora e não sei por onde começar. Qual é o primeiro passo?',
      a: 'O primeiro e mais importante passo é definir o que você vai estudar. Se você já tem o PDF do seu edital, acesse a aba "Edital Verticalizado" e importe o documento para a IA criar o mapa das matérias. Se você ainda não tem edital, não se preocupe: use nossos "Kits de Edital em 1 Clique" (Policial, Administrativo, Bancário ou Tronco Comum). Com o edital ativo, você pode gerar simulados no módulo de Questões, criar Flashcards e iniciar suas sessões de estudo guiadas na Sala de Foco.',
      category: 'iniciante',
      tag: 'Primeiros Passos',
      icon: Compass,
    },
    {
      q: 'Meu concurso ainda não tem edital publicado ou banca definida. Como devo estudar?',
      a: 'Mais de 70% do conteúdo de quase todos os concursos do Brasil é composto pelo chamado "Tronco Comum": Língua Portuguesa, Raciocínio Lógico-Matemático, Direito Constitucional e Direito Administrativo. Se o seu concurso dos sonhos ainda não saiu, selecione o kit "Tronco Comum" na área de Editais. Dominar essas 4 matérias com antecedência é o maior diferencial dos candidatos aprovados nos primeiros lugares.',
      category: 'edital',
      tag: 'Estratégia de Edital',
      icon: BookOpen,
    },
    {
      q: 'O que é o Modo Minimalista (Essencial) e como alternar a visualização do Dashboard?',
      a: 'Sabemos que dashboards cheios de métricas podem sobrecarregar quem busca foco absoluto. Por isso, criamos o seletor de visualização no topo da tela inicial. Você pode alternar entre: 1) Modo Essencial (focado estritamente na sua meta de hoje e no botão de iniciar estudos); 2) Prática Diária (destaque para simulados e flashcards); 3) Modo Completo (visão analítica com estatísticas avançadas e cockpit); ou 4) Personalizado (onde você escolhe exatamente quais cartões deseja ver ou ocultar).',
      category: 'iniciante',
      tag: 'Personalização',
      icon: Sliders,
    },
    {
      q: 'Como funciona o Laboratório de Redação e o envio de foto manuscrita?',
      a: 'Você pode treinar redações digitando diretamente no editor ou, ainda melhor, escrevendo à mão em uma folha pautada e enviando uma foto pelo celular! Nossa inteligência artificial com visão computacional (OCR) transcreve sua letra e avalia o texto segundo os critérios oficiais da banca (Cebraspe, FCC, FGV ou Vunesp). Você recebe notas por critério (estrutura, argumentação, gramática e coesão) e correções pontuais em cada parágrafo.',
      category: 'redacao',
      tag: 'Redação Oficial',
      icon: PenTool,
    },
    {
      q: 'O que é o Caderno de Erros e o Simulado de Remediação?',
      a: 'O segredo da aprovação rápida não é acertar o que você já sabe, e sim exterminar o que você ainda erra. Toda vez que você erra uma questão em um simulado, ela é arquivada automaticamente no seu Caderno de Erros com o diagnóstico da pegadinha. Pelo botão "Treinar Questões que Errei" na tela de Simulados, o sistema monta um teste exclusivo focado nas suas falhas para garantir que você domine o assunto antes da prova.',
      category: 'simulados',
      tag: 'Caderno de Erros',
      icon: ShieldAlert,
    },
    {
      q: 'Como funcionam os Flashcards e o Estudo em Áudio (Modo Podcast)?',
      a: 'Os Flashcards utilizam o algoritmo de repetição espaçada: ele calcula o momento exato em que seu cérebro está prestes a esquecer uma informação e a reapresenta para você fixá-la na memória de longo prazo. Além disso, pelo Modo Podcast, você pode ouvir resumos em áudio de alta fidelidade enquanto se desloca no trânsito, faz caminhadas ou treina para o Teste de Aptidão Física (TAF).',
      category: 'revisao',
      tag: 'Áudio & Flashcards',
      icon: Headphones,
    },
    {
      q: 'Qual a diferença entre Cronograma Semanal e Ciclo de Estudos Dinâmico?',
      a: 'No Cronograma Semanal tradicional, as disciplinas ficam amarradas a dias fixos (ex: Português na segunda, RLM na terça). O problema é que, se você tiver um imprevisto na segunda, a matéria fica para trás. No Ciclo de Estudos Dinâmico, as matérias giram em uma fila contínua de blocos: se um imprevisto acontecer, você retoma exatamente no bloco seguinte no próximo momento livre, sem culpa e sem perder o ritmo.',
      category: 'rotina',
      tag: 'Rotina & Ciclos',
      icon: Calendar,
    },
    {
      q: 'O que significa a "Chance de Aprovação" e como ela é calculada?',
      a: 'A estimativa de aprovação é um termômetro estatístico inteligente que combina 3 fatores: 1) Sua porcentagem média de acertos nos simulados por matéria; 2) A cobertura total do edital que você já estudou e revisou; e 3) Sua constância de estudo (streak e cumprimento de metas semanais). Conforme você resolve questões e revisa flashcards, o algoritmo recalibra sua probabilidade real de passar.',
      category: 'metricas',
      tag: 'Métricas Inteligentes',
      icon: Target,
    },
  ];

  const categories = [
    { id: 'todos', label: 'Todas as Dúvidas' },
    { id: 'iniciante', label: 'Primeiros Passos' },
    { id: 'edital', label: 'Edital & Carreiras' },
    { id: 'simulados', label: 'Simulados & Erros' },
    { id: 'redacao', label: 'Redação Oficial' },
    { id: 'revisao', label: 'Flashcards & Áudio' },
    { id: 'rotina', label: 'Rotina & Ciclos' },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'todos' || faq.category === selectedCategory;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tag.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 sm:p-6 md:p-10 font-sans antialiased space-y-8 max-w-5xl mx-auto">
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
          <span>Guia do Concurseiro</span>
        </div>
      </div>

      {/* 🚀 HERO BANNER - CENTRO DE AJUDA */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-950/80 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Suporte & Boas-Vindas</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Como podemos descomplicar seu{' '}
            <span className="bg-linear-to-r from-indigo-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              estudo hoje?
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Criamos o Synapse AI para ser seu parceiro diário de aprovação. Aqui você encontra respostas diretas, atalhos rápidos e guias práticos para tirar o máximo proveito da plataforma.
          </p>

          {/* BARRA DE PESQUISA */}
          <div className="pt-2 relative max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Buscar dúvida, ferramenta ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* ⚡ AÇÕES RÁPIDAS PARA O ALUNO */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Zap size={14} className="text-amber-400" />
          <span>Ações Rápidas de Ajuste e Navegação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard?openTour=true"
            className="p-4 bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl backdrop-blur-xl flex items-center gap-3.5 group transition-all hover:bg-slate-900/80"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
              <Compass size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Reiniciar Tour Guiado
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rever a explicação interativa
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard?openQuiz=true"
            className="p-4 bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 rounded-2xl backdrop-blur-xl flex items-center gap-3.5 group transition-all hover:bg-slate-900/80"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-110 transition-transform">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                Recalibrar Perfil
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Redefinir horas e carreira
              </p>
            </div>
          </Link>

          <Link
            href="/edital"
            className="p-4 bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 rounded-2xl backdrop-blur-xl flex items-center gap-3.5 group transition-all hover:bg-slate-900/80"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Kits de Edital em 1 Clique
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Policial, Admin, Bancos e Tronco
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 🏷️ FILTROS DE CATEGORIA */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ❓ LISTA DE ACCORDION FAQ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            <span>Perguntas Frequentes & Tutoriais</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredFaqs.length} {filteredFaqs.length === 1 ? 'dúvida' : 'dúvidas'}
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
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-3.5 pr-2">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isOpen
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-slate-800/60 text-slate-400'
                        }`}
                      >
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/90 block mb-0.5">
                          {faq.tag}
                        </span>
                        <h3 className="text-sm font-bold text-slate-200 leading-snug">
                          {faq.q}
                        </h3>
                      </div>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`text-slate-500 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40 pl-6 sm:pl-16">
                      <p>{faq.a}</p>
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
              Ainda tem alguma dúvida pedagógica ou técnica?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nossa equipe está à disposição para te apoiar em toda a sua jornada até o diário oficial.
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
