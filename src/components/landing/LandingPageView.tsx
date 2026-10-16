"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { BancasMarquee } from "./BancasMarquee";
import { PainTransitionSection } from "./PainTransitionSection";
import { InteractiveStickyShowcase } from "./InteractiveStickyShowcase";
import { RealityCheckSection } from "./RealityCheckSection";
import { ArsenalBentoGrid } from "./ArsenalBentoGrid";
import { StickyShowcaseWorkflow } from "./StickyShowcaseWorkflow";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { ChevronUp, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { triggerHaptic } from "@/lib/sensory/haptics";
import { useAdaptivePerformance } from "@/hooks/useAdaptivePerformance";

// Dynamic Code Splitting para seções inferiores (First Contentful Paint ultra leve no mobile)
const TimeRecoveryCalculator = dynamic(
  () => import("./TimeRecoveryCalculator").then((m) => m.TimeRecoveryCalculator),
  { ssr: true }
);
const OpportunityCostCalculator = dynamic(
  () => import("./OpportunityCostCalculator").then((m) => m.OpportunityCostCalculator),
  { ssr: true }
);
const ComparisonMatrixSection = dynamic(
  () => import("./ComparisonMatrixSection").then((m) => m.ComparisonMatrixSection),
  { ssr: true }
);
const TestimonialsSection = dynamic(
  () => import("./TestimonialsSection").then((m) => m.TestimonialsSection),
  { ssr: true }
);
const PricingSection = dynamic(
  () => import("./PricingSection").then((m) => m.PricingSection),
  { ssr: true }
);
const FaqSection = dynamic(
  () => import("./FaqSection").then((m) => m.FaqSection),
  { ssr: true }
);
const FinalCtaSection = dynamic(
  () => import("./FinalCtaSection").then((m) => m.FinalCtaSection),
  { ssr: true }
);
const Footer = dynamic(
  () => import("./Footer").then((m) => m.Footer),
  { ssr: true }
);
const CommandMenu = dynamic(
  () => import("./CommandMenu").then((m) => m.CommandMenu),
  { ssr: false }
);
const PwaInstallModal = dynamic(
  () => import("./PwaInstallModal").then((m) => m.PwaInstallModal),
  { ssr: false }
);

export function LandingPageView() {
  const { isLowPerformance } = useAdaptivePerformance();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Global Spotlight Keyboard Shortcut (Ctrl+K ou ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30 selection:text-cyan-200 relative overflow-x-clip font-sans ${
        isLowPerformance ? "perf-low" : ""
      }`}
    >
      {/* Subtle Film Grain Noise Overlay (Big Tech Polish - Apenas Desktop para poupar GPU mobile) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-screen select-none hidden md:block"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Floating Navbar */}
      <Navbar
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
      />

      {/* Scrollytelling Main Content Flow */}
      <main className="w-full">
        {/* 1. Hero com Parallax Cognitivo (100vh) */}
        <HeroSection />

        {/* 2. Faixa Institucional de Bancas & Concursos Mapeados (Trust Marquee) */}
        <BancasMarquee />

        {/* 3. Transição da Dor ao Alívio (Scrollytelling Sticky) */}
        <PainTransitionSection />

        {/* 4. Sticky Showcase 3D do Cockpit Synapse (Táctil & Interativo) */}
        <InteractiveStickyShowcase />

        {/* 5. O Choque de Realidade: Método Arcaico vs. Synapse AI */}
        <RealityCheckSection />

        {/* 6. O Arsenal Cognitivo (Bento Grid Interativo com Antes vs. Depois) */}
        <ArsenalBentoGrid />

        {/* 7. Do Edital Bruto ao Cronograma em 3 Passos */}
        <div className="landing-section-deferred">
          <StickyShowcaseWorkflow />
        </div>

        {/* 8. Calculadora Interativa de Horas Líquidas (ROI do Concurseiro) */}
        <div className="landing-section-deferred">
          <TimeRecoveryCalculator />
        </div>

        {/* 8.1. Calculadora do Custo de Oportunidade (O Salário da Posse) */}
        <div className="landing-section-deferred">
          <OpportunityCostCalculator />
        </div>

        {/* 9. Matriz Comparativa Racional: Synapse AI vs. Cursinhos vs. Anki */}
        <div className="landing-section-deferred">
          <ComparisonMatrixSection />
        </div>

        {/* 9.1. Muro de Prova Social • Depoimentos Verificados */}
        <div className="landing-section-deferred">
          <TestimonialsSection />
        </div>

        {/* 10. Planos Transparentes */}
        <div className="landing-section-deferred">
          <PricingSection />
        </div>

        {/* 10. FAQ em Accordion */}
        <div className="landing-section-deferred">
          <FaqSection />
        </div>

        {/* 11. Chamada Final à Ação */}
        <div className="landing-section-deferred">
          <FinalCtaSection />
        </div>
      </main>

      {/* Footer Cinematográfico */}
      <Footer />

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white backdrop-blur-xl shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Mobile Sticky Bottom CTA */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#030712]/92 backdrop-blur-xl border-t border-cyan-500/25 px-4 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    Synapse Pro • 7 Dias Grátis
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-white font-mono">
                    R$ 29,90
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/mês</span>
                </div>
              </div>

              <Link
                href="#planos"
                onClick={() => triggerHaptic("medium")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-mono font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-transform shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
                <span>Garantir Vaga</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/90" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spotlight Command Palette (⌘K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
      />

      {/* PWA Mobile Installation Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
