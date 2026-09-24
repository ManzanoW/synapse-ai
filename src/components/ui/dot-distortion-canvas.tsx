"use client";

import React, { useEffect, useRef } from "react";

interface DotDistortionProps {
  dotColor?: string;
  activeColor?: string;
  dotSize?: number;
  spacing?: number;
  distortionRadius?: number;
  className?: string;
}

export function DotDistortionCanvas({
  dotColor = "rgba(99, 102, 241, 0.2)",
  activeColor = "rgba(192, 132, 252, 0.95)",
  dotSize = 1.3,
  spacing = 28,
  distortionRadius = 140,
  className = "",
}: DotDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Respeita preferência do sistema por animações reduzidas
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let time = 0;
    const mouse = { x: -3000, y: -3000, targetX: -3000, targetY: -3000 };

    // Dimensões em cache para evitar reflows síncronos (getBoundingClientRect no loop)
    let width = 0;
    let height = 0;
    let rectLeft = 0;
    let rectTop = 0;

    const updateDimensions = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      width = rect.width;
      height = rect.height;

      // Limita DPR a no máximo 1.5 para evitar sobrecarga de renderização em telas 4K/Retina
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reseta matriz
      ctx.scale(dpr, dpr);
    };

    updateDimensions();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX - rectLeft;
      mouse.targetY = e.clientY - rectTop;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;
    };

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("scroll", updateDimensions, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const radiusSq = distortionRadius * distortionRadius;

    // Se preferir movimento reduzido, desenha apenas um frame estático e encerra
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        const x = i * spacing;
        for (let j = 0; j <= rows; j++) {
          const y = j * spacing;
          ctx.moveTo(x + dotSize, y);
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = dotColor;
      ctx.fill();
      return () => {
        window.removeEventListener("resize", updateDimensions);
        window.removeEventListener("scroll", updateDimensions);
        window.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    const render = () => {
      if (!canvas || document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.015;

      // Interpolação suave de posição do mouse (amortecimento)
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const activeNodes: { x: number; y: number; factor: number; size: number }[] = [];

      // 1. LOTE ÚNICO DE PONTOS PASSIVOS (98% da tela desenhada em 1 único draw call)
      ctx.beginPath();

      for (let i = 0; i <= cols; i++) {
        const baseX = i * spacing;
        for (let j = 0; j <= rows; j++) {
          const baseY = j * spacing;

          // Onda contínua sutil
          const wave = Math.sin(time + (i * 0.2 + j * 0.3)) * 1.5;
          const origX = baseX + wave;
          const origY = baseY + wave;

          const dx = mouse.x - origX;
          const dy = mouse.y - origY;
          const distSq = dx * dx + dy * dy;

          // Verificação rápida por raio ao quadrado (evita Math.sqrt para pontos distantes)
          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const factor = Math.cos((dist / distortionRadius) * (Math.PI / 2));
            const force = factor * 28;
            const angle = Math.atan2(dy, dx);

            const drawX = origX - Math.cos(angle) * force;
            const drawY = origY - Math.sin(angle) * force;
            const currentSize = dotSize + factor * 2;

            activeNodes.push({ x: drawX, y: drawY, factor, size: currentSize });
          } else {
            // Ponto estático/passivo adicionado ao lote
            ctx.moveTo(origX + dotSize, origY);
            ctx.arc(origX, origY, dotSize, 0, Math.PI * 2);
          }
        }
      }

      ctx.fillStyle = dotColor;
      ctx.fill();

      // 2. DESENHO APENAS DOS PONTOS ATIVOS (Próximos ao cursor - máx ~20-30 pontos)
      if (activeNodes.length > 0) {
        // Conexões de malha neural limitada a no máximo 25 nós para evitar pico quadrático O(N²)
        const maxNodesForLines = Math.min(activeNodes.length, 25);
        const maxLineDist = spacing * 1.6;
        const maxLineDistSq = maxLineDist * maxLineDist;

        for (let m = 0; m < maxNodesForLines; m++) {
          for (let n = m + 1; n < maxNodesForLines; n++) {
            const p1 = activeNodes[m];
            const p2 = activeNodes[n];
            const ndx = p1.x - p2.x;
            const ndy = p1.y - p2.y;
            const nodeDistSq = ndx * ndx + ndy * ndy;

            if (nodeDistSq < maxLineDistSq) {
              const nodeDist = Math.sqrt(nodeDistSq);
              const alpha =
                (1 - nodeDist / maxLineDist) *
                Math.min(p1.factor, p2.factor) *
                0.4;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }

        // Renderiza brilho e pontos ativos SEM usar ctx.shadowBlur (que causa lag pesado em CPUs fracas)
        for (const node of activeNodes) {
          // Halo circular externo suave
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 1.8 * node.factor, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168, 85, 247, ${0.25 * node.factor})`;
          ctx.fill();

          // Ponto central nítido
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("scroll", updateDimensions);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotColor, activeColor, dotSize, spacing, distortionRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
    />
  );
}
