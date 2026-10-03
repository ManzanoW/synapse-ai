"use client";

import React, { useEffect, useRef } from "react";
import { MotionValue } from "framer-motion";

interface NeuralWaveCanvasProps {
  scrollProgress: MotionValue<number>;
  className?: string;
}

/**
 * Visualizador Neural Líquido Contínuo a 60 FPS (Zero Trancos, Zero Resets)
 * Renderiza ondas senoidais multi-camadas através de um Canvas 2D ultra-otimizado,
 * modulando a turbulência (ruído de estresse ➔ harmonia ciano) com base no scroll.
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

      // Fase de Alívio (acima de 0.72): a turbulência zera e a onda se harmoniza
      const isRelief = currentScroll >= 0.72;
      const reliefFactor = Math.max(0, Math.min(1, (currentScroll - 0.65) / 0.18));
      const turbulence = (1 - reliefFactor); // 1 = estresse/ruído caótico, 0 = harmonia pura

      phase += 0.022; // Velocidade contínua e suave da ondulação

      const centerY = height / 2;

      // Configuração das 3 ondas senoidais sobrepostas
      const waves = [
        {
          amplitude: 28 * (1 + turbulence * 0.4),
          frequency: 0.007,
          phaseOffset: phase * 0.8,
          noiseFreq: 0.025,
          color: isRelief ? "rgba(6, 182, 212, 0.85)" : "rgba(129, 140, 248, 0.8)",
          glowColor: isRelief ? "rgba(6, 182, 212, 0.7)" : "rgba(99, 102, 241, 0.6)",
          lineWidth: 2.5,
          blur: 16,
        },
        {
          amplitude: 20 * (1 + turbulence * 0.5),
          frequency: 0.012,
          phaseOffset: phase * 1.2 + Math.PI / 3,
          noiseFreq: 0.035,
          color: isRelief ? "rgba(34, 211, 238, 0.95)" : "rgba(192, 132, 252, 0.85)",
          glowColor: isRelief ? "rgba(34, 211, 238, 0.8)" : "rgba(168, 85, 247, 0.6)",
          lineWidth: 3,
          blur: 20,
        },
        {
          amplitude: 14 * (1 + turbulence * 0.3),
          frequency: 0.018,
          phaseOffset: phase * 0.6 + Math.PI / 1.5,
          noiseFreq: 0.045,
          color: isRelief ? "rgba(165, 243, 252, 0.7)" : "rgba(99, 102, 241, 0.5)",
          glowColor: isRelief ? "rgba(165, 243, 252, 0.5)" : "rgba(99, 102, 241, 0.4)",
          lineWidth: 1.5,
          blur: 10,
        },
      ];

      // Desenha cada camada com interpolação suave
      waves.forEach((wave) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.shadowColor = wave.glowColor;
        ctx.shadowBlur = wave.blur;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const step = 4; // Resolução por ponto para 60 FPS ultra-leve
        let first = true;

        for (let x = 0; x <= width + step; x += step) {
          // Onda Senoidal Base
          const baseSin = Math.sin(x * wave.frequency + wave.phaseOffset);

          // Componente de Turbulência / Ruído Cognitivo (some suavemente na fase de alívio)
          const noiseSin = Math.sin(x * wave.noiseFreq + phase * 2.2) * Math.cos(x * 0.004 + phase);
          const y = centerY + (baseSin * wave.amplitude) + (noiseSin * wave.amplitude * 0.6 * turbulence);

          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        ctx.restore();
      });

      // Partículas de Potencial de Ação Sináptico (pequenos pulsos viajando na onda harmônica)
      if (isRelief) {
        ctx.save();
        const pulseCount = 3;
        for (let p = 0; p < pulseCount; p++) {
          const pulseProgress = ((phase * 0.6 + p * 0.33) % 1);
          const px = pulseProgress * width;
          const py = centerY + Math.sin(px * 0.012 + phase * 1.2 + Math.PI / 3) * 20;

          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 15;
          ctx.fill();
        }
        ctx.restore();
      }

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
