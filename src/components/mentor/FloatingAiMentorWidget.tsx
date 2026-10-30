"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface Message {
  id: string;
  sender: "user" | "mentor";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Desconcentração vs Descentralização",
  "Mnemônico LIMPE (Art. 37 CF)",
  "Regras de ouro da Crase",
  "Inviolabilidade de Domicílio",
];

export function FloatingAiMentorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "mentor",
      text: "Olá, concurseiro! Sou seu **Professor Sináptico IA**. Ficou com dúvida em algum termo, conceito ou lei? Me pergunte agora e eu explico com macetes e pegadinhas de banca!",
      timestamp: "Agora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuestion.trim();
    if (!textToSend || isLoading) return;

    triggerHaptic("medium");

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/ask-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        const mentorMsg: Message = {
          id: `m_${Date.now()}`,
          sender: "mentor",
          text: data.answer || "Aqui está a explicação com foco na sua prova.",
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, mentorMsg]);
        triggerHaptic("light");
      } else {
        throw new Error("Falha na resposta");
      }
    } catch {
      const errorMsg: Message = {
        id: `e_${Date.now()}`,
        sender: "mentor",
        text: "Houve uma instabilidade momentânea na conexão. Tente novamente em instantes ou pergunte com outras palavras.",
        timestamp: "Agora",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerHaptic("light");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Botão Flutuante (Launcher) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic("medium");
            setIsOpen((prev) => !prev);
          }}
          className={`flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all cursor-pointer border ${
            isOpen
              ? "bg-slate-900 border-slate-700 text-slate-300"
              : "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 border-violet-400/30 text-white shadow-violet-900/50"
          }`}
          title="Tirar dúvida rápida com o Professor IA"
        >
          <div className="relative">
            <Sparkles size={18} className="text-amber-300" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
          </div>
          <span className="text-xs font-bold hidden sm:inline">
            {isOpen ? "Fechar Dúvidas" : "Dúvida? Pergunte à IA"}
          </span>
        </motion.button>
      </div>

      {/* Janela de Chat Flutuante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-3 sm:bottom-20 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[82vh] sm:max-h-[600px] flex flex-col rounded-3xl border border-violet-500/30 bg-[#060a14] shadow-2xl shadow-violet-950/60 overflow-hidden print:hidden"
          >
            {/* Header do Chat */}
            <div className="p-3.5 bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Professor Sináptico IA
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Tire dúvidas da matéria com foco em concurso
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={15} />
              </button>
            </div>

            {/* Mensagens & Chips */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs custom-scrollbar">
              {/* Chips Rápidos Sugeridos */}
              <div className="space-y-1.5 pb-2 border-b border-white/5">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-400" />
                  Dúvidas Frequentes (1 clique):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/30 text-[10px] text-slate-300 hover:text-violet-200 transition-all cursor-pointer disabled:opacity-50 text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Mensagens */}
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-violet-600 text-white rounded-br-xs shadow-md shadow-violet-950/40"
                          : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-bl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {!isUser && msg.id !== "welcome" && (
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-violet-400 bg-slate-900/80 border border-white/10 p-2.5 rounded-2xl w-fit">
                  <Loader2 size={14} className="animate-spin text-violet-400" />
                  <span className="text-[11px]">Professor Sináptico elaborando macete...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de Envio */}
            <div className="p-2.5 bg-slate-950 border-t border-white/10 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Digite sua dúvida ou conceito da prova..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputQuestion.trim()}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0"
                  title="Enviar pergunta"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
