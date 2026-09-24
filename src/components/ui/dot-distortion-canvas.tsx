"use client";

import React, { useEffect, useRef, useState } from "react";
import { Zap, Sparkles } from "lucide-react";

interface DotDistortionProps {
  dotColor?: string;
  activeColor?: string;
  dotSize?: number;
  spacing?: number;
  distortionRadius?: number;
  className?: string;
  showQualityToggle?: boolean;
}

export type CanvasQualityMode = "fluid" | "performance";

export function DotDistortionCanvas({
  dotColor = "rgba(99, 102, 241, 0.2)",
  activeColor = "rgba(192, 132, 252, 0.95)",
  dotSize = 1.3,
  spacing = 28,
  distortionRadius = 140,
  className = "",
  showQualityToggle = true,
}: DotDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Inicializa o modo de qualidade com base no hardware do usuário
  const [qualityMode, setQualityMode] = useState<CanvasQualityMode>("fluid");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 1. Verifica preferência salva pelo usuário
    const saved = localStorage.getItem("synapse_canvas_quality") as CanvasQualityMode | null;
    if (saved === "fluid" || saved === "performance") {
      setQualityMode(saved);
      return;
    }

    // 2. Detecção automática de hardware:
    // - Cores de CPU <= 4 (Celeron, Pentium, i3 antigo ou dual-core)
    // - Memória RAM estimada <= 4GB
    // - Preferência do SO por movimento reduzido
    const isLowPowerHardware =
      typeof navigator !== "undefined" &&
      ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        // @ts-expect-error deviceMemory pode não constar em tipos padrão
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches));

    if (isLowPowerHardware) {
      setQualityMode("performance");
    } else {
      setQualityMode("fluid");
    }
  }, []);

  const toggleQuality = () => {
    const nextMode: CanvasQualityMode =
      qualityMode === "fluid" ? "performance" : "fluid";
    setQualityMode(nextMode);
    try {
      localStorage.setItem("synapse_canvas_quality", nextMode);
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let isRunning = false;
    let lastMoveTime = 0;
    let time = 0;

    // Coordenadas
    const mouse = { x: -3000, y: -3000, targetX: -3000, targetY: -3000 };

    // Dimensões em cache (zero layout thrashing)
    let width = 0;
    let height = 0;
    let rectLeft = 0;
    let rectTop = 0;

    // Sentinela de queda de FPS em tempo real (Auto-Downgrade se engasgar no modo Fluido)
    let droppedFramesCount = 0;
    let lastFrameTimestamp = performance.now();

    const updateDimensions = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      width = rect.width;
      height = rect.height;

      // Limita DPR: 1.0 no modo desempenho / 1.25 no modo fluido
      const maxDpr = qualityMode === "performance" ? 1.0 : 1.25;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (qualityMode === "performance") {
        drawPerformanceFrame();
      }
    };

    const radiusSq = distortionRadius * distortionRadius;

    // =========================================================================
    // MODO 1: ALTO DESEMPENHO (PCs modestos, notebooks, 0ms input lag, 0% CPU idle)
    // =========================================================================
    const drawPerformanceFrame = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const activeNodes: { x: number; y: number; factor: number; size: number }[] = [];

      const hasMouse = mouse.x > -1000 && mouse.y > -1000;

      // Bounding box espacial: calcula física apenas para nós sob o cursor
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

      ctx.beginPath();

      for (let i = 0; i <= cols; i++) {
        const baseX = i * spacing;
        const inColRange = i >= minCol && i <= maxCol;

        for (let j = 0; j <= rows; j++) {
          const baseY = j * spacing;

          // Ponto fora da caixa: estático instantâneo
          if (!inColRange || j < minRow || j > maxRow) {
            ctx.moveTo(baseX + dotSize, baseY);
            ctx.arc(baseX, baseY, dotSize, 0, Math.PI * 2);
            continue;
          }

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

      // Nós ativos e conexões (apenas se o cursor estiver sobre a malha)
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

    const performanceLoop = (timestamp: number) => {
      drawPerformanceFrame();

      // Pausa inteligente após 120ms sem movimento para garantir 0% de CPU
      if (timestamp - lastMoveTime > 120) {
        isRunning = false;
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(performanceLoop);
    };

    // =========================================================================
    // MODO 2: FLUIDO CINEMATOGRÁFICO (PCs rápidos, física elástica, onda contínua)
    // =========================================================================
    const fluidLoop = (timestamp: number) => {
      if (!canvas || document.hidden) {
        animationFrameId = requestAnimationFrame(fluidLoop);
        return;
      }

      // Sentinela de performance: se o frame demorar mais de 28ms (<35 FPS) 6x, migra para o modo performance
      const delta = timestamp - lastFrameTimestamp;
      lastFrameTimestamp = timestamp;
      if (delta > 28) {
        droppedFramesCount++;
        if (droppedFramesCount >= 6) {
          console.warn("[Synapse AI] Queda de frames detectada. Ajustando automaticamente para Modo Desempenho.");
          setQualityMode("performance");
          return;
        }
      } else {
        droppedFramesCount = Math.max(0, droppedFramesCount - 1);
      }

      time += 0.015;

      // Amortecimento elástico orgânico (interpolação suave refinada)
      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const activeNodes: { x: number; y: number; factor: number; size: number }[] = [];

      ctx.beginPath();

      for (let i = 0; i <= cols; i++) {
        const baseX = i * spacing;
        for (let j = 0; j <= rows; j++) {
          const baseY = j * spacing;

          // Onda orgânica contínua viva
          const wave = Math.sin(time + (i * 0.2 + j * 0.3)) * 1.6;
          const origX = baseX + wave;
          const origY = baseY + wave;

          const dx = mouse.x - origX;
          const dy = mouse.y - origY;
          const distSq = dx * dx + dy * dy;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const factor = Math.cos((dist / distortionRadius) * (Math.PI / 2));
            const force = factor * 30;
            const angle = Math.atan2(dy, dx);

            const drawX = origX - Math.cos(angle) * force;
            const drawY = origY - Math.sin(angle) * force;
            const currentSize = dotSize + factor * 2.2;

            activeNodes.push({ x: drawX, y: drawY, factor, size: currentSize });
          } else {
            ctx.moveTo(origX + dotSize, origY);
            ctx.arc(origX, origY, dotSize, 0, Math.PI * 2);
          }
        }
      }

      ctx.fillStyle = dotColor;
      ctx.fill();

      // Conexões e partículas vivas
      if (activeNodes.length > 0) {
        const maxNodesForLines = Math.min(activeNodes.length, 28);
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

        for (const node of activeNodes) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 2.0 * node.factor, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168, 85, 247, ${0.28 * node.factor})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx.fillStyle = activeColor;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(fluidLoop);
    };

    updateDimensions();

    const handleMouseMove = (e: MouseEvent) => {
      const targetX = e.clientX - rectLeft;
      const targetY = e.clientY - rectTop;

      if (qualityMode === "performance") {
        // Resposta 1:1 direta (0ms lag)
        mouse.x = targetX;
        mouse.y = targetY;
        lastMoveTime = performance.now();
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(performanceLoop);
        }
      } else {
        // Modo Fluido: interpolação elástica contínua
        mouse.targetX = targetX;
        mouse.targetY = targetY;
      }
    };

    const handleMouseLeave = () => {
      mouse.targetX = -3000;
      mouse.targetY = -3000;

      if (qualityMode === "performance") {
        mouse.x = -3000;
        mouse.y = -3000;
        drawPerformanceFrame();
        isRunning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    };

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("scroll", updateDimensions, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    if (qualityMode === "performance") {
      drawPerformanceFrame();
    } else {
      animationFrameId = requestAnimationFrame(fluidLoop);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("scroll", updateDimensions);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dotColor, activeColor, dotSize, spacing, distortionRadius, qualityMode]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
      />

      {/* Seletor Discreto de Modo de Qualidade */}
      {showQualityToggle && isClient && (
        <div className="absolute top-4 right-4 z-20 hidden lg:block">
          <button
            type="button"
            onClick={toggleQuality}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-[10px] font-mono text-slate-400 hover:text-white transition-all shadow-md backdrop-blur-md cursor-pointer group"
            title={
              qualityMode === "fluid"
                ? "Modo Fluido ativo (física elástica). Clique para mudar para o Modo Leve (ideal para notebooks ou PCs mais lentos)."
                : "Modo Leve ativo (0ms delay, baixo uso de CPU). Clique para ativar o Modo Fluido original."
            }
          >
            {qualityMode === "fluid" ? (
              <>
                <Sparkles size={11} className="text-violet-400 group-hover:animate-spin" />
                <span>Efeito Fluido</span>
              </>
            ) : (
              <>
                <Zap size={11} className="text-amber-400" />
                <span>Modo Leve (0ms)</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
