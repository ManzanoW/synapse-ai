"use client";

import React from "react";
import { motion } from "framer-motion";

interface BorderBeamProps {
  className?: string;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

/**
 * Feixe de Luz Sináptico Contínuo (Border Beam)
 * Renderiza um feixe neon infinito giratório de 360° com conic-gradient,
 * acelerado via GPU (Framer Motion rotate) sem dependências externas.
 */
export function BorderBeam({
  className = "",
  duration = 8,
  delay = 0,
  colorFrom = "#06b6d4", // Cyan neon
  colorTo = "#6366f1",   // Indigo neon
}: BorderBeamProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className="absolute -inset-[150%] opacity-90"
        animate={{ rotate: 360 }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          delay,
        }}
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 280deg, ${colorFrom} 325deg, ${colorTo} 355deg, transparent 360deg)`,
        }}
      />
    </div>
  );
}
