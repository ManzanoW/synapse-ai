import React from "react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top welcome & action skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 rounded-xl bg-slate-900/80 animate-pulse border border-white/5" />
            <div className="h-4 w-96 max-w-full rounded-lg bg-slate-900/50 animate-pulse border border-white/5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 rounded-2xl bg-slate-900/80 animate-pulse border border-white/5" />
            <div className="h-10 w-32 rounded-2xl bg-indigo-950/50 animate-pulse border border-indigo-500/20" />
          </div>
        </div>

        {/* Quick action cards skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-white/5 bg-slate-900/40 p-4 animate-pulse flex items-center gap-3"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800/80" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-slate-800/70 rounded" />
                <div className="h-2.5 w-24 bg-slate-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Journey Hero Banner Skeleton */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:divide-x md:divide-white/5">
            <div className="space-y-4 pr-0 md:pr-6">
              <div className="h-3 w-28 rounded bg-slate-800/80 animate-pulse" />
              <div className="h-10 w-36 rounded-lg bg-slate-800/60 animate-pulse" />
              <div className="h-3 w-40 rounded bg-slate-800/40 animate-pulse" />
            </div>
            <div className="space-y-4 px-0 md:px-6">
              <div className="h-3 w-28 rounded bg-slate-800/80 animate-pulse" />
              <div className="h-10 w-36 rounded-lg bg-slate-800/60 animate-pulse" />
              <div className="h-3 w-40 rounded bg-slate-800/40 animate-pulse" />
            </div>
            <div className="space-y-4 pl-0 md:pl-6">
              <div className="h-3 w-28 rounded bg-slate-800/80 animate-pulse" />
              <div className="h-10 w-36 rounded-lg bg-slate-800/60 animate-pulse" />
              <div className="h-2 w-full rounded-full bg-slate-900 border border-white/5" />
            </div>
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-64 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
              <div className="h-64 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
            </div>
            <div className="h-72 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
            <div className="h-56 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:col-span-4">
            <div className="h-52 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
            <div className="h-44 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
            <div className="h-44 rounded-3xl border border-white/[0.08] bg-slate-900/40 p-6 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
