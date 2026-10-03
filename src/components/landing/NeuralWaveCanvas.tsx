"use client";

import React, { useEffect, useRef } from "react";
import { MotionValue } from "framer-motion";

interface NeuralWaveCanvasProps {
  scrollProgress: MotionValue<number>;
  className?: string;
}

/**
 * Visualizador Neural Líquido Contínuo a 60 FPS (Física Senoidal Orgânica de Big Tech)
 * Renderiza fitas de luz líquida (Aurora Ribbon) com ondas senoidais multi-camadas
 * em Canvas 2D de alta definição, modulando a turbulência com base no scroll.
 */
export function NeuralWaveCanvas({ scrollProgress, className = "" }: NeuralWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Lê o progresso atual do scroll (0 a 1)
      const currentScroll = scrollProgress.get();

      // Fase de Alívio (acima de 0.72): a turbulência zera e a onda se harmoniza em ciano
      const isRelief = currentScroll >= 0.72;
      const reliefFactor = Math.max(0, Math.min(1, (currentScroll - 0.65) / 0.18));
      const turbulence = (1 - reliefFactor); // 1 = estresse/ruído caótico, 0 = harmonia pura

      phase += 0.02; // Velocidade contínua e ultra-fluida

      const centerY = height * 0.55; // Ligeiramente abaixo do centro para não colidir com o texto

      // Configuração das 3 ondas senoidais holográficas com fitas de luz (Ribbons)
      const waves = [
        {
          amplitude: 32 * (1 + turbulence * 0.35),
          frequency: 0.006,
          phaseOffset: phase * 0.75,
          noiseFreq: 0.022,
          strokeColor: isRelief ? "rgba(6, 182, 212, 0.9)" : "rgba(129, 140, 248, 0.85)",
          glowColor: isRelief ? "rgba(6, 182, 212, 0.8)" : "rgba(99, 102, 241, 0.65)",
          ribbonColorStart: isRelief ? "rgba(6, 182, 212, 0.14)" : "rgba(99, 102, 241, 0.12)",
          lineWidth: 2.5,
          blur: 18,
        },
        {
          amplitude: 22 * (1 + turbulence * 0.45),
          frequency: 0.011,
          phaseOffset: phase * 1.15 + Math.PI / 3,
          noiseFreq: 0.032,
          strokeColor: isRelief ? "rgba(34, 211, 238, 0.95)" : "rgba(192, 132, 252, 0.9)",
          glowColor: isRelief ? "rgba(34, 211, 238, 0.85)" : "rgba(168, 85, 247, 0.7)",
          ribbonColorStart: isRelief ? "rgba(34, 211, 238, 0.18)" : "rgba(168, 85, 247, 0.12)",
          lineWidth: 3,
          blur: 24,
        },
        {
          amplitude: 15 * (1 + turbulence * 0.25),
          frequency: 0.016,
          phaseOffset: phase * 0.55 + Math.PI / 1.5,
          noiseFreq: 0.042,
          strokeColor: isRelief ? "rgba(165, 243, 252, 0.8)" : "rgba(99, 102, 241, 0.6)",
          glowColor: isRelief ? "rgba(165, 243, 252, 0.6)" : "rgba(99, 102, 241, 0.45)",
          ribbonColorStart: isRelief ? "rgba(165, 243, 252, 0.08)" : "rgba(99, 102, 241, 0.06)",
          lineWidth: 1.5,
          blur: 12,
        },
      ];

      // Desenha cada camada com Ribbon volumétrico e traço de laser
      waves.forEach((wave) => {
        const points: { x: number; y: number }[] = [];
        const step = 4; // Resolução por ponto para 60 FPS cravados

        for (let x = 0; x <= width + step; x += step) {
          const baseSin = Math.sin(x * wave.frequency + wave.phaseOffset);
          const noiseSin = Math.sin(x * wave.noiseFreq + phase * 2.2) * Math.cos(x * 0.003 + phase);
          const y = centerY + (baseSin * wave.amplitude) + (noiseSin * wave.amplitude * 0.5 * turbulence);
          points.push({ x, y });
        }

        // 1. Preenchimento de Fita Volumétrica (Aurora Ribbon Gradient)
        ctx.save();
        ctx.beginPath();
        if (points.length > 0) {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();

          const ribbonGrad = ctx.createLinearGradient(0, centerY - wave.amplitude, 0, height);
          ribbonGrad.addColorStop(0, wave.ribbonColorStart);
          ribbonGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.02)");
          ribbonGrad.addColorStop(1, "rgba(3, 7, 18, 0)");
          ctx.fillStyle = ribbonGrad;
          ctx.fill();
        }
        ctx.restore();

        // 2. Traço de Luz Neon Laser
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = wave.strokeColor;
        ctx.lineWidth = wave.lineWidth;
        ctx.shadowColor = wave.glowColor;
        ctx.shadowBlur = wave.blur;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (points.length > 0) {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.stroke();
        ctx.restore();
      });

      // Partículas de Potencial de Ação Sináptico (Pulsos de Luz Flutuantes)
      ctx.save();
      const nodeCount = isRelief ? 4 : 2;
      for (let n = 0; n < nodeCount; n++) {
        const nodeProgress = ((phase * 0.4 + n * (1 / nodeCount)) % 1);
        const nx = nodeProgress * width;
        const ny = centerY + Math.sin(nx * 0.011 + phase * 1.15 + Math.PI / 3) * 22;

        ctx.beginPath();
        ctx.arc(nx, ny, isRelief ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isRelief ? "#ffffff" : "#c084fc";
        ctx.shadowColor = isRelief ? "#06b6d4" : "#818cf8";
        ctx.shadowBlur = isRelief ? 18 : 12;
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none select-none ${className}`}
    />
  );
}
