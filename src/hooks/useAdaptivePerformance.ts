"use client";

import { useEffect, useState } from "react";

/**
 * useAdaptivePerformance
 * 
 * Detecta a capacidade de hardware do cliente de forma não invasiva:
 * 1. navigator.hardwareConcurrency (núcleos de CPU <= 4)
 * 2. navigator.deviceMemory (RAM <= 4GB)
 * 3. prefers-reduced-motion
 * 4. Runtime FPS Sentinel: monitora quedas de taxa de quadros (frame drops) durante os primeiros 2 segundos
 * 
 * Se o computador for potente:
 * - isLowPerformance = false
 * - Mantém 100% dos efeitos cinemáticos, 3D tilt, blur volumétrico e filtros originais.
 * 
 * Se o computador for modesto/fraco:
 * - isLowPerformance = true
 * - Adiciona a classe 'perf-low' ao document.documentElement
 * - Neutraliza gargalos de fill-rate (backdrop-filter excessivo e shadowBlur de canvas)
 * - Garante 60 FPS estáveis sem degradar a estética visual.
 */
export function useAdaptivePerformance() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Checa preferência salva em sessão
    const cachedTier = sessionStorage.getItem("synapse_perf_tier");
    if (cachedTier === "low") {
      setIsLowPerformance(true);
      document.documentElement.classList.add("perf-low");
      return;
    } else if (cachedTier === "high") {
      setIsLowPerformance(false);
      document.documentElement.classList.remove("perf-low");
      return;
    }

    // 2. Avaliação de Hardware Inicial
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isHardwareConstrained = cores <= 4 || memory <= 4 || prefersReducedMotion;

    if (isHardwareConstrained) {
      setIsLowPerformance(true);
      document.documentElement.classList.add("perf-low");
      sessionStorage.setItem("synapse_perf_tier", "low");
      return;
    }

    // 3. Monitor Dinâmico de FPS (Sentinela de Desempenho em Tempo Real)
    // Mede a cadência de 45 quadros para detectar se a GPU integrada engasga
    let frameCount = 0;
    let slowFrames = 0;
    let lastTime = performance.now();
    let animId: number;

    const checkPerformance = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      // Se um frame demorou mais que 34ms (< 30 FPS)
      if (delta > 34) {
        slowFrames++;
      }

      frameCount++;

      if (frameCount < 45) {
        animId = requestAnimationFrame(checkPerformance);
      } else {
        // Se mais de 15% dos quadros engasgaram em computadores que pareciam rápidos no papel
        if (slowFrames >= 7) {
          setIsLowPerformance(true);
          document.documentElement.classList.add("perf-low");
          sessionStorage.setItem("synapse_perf_tier", "low");
        } else {
          sessionStorage.setItem("synapse_perf_tier", "high");
        }
      }
    };

    animId = requestAnimationFrame(checkPerformance);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return { isLowPerformance };
}
