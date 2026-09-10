export default function SubjectCardSkeleton() {
  return (
    <div className="bg-[#070b12] border border-slate-900/60 border-l-4 border-l-slate-800 rounded-xl p-4.5 w-full min-h-31.25 relative overflow-hidden flex flex-col justify-between">
      
      {/* Topo: Título e Seta fake */}
      <div className="flex items-center justify-between w-full">
        <div className="h-4 w-1/3 bg-slate-800/80 rounded-md animate-pulse" />
        <div className="h-4 w-3 bg-slate-800/50 rounded animate-pulse" />
      </div>

      {/* Meio: Métricas de Progresso/Acertos e Barra fake */}
      <div className="space-y-2.5 my-2">
        <div className="flex justify-between w-full">
          <div className="h-3 w-1/4 bg-slate-800/50 rounded animate-pulse" />
          <div className="h-3 w-1/5 bg-slate-800/50 rounded animate-pulse" />
        </div>
        {/* Barra de progresso vazia */}
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden" />
      </div>

      {/* Rodapé: Contadores fake */}
      <div className="flex justify-between items-center w-full pt-1">
        <div className="h-3 w-1/4 bg-slate-800/40 rounded animate-pulse" />
        <div className="h-4 w-12 bg-slate-900 rounded border border-slate-800/40 animate-pulse" />
      </div>

    </div>
  );
}