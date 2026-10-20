import React from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileTargetForm from "@/components/profile/target-form";
import { LocalDataBackupCard } from "@/components/profile/LocalDataBackupCard";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Award,
  Sparkles,
  Zap,
  BookOpen,
  Flame,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userSession = session.user;

  // Busca os dados dinâmicos atualizados do usuário no banco
  const dbUser = await prisma.user.findUnique({
    where: { id: userSession.id },
    select: {
      name: true,
      email: true,
      image: true,
      weeklyGoalHours: true,
      studyMode: true,
      targetExamDate: true,
      careerFocus: true,
      targetRole: true,
      planTier: true,
      role: true,
    },
  });

  const isPremiumUser =
    dbUser?.role === "ADMIN" ||
    dbUser?.planTier === "PREMIUM" ||
    Boolean(
      (dbUser?.email || userSession?.email) &&
        process.env.ADMIN_EMAIL &&
        (dbUser?.email || userSession?.email)!.toLowerCase() ===
          process.env.ADMIN_EMAIL.toLowerCase(),
    );

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const weeklyGoalHours = dbUser?.weeklyGoalHours ?? 10;
  const studyModeLabel =
    dbUser?.studyMode === "CYCLE"
      ? "Ciclo de Estudos Dinâmico"
      : "Cronograma Semanal";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-10 font-sans antialiased space-y-8 max-w-5xl mx-auto transition-colors">
      {/* NAVEGAÇÃO SUPERIOR */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors bg-white dark:bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 group backdrop-blur-md shadow-2xs"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-1 text-indigo-600 dark:text-indigo-400"
          />
          <span>Voltar para a Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 dark:text-indigo-400/90 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-full font-medium shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>Sincronizado com Synapse AI</span>
        </div>
      </div>

      {/* 🚀 HERO CONTAINER - PERFIL PREMIUM */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-50/80 via-white to-purple-50/50 dark:from-indigo-950/80 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-indigo-500/30 p-6 sm:p-8 shadow-xs dark:shadow-2xl backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar com efeito Ring */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full blur-xs opacity-70" />
            {dbUser?.image ? (
              <Image
                src={dbUser.image}
                alt={dbUser.name || "Avatar"}
                width={96}
                height={96}
                className="relative w-24 h-24 rounded-full object-cover border-2 border-indigo-400/50 shadow-xl"
              />
            ) : (
              <div className="relative w-24 h-24 bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-2xl text-white border-2 border-indigo-400/50 shadow-xl">
                {getInitials(dbUser?.name)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 border-2 border-white dark:border-slate-950 rounded-full text-white shadow-md">
              <Sparkles size={14} className="fill-white" />
            </div>
          </div>

          {/* Dados Principais do Cabeçalho */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {dbUser?.name || "Estudante Synapse"}
              </h1>
              {isPremiumUser ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/15 to-indigo-500/15 border border-amber-500/40 dark:border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wide shadow-xs">
                  <Award
                    size={13}
                    className="text-amber-500 fill-amber-500/20"
                  />
                  <span>PRO / PREMIUM</span>
                </span>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 dark:bg-slate-800/90 dark:hover:bg-indigo-600/30 dark:border-slate-700 dark:hover:border-indigo-400/40 dark:text-slate-300 dark:hover:text-indigo-200 text-xs font-bold tracking-wide transition-all group shadow-xs"
                >
                  <Award size={13} className="text-slate-400" />
                  <span>BÁSICO (GRÁTIS)</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold group-hover:translate-x-0.5 transition-transform">
                    • Upgrade 💎
                  </span>
                </Link>
              )}
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-lg leading-relaxed">
              Membro ativo da plataforma. Acompanhe abaixo o resumo das suas
              preferências de estudo e credenciais salvas.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                <Mail size={14} className="text-indigo-600 dark:text-indigo-400" />
                {dbUser?.email}
              </span>
              <span className="flex items-center gap-1.5 bg-white dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                <BookOpen size={14} className="text-purple-600 dark:text-purple-400" />
                {dbUser?.careerFocus || "Tecnologia da Informação & Dados"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 RESUMO DE ATIVIDADE RÁPIDA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-xl flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <Flame size={22} className="fill-amber-500/20" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Ofensiva de Estudos
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              5 Dias Seguidos
            </span>
          </div>
        </div>

        {/* ⚡ Card Sincronizado com o Banco */}
        <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-xl flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Meta Semanal
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {weeklyGoalHours} Horas
              </span>
            </div>
          </div>
          <Link
            href="/week"
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            Ajustar
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl backdrop-blur-xl flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Zap size={22} className="fill-emerald-500/20" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Status da Conta
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Ativa & Protegida
            </span>
          </div>
        </div>
      </div>

      {/* ⚙️ SEÇÕES DETALHADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco 1: Informações da Conta */}
        <div className="bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800/60 pb-3">
            <User size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Informações Pessoais
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Nome Exibido
              </label>
              <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium">
                {dbUser?.name || "Não informado"}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                E-mail de Acesso
              </label>
              <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium flex items-center justify-between">
                <span className="truncate">
                  {dbUser?.email || "Não informado"}
                </span>
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Card de Objetivo da Prova */}
        <div className="md:col-span-2">
          <ProfileTargetForm
            initialTargetDate={dbUser?.targetExamDate}
            initialCareerFocus={dbUser?.careerFocus}
            initialTargetRole={dbUser?.targetRole}
          />
        </div>

        {/* Bloco 3: Configurações de Estudo */}
        <div className="bg-white dark:bg-[#090d16] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 space-y-4 backdrop-blur-xl md:col-span-2 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800/60 pb-3">
            <Shield size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Configurações de Estudo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Foco Acadêmico / Carreira
              </label>
              <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium flex items-center justify-between">
                <span className="truncate pr-2">{dbUser?.careerFocus || "Tecnologia da Informação & Dados"}</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20 font-bold shrink-0">
                  Definido
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Modo do Cronograma
              </label>
              <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium flex items-center justify-between">
                <span>{studyModeLabel}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Ciclo Adaptativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 4: Central de Backup & Portabilidade de Dados */}
        <LocalDataBackupCard />
      </div>
    </div>
  );
}
