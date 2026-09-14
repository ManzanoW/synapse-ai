import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, createPartFromUri, type Part } from "@google/genai";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// ============================================================================
// CONFIGURAÇÃO PADRÃO (Edite aqui ou passe argumentos via CLI)
// Exemplo CLI:
//   npm run exam:ingest -- --filePath="./provas/PF_2024_Agente.pdf" --banca="CEBRASPE" --orgao="Polícia Federal" --cargo="Agente" --ano=2024
// ============================================================================
export interface ExamIngestConfig {
  filePath: string;
  banca: string;
  orgao: string;
  cargo: string;
  ano: number;
  gabaritoFilePath?: string;
  model?: string;
}

const DEFAULT_CONFIG: ExamIngestConfig = {
  filePath: "./provas/PF_2024_Agente.pdf",
  banca: "CEBRASPE",
  orgao: "Polícia Federal",
  cargo: "Agente de Polícia Federal",
  ano: 2024,
  gabaritoFilePath: "",
  model: "gemini-1.5-pro",
};

// ============================================================================
// ESTRUTURA DOS DADOS EXTRAÍDOS
// ============================================================================
export interface QuestionAlternative {
  letra: string; // "A", "B", "C", "D", "E" ou "C", "E"
  texto: string;
}

export interface QuestionPayload {
  numeroQuestao: number;
  disciplina: string;
  topico?: string;
  enunciado: string;
  tipo: "MULTIPLA_ESCOLHA" | "CERTO_ERRADO";
  alternativas: QuestionAlternative[];
  gabarito: string; // "A", "B", "C", "D", "E", "CERTO", "ERRADO"
  justificativa?: string;
  difficultyEstimate?: number;
}

// ============================================================================
// PARSER DE ARGUMENTOS DE LINHA DE COMANDO
// ============================================================================
function parseCliArgs(): ExamIngestConfig {
  const args = process.argv.slice(2);
  const config: ExamIngestConfig = { ...DEFAULT_CONFIG };
  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg.startsWith("--filePath=")) {
      config.filePath = arg.slice("--filePath=".length);
    } else if (arg === "--filePath" || arg === "-f" || arg === "--file") {
      config.filePath = args[++i];
    } else if (arg.startsWith("--banca=")) {
      config.banca = arg.slice("--banca=".length);
    } else if (arg === "--banca" || arg === "-b") {
      config.banca = args[++i];
    } else if (arg.startsWith("--orgao=")) {
      config.orgao = arg.slice("--orgao=".length);
    } else if (arg === "--orgao" || arg === "-o") {
      config.orgao = args[++i];
    } else if (arg.startsWith("--cargo=")) {
      config.cargo = arg.slice("--cargo=".length);
    } else if (arg === "--cargo" || arg === "-c") {
      config.cargo = args[++i];
    } else if (arg.startsWith("--ano=")) {
      config.ano = parseInt(arg.slice("--ano=".length), 10);
    } else if (arg === "--ano" || arg === "-a") {
      config.ano = parseInt(args[++i], 10);
    } else if (arg.startsWith("--gabaritoFilePath=")) {
      config.gabaritoFilePath = arg.slice("--gabaritoFilePath=".length);
    } else if (arg.startsWith("--gabarito=")) {
      config.gabaritoFilePath = arg.slice("--gabarito=".length);
    } else if (arg === "--gabaritoFilePath" || arg === "--gabarito" || arg === "-g") {
      config.gabaritoFilePath = args[++i];
    } else if (arg.startsWith("--model=")) {
      config.model = arg.slice("--model=".length);
    } else if (arg === "--model" || arg === "-m") {
      config.model = args[++i];
    } else if (!arg.startsWith("-")) {
      positionalArgs.push(arg);
    }
  }

  // Permite argumentos posicionais: <filePath> <banca> <orgao> <cargo> <ano> [gabaritoFilePath]
  if (positionalArgs.length > 0) {
    if (positionalArgs[0]) config.filePath = positionalArgs[0];
    if (positionalArgs[1]) config.banca = positionalArgs[1];
    if (positionalArgs[2]) config.orgao = positionalArgs[2];
    if (positionalArgs[3]) config.cargo = positionalArgs[3];
    if (positionalArgs[4]) config.ano = parseInt(positionalArgs[4], 10) || config.ano;
    if (positionalArgs[5]) config.gabaritoFilePath = positionalArgs[5];
  }

  return config;
}

