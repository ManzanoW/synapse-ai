"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Scale,
  Zap,
  Lightbulb,
  Plus,
  Minus,
  Maximize2,
  Download,
  RotateCcw,
  BookOpen,
  Info,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { MindMapNode } from "@/actions/mindmap-actions";

export interface MindMapCanvasProps {
  rootNode: MindMapNode;
  subjectColor?: string;
}

interface LayoutNode {
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  collapsed: boolean;
  parent?: LayoutNode;
  children: LayoutNode[];
}

export function MindMapCanvas({
  rootNode,
  subjectColor = "#8b5cf6",
}: MindMapCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(rootNode);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Cálculo da árvore de nós posicionados
  const layoutTree = useMemo(() => {
    const nodeWidth = 240;
    const nodeHeight = 65;
    const colSpacing = 160;
    const rowSpacing = 32;

    let currentY = 60;

    const buildTree = (
      node: MindMapNode,
      depth: number,
      parent?: LayoutNode,
    ): LayoutNode => {
      const isCollapsed = Boolean(collapsedIds[node.id]);
      const layout: LayoutNode = {
        node,
        x: depth * (nodeWidth + colSpacing),
        y: 0,
        width: nodeWidth,
        height: nodeHeight,
        depth,
        collapsed: isCollapsed,
        parent,
        children: [],
      };

      if (!isCollapsed && node.children && node.children.length > 0) {
        layout.children = node.children.map((child) =>
          buildTree(child, depth + 1, layout),
        );
        const childYs = layout.children.map((c) => c.y);
        layout.y = (Math.min(...childYs) + Math.max(...childYs)) / 2;
      } else {
        layout.y = currentY;
        currentY += nodeHeight + rowSpacing;
      }

      return layout;
    };

    return buildTree(rootNode, 0);
  }, [rootNode, collapsedIds]);

  // Lista linear de nós e conexões para renderização
  const { nodes, connections, bounds } = useMemo(() => {
    const allNodes: LayoutNode[] = [];
    const allConnections: Array<{
      id: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      color: string;
    }> = [];

    const traverse = (node: LayoutNode) => {
      allNodes.push(node);
      if (!node.collapsed && node.children.length > 0) {
        node.children.forEach((child) => {
          const fromX = node.x + node.width;
          const fromY = node.y + node.height / 2;
          const toX = child.x;
          const toY = child.y + child.height / 2;

          let connColor = "#6366f1";
          if (child.node.type === "mnemonic") connColor = "#f59e0b";
          else if (child.node.type === "rule") connColor = "#06b6d4";
          else if (child.node.type === "leaf") connColor = "#10b981";

          allConnections.push({
            id: `conn-${node.node.id}-${child.node.id}`,
            from: { x: fromX, y: fromY },
            to: { x: toX, y: toY },
            color: connColor,
          });

          traverse(child);
        });
      }
    };

    traverse(layoutTree);

    const maxX = Math.max(...allNodes.map((n) => n.x + n.width), 1000);
    const maxY = Math.max(...allNodes.map((n) => n.y + n.height), 700);

    return {
      nodes: allNodes,
      connections: allConnections,
      bounds: { width: maxX + 100, height: maxY + 100 },
    };
  }, [layoutTree]);

  // Controles de Pan / Arraste
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Download do SVG
  const handleDownloadSvg = useCallback(() => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapa-mental-${rootNode.label.toLowerCase().replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [rootNode.label]);

  const getNodeIcon = (type: MindMapNode["type"]) => {
    switch (type) {
      case "root":
        return <Brain className="w-4 h-4 text-violet-300" />;
      case "branch":
        return <BookOpen className="w-3.5 h-3.5 text-indigo-300" />;
      case "rule":
        return <Scale className="w-3.5 h-3.5 text-cyan-300" />;
      case "mnemonic":
        return <Lightbulb className="w-3.5 h-3.5 text-amber-300" />;
      case "leaf":
      default:
        return <Zap className="w-3.5 h-3.5 text-emerald-300" />;
    }
  };

  const getNodeStyle = (type: MindMapNode["type"], isSelected: boolean) => {
    let base = "border rounded-2xl p-3 cursor-pointer transition-all backdrop-blur-md ";
    if (isSelected) {
      base += "ring-2 ring-violet-400 shadow-2xl scale-[1.02] z-30 ";
    }

    switch (type) {
      case "root":
        return base + "bg-linear-to-br from-violet-950/80 via-indigo-950/60 to-slate-900/90 border-violet-400/50 shadow-violet-900/30";
      case "branch":
        return base + "bg-linear-to-br from-indigo-950/70 via-slate-900/70 to-slate-950/80 border-indigo-500/30 hover:border-indigo-400";
      case "rule":
        return base + "bg-linear-to-br from-cyan-950/70 via-slate-900/70 to-slate-950/80 border-cyan-500/30 hover:border-cyan-400";
      case "mnemonic":
        return base + "bg-linear-to-br from-amber-950/70 via-slate-900/70 to-slate-950/80 border-amber-500/40 hover:border-amber-400 shadow-amber-950/20";
      case "leaf":
      default:
        return base + "bg-slate-900/80 border-emerald-500/25 hover:border-emerald-400";
    }
  };

  return (
    <div className="relative w-full h-[650px] bg-[#030611] rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl flex flex-col select-none">
      {/* Grade de fundo estilo Blueprint Cyber */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(139, 92, 246, 0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* BARRA DE FERRAMENTAS SUPERIOR FLUTUANTE */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-xl">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Aumentar Zoom"
        >
          <Plus size={15} />
        </button>
        <span className="text-[11px] font-mono font-bold text-slate-300 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Diminuir Zoom"
        >
          <Minus size={15} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 50, y: 50 });
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
          title="Centralizar"
        >
          <RotateCcw size={13} />
          <span>Resetar</span>
        </button>
      </div>

      {/* BOTÃO DOWNLOAD SVG */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={handleDownloadSvg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-950/60 transition-all cursor-pointer active:scale-95"
          title="Baixar Mapa Mental em Formato Vetorial SVG"
        >
          <Download size={13} />
          <span>Exportar SVG</span>
        </button>
      </div>

      {/* ÁREA INTERATIVA DO CANVAS */}
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={bounds.width}
          height={bounds.height}
          className="overflow-visible"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <defs>
            {/* Gradientes e filtros de brilho para conexões */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* CURVAS DE BÉZIER CONECTANDO OS NÓS */}
          {connections.map((conn) => {
            const dx = (conn.to.x - conn.from.x) * 0.5;
            const pathD = `M ${conn.from.x} ${conn.from.y} C ${conn.from.x + dx} ${conn.from.y}, ${conn.to.x - dx} ${conn.to.y}, ${conn.to.x} ${conn.to.y}`;

            return (
              <path
                key={conn.id}
                d={pathD}
                fill="none"
                stroke={conn.color}
                strokeWidth="2.5"
                strokeOpacity="0.6"
                strokeLinecap="round"
                className="transition-all hover:stroke-opacity-100 hover:stroke-width-[3.5px]"
              />
            );
          })}

          {/* RENDERIZAÇÃO DOS NÓS */}
          {nodes.map((layoutNode) => {
            const node = layoutNode.node;
            const isSelected = selectedNode?.id === node.id;
            const hasChildren = node.children && node.children.length > 0;

            return (
              <foreignObject
                key={node.id}
                x={layoutNode.x}
                y={layoutNode.y}
                width={layoutNode.width}
                height={layoutNode.height}
                className="overflow-visible"
              >
                <div
                  onClick={() => setSelectedNode(node)}
                  className={getNodeStyle(node.type, isSelected)}
                  style={{ width: layoutNode.width }}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getNodeIcon(node.type)}
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {node.label}
                      </span>
                    </div>

                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => toggleCollapse(node.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title={layoutNode.collapsed ? "Expandir" : "Recolher"}
                      >
                        {layoutNode.collapsed ? (
                          <Plus size={12} className="text-cyan-400" />
                        ) : (
                          <Minus size={12} className="text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {node.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                      {node.description}
                    </p>
                  )}

                  {node.mnemonic && (
                    <div className="mt-1 text-[9px] font-bold text-amber-300 font-mono flex items-center gap-1">
                      <span>💡 Bizú:</span>
                      <span className="truncate">{node.mnemonic}</span>
                    </div>
                  )}
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* PAINEL DE DETALHES DO NÓ SELECIONADO (RODAPÉ) */}
      {selectedNode && (
        <div className="p-3.5 border-t border-white/10 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 text-xs z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              {getNodeIcon(selectedNode.type)}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {selectedNode.label}
              </span>
              <p className="text-[11px] text-slate-300 truncate">
                {selectedNode.description || "Nenhum detalhe adicional."}
              </p>
            </div>
          </div>

          {selectedNode.ruleOrLaw && (
            <div className="hidden sm:block text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg shrink-0 max-w-xs truncate">
              ⚖️ {selectedNode.ruleOrLaw}
            </div>
          )}

          {selectedNode.mnemonic && (
            <div className="hidden sm:block text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg shrink-0 max-w-xs truncate">
              💡 {selectedNode.mnemonic}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
