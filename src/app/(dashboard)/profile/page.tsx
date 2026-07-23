'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Shield, Award } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User size={24} className="text-indigo-400" />
            Seu Perfil
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Gerencie suas preferências e credenciais de acesso.</p>
        </div>

        {/* Card Informações Principais */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
            <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg shadow-indigo-500/2">
              JV
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-200">João Vytor Manzano Gonzalez</h2>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Award size={12} className="text-indigo-400" /> Plano Premium Ativo</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-slate-950/50 p-3 border border-slate-900 rounded-xl">
              <span className="text-slate-500 flex items-center gap-2"><Mail size={14} /> E-mail</span>
              <span className="text-slate-300 font-medium">joao.vytor@example.com</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/50 p-3 border border-slate-900 rounded-xl">
              <span className="text-slate-500 flex items-center gap-2"><Shield size={14} /> Foco Acadêmico</span>
              <span className="text-slate-300 font-medium">Ciência da Computação</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}