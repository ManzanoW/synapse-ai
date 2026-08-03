'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ArrowLeft, User, Mail, Shield, Award, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const getInitials = (name?: string | null) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 size={18} className="animate-spin text-indigo-400" />
          <span>Carregando dados do perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Voltar para Dashboard */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar para a Dashboard</span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User size={24} className="text-indigo-400" />
            Seu Perfil
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gerencie suas preferências e credenciais de acesso.
          </p>
        </div>

        {/* Card Informações Principais */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Avatar'}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border border-indigo-500/30 shadow-md shadow-indigo-500/10 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/20 shrink-0">
                {getInitials(user?.name)}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-200 truncate">
                {user?.name || 'Estudante Synapse'}
              </h2>
              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Award size={12} className="text-indigo-400 shrink-0" />
                <span>Plano Premium Ativo</span>
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-slate-950/50 p-3 border border-slate-900 rounded-xl gap-4">
              <span className="text-slate-500 flex items-center gap-2 shrink-0">
                <Mail size={14} /> E-mail
              </span>
              <span className="text-slate-300 font-medium truncate">
                {user?.email || 'Nenhum e-mail informado'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/50 p-3 border border-slate-900 rounded-xl gap-4">
              <span className="text-slate-500 flex items-center gap-2 shrink-0">
                <Shield size={14} /> Foco Acadêmico
              </span>
              <span className="text-slate-300 font-medium truncate">
                Ciência da Computação
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
