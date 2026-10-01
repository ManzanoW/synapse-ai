// src/components/mindmap/MindmapViewer.tsx
"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Download,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Brain,
  Info,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";
import { MindmapData, MindmapNode } from "@/actions/mindmap-actions";
import { useSound } from "@/hooks/useSound";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface MindmapViewerProps {
  data: MindmapData;
  className?: string;
}

interface LayoutNode {
  node: MindmapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  depth: number;
  parent?: LayoutNode;
  children: LayoutNode[];
}

export function MindmapViewer({ data, className = "" }: MindmapViewerProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(data.rootNode);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [isActiveRecallMode, setIsActiveRecallMode] = useState<boolean>(false);
  const [revealedNodes, setRevealedNodes] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { playClick, playChime } = useSound();

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick();
    triggerHaptic("light");
    setCollapsedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const toggleActiveRecall = () => {
    playClick();
    triggerHaptic("medium");
    setIsActiveRecallMode((prev) => {
      if (!prev) {
        setRevealedNodes({});
      }
      return !prev;
    });
  };

  const handleSelectNode = (node: MindmapNode) => {
    playClick();
    triggerHaptic("light");
    setSelectedNode(node);
    if (isActiveRecallMode) {
      setRevealedNodes((prev) => ({ ...prev, [node.id]: true }));
    }
  };

  // Exportação em SVG Vetorial de Alta Resolução
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    playChime();
    triggerHaptic("medium");

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = (data.title || "mapa-mental")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    a.download = `synapse-mapa-${safeTitle}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cálculo da árvore de layout para o SVG
  const layoutTree = useMemo(() => {
    const root = data.rootNode;
    const branches = root.children || [];
    const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

    // Altura calculada com base na quantidade de folhas
    const nodeWidth = 190;
    const nodeHeight = 56;
    const levelSpacing = 240;

    let currentY = 80;

    const buildSubtree = (
      node: MindmapNode,
      depth: number,
      color: string,
      parent?: LayoutNode
    ): LayoutNode => {
      const isCollapsed = collapsedNodes[node.id];
      const childrenNodes: LayoutNode[] = [];

      if (!isCollapsed && node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          childrenNodes.push(buildSubtree(child, depth + 1, color, undefined));
        });
      }

      const layout: LayoutNode = {
        node,
        x: 60 + depth * levelSpacing,
        y: 0, // calculado abaixo
        width: nodeWidth,
        height: nodeHeight,
        color,
        depth,
        parent,
        children: childrenNodes,
      };

      if (childrenNodes.length === 0) {
        layout.y = currentY;
        currentY += 80;
      } else {
        const firstY = childrenNodes[0].y;
        const lastY = childrenNodes[childrenNodes.length - 1].y;
        layout.y = (firstY + lastY) / 2;
      }

      // Conecta pais
      childrenNodes.forEach((c) => {
        c.parent = layout;
      });

      return layout;
    };

    // Monta raízes dos ramos
    const branchLayouts: LayoutNode[] = [];
    branches.forEach((branch, bIdx) => {
      const branchColor = colors[bIdx % colors.length];
      branchLayouts.push(buildSubtree(branch, 1, branchColor));
    });

    const rootY =
      branchLayouts.length > 0
        ? (branchLayouts[0].y + branchLayouts[branchLayouts.length - 1].y) / 2
        : 150;

    const rootLayout: LayoutNode = {
      node: root,
      x: 60,
      y: rootY,
      width: 220,
      height: 64,
      color: "#818cf8",
      depth: 0,
      children: branchLayouts,
    };

    branchLayouts.forEach((b) => {
      b.parent = rootLayout;
    });

    return {
      rootLayout,
      totalHeight: Math.max(currentY + 100, 600),
      totalWidth: 60 + 4 * levelSpacing + 200,
    };
  }, [data, collapsedNodes]);

  // Achatamento de nós e conexões para renderizar o SVG
  const { allNodes, connections } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const conns: Array<{ from: LayoutNode; to: LayoutNode; color: string }> = [];

    const traverse = (node: LayoutNode) => {
      nodes.push(node);
      node.children.forEach((child) => {
        conns.push({ from: node, to: child, color: child.color });
        traverse(child);
      });
    };

    traverse(layoutTree.rootLayout);
    return { allNodes: nodes, connections: conns };
  }, [layoutTree]);

  // Controles de Pan / Drag no canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-mindmap-interactive]")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetZoom = () => {
    playClick();
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`relative w-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#07090e] overflow-hidden flex flex-col md:flex-row h-[620px] font-sans ${className}`}
    >
      {/* Luz Ambient Neon */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      {/* ÁREA PRINCIPAL DO SVG VETORIAL */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 h-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none`}
      >
        {/* Barra de Ferramentas Flutuante de Zoom & Pan */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-lg backdrop-blur-md">
          <button
            type="button"
            data-mindmap-interactive
            onClick={() => {
              playClick();
              setScale((s) => Math.min(s + 0.15, 2.2));
            }}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Aproximar zoom"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-[10px] font-mono font-bold px-1.5 text-slate-500 dark:text-slate-400">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            data-mindmap-interactive
            onClick={() => {
              playClick();
              setScale((s) => Math.max(s - 0.15, 0.4));
            }}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Afastar zoom"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            data-mindmap-interactive
            onClick={handleResetZoom}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Centralizar e resetar zoom"
          >
            <RotateCcw size={14} />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

          {/* Botão Active Recall (Desafio de Memória) */}
          <button
            type="button"
            data-mindmap-interactive
            onClick={toggleActiveRecall}
            className={`px-2 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              isActiveRecallMode
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
            title={
              isActiveRecallMode
                ? "Desativar modo Active Recall"
                : "Ativar modo Active Recall (oculta respostas para testar sua memória)"
            }
          >
            {isActiveRecallMode ? <EyeOff size={14} className="text-amber-400" /> : <Eye size={14} />}
            <span className="hidden sm:inline text-[11px]">Active Recall</span>
            <span
              className={`text-[9px] px-1 rounded font-mono ${
                isActiveRecallMode
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {isActiveRecallMode ? "ON" : "OFF"}
            </span>
          </button>

          {/* Botão Exportar SVG */}
          <button
            type="button"
            data-mindmap-interactive
            onClick={handleExportSvg}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Exportar Mapa Mental em SVG Vetorial de Alta Resolução"
          >
            <Download size={15} />
          </button>
        </div>

        {/* Canvas SVG */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <svg
            ref={svgRef}
            width={layoutTree.totalWidth + 100}
            height={layoutTree.totalHeight + 100}
            className="w-full h-full pointer-events-auto"
          >
            {/* CONEXÕES CURVAS DE BÉZIER CÚBICAS */}
            {connections.map((conn, idx) => {
              const startX = conn.from.x + conn.from.width;
              const startY = conn.from.y + conn.from.height / 2;
              const endX = conn.to.x;
              const endY = conn.to.y + conn.to.height / 2;
              const dx = (endX - startX) * 0.55;

              return (
                <path
                  key={`conn-${idx}`}
                  d={`M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth={2}
                  strokeOpacity={0.4}
                  strokeLinecap="round"
                />
              );
            })}

            {/* NÓS DO MAPA MENTAL */}
            {allNodes.map((item) => {
              const isSelected = selectedNode?.id === item.node.id;
              const hasChildren = item.node.children && item.node.children.length > 0;
              const isCollapsed = Boolean(collapsedNodes[item.node.id]);
              const hasMnemonic = Boolean(item.node.mnemonic);
              const hasTrap = Boolean(item.node.trapWarning);

              return (
                <g
                  key={`node-${item.node.id}`}
                  transform={`translate(${item.x}, ${item.y})`}
                  onClick={() => handleSelectNode(item.node)}
                  className="cursor-pointer group"
                >
                  {/* Caixa do Nó */}
                  <rect
                    width={item.width}
                    height={item.height}
                    rx={14}
                    fill={isSelected ? (item.depth === 0 ? "#4f46e5" : item.color) : "currentColor"}
                    className={`${
                      isSelected
                        ? "text-white shadow-xl"
                        : "text-white dark:text-[#0b0f19] fill-white dark:fill-[#0b0f19] stroke-slate-200 dark:stroke-white/10 hover:stroke-indigo-500/50"
                    } transition-all duration-200`}
                    strokeWidth={isSelected ? 2 : 1}
                    filter={isSelected ? "drop-shadow(0 0 12px rgba(99,102,241,0.5))" : undefined}
                  />

                  {/* Borda de cor à esquerda do nó */}
                  {item.depth > 0 && (
                    <rect
                      x={0}
                      y={0}
                      width={5}
                      height={item.height}
                      rx={3}
                      fill={item.color}
                    />
                  )}

                  {/* Título do Nó (Suporte a Active Recall) */}
                  {isActiveRecallMode && item.depth > 0 && !revealedNodes[item.node.id] ? (
                    <text
                      x={14}
                      y={32}
                      fill="#f59e0b"
                      className="text-[11px] font-extrabold select-none fill-amber-500 animate-pulse"
                    >
                      ❓ [Clique p/ Lembrar]
                    </text>
                  ) : (
                    <>
                      <text
                        x={item.depth > 0 ? 14 : 16}
                        y={hasMnemonic || hasTrap ? 24 : 32}
                        fill={isSelected ? "#ffffff" : "currentColor"}
                        className={`${
                          item.depth === 0
                            ? "text-xs font-black"
                            : "text-[11px] font-bold"
                        } select-none fill-slate-900 dark:fill-slate-100`}
                      >
                        {item.node.label.length > 24
                          ? `${item.node.label.slice(0, 22)}...`
                          : item.node.label}
                      </text>

                      {/* Badges de Mnemônico ou Pegadinha no Nó */}
                      {(hasMnemonic || hasTrap) && (
                        <g transform="translate(14, 34)">
                          {hasMnemonic && (
                            <text
                              x={0}
                              y={10}
                              fill="#f59e0b"
                              className="text-[9px] font-extrabold select-none"
                            >
                              💡 MACETE
                            </text>
                          )}
                          {hasTrap && (
                            <text
                              x={hasMnemonic ? 56 : 0}
                              y={10}
                              fill="#f43f5e"
                              className="text-[9px] font-extrabold select-none"
                            >
                              ⚠️ PEGADINHA
                            </text>
                          )}
                        </g>
                      )}
                    </>
                  )}

                  {/* Botão de Expandir/Recolher Filhos */}
                  {hasChildren && (
                    <circle
                      cx={item.width + 12}
                      cy={item.height / 2}
                      r={10}
                      fill={item.color}
                      onClick={(e) => toggleCollapse(item.node.id, e)}
                      className="cursor-pointer hover:scale-110 transition-transform shadow-md"
                    />
                  )}
                  {hasChildren && (
                    <text
                      x={item.width + 9}
                      y={item.height / 2 + 4}
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {isCollapsed ? "+" : "−"}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* PAINEL LATERAL DE DETALHES DO NÓ SELECIONADO */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-xl p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Brain size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Detalhes Cognitivos
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {selectedNode?.label || "Selecione um conceito"}
              </h3>
            </div>
          </div>

          {selectedNode?.description && (
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Definição / Conceito
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/80 dark:border-white/5">
                {selectedNode.description}
              </p>
            </div>
          )}

          {/* Card de Mnemônico */}
          {selectedNode?.mnemonic && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100 space-y-1">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Lightbulb size={14} className="shrink-0" />
                <span>Macete Mnemônico</span>
              </span>
              <p className="text-xs leading-relaxed font-medium">
                {selectedNode.mnemonic}
              </p>
            </div>
          )}

          {/* Alerta de Pegadinha da Banca */}
          {selectedNode?.trapWarning && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-100 space-y-1">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Pegadinha de Prova</span>
              </span>
              <p className="text-xs leading-relaxed font-medium">
                {selectedNode.trapWarning}
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Matéria: {data.subject}</span>
            <span className="font-mono">FSRS Linked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