function printHelp() {
  console.log(`
=============================================================================
🏛️ SYNAPSE AI - INGESTÃO DE CADERNOS DE PROVAS (PDF -> GEMINI -> PRISMA)
=============================================================================

Uso via npm script:
  npm run exam:ingest -- [opções]

Opções:
  --filePath, -f        Caminho para o PDF da prova (ex: ./provas/PF_2024_Agente.pdf)
  --banca, -b           Banca organizadora (ex: CEBRASPE, FGV, FCC, VUNESP)
  --orgao, -o           Órgão do concurso (ex: Polícia Federal, Receita Federal)
  --cargo, -c           Cargo do concurso (ex: Agente de Polícia Federal, Auditor-Fiscal)
  --ano, -a             Ano de aplicação (ex: 2024)
  --gabarito, -g        (Opcional) Caminho para PDF ou arquivo de texto com gabarito
  --model, -m           (Opcional) Modelo Gemini (padrão: gemini-1.5-pro)
  --help, -h            Exibe este manual de ajuda

Exemplo completo:
  npm run exam:ingest -- --filePath="./provas/PF_2024.pdf" --banca="CEBRASPE" --orgao="Polícia Federal" --cargo="Agente" --ano=2024
=============================================================================
`);
}

// ============================================================================
// HELPERS PARA UPLOAD E FILE API DO GEMINI
// ============================================================================
interface FileUploadResult {
  part: Part;
  uploadedFileName?: string;
}

async function prepareFilePart(
  ai: GoogleGenAI,
  absolutePath: string,
  displayName: string
): Promise<FileUploadResult> {
  const mimeType = absolutePath.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "text/plain";

  try {
    console.log(`   📤 Enviando arquivo para Google AI File API: ${path.basename(absolutePath)}...`);
    const fileUpload = await ai.files.upload({
      file: absolutePath,
      config: {
        mimeType,
        displayName,
      },
    });

    if (!fileUpload.name) {
      throw new Error("Falha ao obter identificador do arquivo no Google AI File API.");
    }

    // Aguarda eventual processamento assíncrono do arquivo
    let fileInfo = await ai.files.get({ name: fileUpload.name });
    let attempts = 0;
    while (fileInfo.state === "PROCESSING" && attempts < 30) {
      attempts++;
      console.log(`   ⏳ Arquivo ainda em processamento no Gemini (${attempts * 3}s)...`);
      await new Promise((res) => setTimeout(res, 3000));
      fileInfo = await ai.files.get({ name: fileUpload.name });
    }

    if (fileInfo.state === "FAILED") {
      throw new Error(`Processamento do arquivo falhou no Google AI File API: ${fileUpload.name}`);
    }

    const fileUri = fileInfo.uri || fileUpload.uri;
    if (!fileUri) {
      throw new Error("URI do arquivo não foi gerada pelo Google AI File API.");
    }

    console.log(`   ✅ Arquivo processado na File API com sucesso: ${fileUpload.name}`);
    return {
      part: createPartFromUri(fileUri, mimeType),
      uploadedFileName: fileUpload.name,
    };
  } catch (fileApiErr) {
    console.warn(
      `   ⚠️ File API indisponível ou encontrou erro (${String(fileApiErr)}). Fazendo fallback para buffer base64 inline...`
    );

    // Fallback: conversão direta para inlineData em base64
    const buffer = fs.readFileSync(absolutePath);
    return {
      part: {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType,
        },
      },
    };
  }
}

