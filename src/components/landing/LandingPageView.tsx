"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { PainTransitionSection } from "./PainTransitionSection";
import { InteractiveStickyShowcase } from "./InteractiveStickyShowcase";
import { RealityCheckSection } from "./RealityCheckSection";
import { ArsenalBentoGrid } from "./ArsenalBentoGrid";
import { StickyShowcaseWorkflow } from "./StickyShowcaseWorkflow";
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

        {/* 2. Transição da Dor ao Alívio (Scrollytelling Sticky) */}
        <PainTransitionSection />

        {/* 3. Sticky Showcase 3D do Cockpit Synapse (Efeito UAU) */}
        <InteractiveStickyShowcase />

        {/* 4. O Choque de Realidade: Método Arcaico vs. Synapse AI */}
        <RealityCheckSection />

        {/* 5. O Arsenal Cognitivo (Bento Grid Interativo) */}
        <ArsenalBentoGrid />

        {/* 6. Do Edital Bruto ao Cronograma em 3 Passos */}
        <StickyShowcaseWorkflow />

        {/* 7. Planos Transparentes */}
        <PricingSection />

        {/* 8. FAQ em Accordion */}
        <FaqSection />

        {/* 9. Chamada Final à Ação */}
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
