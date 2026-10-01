"use client";

import React from "react";
import { X, Printer, Gavel, CheckCircle2, AlertTriangle, Scale, Award } from "lucide-react";
import { OralEvaluationResult, OralQuestionData } from "@/actions/oral-exam-actions";

interface PrintableOralExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: OralEvaluationResult;
  questionData?: OralQuestionData | null;
  cargo: string;
  disciplina: string;
  userName?: string | null;
  dateStr?: string;
  transcript?: string;
}

export function PrintableOralExamModal({
  isOpen,
  onClose,
  evaluation,
  questionData,
  cargo,
  disciplina,
  userName = "Candidato(a)",
  dateStr = new Date().toLocaleDateString("pt-BR"),
  transcript,
}: PrintableOralExamModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none print:m-0 print:p-0">
        {/* BARRA SUPERIOR (OCULTA NA IMPRESSÃO) */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
              <Gavel size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Espelho Oficial de Avaliação da Prova Oral
              </h2>
              <p className="text-xs text-slate-400">
                Ficha diagramada em padrão oficial de banca para impressão ou PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer size={15} />
              <span>Imprimir / Salvar em PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* DOCUMENTO OFICIAL A4 (VISÍVEL NA TELA E NA IMPRESSÃO) */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-6 print:p-0 print:space-y-4 print:text-xs">
          <style jsx global>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
              }
            }
          `}</style>

          {/* CABEÇALHO OFICIAL DA BANCA EXAMINADORA */}
          <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1.5">
            <div className="inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              <Scale size={14} className="text-slate-700" />
              <span>Synapse AI • Simulador Nacional de Fases Orais</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
              FICHA DE AVALIAÇÃO DA BANCA EXAMINADORA — PROVA ORAL
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Concurso Público de Admissão à Carreira • Arguição Técnica e Oratória
            </p>
          </div>

          {/* DADOS DA SABATINA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Candidato(a):</span>
              <span className="font-semibold text-slate-900 truncate">{userName || "Candidato(a)"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Cargo Pleiteado:</span>
              <span className="font-semibold text-slate-900 truncate">{cargo}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Disciplina:</span>
              <span className="font-semibold text-slate-900 truncate">{disciplina}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[10px] uppercase">Data da Sessão:</span>
              <span className="font-semibold text-slate-900">{dateStr}</span>
            </div>
          </div>

          {/* PONTO SORTEADO E PERGUNTA DA BANCA */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5">
              <span>Ponto Sorteado: {questionData?.ponto || "Ponto Geral da Disciplina"}</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Arguição Oral</span>
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-1">
                Indagação Formulada pelo Examinador:
              </span>
              <p className="text-xs leading-relaxed text-slate-800 italic">
                &ldquo;{questionData?.enunciadoExaminador || "Pergunta da sabatina oral."}&rdquo;
              </p>
            </div>
          </div>

          {/* TRANSCRIÇÃO DA RESPOSTA DO CANDIDATO */}
          {transcript && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <span className="font-bold text-xs text-slate-700 block uppercase text-[10px]">
                Transcrição Fiel da Explanação Oral do Candidato:
              </span>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {transcript}
              </p>
            </div>
          )}

          {/* QUADRO DE NOTAS OFICIAL */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white p-2.5 text-xs font-bold flex items-center justify-between">
              <span>TABELA DE NOTAS & CRITÉRIOS DE PONTUAÇÃO</span>
              <span className="font-mono text-[10px]">Escala 0,0 a 10,0</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600">
                  <th className="p-2.5">Critério de Avaliação</th>
                  <th className="p-2.5 text-center">Peso</th>
                  <th className="p-2.5 text-center">Nota Obtida</th>
                  <th className="p-2.5">Conceito da Banca</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">
                    1. Domínio Técnico-Jurídico & Exatidão Dogmática
                  </td>
                  <td className="p-2.5 text-center font-mono">60%</td>
                  <td className="p-2.5 text-center font-bold text-slate-900 font-mono">
                    {evaluation.notaTecnica.toFixed(1)}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {evaluation.notaTecnica >= 7 ? "Satisfatório" : "Insuficiente"}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">
                    2. Articulação, Vernáculo, Postura & Oratória
                  </td>
                  <td className="p-2.5 text-center font-mono">40%</td>
                  <td className="p-2.5 text-center font-bold text-slate-900 font-mono">
                    {evaluation.notaOratoria.toFixed(1)}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {evaluation.notaOratoria >= 7 ? "Satisfatório" : "Insuficiente"}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td className="p-3 text-slate-900 font-black">
                    MÉDIA FINAL PONDERADA & VEREDITO
                  </td>
                  <td className="p-3 text-center font-mono">100%</td>
                  <td className="p-3 text-center font-mono text-base font-black text-slate-900">
                    {evaluation.notaGeral.toFixed(1)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-black text-xs ${
                        evaluation.isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {evaluation.isApproved ? "APROVADO PELA BANCA" : "REPROVADO PELA BANCA"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PARECER DESCRITIVO DA BANCA EXAMINADORA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5 text-xs">
              <span className="font-bold text-emerald-800 uppercase text-[10px] flex items-center gap-1">
                <CheckCircle2 size={13} /> Pontos Fortes e Acertos na Explanação:
              </span>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc text-xs">
                {evaluation.pontosFortes.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5 text-xs">
              <span className="font-bold text-amber-800 uppercase text-[10px] flex items-center gap-1">
                <AlertTriangle size={13} /> Oportunidades de Melhoria & Recomendações:
              </span>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc text-xs">
                {evaluation.pontosMelhoria.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* RESPOSTA PADRÃO ESPERADA PELA BANCA */}
          {evaluation.espelhoNota10 && (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1.5">
              <span className="font-bold text-xs text-indigo-900 uppercase text-[10px]">
                Espelho Padrão de Resposta da Banca Examinadora:
              </span>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {evaluation.espelhoNota10}
              </p>
            </div>
          )}

          {/* CAMPO DE ASSINATURA DA BANCA */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 border-t border-slate-200">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5" />
              <span className="font-bold text-slate-800 block">Presidente da Banca Examinadora</span>
              <span className="text-[10px]">Synapse AI Evaluator Engine</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5" />
              <span className="font-bold text-slate-800 block">Candidato(a) Avaliado(a)</span>
              <span className="text-[10px]">{userName || "Assinatura do Candidato"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
