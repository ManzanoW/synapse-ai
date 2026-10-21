import Link from "next/link";
import { Brain, ArrowLeft, Home, BookOpen, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow e Aurora de Fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        {/* Ícone com Pulse */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-500/10 animate-pulse">
          <Brain size={40} />
        </div>

        {/* Cabeçalho */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            Erro 404 • Ponto Cego Cognitivo
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Página Não Encontrada
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            O conteúdo que você procurava mudou de rota, foi arquivado ou não existe na sua grade de estudos.
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
          >
            <Home size={18} />
            <span>Ir para o Dashboard</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-sm font-semibold active:scale-95"
          >
            <ArrowLeft size={18} />
            <span>Página Inicial</span>
          </Link>
        </div>

        {/* Links de Exploração Rápida */}
        <div className="pt-6 border-t border-slate-800/80">
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">
            Atalhos Recomendados
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Link
              href="/flashcards"
              className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors"
            >
              Cartões de Memória
            </Link>
            <Link
              href="/questions"
              className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors"
            >
              Simulados & Questões
            </Link>
            <Link
              href="/redacao"
              className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors"
            >
              Redação Discursiva
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors"
            >
              Planos Pro
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
