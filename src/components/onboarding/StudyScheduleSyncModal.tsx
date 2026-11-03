"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  Sparkles,
  Check,
  Download,
  ExternalLink,
  Sun,
  Sunset,
  Sunrise,
  Moon,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface StudyScheduleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  dailyHours?: number;
  targetRole?: string | null;
}

interface SchedulePreset {
  id: string;
  title: string;
  period: string;
  hour: number;
  minute: number;
  icon: React.ReactNode;
  description: string;
}

const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: "early",
    title: "Madrugador Focado",
    period: "06:00 às 08:00",
    hour: 6,
    minute: 0,
    icon: <Sunrise size={20} className="text-amber-400" />,
    description: "Estude antes do trabalho ou faculdade com a mente 100% descansada.",
  },
  {
    id: "lunch",
    title: "Almoço Produtivo",
    period: "12:30 às 13:30",
    hour: 12,
    minute: 30,
    icon: <Sun size={20} className="text-amber-400" />,
    description: "Aproveite o intervalo do trabalho para fechar seu bloco do dia.",
  },
  {
    id: "evening",
    title: "Fim de Tarde",
    period: "18:30 às 20:30",
    hour: 18,
    minute: 30,
    icon: <Sunset size={20} className="text-orange-400" />,
    description: "Direto ao chegar em casa: foco imediato antes do jantar.",
  },
  {
    id: "night",
    title: "Coruja Noturna",
    period: "21:00 às 23:00",
    hour: 21,
    minute: 0,
    icon: <Moon size={20} className="text-indigo-400" />,
    description: "O silêncio absoluto da noite para absorver matérias densas.",
  },
];

export function StudyScheduleSyncModal({
  isOpen,
  onClose,
  userName,
  dailyHours = 2,
  targetRole = "Concurso Público",
}: StudyScheduleSyncModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("evening");
  const [customHour, setCustomHour] = useState<number>(18);
  const [customMinute, setCustomMinute] = useState<number>(30);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHour = localStorage.getItem("synapse_study_preferred_hour");
      const savedMin = localStorage.getItem("synapse_study_preferred_minute");
      if (savedHour !== null && savedMin !== null) {
        setCustomHour(Number(savedHour));
        setCustomMinute(Number(savedMin));
        const matched = SCHEDULE_PRESETS.find(
          (p) => p.hour === Number(savedHour) && p.minute === Number(savedMin)
        );
        if (matched) {
          setSelectedPresetId(matched.id);
          setIsCustomMode(false);
        } else {
          setIsCustomMode(true);
        }
      }
    }
  }, []);

  if (!isOpen) return null;

  const currentHour = isCustomMode
    ? customHour
    : SCHEDULE_PRESETS.find((p) => p.id === selectedPresetId)?.hour || 18;
  const currentMinute = isCustomMode
    ? customMinute
    : SCHEDULE_PRESETS.find((p) => p.id === selectedPresetId)?.minute || 30;

  const handleSelectPreset = (preset: SchedulePreset) => {
    triggerHaptic("light");
    setSelectedPresetId(preset.id);
    setIsCustomMode(false);
    setCustomHour(preset.hour);
    setCustomMinute(preset.minute);
  };

  const handleSavePreferences = () => {
    triggerHaptic("medium");
    try {
      localStorage.setItem("synapse_study_preferred_hour", String(currentHour));
      localStorage.setItem("synapse_study_preferred_minute", String(currentMinute));
      localStorage.setItem(
        "synapse_study_preferred_time_formatted",
        `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`
      );
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  // Gera Link direto do Google Calendar com recorrência diária
  const safeRoleName = targetRole || "Concurso Público";

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`🧠 Sessão de Estudos - ${safeRoleName} (Synapse AI)`);
    const details = encodeURIComponent(
      `Compromisso diário de estudos com alta retenção sináptica.\nFoco: ${safeRoleName}\nAcesse sua plataforma: https://synapseconcursos.com.br/dashboard`
    );

    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      currentHour,
      currentMinute,
      0
    );
    const end = new Date(start.getTime() + dailyHours * 60 * 60 * 1000);

    const formatDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const dates = `${formatDate(start)}/${formatDate(end)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&recur=RRULE:FREQ=DAILY`;
  };

  // Gera e faz download do arquivo .ics universal (Apple, Outlook, Android)
  const handleDownloadIcs = () => {
    triggerHaptic("medium");
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
      now.getUTCDate()
    )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;

    const startH = pad(currentHour);
    const startM = pad(currentMinute);
    const endTotalMins = currentMinute + dailyHours * 60;
    const endH = pad((currentHour + Math.floor(endTotalMins / 60)) % 24);
    const endM = pad(endTotalMins % 60);

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Synapse AI//Horário Nobre Concursos//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:synapse-study-slot-${Date.now()}@synapse.ai`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${startH}${startM}00`,
      `DTEND:${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${endH}${endM}00`,
      "RRULE:FREQ=DAILY",
      `SUMMARY:🧠 Bloco de Estudos Diário - ${safeRoleName}`,
      "DESCRIPTION:Horário sagrado de estudos no Synapse AI. Celular no silencioso e foco total na sua posse!",
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT10M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Seu bloco de estudos começa em 10 minutos! Prepare seu café e abra o Synapse.",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileSlug = safeRoleName.toLowerCase().replace(/\s+/g, "-");
    link.download = `horario-estudos-${fileSlug}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-500/30 bg-[#090e1a] p-5 sm:p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Definir Meu Horário Nobre
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  HÁBITO
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Em qual horário você rende mais para bater suas {dailyHours}h de estudo diárias?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div className="py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SCHEDULE_PRESETS.map((preset) => {
              const isSelected = !isCustomMode && selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50"
                      : "bg-slate-900/60 hover:bg-slate-900/90 border-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                      {preset.icon}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-indigo-300">
                      {preset.period}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{preset.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Opção Horário Personalizado */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIsCustomMode(true);
              }}
              className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                isCustomMode
                  ? "bg-indigo-950/60 border-indigo-500 text-white"
                  : "bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>⚙️ Definir Outro Horário Específico</span>
              <span className="font-mono font-bold text-indigo-400">
                {String(currentHour).padStart(2, "0")}:{String(currentMinute).padStart(2, "0")}
              </span>
            </button>

            {isCustomMode && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3 animate-in fade-in duration-150">
                <span className="text-xs text-slate-400">Horário diário de início:</span>
                <input
                  type="time"
                  value={`${String(customHour).padStart(2, "0")}:${String(customMinute).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                      setCustomHour(h);
                      setCustomMinute(m);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Sincronização com Agenda Externa (Google & Apple Calendar) */}
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Calendar size={14} className="text-amber-400" />
              <span>Sincronizar Alarme no seu Celular:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic("medium")}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10"
              >
                <ExternalLink size={13} className="text-indigo-400" />
                <span>Google Agenda</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadIcs}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 cursor-pointer"
                title="Compatível com Apple Calendar, Outlook e Samsung Calendar"
              >
                <Download size={13} className="text-emerald-400" />
                <span>Apple / Outlook (.ics)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Você receberá avisos no horário configurado.
          </span>

          <button
            type="button"
            onClick={handleSavePreferences}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
              savedSuccess
                ? "bg-emerald-600 text-white shadow-emerald-950/50"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50"
            }`}
          >
            {savedSuccess ? (
              <>
                <Check size={14} />
                <span>Horário Salvo!</span>
              </>
            ) : (
              <span>Confirmar Meu Horário</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
