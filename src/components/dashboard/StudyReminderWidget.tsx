"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, Check, Clock, Flame, Shield, X } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface StudyReminderWidgetProps {
  currentStreak?: number;
}

export function StudyReminderWidget({ currentStreak = 0 }: StudyReminderWidgetProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("19:00");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const savedEnabled = localStorage.getItem("synapse_study_reminder_enabled");
    const savedTime = localStorage.getItem("synapse_study_reminder_time");
    const dismissed = localStorage.getItem("synapse_study_reminder_dismissed");

    if (savedEnabled === "true") setIsEnabled(true);
    if (savedTime) setReminderTime(savedTime);
    if (dismissed === "true") setIsDismissed(true);
  }, []);

  const handleRequestPermission = async () => {
    triggerHaptic("medium");

    if (!("Notification" in window)) {
      alert("Seu navegador não suporta notificações de sistema.");
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        setIsEnabled(true);
        localStorage.setItem("synapse_study_reminder_enabled", "true");
        localStorage.setItem("synapse_study_reminder_time", reminderTime);

        // Dispara uma notificação de confirmação elegante
        new Notification("🔥 Lembrete Synapse Ativado!", {
          body: `Seu lembrete diário foi definido para às ${reminderTime}. Proteja seu Streak de estudos!`,
          icon: "/Synapse-icon.png",
        });

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      }
    } catch (e) {
      console.warn("Erro ao solicitar permissão de notificação:", e);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReminderTime(val);
    localStorage.setItem("synapse_study_reminder_time", val);
  };

  const handleToggle = () => {
    triggerHaptic("light");
    if (!isEnabled && permission !== "granted") {
      handleRequestPermission();
      return;
    }

    const next = !isEnabled;
    setIsEnabled(next);
    localStorage.setItem("synapse_study_reminder_enabled", next ? "true" : "false");
    if (next) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("synapse_study_reminder_dismissed", "true");
  };

  if (isDismissed && !isEnabled) return null;

  return (
    <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-950/80 border border-amber-500/20 shadow-lg backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            {isEnabled ? <BellRing className="w-4 h-4 text-amber-300 animate-bounce" /> : <Bell className="w-4 h-4 text-amber-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Proteção de Streak
              </span>
              {currentStreak > 0 && (
                <span className="text-[11px] font-extrabold text-orange-400 flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                  {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
              Lembrete Diário de Estudos
            </h4>
            <p className="text-[11px] text-slate-400">
              {isEnabled
                ? `Ativo: avisaremos às ${reminderTime} para você não esquecer de estudar hoje.`
                : "Receba um aviso no seu celular/computador para nunca perder o foco diário."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="time"
              value={reminderTime}
              onChange={handleTimeChange}
              className="bg-transparent text-xs font-mono text-white focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isEnabled
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
            }`}
          >
            {isEnabled ? (
              <>
                <Check className="w-3 h-3" />
                <span>Ativo</span>
              </>
            ) : (
              <span>Ativar Aviso</span>
            )}
          </button>

          {!isEnabled && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Dispensar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showSuccessToast && (
        <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Notificações sincronizadas com sucesso para às {reminderTime}!</span>
        </div>
      )}
    </div>
  );
}