// ============================================================================
// PARSE E LIMPEZA SEGURA DO JSON RETORNADO
// ============================================================================
function parseQuestionsJson(rawOutput: string): QuestionPayload[] {
  let cleaned = rawOutput.trim();

  // Remove markdown code fences se presentes
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  // Localiza o início e fim de array JSON caso haja texto residual
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Erro de sintaxe ao fazer parse do JSON retornado pelo Gemini.");
    console.error("Trecho recebido (primeiros 500 caracteres):\n", rawOutput.slice(0, 500));
    throw new Error(`Falha no JSON.parse: ${String(err)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("O Gemini retornou uma resposta válida, mas não no formato de array JSON esperado.");
  }

  // Validação e normalização de cada questão
  const normalized: QuestionPayload[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;

    const numeroQuestao = typeof item.numeroQuestao === "number"
      ? item.numeroQuestao
      : parseInt(String(item.numeroQuestao || i + 1), 10) || i + 1;

    const enunciado = typeof item.enunciado === "string" ? item.enunciado.trim() : "";
    if (!enunciado) {
      console.warn(`   ⚠️ Questão #${numeroQuestao} ignorada por ausência de enunciado.`);
      continue;
    }

    const disciplina = typeof item.disciplina === "string" && item.disciplina.trim()
      ? item.disciplina.trim()
      : "Geral";

    const topico = typeof item.topico === "string" && item.topico.trim()
      ? item.topico.trim()
      : undefined;

    let tipo: "MULTIPLA_ESCOLHA" | "CERTO_ERRADO" = "MULTIPLA_ESCOLHA";
    if (
      item.tipo === "CERTO_ERRADO" ||
      item.tipo === "CERTO/ERRADO" ||
      item.tipo === "C_E"
    ) {
      tipo = "CERTO_ERRADO";
    }

    let alternativas: QuestionAlternative[] = [];
    if (Array.isArray(item.alternativas)) {
      alternativas = item.alternativas
        .map((alt: unknown) => {
          const a = alt as Record<string, unknown>;
          return {
            letra: String(a.letra || "").trim().toUpperCase(),
            texto: String(a.texto || "").trim(),
          };
        })
        .filter((alt) => alt.letra && alt.texto);
    }

    // Se for estilo Certo/Errado e não tiver alternativas estruturadas, cria as opções padrão C e E
    if (tipo === "CERTO_ERRADO" && alternativas.length === 0) {
      alternativas = [
        { letra: "C", texto: "Certo" },
        { letra: "E", texto: "Errado" },
      ];
    }

    let gabarito = String(item.gabarito || "").trim().toUpperCase();
    if (tipo === "CERTO_ERRADO") {
      if (gabarito === "C" || gabarito === "CERTO") gabarito = "CERTO";
      else if (gabarito === "E" || gabarito === "ERRADO") gabarito = "ERRADO";
    }

    const justificativa = typeof item.justificativa === "string"
      ? item.justificativa.trim()
      : undefined;

    const difficultyEstimate = typeof item.difficultyEstimate === "number"
      ? item.difficultyEstimate
      : 3.0;

    normalized.push({
      numeroQuestao,
      disciplina,
      topico,
      enunciado,
      tipo,
      alternativas,
      gabarito: gabarito || "N/A",
      justificativa,
      difficultyEstimate,
    });
  }

  return normalized;
}

