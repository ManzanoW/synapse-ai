import { loginWithGoogle, loginWithGithub } from "@/actions/auth-actions";
import Link from "next/link";
import { DotDistortionCanvas } from "@/components/ui/dot-distortion-canvas";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#020408] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Luzes Volumétricas Globais */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[650px] h-[650px] bg-indigo-600/10 rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[150px]" />

      {/* ================= COLUNA ESQUERDA: SHOWCASE INTERATIVO ================= */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden w-full border-r border-white/[0.06] bg-[#030509]/80 backdrop-blur-3xl">
        {/* Canvas de Partículas Neurais */}
        <DotDistortionCanvas
          dotColor="rgba(99, 102, 241, 0.22)"
          activeColor="rgba(192, 132, 252, 0.95)"
          spacing={24}
          distortionRadius={150}
        />

        <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-[#030509]/40 to-[#030509]/95 z-1" />

        {/* 1. Header - Logo */}
        <div className="relative z-10 w-full max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 select-none">
            <h1 className="font-black text-white text-3xl tracking-tight drop-shadow-[0_0_24px_rgba(255,255,255,0.2)]">
              Synapse
            </h1>

            <div className="inline-flex items-center gap-1.5">
              <span className="font-black text-3xl tracking-tight bg-linear-to-r from-indigo-400 via-purple-300 to-white bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(168,85,247,0.6)]">
                AI
              </span>
              <div className="relative flex items-center justify-center w-2.5 h-2.5 mt-1.5 ml-0.5">
                <span className="absolute w-2.5 h-2.5 rounded-full bg-indigo-400/50 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 drop-shadow-[0_0_8px_#818cf8]" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Card Glassmorphic Ativo */}
        <div className="relative z-10 my-auto w-full max-w-xl mx-auto space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] group">
            {/* Feixe de Luz Superior */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-400/80 to-transparent" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-violet-500/25 blur-2xl pointer-events-none" />

            {/* Header do Card */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                  <svg
                    className="w-5 h-5 fill-none stroke-current"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Plano de Estudos Inteligente
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Exemplo de Dashboard • Synapse Engine
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-extrabold bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                Preview
              </span>
            </div>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-2 gap-3.5 pt-4">
              <div className="bg-slate-900/60 border border-white/[0.06] p-3.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">
                  Ritmo de Estudo
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-black text-slate-100">
                    Consistente
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">
                    94%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-400 shadow-[0_0_8px_rgba(129,140,248,0.6)] w-[94%]" />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/[0.06] p-3.5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">
                  Organização IA
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]">
                    Automatizada
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400/80">
                    Ativo
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.6)] w-[100%]" />
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-3.5 bg-violet-950/40 border border-violet-500/25 p-3 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a855f7] shrink-0" />
              <p className="text-xs text-violet-200/90 font-mono truncate">
                Algoritmos SM-2 & Quests diárias calibrando seu ciclo.
              </p>
            </div>
          </div>

          {/* 3. Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Sua rotina de estudos estruturada com o poder da{" "}
              <span className="bg-linear-to-r from-indigo-300 via-violet-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(168,85,247,0.45)]">
                Inteligência Artificial
              </span>
              .
            </h2>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-mono bg-white/[0.04] border border-white/10 text-slate-300 px-3.5 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span className="text-amber-400">⚡</span> Algoritmos Preditivos
              </span>
              <span className="text-xs font-mono bg-white/[0.04] border border-white/10 text-slate-300 px-3.5 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span className="text-emerald-400">🔒</span> Foco em Privacidade
              </span>
            </div>
          </div>
        </div>

        {/* 4. Footer */}
        <div className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between text-xs font-mono text-slate-500 pt-6">
          <span>&copy; {new Date().getFullYear()} Synapse AI</span>

          <a
            href="https://my-portfolio-beta-flax-uo1wwytg9x.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-violet-300 transition-all duration-200 py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-violet-500/40 group shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Desenvolvido por João Vytor</span>
            <svg
              className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* ================= COLUNA DIREITA: FORMULÁRIO GLASSMORPHIC ================= */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Glow Central Atrás do Formulário */}
        <div className="pointer-events-none absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-[130px]" />

        <div className="w-full max-w-md relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl space-y-8">
          {/* Linha de Destaque Superior */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-2">
            <div className="inline-flex items-center gap-1.5 select-none">
              <h1 className="font-extrabold text-slate-50 text-2xl tracking-tight">
                Synapse
              </h1>
              <span className="font-black text-2xl tracking-tight bg-linear-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent">
                AI
              </span>
            </div>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-mono text-violet-300 font-bold mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Acesso Seguro
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Acesse sua conta
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Entre para continuar seus ciclos de estudo e resgatar suas quests
              diárias.
            </p>
          </div>

          {/* Botões de Ação OAuth */}
          <div className="space-y-3.5">
            <form action={loginWithGoogle}>
              <button
                type="submit"
                className="group relative w-full flex items-center justify-center gap-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-white/10 hover:border-violet-500/40 font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] text-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span className="relative z-10">Continuar com Google</span>
              </button>
            </form>

            <form action={loginWithGithub}>
              <button
                type="submit"
                className="group relative w-full flex items-center justify-center gap-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-white/10 hover:border-violet-500/40 font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] text-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg
                  className="w-4 h-4 fill-current text-white shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="relative z-10">Continuar com GitHub</span>
              </button>
            </form>
          </div>

          {/* Footer Informativo */}
          <div className="pt-6 border-t border-white/[0.08] text-center lg:text-left space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-400">
              <svg
                className="w-4 h-4 text-emerald-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>
                Autenticação OAuth 2.0 com criptografia ponta a ponta.
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ao continuar, você concorda com nossos{" "}
              <Link
                href="#"
                className="underline hover:text-slate-300 transition-colors"
              >
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link
                href="#"
                className="underline hover:text-slate-300 transition-colors"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
