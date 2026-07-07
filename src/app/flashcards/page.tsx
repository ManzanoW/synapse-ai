'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Sparkles, CheckCircle, XCircle, ChevronRight, Award } from 'lucide-react';

// Array de Flashcards para simulação local
const MOCK_CARDS = [
  {
    id: 1,
    subject: "Português • Sintaxe",
    question: "Qual é a função sintática do termo destacado em: 'Comprei um livro novo'?",
    answer: "Objeto Direto",
    details: "O verbo 'comprar' é transitivo direto (VTD), exigindo um complemento sem preposição obrigatória."
  },
  {
    id: 2,
    subject: "Raciocínio Lógico • Proposições",
    question: "Qual é a negação lógica da proposição: 'Todo concurseiro estuda'?",
    answer: "Pelo menos um concurseiro não estuda",
    details: "A negação de 'Todo A é B' é 'Algum A não é B' (ou 'Pelo menos um')."
  },
  {
    id: 3,
    subject: "Informática • Segurança",
    question: "Qual tipo de malware se disfarça de um programa legítimo mas executa funções maliciosas?",
    answer: "Cavalo de Troia (Trojan)",
    details: "Diferente de vírus e worms, os trojans precisam ser executados pelo usuário, geralmente vindo em anexos ou downloads."
  }
];

export default function FlashcardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalCards = MOCK_CARDS.length;
  const currentCard = MOCK_CARDS[currentIndex];
  const progressPercentage = (currentIndex / totalCards) * 100;

  const handleFeedback = () => {
    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentIndex + 1 < totalCards) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 250);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 p-4 flex flex-col items-center justify-center font-sans antialiased">
        <div className="max-w-md w-full bg-[#090d16] border border-slate-800/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
            <Award size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Sessão Concluída!</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Excelente trabalho! Você revisou todos os cards agendados para este bloco de estudos.
            </p>
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
            <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full w-full" />
          </div>
          <Link 
            href="/dashboard"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 group text-sm shadow-lg shadow-indigo-600/10"
          >
            <span>Voltar para a Dashboard</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 flex flex-col justify-center items-center">
      <div className="max-w-3xl w-full space-y-6 animate-pulse">
        {/* Esqueleto da Barra de Progresso */}
        <div className="h-1.5 w-full bg-slate-900 rounded-full" />
        
        {/* Esqueleto do Top Nav */}
        <div className="flex justify-between items-center w-full">
          <div className="h-4 w-32 bg-slate-900 rounded-lg" />
          <div className="h-6 w-20 bg-slate-900 rounded-lg" />
        </div>

        {/* Esqueleto do Card Principal */}
        <div className="w-full h-80 bg-[#090d16] border border-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 bg-slate-950 rounded-full" />
          <div className="h-6 w-2/3 bg-slate-950 rounded-lg" />
          <div className="h-4 w-1/3 bg-slate-950 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-center">
        
        {/* BARRA DE PROGRESSO DO TOPO */}
        <div className="w-full space-y-2 mb-2">
          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900 relative">
            <div 
              className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Top Navigation */}
        <div className="flex items-center justify-between w-full mb-4">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-900 shadow-sm">
            Card <span className="text-indigo-400 font-bold">{currentIndex + 1}</span> de {totalCards}
          </div>
        </div>

        {/* CONTAINER COM PERSPECTIVA 3D */}
        <div className="w-full min-h-80 perspective-[1000px] select-none">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full h-full min-h-80 relative rounded-2xl transition-transform duration-500 transform-3d cursor-pointer shadow-xl ${
              isFlipped ? 'transform-[rotateY(180deg)]' : ''
            }`}
          >
            
            {/* FACE DA FRENTE (PERGUNTA) */}
            <div className="absolute inset-0 w-full h-full bg-[#090d16] border border-slate-800/60 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center backface-hidden transition-colors">
              <div className="absolute top-4 left-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                {currentCard.subject}
              </div>
              
              <div className="max-w-md space-y-4">
                <HelpCircle size={32} className="text-slate-600 mx-auto animate-pulse [animation-duration:3s]" />
                <h2 className="text-xl font-medium text-slate-200 tracking-tight leading-snug">
                  {currentCard.question}
                </h2>
                <p className="text-xs text-slate-500 tracking-wide">Clique no card para revelar a resposta</p>
              </div>
            </div>

            {/* FACE DE TRÁS (RESPOSTA) */}
            <div className="absolute inset-0 w-full h-full bg-[#090d16] border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center backface-hidden transform-[rotateY(180deg)] shadow-2xl shadow-indigo-500/2">
              <div className="absolute top-4 left-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                {currentCard.subject}
              </div>

              <div className="max-w-md space-y-3">
                <Sparkles size={32} className="text-indigo-400 mx-auto" />
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Resposta</span>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight leading-snug">
                  {currentCard.answer}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {currentCard.details}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Spaced Repetition Feedback Buttons */}
        <div className="w-full grid grid-cols-3 gap-3 transition-all duration-300 pt-4 opacity-100">
          <button 
            onClick={handleFeedback}
            className="bg-slate-950 hover:bg-rose-500/10 border border-slate-900 hover:border-rose-500/20 py-3 rounded-xl flex flex-col items-center gap-1 transition-all group active:scale-98"
          >
            <XCircle size={16} className="text-rose-500 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-rose-400">Errei</span>
          </button>
          
          <button 
            onClick={handleFeedback}
            className="bg-slate-950 hover:bg-amber-500/10 border border-slate-900 hover:border-amber-500/20 py-3 rounded-xl flex flex-col items-center gap-1 transition-all group active:scale-98"
          >
            <HelpCircle size={16} className="text-amber-500 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-amber-400">Difícil</span>
          </button>
          
          <button 
            onClick={handleFeedback}
            className="bg-slate-950 hover:bg-emerald-500/10 border border-slate-900 hover:border-emerald-500/20 py-3 rounded-xl flex flex-col items-center gap-1 transition-all group active:scale-98"
          >
            <CheckCircle size={16} className="text-emerald-500 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-400">Bom</span>
          </button>
        </div>

      </div>
    </div>
  );
}