// ============================================================================
// PROMPT ESTRUTURADO DE EXTRAÇÃO
// ============================================================================
function buildExtractionPrompt(
  banca: string,
  orgao: string,
  cargo: string,
  ano: number,
  gabaritoInfo?: string
): string {
  return `Você é um perito em análise, catalogação e estruturação de cadernos de prova oficiais de concursos públicos brasileiros.
Você está analisando o caderno de prova oficial em anexo referente a:
- Banca Examinadora: ${banca}
- Órgão: ${orgao}
- Cargo: ${cargo}
- Ano de Aplicação: ${ano}

${
  gabaritoInfo
    ? `\n--- GABARITO OFICIAL FORNECIDO ---\n${gabaritoInfo}\nUtilize rigorosamente este gabarito para assinalar a resposta correta de cada questão.\n`
    : `\nINSTRUÇÃO DE GABARITO: Caso o documento contenha a folha/gabarito de respostas oficial ao final, utilize-a. Se não contiver, extraia o gabarito indicado pelas marcações/comentários oficiais ou infira o gabarito tecnicamente com base no ordenamento jurídico e na doutrina majoritária vigente à época.\n`
}

DIRETRIZES FUNDAMENTAIS DE EXTRAÇÃO:
1. Extraia TODAS as questões presentes no caderno de provas, em ordem crescente de numeração.
2. Ignore integralmente:
   - Cabeçalhos de página repetitivos
   - Numeração de páginas
   - Textos de instruções iniciais do candidato ("Prezado candidato...", "Duração da prova: X horas", etc.)
   - Propagandas ou rodapés de gráficas.
3. Tratamento de Textos de Apoio / Textos Base:
   - Quando um grupo de questões se basear em um texto introdutório comum (ex: "Texto para as questões de 1 a 5"), inclua a referência ou o excerto essencial no início do campo "enunciado" de cada questão, de modo que cada questão seja 100% autossuficiente e compreensível isoladamente.
4. Tipo de Questão:
   - Se for modelo CEBRASPE (itens independentes para julgar): defina "tipo": "CERTO_ERRADO", "alternativas": [{"letra": "C", "texto": "Certo"}, {"letra": "E", "texto": "Errado"}], e "gabarito": "CERTO" ou "ERRADO".
   - Se for modelo de múltipla escolha (FGV, FCC, VUNESP, CESGRANRIO): defina "tipo": "MULTIPLA_ESCOLHA", liste todas as opções em "alternativas" com as letras correspondentes (A, B, C, D, E), e assinale a letra correta em "gabarito".
5. Disciplinas e Tópicos:
   - Classifique a "disciplina" com o nome formal da matéria (ex: "Língua Portuguesa", "Direito Constitucional", "Direito Administrativo", "Direito Penal", "Tecnologia da Informação", "Contabilidade Geral", "Raciocínio Lógico-Matemático", etc.).
   - Em "topico", informe o assunto específico cobrado (ex: "Crimes contra a Administração Pública", "Controle de Constitucionalidade", "Regência Verbal").
6. Justificativa:
   - Elabore uma justificativa técnica concisa e bem fundamentada explicando por que a alternativa ou o julgamento está correto.
7. Formato da Resposta:
   - Retorne ESTRITAMENTE um array JSON contendo objetos com a seguinte interface TypeScript:

[
  {
    "numeroQuestao": 1,
    "disciplina": "Língua Portuguesa",
    "topico": "Compreensão e Interpretação de Textos",
    "enunciado": "...",
    "tipo": "MULTIPLA_ESCOLHA", // ou "CERTO_ERRADO"
    "alternativas": [
      { "letra": "A", "texto": "..." },
      { "letra": "B", "texto": "..." },
      { "letra": "C", "texto": "..." },
      { "letra": "D", "texto": "..." },
      { "letra": "E", "texto": "..." }
    ],
    "gabarito": "B", // "A", "B", "C", "D", "E", "CERTO" ou "ERRADO"
    "justificativa": "Fundamentação sucinta e objetiva...",
    "difficultyEstimate": 3.0 // 1.0 (muito fácil) a 5.0 (muito difícil)
  }
]`;
}

