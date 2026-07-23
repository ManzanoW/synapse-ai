'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, BookOpen, MessageSquare } from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    { q: 'Como funciona o algoritmo de repetição espaçada?', a: 'O Synapse AI calcula o tempo ideal baseado nas suas respostas (Bom, Difícil ou Errei) para reapresentar o card pouco antes do seu cérebro atingir a zona de esquecimento.' },
    { q: 'Posso alterar meu modelo de revisão padrão?', a: 'Sim! Você pode mudar a qualquer momento acessando a aba Analytics e selecionando o Ciclo Dinâmico desejado.' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle size={24} className="text-indigo-400" />
            Suporte & FAQ
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Tire suas dúvidas sobre o funcionamento do cérebro artificial.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#090d16] border border-slate-800/60 rounded-xl p-4 space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400" />
                {faq.q}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}