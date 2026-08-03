import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Award,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;

  const getInitials = (name?: string | null) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 md:p-10 font-sans antialiased space-y-8 max-w-5xl mx-auto">
      
      {/* NAVEGAÇÃO SUPERIOR */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 group backdrop-blur-md"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1 text-indigo-400" />
          <span>Voltar para a Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400/80 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sincronizado com Synapse AI</span>
        </div>
      </div>

      {/* 🚀 HERO CONTAINER - PERFIL PREMIUM */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-950/80 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar com efeito Ring */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'Avatar'}
                width={96}
                height={96}
                className="relative w-24 h-24 rounded-full object-cover border-2 border-indigo-400/50 shadow-xl"
              />
            ) : (
              <div className="relative w-24 h-24 bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-2xl text-white border-2 border-indigo-400/50 shadow-xl">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 border-2 border-slate-950 rounded-full text-white shadow-md">
              <Sparkles size={14} className="fill-white" />
            </div>
          </div>

          {/* Dados Principais do Cabeçalho */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {user?.name || 'Estudante Synapse'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide shadow-xs">
                <Award size={13} className="text-indigo-400 fill-indigo-400/20" />
                <span>PREMIUM</span>
              </span>
            </div>

            <p className="text-slate-300 text-sm max-w-lg leading-relaxed">
              Membro ativo da plataforma. Acompanhe abaixo o resumo das suas preferências de estudo e credenciais salvas.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Mail size={14} className="text-indigo-400" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <BookOpen size={14} className="text-purple-400" />
                Ciência da Computação
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 RESUMO DE ATIVIDADE RÁPIDA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Flame size={22} className="fill-amber-400/20" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Ofensiva de Estudos</span>
            <span className="text-lg font-bold text-white">5 Dias Seguidos</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Meta Semanal</span>
            <span className="text-lg font-bold text-white">10 Horas</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap size={22} className="fill-emerald-400/20" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Status da Conta</span>
            <span className="text-lg font-bold text-emerald-400">Ativa & Protegida</span>
          </div>
        </div>
      </div>

      {/* ⚙️ SEÇÕES DETALHADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bloco 1: Informações da Conta */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3">
            <User size={18} className="text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Informações Pessoais</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Nome Exibido
              </label>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-medium">
                {user?.name || 'Não informado'}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                E-mail de Acesso
              </label>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-medium flex items-center justify-between">
                <span className="truncate">{user?.email || 'Não informado'}</span>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Foco e Preferências de Estudo */}
        <div className="bg-[#090d16] border border-slate-800/60 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3">
            <Shield size={18} className="text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Configurações de Estudo</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Foco Acadêmico
              </label>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-medium flex items-center justify-between">
                <span>Ciência da Computação</span>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                  Definido
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Modo do Cronograma
              </label>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-200 font-medium flex items-center justify-between">
                <span>Ciclo de Estudos Dinâmico</span>
                <span className="text-xs text-slate-400">SM-2 Ponderado</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
