"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory/haptics";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const calculateScroll = useCallback(() => {
    const mainEl = document.getElementById("main-scroll-container");
    const target = mainEl || window;

    let scrollTop = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    if (mainEl) {
      scrollTop = mainEl.scrollTop;
      scrollHeight = mainEl.scrollHeight;
      clientHeight = mainEl.clientHeight;
    } else {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    }

    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
      setScrollProgress(Math.round(progress));
    }

    // Exibe quando rolar mais de 240px
    setIsVisible(scrollTop > 240);
  }, []);

  useEffect(() => {
    const mainEl = document.getElementById("main-scroll-container");
    const target = mainEl || window;

    target.addEventListener("scroll", calculateScroll, { passive: true });
    calculateScroll();

    return () => {
      target.removeEventListener("scroll", calculateScroll);
    };
  }, [calculateScroll]);

  const scrollToTop = () => {
    triggerHaptic("light");
    const mainEl = document.getElementById("main-scroll-container");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const circleRadius = 16;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden select-none"
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo da página"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-indigo-500/30 bg-[#090d18]/90 text-indigo-300 shadow-xl shadow-indigo-950/50 backdrop-blur-md transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-600 hover:text-white active:scale-90 cursor-pointer"
            title={`Voltar ao topo (${scrollProgress}% lido)`}
          >
            {/* SVG Progress Ring */}
            <svg
              className="absolute inset-0 -rotate-90 pointer-events-none"
              width="44"
              height="44"
            >
              <circle
                cx="22"
                cy="22"
                r={circleRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-white/10"
              />
              <circle
                cx="22"
                cy="22"
                r={circleRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-indigo-400 group-hover:text-white transition-all duration-150"
              />
            </svg>

            {/* Ícone de Seta para cima */}
            <ArrowUp
              size={18}
              className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
