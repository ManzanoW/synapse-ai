import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
    }

    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
      include: {
        topic: { select: { title: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Simulado não encontrado." },
        { status: 404 }
      );
    }

    const rawQuestions = Array.isArray(quiz.questions) ? (quiz.questions as any[]) : [];
    const totalQuestions = rawQuestions.length;
    const banca = (quiz.banca || "CEBRASPE").toUpperCase();
    const subject = quiz.subject || "Conhecimentos Gerais";
    const examDate = new Date(quiz.createdAt).toLocaleDateString("pt-BR");
    const estimatedMinutes = Math.max(15, totalQuestions * 3);

    // Constrói a diagramação em HTML puro estilizável para impressão A4 de alta fidelidade
    const questionsHtml = rawQuestions
      .map((q, idx) => {
        const num = idx + 1;
        const format = q.formato || "multipla";
        const isCertoErrado = format === "certo_errado";
        const statement = (q.enunciado || "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        let optionsHtml = "";
        if (isCertoErrado) {
          optionsHtml = `
            <div class="options-container ce">
              <div class="option-item"><span class="bubble">C</span> CERTO</div>
              <div class="option-item"><span class="bubble">E</span> ERRADO</div>
            </div>
          `;
        } else if (Array.isArray(q.alternativas)) {
          optionsHtml = `
            <div class="options-container mc">
              ${q.alternativas
                .map((alt: any, aIdx: number) => {
                  const letter = String.fromCharCode(65 + aIdx);
                  const text = typeof alt === "string" ? alt : alt?.texto || "";
                  return `
                    <div class="option-item">
                      <span class="bubble">${letter}</span>
                      <span class="option-text">${text}</span>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `;
        }

        return `
          <div class="question-block">
            <div class="question-header">
              <span class="q-badge">QUESTÃO ${num}</span>
              <span class="q-subject">${subject}</span>
            </div>
            <div class="q-statement">${statement}</div>
            ${optionsHtml}
          </div>
        `;
      })
      .join("");

    // Folha de respostas óptica
    const bubblesHtml = rawQuestions
      .map((q, idx) => {
        const num = String(idx + 1).padStart(2, "0");
        const isCertoErrado = q.formato === "certo_errado";
        const letters = isCertoErrado
          ? ["C", "E"]
          : Array.isArray(q.alternativas) && q.alternativas.length > 0
          ? q.alternativas.map((_: any, aIdx: number) => String.fromCharCode(65 + aIdx))
          : ["A", "B", "C", "D"];

        return `
          <div class="answer-row">
            <span class="row-num">${num}</span>
            <div class="row-bubbles">
              ${letters.map((l: string) => `<span class="opt-bubble">${l}</span>`).join("")}
            </div>
          </div>
        `;
      })
      .join("");

    // Gabarito e justificativas
    const answersGridHtml = rawQuestions
      .map((q, idx) => {
        const num = String(idx + 1).padStart(2, "0");
        return `
          <div class="key-box">
            <div class="key-num">Q-${num}</div>
            <div class="key-val">${q.gabaritoCorreto || "-"}</div>
          </div>
        `;
      })
      .join("");

    const explanationsHtml = rawQuestions
      .map((q, idx) => {
        const num = idx + 1;
        return `
          <div class="exp-item">
            <div class="exp-title">QUESTÃO ${num} • Gabarito: ${q.gabaritoCorreto || "-"}</div>
            <div class="exp-body">${q.justificativa || "Fundamentação técnica oficial."}</div>
          </div>
        `;
      })
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Caderno de Prova Oficial • ${banca} - ${subject}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.45;
    }
    .no-print-bar {
      background: #0f172a;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .no-print-bar button {
      background: linear-gradient(135deg, #06b6d4, #14b8a6);
      color: #000;
      border: none;
      padding: 8px 18px;
      font-weight: 700;
      font-size: 13px;
      border-radius: 8px;
      cursor: pointer;
    }
    .paper-sheet {
      max-width: 900px;
      margin: 20px auto;
      background: #fff;
      padding: 40px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    }
    .cover-box {
      border: 3px solid #000;
      padding: 24px;
      margin-bottom: 40px;
      min-height: 950px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; }
    .cover-header h1 { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; font-family: sans-serif; }
    .cover-header h2 { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; font-family: sans-serif; }
    .banca-tag { display: inline-block; background: #000; color: #fff; padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; font-family: sans-serif; margin-top: 8px; }
    .cover-body { text-align: center; padding: 24px 0; background: #f8fafc; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; margin: 20px 0; }
    .cover-body h3 { font-size: 18px; font-weight: 900; text-transform: uppercase; font-family: sans-serif; }
    .instructions-box { border: 1px solid #000; padding: 14px; font-family: sans-serif; font-size: 11px; line-height: 1.5; background: #fff; text-align: left; }
    .instructions-box h4 { font-size: 12px; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
    .instructions-box ol { padding-left: 20px; }
    .candidate-box { border-top: 2px solid #000; padding-top: 16px; font-family: sans-serif; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field-line { border-bottom: 1.5px solid #000; height: 26px; }
    .columns-grid { column-count: 2; column-gap: 24px; column-rule: 1px solid #e2e8f0; }
    .question-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-family: sans-serif; }
    .q-badge { background: #e2e8f0; font-size: 10px; font-weight: 800; padding: 2px 6px; text-transform: uppercase; shrink-0; }
    .q-subject { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: right; max-width: 220px; line-height: 1.2; word-break: break-word; }
    .q-statement { font-size: 11.5px; text-align: justify; margin-bottom: 8px; }
    .options-container { font-family: sans-serif; font-size: 10.5px; display: flex; flex-direction: column; gap: 4px; }
    .option-item { display: flex; align-items: flex-start; gap: 6px; text-align: justify; }
    .bubble { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; shrink-0; margin-top: 1px; }
    .answer-sheet { border: 2px solid #000; padding: 20px; margin-top: 30px; font-family: sans-serif; page-break-before: always; break-before: page; min-height: 950px; display: flex; flex-direction: column; justify-content: space-between; }
    .answer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 16px; }
    .answer-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 3px 0; }
    .row-num { font-family: monospace; font-size: 10px; font-weight: 800; }
    .row-bubbles { display: flex; gap: 5px; }
    .opt-bubble { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; }
    .explanations-section { page-break-before: always; break-before: page; border-top: 2px solid #000; padding-top: 20px; margin-top: 30px; }
    .key-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; margin-bottom: 20px; font-family: sans-serif; }
    .key-box { border: 1px solid #000; background: #fff; padding: 4px; text-align: center; }
    .key-num { font-size: 8px; font-family: monospace; color: #64748b; font-weight: 700; }
    .key-val { font-size: 13px; font-weight: 900; color: #4338ca; }
    .exp-columns { column-count: 2; column-gap: 20px; column-rule: 1px solid #e2e8f0; }
    .exp-item { break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
    .exp-title { font-family: sans-serif; font-size: 10px; font-weight: 800; margin-bottom: 2px; }
    .exp-body { font-size: 10.5px; text-align: justify; color: #334155; }

    @media print {
      body { background: #fff; color: #000; margin: 0; padding: 0; }
      .no-print-bar { display: none !important; }
      .paper-sheet { box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
      @page { size: A4 portrait; margin: 10mm 12mm; }
      .cover-box {
        box-sizing: border-box !important;
        min-height: 248mm !important;
        height: 250mm !important;
        max-height: 252mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        padding: 6mm 8mm !important;
      }
      .answer-sheet {
        box-sizing: border-box !important;
        min-height: 248mm !important;
        height: 250mm !important;
        max-height: 252mm !important;
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 !important;
        padding: 6mm 8mm !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>SYNAPSE AI • CADERNO OFICIAL DE PROVA (${banca})</strong>
      <span style="opacity: 0.7; font-size: 12px; margin-left: 8px;">${totalQuestions} questões • A4</span>
    </div>
    <button onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>

  <div class="paper-sheet">
    <!-- CAPA -->
    <div class="cover-box">
      <div>
        <div class="cover-header">
          <h2>SYNAPSE AI • SISTEMA COGNITIVO DE ALTO RENDIMENTO</h2>
          <h1>CONCURSO PÚBLICO & SIMULADO OFICIAL</h1>
          <div class="banca-tag">BANCA EXAMINADORA: ${banca}</div>
        </div>

        <div class="cover-body">
          <span style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #64748b; text-transform: uppercase;">Caderno de Questões Objetivas</span>
          <h3>${subject}</h3>
          <p style="font-size: 11px; font-weight: 700; margin-top: 6px;">DURAÇÃO SUGERIDA: ${estimatedMinutes} MINUTOS • TOTAL DE ITENS: ${totalQuestions}</p>
        </div>

        <div class="instructions-box">
          <h4>INSTRUÇÕES GERAIS AO CANDIDATO:</h4>
          <ol>
            <li>Verifique se este caderno contém exatamente <strong>${totalQuestions} questões</strong>.</li>
            <li>Utilize <strong>caneta esferográfica de tinta preta ou azul escura</strong> para preenchimento.</li>
            <li>Para cada questão, preencha totalmente o círculo da opção correspondente na Folha Óptica.</li>
            <li>O tempo médio estimado é de <strong>${Math.round(estimatedMinutes / Math.max(1, totalQuestions))} minutos por questão</strong>.</li>
            <li>Ao término da prova, consulte as resoluções e gabaritos comentados na folha de auditoria cognitiva.</li>
          </ol>
        </div>
      </div>

      <div class="candidate-box">
        <div>
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase;">Nome do Candidato:</span>
          <div class="field-line"></div>
        </div>
        <div>
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase;">Inscrição:</span>
          <div class="field-line" style="font-family: monospace; font-weight: 700; padding-top: 4px; text-align: center;">SYN-${id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div>
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase;">Data:</span>
          <div class="field-line" style="font-family: monospace; padding-top: 4px;">${examDate}</div>
        </div>
        <div>
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase;">Assinatura:</span>
          <div class="field-line"></div>
        </div>
      </div>
    </div>

    <!-- QUESTÕES -->
    <div style="page-break-before: always; break-before: page;">
      <div style="border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 16px; font-family: sans-serif; font-size: 10px; font-weight: 800; display: flex; justify-content: space-between;">
        <span>${banca} • ${subject}</span>
        <span>CADERNO DE QUESTÕES OBJETIVAS</span>
      </div>
      <div class="columns-grid">
        ${questionsHtml}
      </div>
    </div>

    <!-- FOLHA ÓPTICA -->
    <div class="answer-sheet">
      <div>
        <div style="text-align: center; border-bottom: 1.5px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 16px; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #64748b;">
          ✂ DESTAQUE AQUI E ENTREGUE AO FISCAL DE PROVA ✂
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px;">
          <div>
            <span style="font-size: 9px; font-weight: 700; color: #64748b;">SYNAPSE AI • LEITURA ÓPTICA</span>
            <h3 style="font-size: 16px; font-weight: 900; text-transform: uppercase;">FOLHA OFICIAL DE RESPOSTAS</h3>
            <p style="font-size: 10px; color: #475569;">Banca: <strong>${banca}</strong> • Total de Itens: <strong>${totalQuestions}</strong> • Data: <strong>${examDate}</strong></p>
          </div>
        </div>

        <div class="answer-grid">
          ${bubblesHtml}
        </div>
      </div>

      <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px;">
        <div>Assinatura do Candidato: ___________________________________</div>
        <div>Acertos (Uso do Fiscal): ______ / ${totalQuestions}</div>
      </div>
    </div>

    <!-- GABARITO & JUSTIFICATIVAS -->
    <div class="explanations-section">
      <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; font-family: sans-serif; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 9px; font-weight: 700; color: #64748b;">SYNAPSE AI • AUDITORIA COGNITIVA</span>
          <h3 style="font-size: 16px; font-weight: 900; text-transform: uppercase;">CHAVE DE GABARITO & JUSTIFICATIVAS</h3>
        </div>
        <span style="background: #000; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px;">CONFIDENCIAL</span>
      </div>

      <div class="key-grid">
        ${answersGridHtml}
      </div>

      <div class="exp-columns">
        ${explanationsHtml}
      </div>
    </div>
  </div>
</body>
</html>`;

    return new Response(fullHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[/api/questions/[id]/print] Erro ao gerar documento de impressão:", error);
    return NextResponse.json(
      { error: "Falha ao gerar o documento para impressão." },
      { status: 500 }
    );
  }
}
