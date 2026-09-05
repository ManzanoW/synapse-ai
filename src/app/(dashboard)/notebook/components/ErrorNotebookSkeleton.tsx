"use client";

import React from "react";

export function ErrorNotebookSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* 1. Header Hero Skeleton */}
      <div className="space-y-4 mb-8">
        <div className="h-6 w-64 rounded-full bg-slate-800/50 border border-slate-700/30" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/30 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-72 md:w-96 rounded-lg bg-slate-800/60" />
            <div className="h-4 w-full max-w-xl rounded bg-slate-800/40" />
          </div>
        </div>
      </div>

      {/* 2. Grid de 3 Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/40 border border-slate-800/60 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-32 rounded bg-slate-800/60" />
              <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30" />
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <div className="h-9 w-16 rounded-lg bg-slate-700/50" />
              <div className="h-3 w-24 rounded bg-slate-800/40" />
            </div>
            <div className="h-3 w-3/4 rounded bg-slate-800/40 pt-1" />
          </div>
        ))}
      </div>

      {/* 3. Distribuição Taxonômica (5 blocos) */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 space-y-3">
        <div className="h-3.5 w-48 rounded bg-slate-800/50" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-slate-900/60 border border-slate-800/40 p-2.5 flex flex-col justify-between"
            >
              <div className="h-2.5 w-16 rounded bg-slate-800/60" />
              <div className="h-4 w-8 rounded bg-slate-700/40" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="h-10 w-full sm:w-72 rounded-xl bg-slate-800/50" />
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="h-9 w-28 rounded-xl bg-slate-800/40 shrink-0" />
          <div className="h-9 w-28 rounded-xl bg-slate-800/40 shrink-0" />
          <div className="h-9 w-24 rounded-xl bg-slate-800/40 shrink-0" />
        </div>
      </div>

      {/* 5. Lista de ErrorCards Fake */}
      <div className="space-y-4 pt-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#080d1a]/80 border border-slate-800/60 p-5 sm:p-6 space-y-4"
          >
            {/* Topo do Card: Tags e Ações */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 rounded-md bg-slate-800/60" />
                <div className="h-5 w-32 rounded-md bg-slate-800/50" />
              </div>
              <div className="h-7 w-28 rounded-lg bg-slate-800/50" />
            </div>

            {/* Enunciado fake */}
            <div className="space-y-2 py-1">
              <div className="h-4 w-full rounded bg-slate-800/60" />
              <div className="h-4 w-11/12 rounded bg-slate-800/50" />
              <div className="h-4 w-3/4 rounded bg-slate-800/40" />
            </div>

            {/* Alternativas fake */}
            <div className="space-y-2 pt-2">
              <div className="h-10 w-full rounded-xl bg-slate-900/70 border border-slate-800/40" />
              <div className="h-10 w-full rounded-xl bg-slate-900/70 border border-slate-800/40" />
            </div>

            {/* Rodapé fake */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
              <div className="h-3 w-32 rounded bg-slate-800/40" />
              <div className="h-8 w-36 rounded-xl bg-slate-800/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
