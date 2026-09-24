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

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number | null = null;
    let isRunning = false;
    let lastMoveTime = 0;
    const mouse = { x: -3000, y: -3000 };

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

      // Limita DPR a 1.25 em telas de alta resolução para garantir fluidez total
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      drawFrame();
    };

    const radiusSq = distortionRadius * distortionRadius;

    // Renderiza um frame com resposta 1:1 imediata e busca espacial O(1)
    const drawFrame = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const activeNodes: { x: number; y: number; factor: number; size: number }[] = [];

      const hasMouse = mouse.x > -1000 && mouse.y > -1000;

      // Bounding Box local do cursor (calcula distâncias apenas para ~30 a 50 pontos próximos)
      const minCol = hasMouse
        ? Math.max(0, Math.floor((mouse.x - distortionRadius) / spacing))
        : -1;
      const maxCol = hasMouse
        ? Math.min(cols, Math.ceil((mouse.x + distortionRadius) / spacing))
        : -1;
      const minRow = hasMouse
        ? Math.max(0, Math.floor((mouse.y - distortionRadius) / spacing))
        : -1;
      const maxRow = hasMouse
        ? Math.min(rows, Math.ceil((mouse.y + distortionRadius) / spacing))
        : -1;

      // Lote único de pontos passivos (sem nenhuma conta matemática trigonométrica)
      ctx.beginPath();

      for (let i = 0; i <= cols; i++) {
        const baseX = i * spacing;
        const inColRange = i >= minCol && i <= maxCol;

        for (let j = 0; j <= rows; j++) {
          const baseY = j * spacing;

          // Se estiver fora do quadrante do cursor, desenha ponto estático imediatamente
          if (!inColRange || j < minRow || j > maxRow) {
            ctx.moveTo(baseX + dotSize, baseY);
            ctx.arc(baseX, baseY, dotSize, 0, Math.PI * 2);
            continue;
          }

          // Apenas pontos dentro da vizinhança do mouse sofrem cálculo de distorção
          const dx = mouse.x - baseX;
          const dy = mouse.y - baseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const factor = Math.cos((dist / distortionRadius) * (Math.PI / 2));
            const force = factor * 26;
            const angle = Math.atan2(dy, dx);

            const drawX = baseX - Math.cos(angle) * force;
            const drawY = baseY - Math.sin(angle) * force;
            const currentSize = dotSize + factor * 2;

            activeNodes.push({ x: drawX, y: drawY, factor, size: currentSize });
          } else {
            ctx.moveTo(baseX + dotSize, baseY);
            ctx.arc(baseX, baseY, dotSize, 0, Math.PI * 2);
          }
        }
      }

      ctx.fillStyle = dotColor;
      ctx.fill();

      // Desenha nós ativos sob o cursor com resposta instantânea
      if (activeNodes.length > 0) {
        const maxNodesForLines = Math.min(activeNodes.length, 20);
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

        // Halo suave concêntrico acelerado por hardware
        for (const node of activeNodes) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 1.8 * node.factor, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168, 85, 247, ${0.25 * node.factor})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.fill();
        }
      }
    };

    // Loop de renderização ativo apenas enquanto o cursor está em movimento
    const loop = (timestamp: number) => {
      drawFrame();

      // Se o mouse parou de se mover há mais de 100ms, encerra o loop para poupar 100% de CPU
      if (timestamp - lastMoveTime > 120) {
        isRunning = false;
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      lastMoveTime = performance.now();
      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    updateDimensions();

    if (prefersReducedMotion) {
      drawFrame();
      return;
    }

    // 1:1 Instantâneo (0ms Delay artificial)
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX - rectLeft;
      mouse.y = e.clientY - rectTop;
      startLoop();
    };

    const handleMouseLeave = () => {
      mouse.x = -3000;
      mouse.y = -3000;
      drawFrame();
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("scroll", updateDimensions, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // Primeiro frame estático
    drawFrame();

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("scroll", updateDimensions);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dotColor, activeColor, dotSize, spacing, distortionRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
    />
  );
}
