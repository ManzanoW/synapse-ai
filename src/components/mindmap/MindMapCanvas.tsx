"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Scale,
  Zap,
  Lightbulb,
  Plus,
  Minus,
  Download,
  RotateCcw,
  BookOpen,
  Printer,
  FileImage,
  FileText,
  ChevronDown,
  Check,
  Crown,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { MindMapNode, deepenMindMapNodeAction } from "@/actions/mindmap-actions";

export interface MindMapCanvasProps {
  rootNode: MindMapNode;
  subjectColor?: string;
  isPro?: boolean;
  topicTitle?: string;
  subjectName?: string;
}

function addSubNodesToTree(
  node: MindMapNode,
  targetId: string,
  newChildren: MindMapNode[],
  newExplanation?: string,
): MindMapNode {
  if (node.id === targetId) {
    return {
      ...node,
      description: newExplanation || node.description,
      children: [...(node.children || []), ...newChildren],
    };
  }
  if (!node.children || node.children.length === 0) return node;
  return {
    ...node,
    children: node.children.map((child) =>
      addSubNodesToTree(child, targetId, newChildren, newExplanation),
    ),
  };
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

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Calcula dimensões ideais do card para que TODO o texto caiba
 * sem qualquer truncamento, cortes de linha ou bordas cortadas.
 * Considera títulos multilinhas, descrições detalhadas e pílulas de bizu/regra.
 */
function computeNodeDimensions(node: MindMapNode) {
  const width = 280;

  // 1. Título (12px bold, ~7.5px por caractere)
  // No card interativo divide espaço com o ícone (16px) e botão expandir (20px)
  const labelLength = node.label ? node.label.length : 0;
  const titleCharsPerLine = 25;
  const titleLines = Math.max(1, Math.ceil(labelLength / titleCharsPerLine));
  const titleHeight = titleLines * 19;

  // 2. Descrição (10.5px regular, ~6.2px por caractere)
  const descLength = node.description ? node.description.length : 0;
  const descCharsPerLine = 35;
  const descLines = descLength > 0 ? Math.ceil(descLength / descCharsPerLine) : 0;
  const descHeight = descLines > 0 ? 6 + descLines * 16 : 0;

  // 3. Regra / Legislação (10px monospace, ~7px por caractere)
  let ruleHeight = 0;
  if (node.ruleOrLaw) {
    const fullRuleText = `⚖️ Regra: ${node.ruleOrLaw}`;
    const ruleCharsPerLine = 28;
    const ruleLines = Math.max(1, Math.ceil(fullRuleText.length / ruleCharsPerLine));
    // margin-top (8px) + padding vertical (8px) + linhas (16px cada)
    ruleHeight = 8 + 8 + ruleLines * 16;
  }

  // 4. Mnemônico / Bizú (10px monospace, ~7px por caractere)
  let mnemonicHeight = 0;
  if (node.mnemonic) {
    const fullMnemonicText = `💡 Bizú: ${node.mnemonic}`;
    const mnemonicCharsPerLine = 28;
    const mnemonicLines = Math.max(1, Math.ceil(fullMnemonicText.length / mnemonicCharsPerLine));
    // margin-top (8px) + padding vertical (8px) + linhas (16px cada)
    mnemonicHeight = 8 + 8 + mnemonicLines * 16;
  }

  // 5. Padding do Card: top 12px + bottom 14px + bordas 3px + respiro de segurança 18px
  const cardPaddingAndSafety = 12 + 14 + 3 + 18;

  const computedHeight =
    cardPaddingAndSafety + titleHeight + descHeight + ruleHeight + mnemonicHeight;
  const height = Math.max(82, Math.ceil(computedHeight));

  return { width, height };
}

/**
 * Gera string SVG autocontida com estilos embutidos e fundo opaco,
 * pronta para ser aberta em qualquer navegador, visualizador vetorial ou impressão.
 */
function generateStandaloneSvg(
  nodes: LayoutNode[],
  connections: Array<{
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    color: string;
  }>,
  title: string,
  mode: "dark" | "light" = "dark",
): string {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });

  const paddingX = 60;
  const paddingTop = 60;
  const paddingBottom = 100; // Margem generosa no rodapé para garantir que cards e sombras nunca fiquem cortados
  const viewBoxX = minX - paddingX;
  const viewBoxY = minY - paddingTop;
  const viewBoxWidth = Math.max(600, maxX - minX + paddingX * 2);
  const viewBoxHeight = Math.max(400, maxY - minY + paddingTop + paddingBottom);

  const isDark = mode === "dark";
  const bgColor = isDark ? "#030611" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const descColor = isDark ? "#cbd5e1" : "#475569";

  const connectionsSvg = connections
    .map((conn) => {
      const dx = (conn.to.x - conn.from.x) * 0.5;
      const pathD = `M ${conn.from.x} ${conn.from.y} C ${conn.from.x + dx} ${conn.from.y}, ${conn.to.x - dx} ${conn.to.y}, ${conn.to.x} ${conn.to.y}`;
      return `<path d="${pathD}" fill="none" stroke="${conn.color}" stroke-width="2.5" stroke-linecap="round" opacity="${isDark ? "0.85" : "0.7"}" />`;
    })
    .join("\n    ");

  const nodesSvg = nodes
    .map((n) => {
      const node = n.node;
      let cardBg = isDark ? "#0d1326" : "#f8fafc";
      let borderColor = isDark ? "#6366f1" : "#cbd5e1";

      if (node.type === "root") {
        cardBg = isDark
          ? "linear-gradient(135deg, #2e1065 0%, #0f172a 100%)"
          : "#ede9fe";
        borderColor = isDark ? "#a78bfa" : "#8b5cf6";
      } else if (node.type === "mnemonic") {
        cardBg = isDark
          ? "linear-gradient(135deg, #451a03 0%, #0f172a 100%)"
          : "#fef3c7";
        borderColor = isDark ? "#f59e0b" : "#d97706";
      } else if (node.type === "rule") {
        cardBg = isDark
          ? "linear-gradient(135deg, #083344 0%, #0f172a 100%)"
          : "#ecfeff";
        borderColor = isDark ? "#06b6d4" : "#0891b2";
      } else if (node.type === "leaf") {
        cardBg = isDark ? "#06221b" : "#f0fdf4";
        borderColor = isDark ? "#10b981" : "#059669";
      }

      const ruleHtml = node.ruleOrLaw
        ? `<div style="margin-top: 8px; font-size: 10px; font-weight: 700; color: ${isDark ? "#67e8f9" : "#0e7490"}; font-family: monospace; background: ${isDark ? "rgba(6, 182, 212, 0.2)" : "#cffafe"}; border: 1px solid ${isDark ? "rgba(6, 182, 212, 0.4)" : "#a5f3fc"}; padding: 4px 8px; border-radius: 6px; line-height: 1.4; word-break: break-word;">⚖️ Regra: ${escapeXml(node.ruleOrLaw)}</div>`
        : "";

      const mnemonicHtml = node.mnemonic
        ? `<div style="margin-top: 8px; font-size: 10px; font-weight: 700; color: ${isDark ? "#fcd34d" : "#b45309"}; font-family: monospace; background: ${isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7"}; border: 1px solid ${isDark ? "rgba(245, 158, 11, 0.4)" : "#fde68a"}; padding: 4px 8px; border-radius: 6px; line-height: 1.4; word-break: break-word;">💡 Bizú: ${escapeXml(node.mnemonic)}</div>`
        : "";

      return `
    <foreignObject x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" style="overflow: visible;">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; box-sizing: border-box; background: ${cardBg}; border: 1.5px solid ${borderColor}; border-radius: 14px; padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,${isDark ? "0.4" : "0.08"});">
        <div style="font-size: 12px; font-weight: 700; color: ${textColor}; line-height: 1.35; word-break: break-word;">
          ${escapeXml(node.label)}
        </div>
        ${
          node.description
            ? `<div style="font-size: 10.5px; color: ${descColor}; line-height: 1.4; margin-top: 6px; word-break: break-word;">${escapeXml(node.description)}</div>`
            : ""
        }
        ${ruleHtml}
        ${mnemonicHtml}
      </div>
    </foreignObject>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <defs>
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&amp;display=swap');
      div { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
  </defs>
  <!-- Fundo do Mapa Mental -->
  <rect x="${viewBoxX}" y="${viewBoxY}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="${bgColor}" rx="12" />

  <!-- Conexões -->
  <g id="connections">
    ${connectionsSvg}
  </g>

  <!-- Nós do Mapa -->
  <g id="nodes">
    ${nodesSvg}
  </g>
</svg>`;
}

export function MindMapCanvas({
  rootNode,
  subjectColor = "#8b5cf6",
  isPro = false,
  topicTitle,
  subjectName,
}: MindMapCanvasProps) {
  const [currentNode, setCurrentNode] = useState<MindMapNode>(rootNode);
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 60 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(rootNode);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [proFeatureReason, setProFeatureReason] = useState<"export" | "deepen">("export");
  const [isDeepening, setIsDeepening] = useState<boolean>(false);

  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setCurrentNode(rootNode);
    setSelectedNode(rootNode);
  }, [rootNode]);

  // Fecha menu de exportação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeepenNode = async (node: MindMapNode) => {
    if (!isPro) {
      setProFeatureReason("deepen");
      setIsProModalOpen(true);
      return;
    }

    setIsDeepening(true);
    try {
      const res = await deepenMindMapNodeAction({
        nodeId: node.id,
        nodeLabel: node.label,
        nodeDescription: node.description,
        topicTitle: topicTitle || currentNode.label,
        subjectName: subjectName || "Geral",
      });

      if (res.success && res.data) {
        const updated = addSubNodesToTree(
          currentNode,
          node.id,
          res.data.subNodes,
          res.data.expandedExplanation,
        );
        setCurrentNode(updated);
        setSelectedNode((prev) =>
          prev && prev.id === node.id
            ? {
                ...prev,
                description: res.data!.expandedExplanation || prev.description,
                children: [...(prev.children || []), ...res.data!.subNodes],
              }
            : prev,
        );
        setExportSuccessMsg("Nó aprofundado com sucesso!");
        setTimeout(() => setExportSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Erro ao aprofundar nó:", err);
    } finally {
      setIsDeepening(false);
    }
  };

  // Cálculo da árvore de nós posicionados com alturas dinâmicas
  const layoutTree = useMemo(() => {
    const colSpacing = 160;
    const rowSpacing = 28;

    let currentY = 60;

    const buildTree = (
      node: MindMapNode,
      depth: number,
      parent?: LayoutNode,
    ): LayoutNode => {
      const isCollapsed = Boolean(collapsedIds[node.id]);
      const { width: nodeWidth, height: nodeHeight } =
        computeNodeDimensions(node);

      const layout: LayoutNode = {
        node,
        x: depth * (280 + colSpacing),
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
        const childYs = layout.children.map((c) => c.y + c.height / 2);
        const avgCenterY = (Math.min(...childYs) + Math.max(...childYs)) / 2;
        layout.y = avgCenterY - nodeHeight / 2;
      } else {
        layout.y = currentY;
        currentY += nodeHeight + rowSpacing;
      }

      return layout;
    };

    return buildTree(currentNode, 0);
  }, [currentNode, collapsedIds]);

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

    // Garante que nenhum nó fique acima de y=40
    const minY = Math.min(...allNodes.map((n) => n.y), 40);
    const yOffset = minY < 40 ? 40 - minY : 0;

    if (yOffset > 0) {
      allNodes.forEach((n) => (n.y += yOffset));
      allConnections.forEach((c) => {
        c.from.y += yOffset;
        c.to.y += yOffset;
      });
    }

    const maxX = Math.max(...allNodes.map((n) => n.x + n.width), 1000);
    const maxY = Math.max(...allNodes.map((n) => n.y + n.height), 700);

    return {
      nodes: allNodes,
      connections: allConnections,
      bounds: { width: maxX + 120, height: maxY + 140 },
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

  // 1. Download SVG Autocontido
  const handleDownloadSvg = useCallback(
    (mode: "dark" | "light" = "dark") => {
      setIsExportMenuOpen(false);
      const svgString = generateStandaloneSvg(
        nodes,
        connections,
        rootNode.label,
        mode,
      );
      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mapa-mental-${rootNode.label
        .toLowerCase()
        .replace(/\s+/g, "-")}-${mode}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg("SVG Exportado com Sucesso!");
      setTimeout(() => setExportSuccessMsg(null), 3000);
    },
    [nodes, connections, rootNode.label],
  );

  // 2. Download PNG em Alta Resolução (HD)
  const handleDownloadPng = useCallback(
    (mode: "dark" | "light" = "dark") => {
      setIsExportMenuOpen(false);
      if (!isPro) {
        setProFeatureReason("export");
        setIsProModalOpen(true);
        return;
      }
      const svgString = generateStandaloneSvg(
        nodes,
        connections,
        rootNode.label,
        mode,
      );
      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const scale = 2; // Resolução Retina 2x
          const imgWidth = img.naturalWidth || img.width || bounds.width;
          const imgHeight = img.naturalHeight || img.height || bounds.height;
          const canvas = document.createElement("canvas");
          canvas.width = imgWidth * scale;
          canvas.height = imgHeight * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            return;
          }

          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              const pngUrl = URL.createObjectURL(pngBlob);
              const link = document.createElement("a");
              link.href = pngUrl;
              link.download = `mapa-mental-${rootNode.label
                .toLowerCase()
                .replace(/\s+/g, "-")}-${mode}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);
            }
            URL.revokeObjectURL(url);
          }, "image/png");

          setExportSuccessMsg("Imagem PNG Gerada em Alta Resolução!");
          setTimeout(() => setExportSuccessMsg(null), 3000);
        } catch (e) {
          console.error("Erro ao gerar PNG:", e);
          handleDownloadSvg(mode);
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = () => {
        handleDownloadSvg(mode);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    },
    [nodes, connections, bounds, rootNode.label, handleDownloadSvg],
  );

  // 3. Impressão Direta / Salvar como PDF em A4 Paisagem (1 Página Perfeita)
  const handlePrint = useCallback(
    (mode: "light" | "dark" = "light") => {
      setIsExportMenuOpen(false);
      if (!isPro) {
        setProFeatureReason("export");
        setIsProModalOpen(true);
        return;
      }
      const svgString = generateStandaloneSvg(
        nodes,
        connections,
        rootNode.label,
        mode,
      );

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Permita pop-ups no navegador para imprimir o mapa mental.");
        return;
      }

      const isDark = mode === "dark";

      // Converte largura e altura fixas para 100% para que o viewBox escale responsivamente na folha A4
      const responsiveSvg = svgString
        .replace(/<\?xml.*?\?>/, "")
        .replace(/width="[^"]*"/, 'width="100%"')
        .replace(/height="[^"]*"/, 'height="100%"');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Mapa Mental - ${escapeXml(rootNode.label)}</title>
            <style>
              @page {
                size: landscape;
                margin: 6mm 8mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                background-color: ${isDark ? "#030611" : "#ffffff"};
                color: ${isDark ? "#ffffff" : "#0f172a"};
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .page-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                padding: 6px 10px;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .header {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"};
                padding-bottom: 6px;
                margin-bottom: 6px;
                flex-shrink: 0;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .title {
                font-size: 15px;
                font-weight: 800;
                margin: 0;
              }
              .subtitle {
                font-size: 10px;
                color: ${isDark ? "#94a3b8" : "#64748b"};
                margin: 1px 0 0 0;
              }
              .svg-wrap {
                flex: 1 1 auto;
                width: 100%;
                min-height: 0;
                height: calc(100% - 46px);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: visible;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              svg {
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                object-fit: contain;
                display: block;
                margin: 0 auto;
              }
              @media print {
                html, body {
                  width: 100% !important;
                  height: 100% !important;
                  overflow: visible !important;
                  background-color: ${isDark ? "#030611" : "#ffffff"} !important;
                }
                .page-container {
                  padding: 2px 4px !important;
                  width: 100% !important;
                  height: 100% !important;
                  max-height: 100% !important;
                  overflow: visible !important;
                  display: flex !important;
                  flex-direction: column !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .no-print {
                  display: none !important;
                }
                .header {
                  padding-bottom: 4px !important;
                  margin-bottom: 4px !important;
                  flex-shrink: 0 !important;
                }
                .svg-wrap {
                  flex: 1 1 auto !important;
                  width: 100% !important;
                  min-height: 0 !important;
                  height: calc(100% - 36px) !important;
                  max-height: calc(100% - 36px) !important;
                  overflow: visible !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                svg {
                  width: 100% !important;
                  height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  object-fit: contain !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="page-container">
              <div class="header">
                <div>
                  <h1 class="title">${escapeXml(rootNode.label)}</h1>
                  <p class="subtitle">Synapse AI • Mapa Mental de Alta Retenção</p>
                </div>
                <button class="no-print" onclick="window.print()" style="padding: 6px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; background: #6366f1; color: white; border: none; font-size: 11px;">Imprimir Agora / Salvar PDF</button>
              </div>
              <div class="svg-wrap">
                ${responsiveSvg}
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 350);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    },
    [nodes, connections, rootNode.label],
  );

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

      {/* BOTÕES DE EXPORTAÇÃO & IMPRESSÃO */}
      <div
        className="absolute top-4 right-4 z-30 flex items-center gap-2"
        ref={exportMenuRef}
      >
        {/* Notificação toast de feedback */}
        {exportSuccessMsg && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <Check size={13} className="text-emerald-400" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Botão rápido: Imprimir / PDF */}
        <button
          type="button"
          onClick={() => handlePrint("light")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 font-bold text-xs backdrop-blur-md shadow-lg transition-all cursor-pointer active:scale-95"
          title="Imprimir mapa mental ou Salvar em PDF (Formato A4 Paisagem)"
        >
          <Printer size={13} className="text-violet-400" />
          <span className="hidden sm:inline">Imprimir / PDF</span>
          {!isPro && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
              <Crown size={8} /> PRO
            </span>
          )}
        </button>

        {/* Menu Dropdown de Exportação */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-950/60 transition-all cursor-pointer active:scale-95"
            title="Opções de Download e Exportação"
          >
            <Download size={13} />
            <span>Exportar</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${
                isExportMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 border border-violet-500/30 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formato Vetorial (SVG)
              </div>
              <button
                type="button"
                onClick={() => handleDownloadSvg("dark")}
                className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:bg-violet-600/20 hover:text-white transition-colors cursor-pointer"
              >
                <Download size={13} className="text-violet-400 shrink-0" />
                <div>
                  <div className="font-semibold">SVG Vetorial (Tema Escuro)</div>
                  <div className="text-[10px] text-slate-400">
                    Nitidez infinita com visual Cyber Dark
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSvg("light")}
                className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:bg-violet-600/20 hover:text-white transition-colors cursor-pointer"
              >
                <Download size={13} className="text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold">SVG Vetorial (Tema Claro)</div>
                  <div className="text-[10px] text-slate-400">
                    Fundo branco, ideal para Illustrator/Canva
                  </div>
                </div>
              </button>

              <div className="my-1 border-t border-white/10" />

              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Imagem e Impressão
              </div>
              <button
                type="button"
                onClick={() => handleDownloadPng("dark")}
                className="w-full text-left flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:bg-violet-600/20 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileImage size={13} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>PNG Alta Resolução (HD 2x)</span>
                      {!isPro && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                          <Crown size={8} /> PRO
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Imagem nítida pronta para slides e celular
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handlePrint("light")}
                className="w-full text-left flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:bg-violet-600/20 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Printer size={13} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Imprimir / Salvar PDF</span>
                      {!isPro && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                          <Crown size={8} /> PRO
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Otimizado para folha A4 em modo paisagem
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
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
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <div className="shrink-0 mt-0.5">
                        {getNodeIcon(node.type)}
                      </div>
                      <span className="text-xs font-bold text-slate-100 leading-snug break-words">
                        {node.label}
                      </span>
                    </div>

                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => toggleCollapse(node.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 mt-[-2px]"
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
                    <p className="text-[10.5px] text-slate-300/90 leading-relaxed break-words mb-1">
                      {node.description}
                    </p>
                  )}

                  {node.ruleOrLaw && (
                    <div className="mt-1 text-[9.5px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md break-words flex items-start gap-1">
                      <span className="shrink-0">⚖️</span>
                      <span className="leading-snug">{node.ruleOrLaw}</span>
                    </div>
                  )}

                  {node.mnemonic && (
                    <div className="mt-1 text-[9.5px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md break-words flex items-start gap-1">
                      <span className="shrink-0">💡</span>
                      <span className="leading-snug">{node.mnemonic}</span>
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

          <div className="flex items-center gap-2 shrink-0">
            {selectedNode.ruleOrLaw && (
              <div className="hidden md:block text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg shrink-0 max-w-xs truncate">
                ⚖️ {selectedNode.ruleOrLaw}
              </div>
            )}

            {selectedNode.mnemonic && (
              <div className="hidden md:block text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg shrink-0 max-w-xs truncate">
                💡 {selectedNode.mnemonic}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleDeepenNode(selectedNode)}
              disabled={isDeepening}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              title="Aprofundar com IA (Exclusivo Synapse Pro)"
            >
              {isDeepening ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span className="hidden sm:inline">Aprofundar com IA</span>
              <Crown size={12} className="fill-slate-950/30" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RECURSO EXCLUSIVO SYNAPSE PRO */}
      {isProModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#090d1c] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsProModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Crown size={28} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Recurso Synapse Pro
              </span>
              <h3 className="text-base font-bold text-white">
                {proFeatureReason === "export"
                  ? "Exportação em Alta Resolução (PDF & PNG HD)"
                  : "Aprofundamento de Conceitos com IA"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {proFeatureReason === "export"
                  ? "Exporte seus mapas mentais em Ultra Definição A4 ou PNG Retina 2x para imprimir ou usar no GoodNotes/Notion sem perda de nitidez."
                  : "Desdobre qualquer ramo com jurisprudência, pegadinhas de bancas examinadoras e macetes inéditos gerados pelo Gemini Pro."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/pricing"
                onClick={() => setIsProModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
              >
                <Crown size={15} />
                <span>Desbloquear Acesso Ilimitado Pro</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsProModalOpen(false)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Continuar no Plano Gratuito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
