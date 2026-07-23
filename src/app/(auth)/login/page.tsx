import { loginWithGoogle, loginWithGithub } from "@/actions/auth-actions";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Coluna Esquerda: Showcase & Visual Power */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 border-r border-zinc-800/60 relative overflow-hidden">
        {/* Padrão de Grade + Luzes de Fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(#38383a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Header - Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white select-none">
            <h1 className="font-extrabold text-slate-50 text-[1.85rem] tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.12)]">
              Synapse
            </h1>

            <div className="inline-flex items-center gap-1">
              <span className="font-black text-[1.85rem] tracking-tight bg-gradient-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]">
                AI
              </span>

              <div className="relative flex items-center justify-center w-2 h-2 mt-1.5">
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

        {/* Conteúdo Central: Mini Dashboard & Value Proposition */}
        <div className="relative z-10 my-auto w-full max-w-lg space-y-6">
          {/* Card Princpal - Preview do Copilot (Exemplo Ilustrativo de UI) */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden group">
            {/* Linha brilhante no topo do card */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            {/* Header do Card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
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
                  <h3 className="text-sm font-semibold text-white">
                    Plano de Estudos Inteligente
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Exemplo de Dashboard • Synapse Engine
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                Preview
              </span>
            </div>

            {/* Métricas ilustrativas da interface */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 block mb-1">
                  Ritmo de Estudo
                </span>
                <span className="text-lg font-bold text-white">
                  Consistente
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 block mb-1">
                  Organização com IA
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  Automatizada
                </span>
              </div>
            </div>

            {/* Status da IA */}
            <div className="bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
              <p className="text-xs text-indigo-200/90 font-mono truncate">
                Gerencie cronogramas e conteúdos em um só lugar.
              </p>
            </div>
          </div>

          {/* Proposta de Valor Verdadeira */}
          <div className="space-y-4 px-2">
            <h2 className="text-xl font-medium tracking-tight text-zinc-200 leading-relaxed">
              Sua rotina de estudos estruturada com o poder da Inteligência
              Artificial.
            </h2>

            {/* Tags da Stack / Filosofia do Produto */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md">
                ⚡ Algoritmos Preditivos
              </span>
              <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md">
                🔒 Foco em Privacidade
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} Synapse AI. Todos os direitos
          reservados.
        </div>
      </div>

      {/* Coluna Direita: Formulário de Login */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative bg-zinc-950">
        <div className="w-full max-w-sm space-y-8 relative z-10">
          {/* Logo Mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white select-none">
              <h1 className="font-extrabold text-slate-50 text-[1.85rem] tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Synapse
              </h1>
              <span className="font-black text-[1.85rem] tracking-tight bg-gradient-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(129,140,248,0.4)]">
                AI
              </span>
            </div>
          </div>

          {/* Cabeçalho */}
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Acesse sua conta
            </h1>
            <p className="text-sm text-zinc-400">
              Entre com sua conta para acessar seus planos de estudo.
            </p>
          </div>

          {/* Botões OAuth */}
          <div className="space-y-3">
            <form action={loginWithGoogle}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800/90 font-medium py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:border-zinc-700 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                Continuar com Google
              </button>
            </form>

            <form action={loginWithGithub}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continuar com GitHub
              </button>
            </form>
          </div>

          {/* Mensagem de Garantia/Segurança */}
          <div className="pt-4 border-t border-zinc-800/60 text-center lg:text-left space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-zinc-400">
              <svg
                className="w-4 h-4 text-emerald-500 shrink-0"
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

            <p className="text-xs text-zinc-500">
              Ao continuar, você concorda com nossos{" "}
              <Link
                href="#"
                className="underline hover:text-zinc-300 transition-colors"
              >
                Termos
              </Link>{" "}
              e{" "}
              <Link
                href="#"
                className="underline hover:text-zinc-300 transition-colors"
              >
                Privacidade
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Efeito de Glow discreto no fundo da coluna direita (atrás do card) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
      </div>
    </div>
  );
}
