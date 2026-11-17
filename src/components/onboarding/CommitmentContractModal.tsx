"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Printer,
  Download,
  Sparkles,
  Award,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  Target,
  FileCheck,
} from "lucide-react";
import { triggerHaptic } from "@/lib/sensory/haptics";

interface CommitmentContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
  targetRole?: string | null;
  careerFocus?: string | null;
  dailyHours?: number;
  examDate?: string | null;
}

export function CommitmentContractModal({
  isOpen,
  onClose,
  userName = "Concurseiro(a)",
  targetRole = "Servidor Público",
  careerFocus = "CEBRASPE",
  dailyHours = 3,
  examDate,
}: CommitmentContractModalProps) {
  const [candidateName, setCandidateName] = useState(userName || "Concurseiro(a)");
  const [roleName, setRoleName] = useState(targetRole || "Servidor(a) Público(a)");
  const [bancaName, setBancaName] = useState(careerFocus || "Banca Oficial");
  const [studyHours, setStudyHours] = useState(dailyHours || 3);
  const [targetDateStr, setTargetDateStr] = useState(() => {
    if (examDate) return examDate;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("synapse_dday_target_date");
      if (saved) return saved;
    }
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    triggerHaptic("medium");
    window.print();
  };

  const formattedExamDate = new Date(targetDateStr + "T00:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  const todayFormatted = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Estilos específicos para Impressão Perfeita A4 (Remove todas as bordas pretas do modal/fundo) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #synapse-commitment-contract,
          #synapse-commitment-contract * {
            visibility: visible !important;
          }
          #synapse-commitment-contract {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px 28px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 2px solid #0f172a !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            display: block !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:backdrop-blur-none print:static print:overflow-visible">
        {/* Botões de Ação Fixos no Topo da Tela (Não aparecem na impressão) */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-xl shadow-indigo-950/60 transition-all cursor-pointer active:scale-95"
            title="Imprimir contrato em folha A4 para assinar e colar na parede"
          >
            <Printer size={15} />
            <span>Imprimir Contrato A4 (Parede)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo do Contrato A4 Diagramado */}
        <div
          id="synapse-commitment-contract"
          ref={printAreaRef}
          className="w-full max-w-[800px] my-auto bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl border-4 border-slate-900 relative overflow-hidden print:p-6 print:m-0 print:border-2 print:border-slate-900 print:rounded-none print:shadow-none print:max-w-none print:w-full print:block"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          {/* Moldura Interna Clássica de Certificado */}
          <div className="absolute inset-2 border-2 border-slate-300 pointer-events-none rounded-2xl print:inset-1.5 print:border print:border-slate-400 print:rounded-none" />

        {/* Marca d'água sutil de fundo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none text-9xl font-black font-sans uppercase">
          APROVADO
        </div>

        {/* Cabeçalho Solene */}
        <div className="text-center relative z-10 space-y-2 pb-6 border-b-2 border-slate-900/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shadow-md">
            <Award size={32} />
          </div>

          <span className="text-[11px] font-sans font-bold tracking-[0.25em] text-slate-600 uppercase block">
            REPÚBLICA FEDERATIVA DOS CONCURSEIROS • SYNAPSE AI
          </span>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
            Termo de Compromisso Solene com a Posse
          </h1>

          <p className="text-xs text-slate-600 font-sans italic max-w-lg mx-auto">
            &ldquo;A disciplina é a ponte inegociável entre o sonho da estabilidade e a assinatura da sua posse.&rdquo;
          </p>
        </div>

        {/* Corpo do Contrato */}
        <div className="py-6 space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed relative z-10 text-justify">
          <p>
            Por este instrumento solene e irrevogável, eu,{" "}
            <strong className="underline decoration-slate-400 underline-offset-4 font-bold text-slate-950 font-sans">
              {candidateName}
            </strong>
            , declaro perante mim mesmo e meu futuro que assumo o compromisso público e irretratável de me dedicar com rigor e disciplina aos estudos direcionados para o cargo de{" "}
            <strong className="font-bold text-slate-950 font-sans">
              {roleName}
            </strong>
            , com foco nas exigências da banca examinadora{" "}
            <strong className="font-bold text-slate-950 font-sans">
              {bancaName}
            </strong>
            .
          </p>

          <p>
            Para garantir que a aprovação seja uma certeza matemática e não obra do acaso, estabeleço como cláusulas inegociáveis de conduta diária:
          </p>

          {/* Cláusulas em Destaque */}
          <div className="space-y-2.5 font-sans my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 print:bg-white print:border print:border-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 shrink-0 text-xs">I.</span>
              <p className="text-xs text-slate-700">
                <strong>Da Meta Diária Inegociável:</strong> Dedicar rigorosamente{" "}
                <span className="font-bold text-slate-950">{studyHours} horas líquidas</span>{" "}
                de estudo ativo por dia, mantendo o celular silenciado e sem abas de distração.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 shrink-0 text-xs">II.</span>
              <p className="text-xs text-slate-700">
                <strong>Do Domínio do Edital:</strong> Não pular etapas. Aprender os conceitos-chave, resolver questões exaustivamente e blindar pontos fracos no Caderno de Erros.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 shrink-0 text-xs">III.</span>
              <p className="text-xs text-slate-700">
                <strong>Da Constância sobre a Perfeição:</strong> Mesmo nos dias difíceis, cansativos ou atípicos, cumprir ao menos 1 bloco de revisão. A constância diária vence o cansaço passageiro.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 shrink-0 text-xs">IV.</span>
              <p className="text-xs text-slate-700">
                <strong>Do Horizonte da Posse:</strong> Manter a visão fixa na data estimada de{" "}
                <span className="font-bold text-slate-950">{formattedExamDate}</span>, lembrando que a dor da disciplina dura meses, mas a honra da estabilidade e do distintivo durará a vida inteira.
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-slate-600">
            E por estar em pleno acordo com minhas metas e aspirações de vida, firmo o presente termo para ser afixado no meu local de estudos diário.
          </p>
        </div>

        {/* Rodapé e Assinaturas */}
        <div className="pt-6 border-t-2 border-slate-900/80 relative z-10 font-sans">
          <div className="text-center text-xs text-slate-500 mb-8">
            Firmado em {todayFormatted} • Brasil
          </div>

          <div className="grid grid-cols-2 gap-8 text-center pt-2">
            <div>
              <div className="border-b-2 border-slate-900 pb-1 mx-4" />
              <p className="text-xs font-bold text-slate-900 mt-1.5 uppercase">
                {candidateName}
              </p>
              <p className="text-[10px] text-slate-500">
                Futuro(a) {roleName}
              </p>
            </div>

            <div>
              <div className="border-b-2 border-slate-900 pb-1 mx-4 flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-700">
                <Sparkles size={12} className="text-amber-500" />
                <span>Synapse AI • Mentor Oficial</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1.5 uppercase">
                Inteligência Cognitiva de Aprovação
              </p>
              <p className="text-[10px] text-slate-500">
                Testemunha de Posse & Metodologia
              </p>
            </div>
          </div>
        </div>

        {/* Selo Simbólico no Canto Inferior Direito */}
        <div className="mt-8 pt-4 flex items-center justify-between text-[10px] font-sans text-slate-400 border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Documento Oficial de Autenticidade Cognitiva • Protocolo #{Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
          </div>
          <span className="font-bold text-slate-700">Cole na parede acima da sua mesa</span>
        </div>
      </div>
    </>
  );
}
