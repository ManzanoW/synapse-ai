import { loginWithGoogle, loginWithGithub } from "@/actions/auth-actions";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#05070a] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e2640_1px,transparent_1px)] bg-size-[24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-5%] w-150 h-150 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-125 h-125 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Coluna Esquerda: Showcase */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden w-full max-w-2xl mx-auto">
        {/* Header - Logo */}
        <div className="relative z-10 w-full">
          <div className="inline-flex items-center gap-1.5 select-none">
            <h1 className="font-extrabold text-slate-50 text-3xl tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
              Synapse
            </h1>

            <div className="inline-flex items-center gap-1">
              <span className="font-black text-3xl tracking-tight bg-linear-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]">
                AI
              </span>
              <div className="relative flex items-center justify-center w-2 h-2 mt-2 ml-0.5">
                <span className="absolute w-2 h-2 rounded-full bg-indigo-400/40 animate-ping" />
                <svg
                  viewBox="0 0 8 8"
                  className="w-1.5 h-1.5 drop-shadow-[0_0_6px_#818cf8]"
                >
                  <circle cx="4" cy="4" r="3.5" className="fill-indigo-200" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Central */}
        <div className="relative z-10 my-auto w-full space-y-8">
          {/* Card Glassmorphic Preview */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl space-y-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent" />

            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
                    Plano de Estudos Inteligente
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Exemplo de Dashboard • Synapse Engine
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold tracking-wider uppercase">
                Preview
              </span>
            </div>

            {/* Mini Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">
                  Ritmo de Estudo
                </span>
                <span className="text-sm font-bold text-slate-100">
                  Consistente
                </span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">
                  Organização IA
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  Automatizada
                </span>
              </div>
            </div>

            {/* IA Status Banner */}
            <div className="bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-xl flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
              <p className="text-xs text-indigo-200/90 font-mono truncate">
                Gerencie cronogramas e conteúdos em um só lugar.
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-100 leading-tight">
              Sua rotina de estudos estruturada com o poder da{" "}
              <span className="bg-linear-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
              .
            </h2>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-mono bg-white/3 border border-white/10 text-slate-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
                ⚡ Algoritmos Preditivos
              </span>
              <span className="text-xs font-mono bg-white/3 border border-white/10 text-slate-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
                🔒 Foco em Privacidade
              </span>
            </div>
          </div>
        </div>

        {/* Footer alinhado com bordas limpas */}
        <div className="relative z-10 w-full flex items-center justify-between text-xs font-mono text-slate-500 pt-6">
          <span>&copy; {new Date().getFullYear()} Synapse AI</span>

          <a
            href="https://my-portfolio-beta-flax-uo1wwytg9x.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-300 transition-all duration-200 py-1.5 px-3 rounded-lg bg-white/3 hover:bg-white/8 border border-white/10 hover:border-indigo-500/40 group shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Desenvolvido por João Vytor</span>
            <svg
              className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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

      {/* Coluna Direita: Formulário de Login */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10 bg-slate-950/20 backdrop-blur-3xl lg:border-l border-white/5">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-4">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Acesse sua conta
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Entre com sua conta para acessar seus planos de estudo.
            </p>
          </div>

          <div className="space-y-3">
            <form action={loginWithGoogle}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white/4 hover:bg-white/8 text-slate-200 border border-white/10 hover:border-white/20 font-medium py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continuar com Google</span>
              </button>
            </form>

            <form action={loginWithGithub}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white/4 hover:bg-white/8 text-slate-200 border border-white/10 hover:border-white/20 font-medium py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] text-sm"
              >
                <svg
                  className="w-4 h-4 fill-current text-white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continuar com GitHub</span>
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-white/5 text-center lg:text-left space-y-3">
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
              <span>Não acessamos senhas ou dados privados.</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ao continuar, você concorda com nossos{" "}
              <Link
                href="#"
                className="underline hover:text-slate-300 transition-colors"
              >
                Termos
              </Link>{" "}
              e{" "}
              <Link
                href="#"
                className="underline hover:text-slate-300 transition-colors"
              >
                Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
