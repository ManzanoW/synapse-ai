"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, SkipForward, X, Sparkles, Flame, Coffee } from "lucide-react";

interface MiniTimerPiPProps {
  isOpen: boolean;
  onClose: () => void;
  minutes: number;
  seconds: number;
  isActive: boolean;
  modeLabel: string;
  isFocusMode: boolean;
  progressPercent: number;
  subjectName?: string;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipToNext: () => void;
}

export function MiniTimerPiP({
  isOpen,
  onClose,
  minutes,
  seconds,
  isActive,
  modeLabel,
  isFocusMode,
  progressPercent,
  subjectName,
  onToggleTimer,
  onResetTimer,
  onSkipToNext,
}: MiniTimerPiPProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  useEffect(() => {
    let activePipWin: Window | null = null;

    async function openPip() {
      if (!isOpen) return;

      // Se a API nativa Document Picture-in-Picture estiver disponível (Chromium/Edge/Chrome)
      if ("documentPictureInPicture" in window) {
        try {
          const docPip = (window as unknown as {
            documentPictureInPicture: {
              requestWindow: (options: { width: number; height: number }) => Promise<Window>;
            };
          }).documentPictureInPicture;

          const win = await docPip.requestWindow({
            width: 340,
            height: 200,
          });

          activePipWin = win;
          setPipWindow(win);

          // Injetar estilos do documento principal
          const allStyleSheets = Array.from(document.styleSheets);
          allStyleSheets.forEach((styleSheet) => {
            try {
              if (styleSheet.href) {
                const link = win.document.createElement("link");
                link.rel = "stylesheet";
                link.href = styleSheet.href;
                win.document.head.appendChild(link);
              } else if (styleSheet.cssRules) {
                const style = win.document.createElement("style");
                for (const rule of styleSheet.cssRules) {
                  style.appendChild(win.document.createTextNode(rule.cssText));
                }
                win.document.head.appendChild(style);
              }
            } catch {
              // Regras protegidas por CORS são ignoradas com segurança
            }
          });

          // Título e estilos de base para a mini-janela
          win.document.title = "Synapse AI - Mini Timer";
          win.document.body.style.margin = "0";
          win.document.body.style.backgroundColor = "#030712";
          win.document.body.style.color = "#f8fafc";
          win.document.body.style.fontFamily = "system-ui, -apple-system, sans-serif";
          win.document.body.style.overflow = "hidden";
          win.document.body.style.display = "flex";
          win.document.body.style.flexDirection = "column";
          win.document.body.style.height = "100vh";

          win.addEventListener("pagehide", () => {
            setPipWindow(null);
            onClose();
          });
        } catch (err) {
          console.warn("Não foi possível abrir Document PiP:", err);
          onClose();
        }
      } else {
        // Fallback para navegadores sem documentPictureInPicture: popup compacta
        try {
          const popup = window.open(
            "",
            "SynapseMiniTimer",
            "width=340,height=210,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
          );

          if (popup) {
            activePipWin = popup;
            setPipWindow(popup);

            popup.document.title = "Synapse AI - Mini Timer";
            popup.document.body.style.margin = "0";
            popup.document.body.style.backgroundColor = "#030712";
            popup.document.body.style.color = "#f8fafc";
            popup.document.body.style.fontFamily = "system-ui, -apple-system, sans-serif";
            popup.document.body.style.overflow = "hidden";

            popup.addEventListener("beforeunload", () => {
              setPipWindow(null);
              onClose();
            });
          } else {
            alert("Por favor, permita popups para abrir a janela flutuante do Mini-Timer.");
            onClose();
          }
        } catch {
          onClose();
        }
      }
    }

    if (isOpen && !pipWindow) {
      openPip();
    } else if (!isOpen && pipWindow) {
      try {
        pipWindow.close();
      } catch {
        // Janela já fechada
      }
      setPipWindow(null);
    }

    return () => {
      if (activePipWin && !activePipWin.closed) {
        try {
          activePipWin.close();
        } catch {
          // Ignora erro ao fechar
        }
      }
    };
  }, [isOpen]);

  if (!isOpen || !pipWindow) return null;

  const formattedMin = String(minutes).padStart(2, "0");
  const formattedSec = String(seconds).padStart(2, "0");

  return createPortal(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        padding: "12px 16px",
        boxSizing: "border-box",
        backgroundColor: "#030712",
        color: "#f8fafc",
        userSelect: "none",
      }}
    >
      {/* Topo do PiP: Disciplina e Modo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isFocusMode ? (
            <Flame size={14} color="#f43f5e" />
          ) : (
            <Coffee size={14} color="#10b981" />
          )}
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#e2e8f0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subjectName || "Foco Livre"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "9999px",
              backgroundColor: isFocusMode ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)",
              color: isFocusMode ? "#818cf8" : "#34d399",
              border: `1px solid ${isFocusMode ? "rgba(99, 102, 241, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
            }}
          >
            {modeLabel}
          </span>
          <button
            onClick={() => {
              if (pipWindow) pipWindow.close();
              onClose();
            }}
            title="Fechar Mini-Timer"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Centro: Display do Timer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          margin: "4px 0",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "44px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: isActive ? "#ffffff" : "#94a3b8",
            lineHeight: 1,
            textShadow: isActive
              ? isFocusMode
                ? "0 0 20px rgba(99, 102, 241, 0.4)"
                : "0 0 20px rgba(16, 185, 129, 0.4)"
              : "none",
          }}
        >
          {formattedMin}:{formattedSec}
        </div>

        {/* Barra de Progresso Fina */}
        <div
          style={{
            width: "100%",
            height: "4px",
            backgroundColor: "#1e293b",
            borderRadius: "9999px",
            marginTop: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: isFocusMode ? "#6366f1" : "#10b981",
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>

      {/* Rodapé: Controles Rápidos */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <button
          onClick={onResetTimer}
          title="Reiniciar Timer"
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            color: "#94a3b8",
            borderRadius: "10px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
          }}
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={onToggleTimer}
          title={isActive ? "Pausar" : "Iniciar Foco"}
          style={{
            backgroundColor: isFocusMode ? "#4f46e5" : "#059669",
            border: "none",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "12px",
            borderRadius: "12px",
            padding: "7px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: isFocusMode
              ? "0 4px 12px rgba(79, 70, 229, 0.35)"
              : "0 4px 12px rgba(5, 150, 105, 0.35)",
          }}
        >
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          <span>{isActive ? "Pausar" : "Iniciar"}</span>
        </button>

        <button
          onClick={onSkipToNext}
          title="Pular Fase"
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            color: "#94a3b8",
            borderRadius: "10px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
          }}
        >
          <SkipForward size={14} />
        </button>
      </div>
    </div>,
    pipWindow.document.body
  );
}
