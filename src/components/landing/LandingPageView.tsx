"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { BancasMarquee } from "./BancasMarquee";
import { PainTransitionSection } from "./PainTransitionSection";
import { InteractiveStickyShowcase } from "./InteractiveStickyShowcase";
import { RealityCheckSection } from "./RealityCheckSection";
import { ArsenalBentoGrid } from "./ArsenalBentoGrid";
import { StickyShowcaseWorkflow } from "./StickyShowcaseWorkflow";
import { TimeRecoveryCalculator } from "./TimeRecoveryCalculator";
import { PricingSection } from "./PricingSection";
import { FaqSection } from "./FaqSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { Footer } from "./Footer";
import { motion, useScroll, useSpring } from "framer-motion";
import { ChevronUp } from "lucide-react";

export function LandingPageView() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

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
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30 selection:text-cyan-200 relative overflow-x-clip font-sans">
      {/* Subtle Film Grain Noise Overlay (Big Tech Polish) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-screen select-none"
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
      <Navbar />

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
        <StickyShowcaseWorkflow />

        {/* 8. Calculadora Interativa de Horas Líquidas (ROI do Concurseiro) */}
        <TimeRecoveryCalculator />

        {/* 9. Planos Transparentes */}
        <PricingSection />

        {/* 10. FAQ em Accordion */}
        <FaqSection />

        {/* 11. Chamada Final à Ação */}
        <FinalCtaSection />
      </main>

      {/* Footer Cinematográfico */}
      <Footer />

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white backdrop-blur-xl shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
