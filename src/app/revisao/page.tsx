'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, Flame, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';

// 1. Lista de cards simulados para testar o comportamento do front-end
const MOCK_FLASHCARDS = [
  {
    id: 1,
    subject: "Direito Constitucional",
    question: "Quais são os remédios constitucionais previstos no artigo 5º da Carta Magna?",
    answer: "Habeas corpus, habeas data, mandado de segurança (individual e coletivo), mandado de injunção e ação popular."
  },
  {
    id: 2,
    subject: "Informática",
    question: "Qual é a principal diferença entre memória RAM e Armazenamento (SSD/HD)?",
    answer: "A memória RAM é volátil (perde os dados ao desligar) e rápida, usada pelo processador no momento. O SSD/HD é não-volátil (salva os dados permanentemente)."
  },
  {
    id: 3,
    subject: "Raciocínio Lógico",
    question: "Qual é a negação lógica da proposição: 'Todo estudante é focado'?",
    answer: "A negação é: 'Pelo menos um estudante não é focado' (ou 'Existe estudante que não é focado')."
  },
  {
    id: 4,
    subject: "Português",
    question: "O que é uma palavra paroxítona?",
    answer: "É uma palavra cuja sílaba tônica (a pronunciada com mais intensidade) é a penúltima. Exemplo: Ca-ne-ta, Lá-pis."
  }
];

export default function FlashcardReview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const totalCards = MOCK_FLASHCARDS.length;
  
  // Só busca o card se a sessão não tiver terminado
  const currentCard = !isFinished && currentIndex < totalCards 
    ? MOCK_FLASHCARDS[currentIndex] 
    : null;

  const handleRating = (rating: string) => {
    console.log(`Card avaliado como: ${rating}`);
    
    if (currentIndex + 1 < totalCards) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setIsFinished(true);
    }
  };

  // 1. Tela de Fim de Sessão (Se estiver finalizado, o React para aqui)
  if (isFinished || !currentCard) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 text-slate-100 p-6 justify-center items-center text-center font-sans antialiased">
        <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full border border-emerald-500/20 mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold">Meta batida!</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
          Você e sua namorada concluíram todas as revisões agendadas para este bloco. Bom trabalho!
        </p>
        <Link href="/dashboard" className="mt-8 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10">
          Voltar para a Dashboard
        </Link>
      </div>
    );
  }

  // 2. Tela de Revisão Ativa (Só renderiza se houver um card válido)
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 text-slate-100 p-6 justify-between font-sans antialiased selection:bg-indigo-500/30">
      
      {/* TOPO: Navegação e Progresso */}
      <header className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors py-1">
            <X size={18} />
            <span>Sair</span>
          </Link>
          
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400 font-medium text-xs shadow-sm">
            <Flame size={14} className="fill-amber-500" />
            <span>12 dias seguidos</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Progresso da sessão</span>
            <span>{currentIndex + 1} / {totalCards} cards</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* CENTRO: O Flashcard */}
      <main className="flex-1 flex flex-col justify-center my-6">
        <div 
          onClick={() => !showAnswer && setShowAnswer(true)}
          className={`w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-85 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden ${
            !showAnswer ? 'cursor-pointer hover:border-slate-700' : ''
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-indigo-400 bg-indigo-500/10 w-max px-2.5 py-1 rounded-md">
              <Sparkles size={12} />
              <span>{currentCard.subject}</span>
            </div>
            
            <h2 className="text-xl font-medium mt-5 leading-relaxed text-slate-100">
              {currentCard.question}
            </h2>
            
            {showAnswer && (
              <div className="mt-6 pt-6 border-t border-slate-800/80 text-slate-300 text-base leading-relaxed animate-fade-in">
                <p className="font-semibold text-emerald-400 text-xs tracking-wider uppercase mb-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Resposta do Card
                </p>
                <p className="text-slate-200">{currentCard.answer}</p>
              </div>
            )}
          </div>
          
          {!showAnswer && (
            <p className="text-center text-xs text-slate-500 font-medium animate-pulse mt-4">
              Toque no cartão para revelar a resposta
            </p>
          )}
        </div>
      </main>

      {/* BASE: Painel de Ações */}
      <footer className="min-h-24 flex flex-col justify-end">
        {!showAnswer ? (
          <button 
            onClick={() => setShowAnswer(true)}
            className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-[0.99]"
          >
            Mostrar Resposta
          </button>
        ) : (
          <div className="w-full space-y-3 animate-slide-up">
            <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
              Como foi o seu desempenho?
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleRating('errei')}
                className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 text-rose-200 py-3 rounded-xl flex flex-col items-center justify-center transition-colors active:scale-95 group"
              >
                <AlertCircle size={16} className="text-rose-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-sm">Errei</span>
                <span className="text-[10px] text-rose-400/80 mt-0.5 font-medium">Rever hoje</span>
              </button>
              
              <button 
                onClick={() => handleRating('dificil')}
                className="bg-amber-950/40 hover:bg-amber-950/60 border border-amber-900/50 text-amber-200 py-3 rounded-xl flex flex-col items-center justify-center transition-colors active:scale-95 group"
              >
                <HelpCircle size={16} className="text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-sm">Difícil</span>
                <span className="text-[10px] text-amber-400/80 mt-0.5 font-medium">Em 2 dias</span>
              </button>
              
              <button 
                onClick={() => handleRating('facil')}
                className="bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-700 text-emerald-200 py-3 rounded-xl flex flex-col items-center justify-center transition-colors active:scale-95 group"
              >
                <CheckCircle2 size={16} className="text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="font-bold text-sm">Fácil!</span>
                <span className="text-[10px] text-emerald-400/80 mt-0.5 font-medium">Em 6 dias</span>
              </button>
            </div>
          </div>
        )}
      </footer>

    </div>
  );
}