// ============================================================================
// FLUXO PRINCIPAL DE EXECUÇÃO
// ============================================================================
async function main() {
  const config = parseCliArgs();

  console.log("=============================================================================");
  console.log("🚀 SYNAPSE AI - INGESTÃO AUTOMATIZADA DE PROVAS VIA GEMINI MULTIMODAL");
  console.log("=============================================================================");
  console.log(`📁 Arquivo do Caderno : ${config.filePath}`);
  console.log(`🏛️ Banca               : ${config.banca}`);
  console.log(`🏢 Órgão               : ${config.orgao}`);
  console.log(`💼 Cargo               : ${config.cargo}`);
  console.log(`📅 Ano                 : ${config.ano}`);
  if (config.gabaritoFilePath) {
    console.log(`📋 Gabarito Externo   : ${config.gabaritoFilePath}`);
  }
  console.log(`🤖 Modelo Gemini       : ${config.model || "gemini-1.5-pro"}`);
  console.log("-----------------------------------------------------------------------------\n");

  const resolvedExamPath = path.resolve(process.cwd(), config.filePath);
  if (!fs.existsSync(resolvedExamPath)) {
    console.error(`❌ Erro: O arquivo do caderno de provas não foi encontrado no caminho especificado:`);
    console.error(`   -> ${resolvedExamPath}\n`);
    console.log(`Dica: Verifique se o caminho está correto ou passe via CLI:`);
    console.log(`   npm run exam:ingest -- --filePath="./meu-arquivo.pdf" --banca="FGV" --orgao="Receita" --cargo="Auditor" --ano=2024\n`);
    process.exit(1);
  }

  const examStats = fs.statSync(resolvedExamPath);
  const examSizeMb = (examStats.size / (1024 * 1024)).toFixed(2);
  console.log(`📄 Arquivo localizado: ${path.basename(resolvedExamPath)} (${examSizeMb} MB)`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Erro: Variável de ambiente GEMINI_API_KEY não foi encontrada no arquivo .env.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const filesToDelete: string[] = [];

  try {
    // =========================================================================
    // [1/3] Upload do PDF e processamento com Gemini...
    // =========================================================================
    console.log("\n[1/3] Upload do PDF e processamento com Gemini...");

    const examFileResult = await prepareFilePart(
      ai,
      resolvedExamPath,
      path.basename(resolvedExamPath)
    );
    if (examFileResult.uploadedFileName) {
      filesToDelete.push(examFileResult.uploadedFileName);
    }

    let gabaritoInfoText: string | undefined = undefined;
    const contents: (Part | string)[] = [];

    // Processa gabarito externo caso fornecido
    if (config.gabaritoFilePath && config.gabaritoFilePath.trim() !== "") {
      const resolvedGabaritoPath = path.resolve(process.cwd(), config.gabaritoFilePath);
      if (fs.existsSync(resolvedGabaritoPath)) {
        if (resolvedGabaritoPath.toLowerCase().endsWith(".pdf")) {
          console.log(`   📋 Preparando PDF de gabarito externo...`);
          const gabaritoFileResult = await prepareFilePart(
            ai,
            resolvedGabaritoPath,
            path.basename(resolvedGabaritoPath)
          );
          if (gabaritoFileResult.uploadedFileName) {
            filesToDelete.push(gabaritoFileResult.uploadedFileName);
          }
          contents.push(gabaritoFileResult.part);
        } else {
          console.log(`   📋 Lendo texto do gabarito externo...`);
          gabaritoInfoText = fs.readFileSync(resolvedGabaritoPath, "utf-8");
        }
      } else {
        console.warn(
          `   ⚠️ Arquivo de gabarito especificado não foi encontrado: ${resolvedGabaritoPath}. Prosseguindo sem ele.`
        );
      }
    }

    const promptText = buildExtractionPrompt(
      config.banca,
      config.orgao,
      config.cargo,
      config.ano,
      gabaritoInfoText
    );

    contents.push(examFileResult.part);
    contents.push(promptText);

    const modelName = config.model || "gemini-1.5-pro";
    console.log(`   🧠 Enviando requisição multimodal para o modelo [${modelName}]...`);

    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⚡ Resposta recebida do Gemini em ${elapsedSeconds}s.`);

    const rawResponseText = response.text || "";
    if (!rawResponseText.trim()) {
      throw new Error("O Gemini retornou uma resposta textual vazia.");
    }

    // =========================================================================
    // [2/3] X questões extraídas com sucesso.
    // =========================================================================
    const questions = parseQuestionsJson(rawResponseText);
    console.log(`\n[2/3] ${questions.length} questões extraídas com sucesso.`);

    if (questions.length === 0) {
      throw new Error("Nenhuma questão pôde ser validada a partir da saída gerada pelo Gemini.");
    }

    // Tabela resumida de disciplinas extraídas
    const disciplinasCount: Record<string, number> = {};
    for (const q of questions) {
      disciplinasCount[q.disciplina] = (disciplinasCount[q.disciplina] || 0) + 1;
    }
    console.log("   📊 Distribuição das questões extraídas por disciplina:");
    for (const [disc, count] of Object.entries(disciplinasCount)) {
      console.log(`      • ${disc.padEnd(30)} : ${count} questão(ões)`);
    }

    // =========================================================================
    // [3/3] Registros persistidos no banco de dados.
    // =========================================================================
    console.log("\n[3/3] Registros persistidos no banco de dados...");

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Localiza se o exame já existe ou cria novo (idempotência)
      let exam = await tx.bankExam.findFirst({
        where: {
          banca: config.banca,
          orgao: config.orgao,
          cargo: config.cargo,
          ano: config.ano,
        },
      });

      if (!exam) {
        exam = await tx.bankExam.create({
          data: {
            banca: config.banca,
            orgao: config.orgao,
            cargo: config.cargo,
            ano: config.ano,
            isProcessed: true,
          },
        });
        console.log(`   ✨ Novo registro BankExam criado com ID: ${exam.id}`);
      } else {
        exam = await tx.bankExam.update({
          where: { id: exam.id },
          data: {
            isProcessed: true,
          },
        });
        console.log(`   ♻️ Caderno existente encontrado (ID: ${exam.id}). Atualizando...`);

        // 2. Limpeza idempotente de questões prévias do mesmo exame
        const deleted = await tx.bankQuestion.deleteMany({
          where: { examId: exam.id },
        });
        if (deleted.count > 0) {
          console.log(`   🧹 ${deleted.count} questões legadas removidas para reinserção limpa.`);
        }
      }

      // 3. Inserção em lote das questões extraídas
      const questionsData = questions.map((q) => ({
        examId: exam.id,
        numeroQuestao: q.numeroQuestao ?? null,
        disciplina: q.disciplina,
        topico: q.topico ?? null,
        enunciado: q.enunciado,
        tipo: q.tipo,
        alternativas: q.alternativas as unknown as Prisma.InputJsonValue,
        gabarito: q.gabarito,
        anulada: false,
        desatualizada: false,
        justificativa: q.justificativa ?? null,
        difficultyEstimate: q.difficultyEstimate ?? 3.0,
      }));

      await tx.bankQuestion.createMany({
        data: questionsData,
      });

      return {
        examId: exam.id,
        totalInserted: questionsData.length,
      };
    });

    console.log(`   ✅ Persistência concluída com sucesso!`);
    console.log(`   📌 Exame ID: ${transactionResult.examId}`);
    console.log(`   📝 Total de Questões Inseridas: ${transactionResult.totalInserted}`);

    console.log("\n=============================================================================");
    console.log("🎉 INGESTÃO FINALIZADA COM SUCESSO!");
    console.log("=============================================================================\n");
  } catch (err) {
    console.error("\n❌ Falha durante o processo de ingestão:");
    console.error(err);
    process.exit(1);
  } finally {
    // Limpeza de arquivos temporários da Google AI File API
    if (filesToDelete.length > 0) {
      for (const fileName of filesToDelete) {
        try {
          await ai.files.delete({ name: fileName });
        } catch {
          // Falha silenciosa de deleção remota se já expirado
        }
      }
    }
    await prisma.$disconnect();
  }
}

// Execução direta via CLI
if (require.main === module || process.argv[1]?.includes("ingest-exam-pdf")) {
  main().catch((err) => {
    console.error("❌ Erro fatal não tratado:", err);
    process.exit(1);
  });
}
