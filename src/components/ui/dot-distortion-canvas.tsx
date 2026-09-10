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
  spacing = 24,
  distortionRadius = 160,
  className = "",
}: DotDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    const mouse = { x: -3000, y: -3000, targetX: -3000, targetY: -3000 };

    const updateSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;
    };

    window.addEventListener("resize", updateSize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      time += 0.015;

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const activeNodes: { x: number; y: number; factor: number }[] = [];

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const baseX = i * spacing;
          const baseY = j * spacing;

          // Onda contínua sutil de fundo
          const wave = Math.sin(time + (i * 0.2 + j * 0.3)) * 1.8;
          const origX = baseX + wave;
          const origY = baseY + wave;

          const dx = mouse.x - origX;
          const dy = mouse.y - origY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let drawX = origX;
          let drawY = origY;
          let currentSize = dotSize;

          if (dist < distortionRadius) {
            const factor = Math.cos((dist / distortionRadius) * (Math.PI / 2));
            const force = factor * 34;
            const angle = Math.atan2(dy, dx);

            drawX -= Math.cos(angle) * force;
            drawY -= Math.sin(angle) * force;
            currentSize = dotSize + factor * 2.2;

            activeNodes.push({ x: drawX, y: drawY, factor });
          }

          ctx.beginPath();
          ctx.arc(drawX, drawY, Math.max(0.6, currentSize), 0, Math.PI * 2);

          if (dist < distortionRadius) {
            const factor = 1 - dist / distortionRadius;
            ctx.fillStyle = activeColor;
            ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
            ctx.shadowBlur = factor * 10;
          } else {
            ctx.fillStyle = dotColor;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      // Conexões de malha neural dinâmica
      for (let m = 0; m < activeNodes.length; m++) {
        for (let n = m + 1; n < activeNodes.length; n++) {
          const p1 = activeNodes[m];
          const p2 = activeNodes[n];
          const nodeDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (nodeDist < spacing * 1.6) {
            const alpha =
              (1 - nodeDist / (spacing * 1.6)) *
              Math.min(p1.factor, p2.factor) *
              0.45;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", updateSize);
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
