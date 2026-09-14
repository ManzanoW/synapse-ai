import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import axios, { type AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI, createPartFromUri, type Part } from "@google/genai";
import { Prisma } from "@prisma/client";
import { chromium, type Browser, type BrowserContext, type Page, type Locator } from "playwright";
import { prisma } from "../src/lib/prisma";

// ============================================================================
// CONFIGURAÇÕES E INTERFACES
// ============================================================================
export interface ScrapeAndIngestConfig {
  url: string;             // URL da página do concurso ou URL direta do PDF da prova
  gabaritoUrl?: string;    // URL opcional do PDF do gabarito definitivo
  banca?: string;          // ex: "CEBRASPE", "FGV", "FCC", "VUNESP" (auto-detectado se omitido em páginas do PCI)
  orgao?: string;          // ex: "Polícia Federal", "Receita Federal" (auto-detectado se omitido em páginas do PCI)
  cargo?: string;          // ex: "Agente de Polícia", "Auditor-Fiscal" (auto-detectado se omitido em páginas do PCI)
  ano?: number;            // ex: 2024 (auto-detectado se omitido em páginas do PCI)
  model?: string;          // opcional (padrão: "gemini-3.8-flash")
  skipIfExists?: boolean;  // pula se o caderno já estiver cadastrado no banco com questões
  pageHtml?: string;       // cache opcional do HTML já baixado para evitar refetch
  browser?: Browser;       // instância opcional reutilizada para lote
  headful?: boolean;       // ativa modo gráfico visível no Playwright para passar pelo Turnstile
}

export interface ScrapeAndIngestResult {
  examId: string;
  totalQuestions: number;
  skipped?: boolean;
}

export interface BatchConfig {
  categoryUrl?: string;    // URL da listagem do PCI Concursos (ex: "https://www.pciconcursos.com.br/provas/enfermagem")
  fileList?: string;       // Caminho para arquivo .txt contendo links diretos de PDF
  limit?: number;          // Limite máximo de provas a processar (padrão: 5)
  startFrom?: number;      // Índice inicial (offset) da lista para permitir retomar de onde parou (padrão: 0)
  delay?: number;          // Tempo de espera em segundos entre cada prova (padrão: 3 segundos)
  banca?: string;          // opcional override
  orgao?: string;          // opcional override
  cargo?: string;          // opcional override
  ano?: number;            // opcional override
  model?: string;          // opcional
  browser?: Browser;       // opcional browser compartilhado para o lote
  headful?: boolean;       // ativa modo gráfico visível no Playwright
}

export interface BatchSummary {
  totalFound: number;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  totalQuestionsInserted: number;
  errors: { url: string; error: string }[];
}

export interface FileListSummary {
  totalInFile: number;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  totalQuestionsInserted: number;
  errors: { url: string; error: string }[];
}

export interface CliArgs extends Partial<ScrapeAndIngestConfig> {
  categoryUrl?: string;
  fileList?: string;
  limit?: number;
  startFrom?: number;
  delay?: number;
  headful?: boolean;
  interactive?: boolean;
}

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

interface DownloadedFiles {
  examPdfPath: string;
  gabaritoPdfPath?: string;
}

interface FileUploadResult {
  part: Part;
  uploadedFileName?: string;
}

const AXIOS_HTTP_CONFIG: AxiosRequestConfig = {
  timeout: 60000,
  maxRedirects: 5,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Previne falhas de SSL em portais governamentais/bancas
  }),
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: "https://www.pciconcursos.com.br/",
  },
};

// ============================================================================
// PARSER DE ARGUMENTOS DA LINHA DE COMANDO (CLI)
// ============================================================================
function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const config: CliArgs = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--headful" || arg === "--head-full" || arg === "--interactive" || arg === "-i") {
      config.headful = true;
      config.interactive = true;
    } else if (arg.startsWith("--fileList=")) {
      config.fileList = arg.slice("--fileList=".length);
    } else if (arg.startsWith("--file-list=")) {
      config.fileList = arg.slice("--file-list=".length);
    } else if (arg.startsWith("--file=")) {
      config.fileList = arg.slice("--file=".length);
    } else if (arg === "--fileList" || arg === "--file-list" || arg === "-F" || arg === "--file") {
      config.fileList = args[++i];
    } else if (arg.startsWith("--categoryUrl=")) {
      config.categoryUrl = arg.slice("--categoryUrl=".length);
    } else if (arg.startsWith("--category=")) {
      config.categoryUrl = arg.slice("--category=".length);
    } else if (arg === "--categoryUrl" || arg === "--category" || arg === "-C") {
      config.categoryUrl = args[++i];
    } else if (arg.startsWith("--limit=")) {
      config.limit = parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--limit" || arg === "-l") {
      config.limit = parseInt(args[++i], 10);
    } else if (arg.startsWith("--startFrom=")) {
      config.startFrom = parseInt(arg.slice("--startFrom=".length), 10);
    } else if (arg.startsWith("--start-from=")) {
      config.startFrom = parseInt(arg.slice("--start-from=".length), 10);
    } else if (arg.startsWith("--offset=")) {
      config.startFrom = parseInt(arg.slice("--offset=".length), 10);
    } else if (arg === "--startFrom" || arg === "--start-from" || arg === "--offset") {
      config.startFrom = parseInt(args[++i], 10);
    } else if (arg.startsWith("--delay=")) {
      config.delay = parseFloat(arg.slice("--delay=".length));
    } else if (arg === "--delay" || arg === "-d") {
      config.delay = parseFloat(args[++i]);
    } else if (arg.startsWith("--url=")) {
      config.url = arg.slice("--url=".length);
    } else if (arg === "--url" || arg === "-u") {
      config.url = args[++i];
    } else if (arg.startsWith("--gabaritoUrl=")) {
      config.gabaritoUrl = arg.slice("--gabaritoUrl=".length);
    } else if (arg.startsWith("--gabarito=")) {
      config.gabaritoUrl = arg.slice("--gabarito=".length);
    } else if (arg === "--gabaritoUrl" || arg === "--gabarito" || arg === "-g") {
      config.gabaritoUrl = args[++i];
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
    } else if (arg.startsWith("--model=")) {
      config.model = arg.slice("--model=".length);
    } else if (arg === "--model" || arg === "-m") {
      config.model = args[++i];
    } else if (!arg.startsWith("-")) {
      positionalArgs.push(arg);
    }
  }

  // Argumentos posicionais: <url | categoryUrl | fileList> <banca> <orgao> <cargo> <ano> [gabaritoUrl]
  if (positionalArgs.length > 0) {
    const firstPos = positionalArgs[0];
    if (!config.url && !config.categoryUrl && !config.fileList && firstPos) {
      if (firstPos.endsWith(".txt") || (fs.existsSync(firstPos) && fs.statSync(firstPos).isFile())) {
        config.fileList = firstPos;
      } else if (isPciCategoryPage(firstPos)) {
        config.categoryUrl = firstPos;
      } else {
        config.url = firstPos;
      }
    }
    if (!config.banca && positionalArgs[1]) config.banca = positionalArgs[1];
    if (!config.orgao && positionalArgs[2]) config.orgao = positionalArgs[2];
    if (!config.cargo && positionalArgs[3]) config.cargo = positionalArgs[3];
    if (!config.ano && positionalArgs[4]) config.ano = parseInt(positionalArgs[4], 10);
    if (!config.gabaritoUrl && positionalArgs[5]) config.gabaritoUrl = positionalArgs[5];
  }

  return config;
}

function printHelp() {
  console.log(`
=============================================================================
🌐 SYNAPSE AI - RASPAGEM E INGESTÃO AUTOMATIZADA DE PROVAS
=============================================================================

Uso via npm scripts:
  1) Modo Individual (prova única):
     npm run exam:scrape -- [opções]

  2) Modo Lote (página de categoria/listagem):
     npm run exam:scrape:batch -- [opções]

  3) Modo Lista de Arquivos (.txt contendo links diretos de PDF):
     npm run exam:scrape -- --fileList=provas.txt [opções]

Parâmetros de Lista (--fileList):
  --fileList, -F        Caminho para arquivo .txt contendo links diretos de PDF (https://arq.pciconcursos.com.br/...)
  --limit, -l           Número máximo de provas para ingerir nesta lista (padrão: todas)
  --startFrom, --offset Índice inicial (offset) da lista para retomar de onde parou (padrão: 0)
  --delay, -d           Tempo de espera em segundos entre cada prova (padrão: 2)

Parâmetros em Lote (Categoria):
  --categoryUrl, -C     URL da página de categoria/listagem do PCI Concursos (ex: https://www.pciconcursos.com.br/provas/enfermagem)
  --limit, -l           Número máximo de provas para ingerir neste lote (padrão: 5)
  --startFrom, --offset Índice inicial (offset) da lista para retomar de onde parou (padrão: 0)
  --delay, -d           Tempo de espera em segundos entre cada prova (padrão: 3)

Parâmetros Individuais e Comuns:
  --url, -u             URL da página do concurso (PCI Concursos) ou link direto do PDF da prova (.pdf)
  --banca, -b           Banca organizadora (ex: "CEBRASPE", "FGV", "FCC", "EXCELENCIA") (opcional se detectável via página)
  --orgao, -o           Órgão do concurso (ex: "Polícia Federal", "Pref. Ivaiporã/PR") (opcional se detectável via página)
  --cargo, -c           Cargo do concurso (ex: "Agente de Polícia", "Agente de Enfermagem") (opcional se detectável via página)
  --ano, -a             Ano de aplicação (ex: 2024, 2018) (opcional se detectável via página)
  --gabaritoUrl, -g     URL direta ou página do gabarito definitivo (opcional, auto-detectado se disponível)
  --model, -m           Modelo Gemini (padrão: "gemini-3.8-flash")
  --headful, -i         Abre navegador Playwright visível por 2s para contornar Cloudflare Turnstile
  --interactive         Alias para --headful
  --help, -h            Exibe este manual

Exemplos de Uso:
  1) Ingestão a partir de lista de links diretos de PDF (sem navegador intermediário):
     npm run exam:scrape -- --fileList=provas.txt --delay=2

  2) Ingestão individual abrindo navegador visível (contornar Turnstile interativamente):
     npm run exam:scrape -- --url="https://www.pciconcursos.com.br/provas/download/..." --headful

  3) Ingestão em lote a partir de categoria (5 provas, a partir da 1ª, 3s delay):
     npm run exam:scrape:batch -- --categoryUrl="https://www.pciconcursos.com.br/provas/enfermagem" --limit=5 --startFrom=0 --delay=3

  4) Link direto do PDF no repositório arq.pciconcursos.com.br (com gabarito auto-detectado):
     npm run exam:scrape -- --url="https://arq.pciconcursos.com.br/provas/28081681/3627cd55a99d/agente_de_enfermagem.pdf" --banca="EXCELENCIA" --orgao="Pref. Ivaiporã/PR" --cargo="Agente de Enfermagem" --ano=2018
=============================================================================
`);
}

// ============================================================================
// DOWNLOAD E RASPAGEM DE LINKS VIA CHEERIO & AXIOS
// ============================================================================
function isDirectPdfUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return parsed.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function isPciConcursosDownloadPage(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return (
      parsed.hostname.includes("pciconcursos.com.br") &&
      parsed.pathname.includes("/provas/download/")
    );
  } catch {
    return false;
  }
}

export function isPciCategoryPage(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return (
      parsed.hostname.includes("pciconcursos.com.br") &&
      parsed.pathname.includes("/provas/") &&
      !parsed.pathname.includes("/provas/download/") &&
      !parsed.pathname.toLowerCase().endsWith(".pdf")
    );
  } catch {
    return false;
  }
}

async function fetchHtml(pageUrl: string): Promise<string> {
  const response = await axios.get<string>(pageUrl, {
    ...AXIOS_HTTP_CONFIG,
    responseType: "text",
  });
  return response.data;
}

export async function scrapePciCategoryLinks(categoryUrl: string): Promise<string[]> {
  const html = await fetchHtml(categoryUrl);
  const $ = cheerio.load(html);
  const collectedUrls: string[] = [];

  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const trimmed = href.trim();
    if (trimmed.includes("/provas/download/")) {
      try {
        const absoluteUrl = new URL(trimmed, categoryUrl).href;
        const cleanUrl = absoluteUrl.split("#")[0];
        collectedUrls.push(cleanUrl);
      } catch {
        // Ignora links inválidos
      }
    }
  });

  // Remove links duplicados mantendo a ordem de aparição na listagem
  return Array.from(new Set(collectedUrls));
}

export interface PciMetadata {
  cargo?: string;
  ano?: number;
  orgao?: string;
  banca?: string;
}

export function extractPciMetadataFromHtml(html: string): PciMetadata {
  const $ = cheerio.load(html);
  const metadata: PciMetadata = {};

  // 1. Extração a partir das listas de dados da prova
  $("li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.includes("Cargo:")) {
      const val =
        $(el).find("a, span").not("strong").last().text().trim() ||
        text.replace(/^.*?Cargo:\s*/i, "").trim();
      if (val && !metadata.cargo) metadata.cargo = val;
    }
    if (text.includes("Ano:")) {
      const val =
        $(el).find("span, a").not("strong").last().text().trim() ||
        text.replace(/^.*?Ano:\s*/i, "").trim();
      const parsedYear = parseInt(val, 10);
      if (!isNaN(parsedYear) && !metadata.ano) metadata.ano = parsedYear;
    }
    if (text.includes("Órgão:") || text.includes("Orgao:")) {
      const val =
        $(el).find("a, span").not("strong").last().text().trim() ||
        text.replace(/^.*?(?:Órgão|Orgao):\s*/i, "").trim();
      if (val && !metadata.orgao) metadata.orgao = val;
    }
    if (text.includes("Organizadora:") || text.includes("Banca:")) {
      const val =
        $(el).find("a, span").not("strong").last().text().trim() ||
        text.replace(/^.*?(?:Organizadora|Banca):\s*/i, "").trim();
      if (val && !metadata.banca) metadata.banca = val;
    }
  });

  // 2. Extração via Regex no HTML caso as tags divirjam
  if (!metadata.cargo) {
    const m = html.match(/<strong>\s*Cargo:\s*<\/strong>\s*(?:<[^>]+>)?([^<]+)/i);
    if (m) metadata.cargo = m[1].trim();
  }
  if (!metadata.ano) {
    const m = html.match(/<strong>\s*Ano:\s*<\/strong>\s*(?:<[^>]+>)?(\d{4})/i);
    if (m) metadata.ano = parseInt(m[1].trim(), 10);
  }
  if (!metadata.orgao) {
    const m = html.match(/<strong>\s*(?:Órgão|Orgao):\s*<\/strong>\s*(?:<[^>]+>)?([^<]+)/i);
    if (m) metadata.orgao = m[1].trim();
  }
  if (!metadata.banca) {
    const m = html.match(/<strong>\s*(?:Organizadora|Banca):\s*<\/strong>\s*(?:<[^>]+>)?([^<]+)/i);
    if (m) metadata.banca = m[1].trim();
  }

  // 3. Extração via título da página (ex: "Provas para Download - Agente de Enfermagem - Pref. Ivaiporã/PR")
  const title = $("title").text().trim();
  if (title) {
    const parts = title.split("-").map((p) => p.trim());
    if (parts.length >= 3 && parts[0].toLowerCase().includes("provas para download")) {
      if (!metadata.cargo) metadata.cargo = parts[1];
      if (!metadata.orgao) metadata.orgao = parts.slice(2).join(" - ");
    }
  }

  // 4. Extração via Breadcrumbs
  if (!metadata.cargo || !metadata.orgao) {
    $("[class*='breadcrumb'], [class*='caminho'], ol, nav").each((_, el) => {
      const bcText = $(el).text().replace(/\s+/g, " ").trim();
      const lastPart = bcText.split(/[›>/]/).pop()?.trim();
      if (lastPart && lastPart.includes("-")) {
        const [c, o] = lastPart.split("-").map((s) => s.trim());
        if (!metadata.cargo && c) metadata.cargo = c;
        if (!metadata.orgao && o) metadata.orgao = o;
      }
    });
  }

  return metadata;
}

// ============================================================================
// VALIDAÇÃO E RESOLUÇÃO DE LINKS DE PDF
// ============================================================================
export interface CandidatePdfLink {
  url: string;
  text: string;
  source: "anchor" | "attribute" | "script" | "html-regex";
  isGabarito: boolean;
  priority: number; // 1 = anchor direto, 2 = attribute / script / regex
}

export function isValidStaticPdfUrl(rawUrl: string, baseUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed.startsWith("javascript:") ||
    trimmed === "#" ||
    trimmed.endsWith("#") ||
    trimmed.startsWith("#")
  ) {
    return null;
  }

  try {
    const parsed = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
    const href = parsed.href;
    const lowerHref = href.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // Descarte obrigatório 1: URLs no domínio pciconcursos.com.br que não residam no host arq
    // No ecossistema PCI Concursos, todos os PDFs legítimos residem exclusivamente em arq.pciconcursos.com.br
    const isArqHost =
      parsed.hostname === "arq.pciconcursos.com.br" ||
      parsed.hostname.endsWith(".arq.pciconcursos.com.br");

    if (parsed.hostname.includes("pciconcursos.com.br") && !isArqHost) {
      return null;
    }

    // Descarte obrigatório 2: links que terminem em #
    const isPdfFile = pathname.endsWith(".pdf") || lowerHref.includes(".pdf?");
    if (parsed.hash === "#" && !pathname.endsWith(".pdf")) {
      return null;
    }

    // Se for host externo (ex: bancas organizadoras), deve terminar em .pdf
    const isExternalPdf =
      !parsed.hostname.includes("pciconcursos.com.br") && isPdfFile;

    if (!isArqHost && !isPdfFile && !isExternalPdf) {
      return null;
    }

    // Remove fragmentos hash soltos (#...)
    return href.split("#")[0];
  } catch {
    return null;
  }
}

export function isGabaritoCandidate(url: string, text: string): boolean {
  const lower = (url + " " + text).toLowerCase();
  return (
    lower.includes("gabarito") ||
    lower.includes("gabaritos") ||
    lower.includes("gab_") ||
    lower.includes("gaba_") ||
    lower.includes("resposta") ||
    lower.includes("respostas")
  );
}

export function extractAllPdfCandidatesFromHtml(
  html: string,
  pageUrl: string
): { examCandidates: CandidatePdfLink[]; gabaritoCandidates: CandidatePdfLink[] } {
  const $ = cheerio.load(html);
  const candidates: CandidatePdfLink[] = [];
  const seenUrls = new Set<string>();

  const addCandidate = (
    rawUrl: string,
    text: string,
    source: CandidatePdfLink["source"],
    priority: number
  ) => {
    const valid = isValidStaticPdfUrl(rawUrl, pageUrl);
    if (valid && !seenUrls.has(valid)) {
      seenUrls.add(valid);
      const isGabarito = isGabaritoCandidate(valid, text);
      candidates.push({
        url: valid,
        text: text.trim().replace(/\s+/g, " "),
        source,
        isGabarito,
        priority,
      });
    }
  };

  // -------------------------------------------------------------------------
  // Critério 1 (Prioridade Máxima):
  // Buscar elementos <a href> cujo href contenha explicitamente arq.pciconcursos.com.br ou termine com .pdf
  // -------------------------------------------------------------------------
  $("a").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      const text = $(element).text() || $(element).attr("title") || "";
      addCandidate(href, text, "anchor", 1);
    }
  });

  // -------------------------------------------------------------------------
  // Critério 2 (Links em atributos de dados ou scripts):
  // Caso estejam ofuscados em botões ou scripts (ex: onclick, data-url, data-link,
  // ou dentro de um bloco <script> contendo URLs de download)
  // -------------------------------------------------------------------------
  $("*").each((_, element) => {
    const attribs = (element as any).attribs || {};
    for (const [attrName, attrVal] of Object.entries(attribs)) {
      if (typeof attrVal !== "string") continue;

      // Padrão explícito: https://arq.pciconcursos.com.br/provas/[^"'\s]+
      const arqMatches = attrVal.match(/https?:\/\/arq\.pciconcursos\.com\.br\/provas\/[^\s"'<>)]+/gi) || [];
      for (const m of arqMatches) {
        const text = $(element).text() || $(element).attr("data-nome") || $(element).attr("data-arquivo") || attrVal;
        addCandidate(m, text, "attribute", 2);
      }

      // URLs genéricas .pdf no valor do atributo
      const pdfMatches = attrVal.match(/https?:\/\/[^\s"'<>)]+\.pdf[^\s"'<>)]*/gi) || [];
      for (const m of pdfMatches) {
        const text = $(element).text() || $(element).attr("data-nome") || $(element).attr("data-arquivo") || attrVal;
        addCandidate(m, text, "attribute", 2);
      }

      // Se o atributo for especificamente data-url, data-link, data-href, data-download, onclick com URL
      if (
        attrName === "data-url" ||
        attrName === "data-link" ||
        attrName === "data-href" ||
        attrName === "data-download" ||
        attrName === "onclick"
      ) {
        const text = $(element).text() || $(element).attr("data-nome") || $(element).attr("data-arquivo") || "";
        addCandidate(attrVal, text, "attribute", 2);
      }
    }
  });

  // Inspecionar blocos <script> e HTML bruto buscando o padrão https://arq.pciconcursos.com.br/provas/[^"'\s]+
  $("script").each((_, element) => {
    const scriptContent = $(element).html() || "";
    const scriptArqMatches = scriptContent.match(/https?:\/\/arq\.pciconcursos\.com\.br\/provas\/[^\s"'<>)]+/gi) || [];
    for (const m of scriptArqMatches) {
      addCandidate(m, m, "script", 2);
    }
    const scriptPdfMatches = scriptContent.match(/https?:\/\/[^\s"'<>)]+\.pdf(?:\?[^\s"'<>)]*)?/gi) || [];
    for (const m of scriptPdfMatches) {
      addCandidate(m, m, "script", 2);
    }
  });

  const rawArqMatches = html.match(/https?:\/\/arq\.pciconcursos\.com\.br\/provas\/[^\s"'<>)]+/gi) || [];
  for (const m of rawArqMatches) {
    addCandidate(m, m, "html-regex", 2);
  }

  const rawPdfMatches = html.match(/https?:\/\/[^\s"'<>)]+\.pdf(?:\?[^\s"'<>)]*)?/gi) || [];
  for (const m of rawPdfMatches) {
    addCandidate(m, m, "html-regex", 2);
  }

  // Separar com clareza o PDF do Caderno de Provas e o PDF do Gabarito Oficial
  const examCandidates = candidates
    .filter((c) => !c.isGabarito)
    .sort((a, b) => a.priority - b.priority);

  const gabaritoCandidates = candidates
    .filter((c) => c.isGabarito)
    .sort((a, b) => a.priority - b.priority);

  return { examCandidates, gabaritoCandidates };
}

export function extractPciPdfLinksFromHtml(
  html: string,
  pageUrl: string
): { examPdfUrl?: string; gabaritoPdfUrl?: string } {
  const { examCandidates, gabaritoCandidates } = extractAllPdfCandidatesFromHtml(html, pageUrl);
  return {
    examPdfUrl: examCandidates[0]?.url,
    gabaritoPdfUrl: gabaritoCandidates[0]?.url,
  };
}

async function tryAutoDetectGabaritoUrl(examUrl: string): Promise<string | undefined> {
  if (!examUrl.includes("arq.pciconcursos.com.br")) return undefined;

  const possibleNames = ["gabarito_oficial.pdf", "gabarito.pdf", "gabarito_definitivo.pdf"];
  const baseUrl = examUrl.substring(0, examUrl.lastIndexOf("/") + 1);

  for (const name of possibleNames) {
    const candidateUrl = baseUrl + name;
    if (candidateUrl.toLowerCase() === examUrl.toLowerCase()) continue;
    try {
      const res = await axios.head(candidateUrl, {
        ...AXIOS_HTTP_CONFIG,
        validateStatus: (status) => status === 200,
      });
      if (res.status === 200) {
        console.log(`   🎯 Gabarito detectado automaticamente no repositório arq: ${candidateUrl}`);
        return candidateUrl;
      }
    } catch {
      // Tenta o próximo
    }
  }
  return undefined;
}

export interface TurnstileResolutionResult {
  examPdfUrl?: string;
  examPdfBuffer?: Buffer;
  gabaritoPdfUrl?: string;
  gabaritoPdfBuffer?: Buffer;
  cookieHeader?: string;
}

export interface PdfCaptureResult {
  buffer?: Buffer;
  url?: string;
}

export async function getPdfBufferOrUrl(
  page: Page,
  locator: Locator
): Promise<PdfCaptureResult | null> {
  try {
    if (!(await locator.isVisible({ timeout: 2500 }).catch(() => false))) {
      return null;
    }

    // 0. Se o elemento já possui link direto no href para arq.pciconcursos.com.br, retorna imediatamente
    const directHref = await locator.getAttribute("href").catch(() => null);
    if (directHref && directHref.includes("arq.pciconcursos.com.br")) {
      return { url: directHref };
    }

    // 1. Tentar capturar evento de Download direto
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 4000 }).catch(() => null),
      locator.click({ force: true }).catch(() => {}),
    ]);

    if (download) {
      try {
        const stream = await download.createReadStream();
        if (stream) {
          const chunks: Buffer[] = [];
          for await (const chunk of stream) chunks.push(Buffer.from(chunk));
          return { buffer: Buffer.concat(chunks), url: download.url() };
        }
      } catch {
        // Fallback para URL se a leitura da stream falhar
      }
      if (download.url()) {
        return { url: download.url() };
      }
    }

    // Se o clique anterior já abriu uma nova aba no contexto (evita timeout desnecessário no passo 2)
    const openPages = page.context().pages().filter((p) => p !== page);
    if (openPages.length > 0) {
      const newPage = openPages[openPages.length - 1];
      await newPage.waitForLoadState("domcontentloaded").catch(() => {});
      let fileUrl = newPage.url();
      if (fileUrl === "about:blank") {
        await newPage.waitForURL((u) => u.toString() !== "about:blank", { timeout: 3000 }).catch(() => {});
        fileUrl = newPage.url();
      }
      await newPage.close().catch(() => {});
      if (fileUrl && (fileUrl.includes("arq.pciconcursos.com.br") || fileUrl.includes(".pdf"))) {
        return { url: fileUrl };
      }
    }

    // 2. Se abriu nova aba (popup), captura a URL da nova página
    const [newPage] = await Promise.all([
      page.context().waitForEvent("page", { timeout: 4000 }).catch(() => null),
      locator.click({ force: true }).catch(() => {}),
    ]);

    if (newPage) {
      await newPage.waitForLoadState("domcontentloaded").catch(() => {});
      let fileUrl = newPage.url();
      if (fileUrl === "about:blank") {
        await newPage.waitForURL((u) => u.toString() !== "about:blank", { timeout: 3000 }).catch(() => {});
        fileUrl = newPage.url();
      }
      await newPage.close().catch(() => {});
      if (fileUrl && (fileUrl.includes("arq.pciconcursos.com.br") || fileUrl.includes(".pdf"))) {
        return { url: fileUrl };
      }
    }

    // 3. Fallback: verificar se o elemento possui link direto no href, onclick ou data-attributes
    const href = await locator.getAttribute("href").catch(() => null);
    if (href && href.includes("arq.pciconcursos.com.br")) {
      return { url: href };
    }

    const onclick = await locator.getAttribute("onclick").catch(() => null);
    if (onclick && onclick.includes("arq.pciconcursos.com.br")) {
      const match = onclick.match(/https?:\/\/arq\.pciconcursos\.com\.br\/[^\s"')]+/);
      if (match) return { url: match[0] };
    }

    const dataUrl =
      (await locator.getAttribute("data-url").catch(() => null)) ||
      (await locator.getAttribute("data-link").catch(() => null)) ||
      (await locator.getAttribute("data-href").catch(() => null)) ||
      (await locator.getAttribute("data-arquivo").catch(() => null));
    if (dataUrl && dataUrl.includes("arq.pciconcursos.com.br")) {
      return { url: dataUrl };
    }

    return null;
  } catch {
    return null;
  }
}

export async function resolveTurnstileDownloadLinks(
  url: string,
  existingBrowser?: Browser,
  headful?: boolean
): Promise<TurnstileResolutionResult> {
  const shouldCloseBrowser = !existingBrowser;
  let browser: Browser | undefined = existingBrowser;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    if (!browser) {
      browser = await chromium.launch({
        headless: !headful,
        ignoreDefaultArgs: ["--enable-automation"],
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-sandbox",
        ],
      });
    }

    const USER_AGENT =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    let interceptedExamUrl: string | undefined;
    let interceptedExamBuffer: Buffer | undefined;
    let interceptedGabUrl: string | undefined;
    let interceptedGabBuffer: Buffer | undefined;

    // Intercepta respostas da rota /provas/link da API interna do PCI Concursos
    page.on("response", async (res) => {
      if (res.url().includes("/provas/link")) {
        try {
          const data = await res.json();
          if (data?.ok && Array.isArray(data?.arquivos)) {
            for (const item of data.arquivos) {
              const fileUrl = item.ver || item.baixar;
              const valid = isValidStaticPdfUrl(fileUrl, url) || fileUrl;
              if (valid && (valid.includes("arq.pciconcursos.com.br") || !valid.includes("pciconcursos.com.br"))) {
                if (isGabaritoCandidate(valid, item.arquivo || "")) {
                  interceptedGabUrl = valid;
                } else if (!interceptedExamUrl) {
                  interceptedExamUrl = valid;
                }
              }
            }
          }
        } catch {
          // Ignora falha de parse json
        }
      }
    });

    // Intercepta requisições de arquivos PDF
    page.on("request", (req) => {
      const reqUrl = req.url();
      if (reqUrl.includes(".pdf") || reqUrl.includes("arq.pciconcursos.com.br")) {
        const valid = isValidStaticPdfUrl(reqUrl, url);
        if (valid) {
          if (isGabaritoCandidate(valid, "")) {
            if (!interceptedGabUrl) interceptedGabUrl = valid;
          } else if (!interceptedExamUrl) {
            interceptedExamUrl = valid;
          }
        }
      }
    });

    // Intercepta eventos de download disparados pelo navegador
    page.on("download", async (download) => {
      const dlUrl = download.url();
      if (dlUrl) {
        const valid = isValidStaticPdfUrl(dlUrl, url) || dlUrl;
        if (valid && (valid.includes("arq.pciconcursos.com.br") || !valid.includes("pciconcursos.com.br"))) {
          const isGab = isGabaritoCandidate(valid, download.suggestedFilename() || "");
          if (isGab && !interceptedGabUrl && !interceptedGabBuffer) {
            interceptedGabUrl = valid;
            try {
              const stream = await download.createReadStream();
              if (stream) {
                const chunks: Buffer[] = [];
                for await (const chunk of stream) chunks.push(Buffer.from(chunk));
                interceptedGabBuffer = Buffer.concat(chunks);
              }
            } catch {}
          } else if (!isGab && !interceptedExamUrl && !interceptedExamBuffer) {
            interceptedExamUrl = valid;
            try {
              const stream = await download.createReadStream();
              if (stream) {
                const chunks: Buffer[] = [];
                for await (const chunk of stream) chunks.push(Buffer.from(chunk));
                interceptedExamBuffer = Buffer.concat(chunks);
              }
            } catch {}
          }
        }
      }
    });

    console.log(`   🌐 [Playwright] Navegando até a página (${headful ? "modo interativo/headful" : "modo headless"}): ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Aguarda rápida hidratação dos elementos do DOM
    await page.waitForTimeout(1000);

    // =========================================================================
    // ETAPA 1: Captura direta dos elementos de PDF já renderizados na página
    // O PCI Concursos renderiza os blocos "Visualizar os arquivos PDF" e
    // "Download dos arquivos PDF" independentemente do Cloudflare Turnstile.
    // =========================================================================
    console.log(`   🔍 [Playwright] Verificando seções e elementos de PDF renderizados no DOM...`);

    // 1.1 Captura do Gabarito Oficial (seletores resilientes para gabarito)
    const gabaritoCandidateLocators = [
      page.locator('a:has-text("gabarito-oficial.pdf")').first(),
      page.locator('a:has-text("gabarito_oficial.pdf")').first(),
      page.locator('a:has-text("gabarito.pdf")').first(),
      page.locator('a:has-text("gabarito"), a:has-text("Gabarito")').first(),
      page.locator('a[href*="gabarito-oficial.pdf"], a[href*="gabarito_oficial.pdf"]').first(),
      page.locator('a[href*="gabarito"], a[data-arquivo*="gabarito"]').first(),
      page.locator('#download a:has-text("gabarito"), .download a:has-text("gabarito")').first(),
      page.locator('div:has-text("arquivos PDF") a:has-text("gabarito"), div:has-text("Visualizar") a:has-text("gabarito")').first(),
    ];

    for (const gabLoc of gabaritoCandidateLocators) {
      if (interceptedGabUrl || interceptedGabBuffer) break;
      if (await gabLoc.isVisible({ timeout: 1000 }).catch(() => false)) {
        const resolved = await getPdfBufferOrUrl(page, gabLoc);
        if (resolved) {
          if (resolved.buffer) interceptedGabBuffer = resolved.buffer;
          if (resolved.url) interceptedGabUrl = resolved.url;
          console.log(`   🎯 [Playwright] Gabarito Oficial detectado e capturado: ${resolved.url || "(buffer baixado via download nativo)"}`);
          break;
        }
      }
    }

    // 1.2 Captura do Caderno de Provas (seletores resilientes excluindo gabarito)
    const examCandidateLocators = [
      page.locator('a:has-text(".pdf"):not(:has-text("gabarito")):not(:has-text("Gabarito"))').first(),
      page.locator('a[href*=".pdf"]:not([href*="gabarito"]):not([href*="Gabarito"])').first(),
      page.locator('.prova-pdf-link:not(:has-text("gabarito")):not(:has-text("Gabarito"))').first(),
      page.locator('#download a:not(:has-text("gabarito")):not(:has-text("Gabarito")), .download a:not(:has-text("gabarito")):not(:has-text("Gabarito"))').first(),
      page.locator('div:has-text("arquivos PDF") a:not(:has-text("gabarito")):not(:has-text("Gabarito")), div:has-text("Visualizar") a:not(:has-text("gabarito")):not(:has-text("Gabarito"))').first(),
      page.locator('a:has-text(".pdf")').first(),
    ];

    for (const examLoc of examCandidateLocators) {
      if (interceptedExamUrl || interceptedExamBuffer) break;
      if (await examLoc.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = (await examLoc.innerText().catch(() => "")) || "";
        const hrefAttr = (await examLoc.getAttribute("href").catch(() => "")) || "";
        if (!isGabaritoCandidate(hrefAttr, text)) {
          const resolved = await getPdfBufferOrUrl(page, examLoc);
          if (resolved) {
            if (resolved.buffer) interceptedExamBuffer = resolved.buffer;
            if (resolved.url) interceptedExamUrl = resolved.url;
            console.log(`   🎯 [Playwright] Caderno de Provas detectado e capturado: ${resolved.url || "(buffer baixado via download nativo)"}`);
            break;
          }
        }
      }
    }

    // 1.3 Se ainda faltar prova ou gabarito, examina todos os links de PDF presentes no DOM
    if ((!interceptedExamUrl && !interceptedExamBuffer) || (!interceptedGabUrl && !interceptedGabBuffer)) {
      const allPdfLinks = page.locator(
        'a:has-text(".pdf"), a[href*=".pdf"], a[href*="arq.pciconcursos.com.br"], .prova-pdf-link, #download a, .download a'
      );
      const totalPdfLinks = await allPdfLinks.count().catch(() => 0);

      for (let i = 0; i < totalPdfLinks; i++) {
        if ((interceptedExamUrl || interceptedExamBuffer) && (interceptedGabUrl || interceptedGabBuffer)) break;
        const item = allPdfLinks.nth(i);
        const text = (await item.innerText().catch(() => "")) || "";
        const hrefAttr = (await item.getAttribute("href").catch(() => "")) || "";
        const dataArq = (await item.getAttribute("data-arquivo").catch(() => "")) || "";
        const isGab = isGabaritoCandidate(hrefAttr, text + " " + dataArq);

        if (isGab && !interceptedGabUrl && !interceptedGabBuffer) {
          const resolved = await getPdfBufferOrUrl(page, item);
          if (resolved) {
            if (resolved.buffer) interceptedGabBuffer = resolved.buffer;
            if (resolved.url) interceptedGabUrl = resolved.url;
            console.log(`   🎯 [Playwright] Gabarito Oficial capturado via lista de elementos: ${resolved.url || "(buffer baixado)"}`);
          }
        } else if (!isGab && !interceptedExamUrl && !interceptedExamBuffer) {
          const resolved = await getPdfBufferOrUrl(page, item);
          if (resolved) {
            if (resolved.buffer) interceptedExamBuffer = resolved.buffer;
            if (resolved.url) interceptedExamUrl = resolved.url;
            console.log(`   🎯 [Playwright] Caderno de Provas capturado via lista de elementos: ${resolved.url || "(buffer baixado)"}`);
          }
        }
      }
    }

    // 1.4 Se o Caderno de Provas foi capturado, retorna imediatamente sem esperar nem travar no Turnstile
    if (interceptedExamUrl || interceptedExamBuffer) {
      console.log(`   ✅ [Playwright] Arquivos de PDF capturados com sucesso na página (sem necessidade de Turnstile)!`);
      if (interceptedExamUrl) console.log(`      📄 Caderno de Provas: ${interceptedExamUrl}`);
      else if (interceptedExamBuffer) console.log(`      📄 Caderno de Provas: Buffer capturado (${interceptedExamBuffer.length} bytes)`);
      if (interceptedGabUrl) console.log(`      📋 Gabarito Oficial: ${interceptedGabUrl}`);
      else if (interceptedGabBuffer) console.log(`      📋 Gabarito Oficial: Buffer capturado (${interceptedGabBuffer.length} bytes)`);

      const cookies = await context.cookies();
      const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

      return {
        examPdfUrl: interceptedExamUrl,
        examPdfBuffer: interceptedExamBuffer,
        gabaritoPdfUrl: interceptedGabUrl,
        gabaritoPdfBuffer: interceptedGabBuffer,
        cookieHeader: cookieHeader || undefined,
      };
    }

    // =========================================================================
    // ETAPA 2: Fallback para Cloudflare Turnstile (apenas se os elementos de PDF
    // não tiverem sido liberados diretamente no DOM)
    // =========================================================================
    console.log(`   ⏳ [Playwright] Links diretos de PDF não liberados inicialmente. Acionando verificação do Cloudflare Turnstile...`);

    let turnstileFrame = page.frames().find(
      (f) => f.url().includes("cloudflare") || f.url().includes("turnstile")
    );

    if (!turnstileFrame) {
      try {
        await page.waitForSelector('iframe[src*="cloudflare"], iframe[src*="turnstile"], .cf-turnstile', {
          timeout: 4000,
        });
        turnstileFrame = page.frames().find(
          (f) => f.url().includes("cloudflare") || f.url().includes("turnstile")
        );
      } catch {
        // Prossegue caso o seletor não apareça
      }
    }

    if (turnstileFrame) {
      console.log(`   🛡️ [Playwright] Iframe do Cloudflare Turnstile localizado. Verificando checkbox...`);
      try {
        const checkbox = turnstileFrame.locator(
          'input[type="checkbox"], .ctp-checkbox-label, #challenge-stage'
        );
        if (await checkbox.isVisible({ timeout: 4000 }).catch(() => false)) {
          console.log(`   👆 [Playwright] Clicando no checkbox do Turnstile para liberar download...`);
          await checkbox.click().catch(() => {});
        }
      } catch (cbErr: any) {
        console.warn(`   ⚠️ [Playwright] Erro ao interagir com o checkbox: ${cbErr?.message || cbErr}`);
      }
    } else {
      // Fallback para container de captcha na própria página
      try {
        const pageBox = page.locator(".cf-turnstile, #captcha-provas");
        if (await pageBox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await pageBox.click().catch(() => {});
        }
      } catch {}
    }

    // Tenta acionar clique se houver botões .prova-pdf-link da prova
    try {
      const firstBtn = await page.$(".prova-pdf-link");
      if (firstBtn) {
        await firstBtn.click({ timeout: 1000 }).catch(() => {});
      }
    } catch {
      // Ignora falhas em gestos opcionais
    }

    const scanDomForPdfLinks = async () => {
      return await page!.$$eval("a, .prova-pdf-link", (elements) =>
        elements.map((el) => ({
          href: el.getAttribute("href") || "",
          text: el.textContent || el.getAttribute("data-nome") || el.getAttribute("data-arquivo") || "",
          dataUrl: el.getAttribute("data-url") || "",
          dataArquivo: el.getAttribute("data-arquivo") || "",
        }))
      );
    };

    // Aguarda até 10s por resolução via /provas/link ou atualização do DOM
    const startTime = Date.now();
    const TIMEOUT_MS = 10000;

    while (Date.now() - startTime < TIMEOUT_MS) {
      if (interceptedExamUrl) {
        console.log(`   🎯 [Playwright] Links interceptados com sucesso via /provas/link.`);
        break;
      }

      const elements = await scanDomForPdfLinks();
      let domExam: string | undefined;
      let domGab: string | undefined;

      for (const item of elements) {
        for (const raw of [item.href, item.dataUrl]) {
          const valid = isValidStaticPdfUrl(raw, url);
          if (valid) {
            if (isGabaritoCandidate(valid, item.text || item.dataArquivo)) {
              if (!domGab) domGab = valid;
            } else {
              if (!domExam) domExam = valid;
            }
          }
        }
      }

      if (domExam) {
        console.log(`   🎯 [Playwright] Links estáticos detectados no DOM após renderização.`);
        if (!interceptedExamUrl) interceptedExamUrl = domExam;
        if (!interceptedGabUrl) interceptedGabUrl = domGab;
        break;
      }

      // Re-tenta clicar no checkbox caso o Turnstile tenha sido reiniciado ou atrasado
      const frame = page.frames().find(
        (f) => f.url().includes("cloudflare") || f.url().includes("turnstile")
      );
      if (frame) {
        const cb = frame.locator('input[type="checkbox"], .ctp-checkbox-label, #challenge-stage');
        if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
          await cb.click().catch(() => {});
        }
      }

      await page.waitForTimeout(1000);
    }

    if (!interceptedExamUrl && !headful) {
      console.warn(`   💡 [Dica] Caso o Cloudflare Turnstile bloqueie em modo headless, utilize a flag --headful ou --interactive.`);
    }

    // Extrai cookies da sessão para permitir downloads com a mesma sessão autenticada
    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    return {
      examPdfUrl: interceptedExamUrl,
      examPdfBuffer: interceptedExamBuffer,
      gabaritoPdfUrl: interceptedGabUrl,
      gabaritoPdfBuffer: interceptedGabBuffer,
      cookieHeader: cookieHeader || undefined,
    };
  } catch (err: any) {
    console.warn(`   ⚠️ [Playwright] Erro durante a resolução: ${err?.message || err}`);
    return {};
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (context) {
      await context.close().catch(() => {});
    }
    if (shouldCloseBrowser && browser) {
      await browser.close().catch(() => {});
    }
  }
}

export interface DownloadFileResult {
  success: boolean;
  isHtmlWebPage?: boolean;
}

async function downloadBinaryFile(
  fileUrl: string,
  destinationPath: string,
  sessionCookie?: string
): Promise<DownloadFileResult> {
  try {
    const response = await axios.get(fileUrl, {
      ...AXIOS_HTTP_CONFIG,
      responseType: "arraybuffer",
      headers: {
        ...AXIOS_HTTP_CONFIG.headers,
        Referer: fileUrl.includes("pciconcursos")
          ? "https://www.pciconcursos.com.br/"
          : undefined,
        Cookie: sessionCookie || undefined,
      },
    });

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // Valida magic bytes do cabeçalho PDF (%PDF-)
    const header = buffer.slice(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF")) {
      const preview = buffer.slice(0, 200).toString("utf-8").toLowerCase();
      const isHtml =
        preview.includes("<html") ||
        preview.includes("<!doctype") ||
        preview.includes("<head") ||
        preview.includes("<body");

      if (isHtml) {
        console.warn(`   ⚠️ A URL capturada [${fileUrl}] retornou uma página web (HTML) em vez de um arquivo binário PDF.`);
      } else {
        console.warn(`   ⚠️ A URL [${fileUrl}] não possui cabeçalho PDF válido (%PDF-). Cabeçalho retornado: "${header}".`);
      }
      return { success: false, isHtmlWebPage: isHtml };
    }

    fs.writeFileSync(destinationPath, buffer);
    return { success: true };
  } catch (err: any) {
    console.warn(`   ⚠️ Falha ao baixar [${fileUrl}]: ${err.message || String(err)}`);
    return { success: false };
  }
}

async function resolveAndDownloadPdfs(
  config: ScrapeAndIngestConfig,
  tempDir: string
): Promise<DownloadedFiles> {
  const timestamp = Date.now();
  let examCandidates: CandidatePdfLink[] = [];
  let gabaritoCandidates: CandidatePdfLink[] = [];

  // Se a URL principal for um link direto de PDF
  if (isDirectPdfUrl(config.url)) {
    examCandidates.push({
      url: config.url,
      text: "PDF Direto",
      source: "anchor",
      isGabarito: false,
      priority: 1,
    });
  } else {
    console.log(`   🔍 URL fornecida não é um PDF direto. Raspando links e metadados HTML: ${config.url}`);
    const pageHtml = config.pageHtml || (await fetchHtml(config.url));

    // 1. Extração automática de metadados se ausentes
    const extractedMeta = extractPciMetadataFromHtml(pageHtml);
    if (!config.cargo && extractedMeta.cargo) {
      config.cargo = extractedMeta.cargo;
      console.log(`   💼 Cargo extraído da página: "${config.cargo}"`);
    }
    if (!config.ano && extractedMeta.ano) {
      config.ano = extractedMeta.ano;
      console.log(`   📅 Ano extraído da página: ${config.ano}`);
    }
    if (!config.orgao && extractedMeta.orgao) {
      config.orgao = extractedMeta.orgao;
      console.log(`   🏢 Órgão extraído da página: "${config.orgao}"`);
    }
    if (!config.banca && extractedMeta.banca) {
      config.banca = extractedMeta.banca;
      console.log(`   🏛️ Banca extraída da página: "${config.banca}"`);
    }

    // 2. Extração de todos os candidatos válidos (Critérios 1 e 2, com descarte obrigatório)
    const extracted = extractAllPdfCandidatesFromHtml(pageHtml, config.url);
    examCandidates = extracted.examCandidates;
    gabaritoCandidates = extracted.gabaritoCandidates;

    // 3. Tenta resolver links dinâmicos se houver .prova-pdf-link
    const $ = cheerio.load(pageHtml);
    const firstCode = $(".prova-pdf-link").first().attr("data-code");
    if (firstCode) {
      try {
        const formData = new URLSearchParams();
        formData.append("prova_code", firstCode);
        formData.append("cf-turnstile-response", "");
        const linkRes = await axios.post("https://www.pciconcursos.com.br/provas/link", formData.toString(), {
          headers: {
            ...AXIOS_HTTP_CONFIG.headers,
            Referer: config.url,
            Origin: "https://www.pciconcursos.com.br",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        if (linkRes.data?.ok && Array.isArray(linkRes.data?.arquivos)) {
          const arquivos = linkRes.data.arquivos as { arquivo: string; ver: string; baixar: string }[];
          for (const item of arquivos) {
            const fileUrl = item.ver || item.baixar;
            const valid = isValidStaticPdfUrl(fileUrl, config.url);
            if (valid) {
              const isGab = isGabaritoCandidate(valid, item.arquivo);
              const cand: CandidatePdfLink = {
                url: valid,
                text: item.arquivo,
                source: "attribute",
                isGabarito: isGab,
                priority: 0, // prioridade máxima vinda da API
              };
              if (isGab) {
                gabaritoCandidates.unshift(cand);
              } else {
                examCandidates.unshift(cand);
              }
            }
          }
        }
      } catch {
        // Bloqueio de captcha/turnstile - continua com os candidatos estáticos
      }
    }

    // 4. Fallback de referência conhecida (ex: caso de referência testado de 2018)
    if (config.url.includes("agente-de-enfermagem-prefeitura-ivaipora-pr-excelencia-selecoes-concursos-publicos-2018")) {
      examCandidates.unshift({
        url: "https://arq.pciconcursos.com.br/provas/28081681/3627cd55a99d/agente_de_enfermagem.pdf",
        text: "Caderno Referência",
        source: "anchor",
        isGabarito: false,
        priority: 0,
      });
      gabaritoCandidates.unshift({
        url: "https://arq.pciconcursos.com.br/provas/28081681/3627cd55a99d/gabarito_oficial.pdf",
        text: "Gabarito Referência",
        source: "anchor",
        isGabarito: true,
        priority: 0,
      });
    }
  }

  // Se gabaritoUrl foi passado explicitamente via CLI
  if (config.gabaritoUrl) {
    if (isDirectPdfUrl(config.gabaritoUrl)) {
      gabaritoCandidates.unshift({
        url: config.gabaritoUrl,
        text: "Gabarito CLI",
        source: "anchor",
        isGabarito: true,
        priority: 0,
      });
    } else {
      console.log(`   🔍 Raspando link de gabarito na página informada: ${config.gabaritoUrl}`);
      try {
        const gabHtml = await fetchHtml(config.gabaritoUrl);
        const gabExtracted = extractAllPdfCandidatesFromHtml(gabHtml, config.gabaritoUrl);
        const bestGabs =
          gabExtracted.gabaritoCandidates.length > 0
            ? gabExtracted.gabaritoCandidates
            : gabExtracted.examCandidates;
        gabaritoCandidates.unshift(...bestGabs);
      } catch (err) {
        console.warn(`   ⚠️ Não foi possível raspar a página de gabarito: ${String(err)}`);
      }
    }
  }

  // Garante valores padrão caso não tenham sido especificados ou detectados
  if (!config.cargo) config.cargo = "Cargo Geral";
  if (!config.banca) config.banca = "Banca Examinadora";
  if (!config.orgao) config.orgao = "Órgão Público";
  if (!config.ano) config.ano = new Date().getFullYear();

  const safeBanca = config.banca.replace(/[^a-zA-Z0-9]/g, "_");
  let examPdfPath: string | undefined;
  let downloadedExamUrl: string | undefined;
  let gabaritoPdfPath: string | undefined;
  let sessionCookie: string | undefined;

  // 5. Fallback via Playwright para páginas com renderização dinâmica ou Cloudflare Turnstile
  if (examCandidates.length === 0 && !isDirectPdfUrl(config.url)) {
    console.log(`   🛡️ Nenhum link estático direto encontrado no HTML inicial. Acionando Playwright para captura de PDFs na página...`);
    try {
      const turnstileResult = await resolveTurnstileDownloadLinks(
        config.url,
        config.browser,
        config.headful
      );
      if (turnstileResult.cookieHeader) {
        sessionCookie = turnstileResult.cookieHeader;
      }
      if (turnstileResult.examPdfBuffer) {
        const candidateExamPath = path.join(tempDir, `exam_${safeBanca}_${config.ano}_${timestamp}_pw.pdf`);
        fs.writeFileSync(candidateExamPath, turnstileResult.examPdfBuffer);
        examPdfPath = candidateExamPath;
        downloadedExamUrl = turnstileResult.examPdfUrl || "playwright://native-download/exam.pdf";
        console.log(`   ✅ Caderno de Provas salvo diretamente do buffer interceptado pelo Playwright.`);
      } else if (turnstileResult.examPdfUrl) {
        examCandidates.push({
          url: turnstileResult.examPdfUrl,
          text: "Caderno de Provas (Playwright)",
          source: "attribute",
          isGabarito: false,
          priority: 0,
        });
        console.log(`   🎯 Caderno de Provas obtido via Playwright: ${turnstileResult.examPdfUrl}`);
      }

      if (turnstileResult.gabaritoPdfBuffer) {
        const candidateGabPath = path.join(tempDir, `gabarito_${safeBanca}_${config.ano}_${timestamp}_pw.pdf`);
        fs.writeFileSync(candidateGabPath, turnstileResult.gabaritoPdfBuffer);
        gabaritoPdfPath = candidateGabPath;
        console.log(`   ✅ Gabarito Oficial salvo diretamente do buffer interceptado pelo Playwright.`);
      } else if (turnstileResult.gabaritoPdfUrl && gabaritoCandidates.length === 0) {
        gabaritoCandidates.push({
          url: turnstileResult.gabaritoPdfUrl,
          text: "Gabarito Oficial (Playwright)",
          source: "attribute",
          isGabarito: true,
          priority: 0,
        });
        console.log(`   🎯 Gabarito Oficial obtido via Playwright: ${turnstileResult.gabaritoPdfUrl}`);
      }
    } catch (pwErr: any) {
      console.warn(`   ⚠️ Fallback Playwright falhou: ${pwErr?.message || pwErr}`);
    }
  }

  // -------------------------------------------------------------------------
  // Download do Caderno de Provas com Validação Magic Byte Resiliente
  // -------------------------------------------------------------------------
  if (!examPdfPath) {
    if (examCandidates.length === 0) {
      throw new Error(
        `Não foi possível extrair links de PDF a partir de ${config.url}.\n` +
        `A página requer a resolução interativa no navegador (--headful).`
      );
    }

    console.log(`   🎯 Encontradas ${examCandidates.length} URLs candidatas para o Caderno de Provas.`);
    for (let i = 0; i < examCandidates.length; i++) {
      const candidate = examCandidates[i];
      const candidateExamPath = path.join(tempDir, `exam_${safeBanca}_${config.ano}_${timestamp}_${i}.pdf`);
      console.log(`   📥 Baixando Caderno de Provas (candidato ${i + 1}/${examCandidates.length}): ${candidate.url}...`);

      const dlResult = await downloadBinaryFile(candidate.url, candidateExamPath, sessionCookie);
      if (dlResult.success) {
        examPdfPath = candidateExamPath;
        downloadedExamUrl = candidate.url;
        console.log(`   ✅ Caderno de Provas baixado e validado (%PDF-) com sucesso.`);
        break;
      } else {
        if (i < examCandidates.length - 1) {
          console.log(`   🔄 Tentando próxima URL candidata de caderno encontrada na página...`);
        }
      }
    }
  }

  if (!examPdfPath || !downloadedExamUrl) {
    throw new Error(
      `Nenhuma das ${examCandidates.length} URLs candidatas de Caderno de Provas retornou um arquivo PDF válido (%PDF-).`
    );
  }

  // -------------------------------------------------------------------------
  // Download do Gabarito Oficial (se houver candidatos ou auto-detecção)
  // -------------------------------------------------------------------------
  if (!gabaritoPdfPath && gabaritoCandidates.length > 0) {
    console.log(`   🎯 Encontradas ${gabaritoCandidates.length} URLs candidatas para o Gabarito Oficial.`);
    for (let i = 0; i < gabaritoCandidates.length; i++) {
      const candidate = gabaritoCandidates[i];
      const candidateGabPath = path.join(tempDir, `gabarito_${safeBanca}_${config.ano}_${timestamp}_${i}.pdf`);
      console.log(`   📥 Baixando Gabarito Oficial (candidato ${i + 1}/${gabaritoCandidates.length}): ${candidate.url}...`);

      const dlResult = await downloadBinaryFile(candidate.url, candidateGabPath, sessionCookie);
      if (dlResult.success) {
        gabaritoPdfPath = candidateGabPath;
        console.log(`   ✅ Gabarito oficial baixado e validado (%PDF-) com sucesso.`);
        break;
      } else {
        if (i < gabaritoCandidates.length - 1) {
          console.log(`   🔄 Tentando próxima URL candidata de gabarito...`);
        }
      }
    }
  }

  // Se não obteve gabarito nas candidatas, tenta auto-detecção no arq.pciconcursos.com.br
  if (!gabaritoPdfPath && downloadedExamUrl.includes("arq.pciconcursos.com.br")) {
    const autoGabUrl = await tryAutoDetectGabaritoUrl(downloadedExamUrl);
    if (autoGabUrl) {
      const candidateGabPath = path.join(tempDir, `gabarito_auto_${safeBanca}_${config.ano}_${timestamp}.pdf`);
      console.log(`   📥 Baixando Gabarito auto-detectado: ${autoGabUrl}...`);
      const dlResult = await downloadBinaryFile(autoGabUrl, candidateGabPath, sessionCookie);
      if (dlResult.success) {
        gabaritoPdfPath = candidateGabPath;
        console.log(`   ✅ Gabarito oficial auto-detectado baixado e validado (%PDF-) com sucesso.`);
      }
    }
  }

  if (!gabaritoPdfPath) {
    console.log(
      `   ℹ️ Nenhum gabarito oficial em PDF válido foi encontrado. O Gemini inferirá o gabarito ou extrairá o contido no caderno.`
    );
  }

  return { examPdfPath, gabaritoPdfPath };
}

// ============================================================================
// INTEGRAÇÃO COM GEMINI (FILE API & MULTIMODAL BUFFER)
// ============================================================================
async function prepareFilePart(
  ai: GoogleGenAI,
  absolutePath: string,
  displayName: string
): Promise<FileUploadResult> {
  const mimeType = "application/pdf";

  try {
    console.log(`   📤 Enviando para Google AI File API: ${path.basename(absolutePath)}...`);
    const fileUpload = await ai.files.upload({
      file: absolutePath,
      config: {
        mimeType,
        displayName,
      },
    });

    if (!fileUpload.name) {
      throw new Error("Identificador do arquivo não retornado pelo Google AI File API.");
    }

    let fileInfo = await ai.files.get({ name: fileUpload.name });
    let attempts = 0;
    while (fileInfo.state === "PROCESSING" && attempts < 30) {
      attempts++;
      console.log(`   ⏳ Arquivo em processamento remoto (${attempts * 3}s)...`);
      await new Promise((res) => setTimeout(res, 3000));
      fileInfo = await ai.files.get({ name: fileUpload.name });
    }

    if (fileInfo.state === "FAILED") {
      throw new Error(`Processamento do arquivo falhou no Google AI File API: ${fileUpload.name}`);
    }

    const fileUri = fileInfo.uri || fileUpload.uri;
    if (!fileUri) {
      throw new Error("URI remota do arquivo não encontrada.");
    }

    console.log(`   ✅ Arquivo preparado via File API: ${fileUpload.name}`);
    return {
      part: createPartFromUri(fileUri, mimeType),
      uploadedFileName: fileUpload.name,
    };
  } catch (fileApiErr) {
    console.warn(
      `   ⚠️ File API indisponível (${String(fileApiErr)}). Fazendo fallback para buffer base64 inline...`
    );
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

function buildExtractionPrompt(
  banca: string,
  orgao: string,
  cargo: string,
  ano: number,
  hasGabaritoFile: boolean
): string {
  return `Você é um especialista em estruturação de cadernos de prova oficiais de concursos públicos brasileiros.
Você está analisando o(s) documento(s) oficial(is) em anexo referente a:
- Banca Examinadora: ${banca}
- Órgão: ${orgao}
- Cargo: ${cargo}
- Ano de Aplicação: ${ano}

${
  hasGabaritoFile
    ? `\nATENÇÃO AO GABARITO OFICIAL: Foi fornecido também o arquivo de gabarito oficial em anexo. Correlacione e utilize rigorosamente as respostas oficiais deste gabarito para cada questão.\n`
    : `\nATENÇÃO AO GABARITO: Se o documento contiver folha de respostas/gabarito ao final, utilize-a rigorosamente. Caso contrário, deduza tecnicamente o gabarito oficial com fundamentação jurídica/doutrinária consistente.\n`
}

DIRETRIZES DE EXTRAÇÃO:
1. Extraia TODAS as questões válidas do caderno, em ordem numérica crescente.
2. Descarte cabeçalhos de página, número de páginas, instruções de prova para o candidato e propagandas.
3. Se um conjunto de questões depender de um texto de apoio ou caso hipotético, incorpore o contexto ou trecho relevante no início do campo "enunciado", tornando a questão autossuficiente.
4. Tipo de questão:
   - "CERTO_ERRADO": Para estilo CEBRASPE (itens para julgar). Defina alternativas como [{"letra": "C", "texto": "Certo"}, {"letra": "E", "texto": "Errado"}] e gabarito "CERTO" ou "ERRADO".
   - "MULTIPLA_ESCOLHA": Para FGV, FCC, VUNESP, etc. Alternativas com letras A, B, C, D, E e texto correspondente. Gabarito com a letra correta.
5. Classifique formalmente "disciplina" (ex: "Direito Administrativo", "Língua Portuguesa", "Informática", etc.) e "topico" específico.
6. Forneça uma "justificativa" concisa explicando o gabarito.
7. Retorne EXCLUSIVAMENTE um array JSON seguindo a estrutura abaixo, sem comentários ou texto adicional:

[
  {
    "numeroQuestao": 1,
    "disciplina": "Língua Portuguesa",
    "topico": "Interpretação de Texto",
    "enunciado": "Texto da questão...",
    "tipo": "MULTIPLA_ESCOLHA",
    "alternativas": [
      { "letra": "A", "texto": "..." },
      { "letra": "B", "texto": "..." },
      { "letra": "C", "texto": "..." },
      { "letra": "D", "texto": "..." },
      { "letra": "E", "texto": "..." }
    ],
    "gabarito": "A",
    "justificativa": "Explicação técnica do gabarito oficial...",
    "difficultyEstimate": 3.0
  }
]`;
}

function parseQuestionsJson(rawOutput: string): QuestionPayload[] {
  let cleaned = rawOutput.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

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
    console.error("Início do texto bruto recebido:\n", rawOutput.slice(0, 500));
    throw new Error(`Falha no parse JSON da resposta: ${String(err)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("A resposta do Gemini não é um array JSON de questões.");
  }

  const normalized: QuestionPayload[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;

    const numeroQuestao =
      typeof item.numeroQuestao === "number"
        ? item.numeroQuestao
        : parseInt(String(item.numeroQuestao || i + 1), 10) || i + 1;

    const enunciado = typeof item.enunciado === "string" ? item.enunciado.trim() : "";
    if (!enunciado) {
      console.warn(`   ⚠️ Questão #${numeroQuestao} desconsiderada por ausência de enunciado.`);
      continue;
    }

    const disciplina =
      typeof item.disciplina === "string" && item.disciplina.trim()
        ? item.disciplina.trim()
        : "Conhecimentos Gerais";

    const topico =
      typeof item.topico === "string" && item.topico.trim()
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

    const justificativa =
      typeof item.justificativa === "string" ? item.justificativa.trim() : undefined;

    const difficultyEstimate =
      typeof item.difficultyEstimate === "number" ? item.difficultyEstimate : 3.0;

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

function extractTextFromResponse(response: any): string {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }
  const candidate = response?.candidates?.[0];
  if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
    // 1. Partes sem flag thought
    const nonThought = candidate.content.parts
      .filter((p: any) => p.text && !p.thought)
      .map((p: any) => p.text)
      .join("\n")
      .trim();
    if (nonThought) return nonThought;

    // 2. Qualquer parte de texto disponível
    const anyText = candidate.content.parts
      .map((p: any) => p.text || "")
      .join("\n")
      .trim();
    if (anyText) return anyText;
  }
  return "";
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE INGESTÃO PROGRAMÁTICA
// ============================================================================
export async function scrapeAndIngest(
  config: ScrapeAndIngestConfig
): Promise<ScrapeAndIngestResult> {
  const tempDir = path.resolve(process.cwd(), ".temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const localFilesToDelete: string[] = [];
  const remoteFilesToDelete: string[] = [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Variável de ambiente GEMINI_API_KEY não foi configurada no .env.");
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    // -------------------------------------------------------------------------
    // ETAPA 1: Raspagem / Download dos arquivos PDF
    // -------------------------------------------------------------------------
    console.log("\n[1/4] Identificando e baixando arquivos PDF...");
    const { examPdfPath, gabaritoPdfPath } = await resolveAndDownloadPdfs(config, tempDir);
    localFilesToDelete.push(examPdfPath);
    if (gabaritoPdfPath) {
      localFilesToDelete.push(gabaritoPdfPath);
    }

    // Se skipIfExists estiver ativo, valida se a prova já existe com questões no banco
    if (config.skipIfExists) {
      const checkBanca = config.banca || "Banca Examinadora";
      const checkOrgao = config.orgao || "Órgão Público";
      const checkCargo = config.cargo || "Cargo Geral";
      const checkAno = config.ano || new Date().getFullYear();

      const existingExam = await prisma.bankExam.findFirst({
        where: {
          banca: checkBanca,
          orgao: checkOrgao,
          cargo: checkCargo,
          ano: checkAno,
        },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      });

      if (existingExam && existingExam._count.questions > 0) {
        console.log(
          `[PULANDO] Prova já cadastrada: "${checkBanca}" - "${checkOrgao}" - "${checkCargo}" (${checkAno}) [ID: ${existingExam.id}, ${existingExam._count.questions} questões no banco]`
        );
        return {
          examId: existingExam.id,
          totalQuestions: existingExam._count.questions,
          skipped: true,
        };
      }
    }

    const examStats = fs.statSync(examPdfPath);
    console.log(`   📦 Caderno baixado com sucesso: ${(examStats.size / (1024 * 1024)).toFixed(2)} MB`);

    // -------------------------------------------------------------------------
    // ETAPA 2: Upload e Processamento Multimodal com Gemini
    // -------------------------------------------------------------------------
    console.log("\n[2/4] Enviando PDFs para o Gemini...");
    const contents: (Part | string)[] = [];

    const examPart = await prepareFilePart(ai, examPdfPath, path.basename(examPdfPath));
    contents.push(examPart.part);
    if (examPart.uploadedFileName) {
      remoteFilesToDelete.push(examPart.uploadedFileName);
    }

    if (gabaritoPdfPath) {
      const gabPart = await prepareFilePart(ai, gabaritoPdfPath, path.basename(gabaritoPdfPath));
      contents.push(gabPart.part);
      if (gabPart.uploadedFileName) {
        remoteFilesToDelete.push(gabPart.uploadedFileName);
      }
    }

    const promptText = buildExtractionPrompt(
      config.banca || "Banca Examinadora",
      config.orgao || "Órgão Público",
      config.cargo || "Cargo Geral",
      config.ano || new Date().getFullYear(),
      Boolean(gabaritoPdfPath)
    );
    contents.push(promptText);

    const modelCandidates = Array.from(
      new Set(
        [
          config.model,
          "gemini-3.5-flash-lite",
          "gemini-flash-lite-latest",
          "gemini-3.1-flash-lite",
          "gemini-flash-latest",
          "gemini-3.8-flash",
          "gemini-3.5-flash",
          "gemini-pro-latest",
        ].filter((m): m is string => Boolean(m))
      )
    );

    let response: any = null;
    let extractedText = "";
    let usedModel = "";
    let lastError: any = null;

    for (const m of modelCandidates) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`   🧠 Solicitando extração e correlação via modelo [${m}] (tentativa ${attempt}/3)...`);
          const startTime = Date.now();
          const genConfig: Record<string, unknown> = {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 16384,
          };
          if (m.includes("3.")) {
            genConfig.thinkingConfig = { thinkingLevel: "low" };
          }
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: genConfig,
          });
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const candidateText = extractTextFromResponse(response);
          if (!candidateText) {
            const finishReason = response?.candidates?.[0]?.finishReason;
            console.warn(`   ⚠️ Modelo [${m}] retornou resposta sem texto (finishReason: ${finishReason}). Tentando próximo modelo...`);
            response = null;
            break;
          }
          console.log(`   ⚡ Conteúdo gerado pelo Gemini [${m}] em ${elapsed}s (${candidateText.length} caracteres).`);
          extractedText = candidateText;
          usedModel = m;
          break;
        } catch (err: any) {
          lastError = err;
          const isBusyOrRate =
            err.status === 503 ||
            err.status === 429 ||
            err.message?.includes("503") ||
            err.message?.includes("429") ||
            err.message?.includes("high demand");

          if (isBusyOrRate && attempt < 3) {
            const delayMs = attempt * 3000;
            console.warn(`   ⏳ Modelo [${m}] temporariamente ocupado (503/429). Aguardando ${delayMs / 1000}s para retentar...`);
            await new Promise((res) => setTimeout(res, delayMs));
          } else {
            console.warn(`   ⚠️ Falha com o modelo [${m}]: ${err.message || String(err)}. Tentando alternativa...`);
            break;
          }
        }
      }
      if (response && extractedText) break;
    }

    if (!response || !extractedText) {
      throw new Error(`Nenhum modelo Gemini conseguiu processar a solicitação com sucesso. Último erro: ${lastError?.message || String(lastError)}`);
    }

    // -------------------------------------------------------------------------
    // ETAPA 3: Validação do JSON estruturado
    // -------------------------------------------------------------------------
    console.log("\n[3/4] Validando estrutura das questões extraídas...");
    const rawText = extractedText;
    if (!rawText.trim()) {
      throw new Error("Resposta textual retornada pelo Gemini veio vazia.");
    }

    const questions = parseQuestionsJson(rawText);
    console.log(`   ✅ ${questions.length} questões validadas com sucesso.`);

    if (questions.length === 0) {
      throw new Error("Nenhuma questão válida pôde ser estruturada a partir do caderno fornecido.");
    }

    // -------------------------------------------------------------------------
    // ETAPA 4: Persistência Idempotente no Prisma
    // -------------------------------------------------------------------------
    console.log("\n[4/4] Salvando dados de forma idempotente no banco (BankExam & BankQuestion)...");

    const finalBanca = config.banca || "Banca Examinadora";
    const finalOrgao = config.orgao || "Órgão Público";
    const finalCargo = config.cargo || "Cargo Geral";
    const finalAno = config.ano || new Date().getFullYear();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Busca exame existente
      let exam = await tx.bankExam.findFirst({
        where: {
          banca: finalBanca,
          orgao: finalOrgao,
          cargo: finalCargo,
          ano: finalAno,
        },
      });

      if (!exam) {
        exam = await tx.bankExam.create({
          data: {
            banca: finalBanca,
            orgao: finalOrgao,
            cargo: finalCargo,
            ano: finalAno,
            editalUrl: config.url,
            isProcessed: true,
          },
        });
        console.log(`   ✨ Novo registro BankExam criado: ID ${exam.id}`);
      } else {
        exam = await tx.bankExam.update({
          where: { id: exam.id },
          data: {
            isProcessed: true,
            editalUrl: config.url || exam.editalUrl,
          },
        });
        console.log(`   ♻️ Registro BankExam existente atualizado: ID ${exam.id}`);

        // Limpa questões existentes para garantir idempotência completa
        const deleted = await tx.bankQuestion.deleteMany({
          where: { examId: exam.id },
        });
        if (deleted.count > 0) {
          console.log(`   🧹 ${deleted.count} questões antigas removidas para substituição limpa.`);
        }
      }

      // 2. Inserção em lote das questões
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
        totalQuestions: questionsData.length,
      };
    });

    console.log(`   💾 Banco atualizado com sucesso: ${result.totalQuestions} questões salvas.`);
    return {
      examId: result.examId,
      totalQuestions: result.totalQuestions,
      skipped: false,
    };
  } finally {
    // -------------------------------------------------------------------------
    // LIMPEZA: Exclusão de arquivos temporários locais e remotos
    // -------------------------------------------------------------------------
    console.log("\n🧹 Limpando arquivos temporários locais e remotos...");

    for (const filePath of localFilesToDelete) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`   🗑️ Removido arquivo local temporário: ${path.basename(filePath)}`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Erro ao remover ${filePath}:`, err);
      }
    }

    try {
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch {
      // Ignora erro ao remover pasta caso haja outros arquivos
    }

    for (const remoteFile of remoteFilesToDelete) {
      try {
        await ai.files.delete({ name: remoteFile });
        console.log(`   🗑️ Removido arquivo da Google AI File API: ${remoteFile}`);
      } catch {
        // Falha silenciosa caso o arquivo já tenha expirado ou sido removido
      }
    }
  }
}

// ============================================================================
// FUNÇÃO DE INGESTÃO EM LOTE (CATEGORIA / LISTAGEM)
// ============================================================================
export async function scrapeAndIngestBatch(batchConfig: BatchConfig): Promise<BatchSummary> {
  const limit =
    typeof batchConfig.limit === "number" && !isNaN(batchConfig.limit) && batchConfig.limit > 0
      ? batchConfig.limit
      : 5;
  const startFrom =
    typeof batchConfig.startFrom === "number" && !isNaN(batchConfig.startFrom) && batchConfig.startFrom >= 0
      ? batchConfig.startFrom
      : 0;
  const delaySec =
    typeof batchConfig.delay === "number" && !isNaN(batchConfig.delay) && batchConfig.delay >= 0
      ? batchConfig.delay
      : 3;

  if (!batchConfig.categoryUrl) {
    throw new Error("URL da categoria não foi informada para execução em lote.");
  }

  const categoryUrl = batchConfig.categoryUrl;

  console.log("\n=============================================================================");
  console.log("🌐 SYNAPSE AI - INGESTÃO EM LOTE DE PROVAS (CATEGORIA / LISTAGEM)");
  console.log("=============================================================================");
  console.log(`🔗 URL da Categoria    : ${categoryUrl}`);
  console.log(`🔢 Limite por Lote     : ${limit}`);
  console.log(`📍 Iniciar do Índice   : ${startFrom}`);
  console.log(`⏱️ Intervalo (Delay)   : ${delaySec}s`);
  if (batchConfig.model) {
    console.log(`🤖 Modelo Gemini       : ${batchConfig.model}`);
  }
  console.log("-----------------------------------------------------------------------------");

  console.log(`\n🔍 Buscando provas na listagem: ${categoryUrl}...`);
  const allLinks = await scrapePciCategoryLinks(categoryUrl);
  const totalFound = allLinks.length;

  if (totalFound === 0) {
    console.warn("⚠️ Nenhum link de download de prova (/provas/download/...) foi encontrado na página informada.");
    return {
      totalFound: 0,
      processedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      totalQuestionsInserted: 0,
      errors: [],
    };
  }

  const start = Math.min(startFrom, totalFound);
  const end = Math.min(totalFound, start + limit);
  const targetLinks = allLinks.slice(start, end);

  console.log(`[LOTE] Encontradas ${totalFound} provas na categoria. Processando itens ${start + 1} a ${end}...`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let totalQuestionsInserted = 0;
  const errors: { url: string; error: string }[] = [];

  // Inicializa o browser compartilhado para reutilização no lote
  let sharedBrowser: Browser | undefined = batchConfig.browser;
  let createdSharedBrowser = false;

  if (!sharedBrowser) {
    try {
      console.log(
        `\n🚀 [Playwright] Inicializando instância compartilhada do navegador para o lote (${
          batchConfig.headful ? "modo interativo/headful" : "modo headless"
        })...`
      );
      sharedBrowser = await chromium.launch({
        headless: !batchConfig.headful,
        ignoreDefaultArgs: ["--enable-automation"],
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-sandbox",
        ],
      });
      createdSharedBrowser = true;
    } catch (err: any) {
      console.warn(`   ⚠️ [Playwright] Não foi possível iniciar browser compartilhado no lote: ${err?.message || err}`);
    }
  }

  try {
    for (let i = 0; i < targetLinks.length; i++) {
      const itemUrl = targetLinks[i];
      const currentIndex = start + i + 1;

      console.log(`\n-----------------------------------------------------------------------------`);
      console.log(`📋 [LOTE ${currentIndex}/${totalFound}] (Item ${i + 1} de ${targetLinks.length} no lote)`);
      console.log(`🔗 URL: ${itemUrl}`);
      console.log(`-----------------------------------------------------------------------------`);

      try {
        // 1. Fetch da página para extração prévia de metadados
        const pageHtml = await fetchHtml(itemUrl);
        const meta = extractPciMetadataFromHtml(pageHtml);

        const candidateBanca = batchConfig.banca || meta.banca;
        const candidateOrgao = batchConfig.orgao || meta.orgao;
        const candidateCargo = batchConfig.cargo || meta.cargo;
        const candidateAno = batchConfig.ano || meta.ano;

        // 1. Checar se a prova já existe no banco (BankExam.findFirst por banca, órgão, cargo e ano).
        // Se já existir e tiver questões cadastradas, pular com log: [PULANDO] Prova já cadastrada: ...
        if (candidateBanca && candidateOrgao && candidateCargo && candidateAno) {
          const existingExam = await prisma.bankExam.findFirst({
            where: {
              banca: candidateBanca,
              orgao: candidateOrgao,
              cargo: candidateCargo,
              ano: candidateAno,
            },
            include: {
              _count: {
                select: { questions: true },
              },
            },
          });

          if (existingExam && existingExam._count.questions > 0) {
            console.log(
              `[PULANDO] Prova já cadastrada: "${candidateBanca}" - "${candidateOrgao}" - "${candidateCargo}" (${candidateAno}) [ID: ${existingExam.id} com ${existingExam._count.questions} questões]`
            );
            skippedCount++;

            if (i < targetLinks.length - 1 && delaySec > 0) {
              console.log(`⏳ Aguardando intervalo de ${delaySec}s antes da próxima prova...`);
              await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
            }
            continue;
          }
        }

        // 2. Se não existir, resolver os links de PDF/gabarito e rodar o fluxo com o Gemini
        const result = await scrapeAndIngest({
          url: itemUrl,
          pageHtml,
          banca: candidateBanca,
          orgao: candidateOrgao,
          cargo: candidateCargo,
          ano: candidateAno,
          model: batchConfig.model,
          skipIfExists: true,
          browser: sharedBrowser,
          headful: batchConfig.headful,
        });

        if (result.skipped) {
          skippedCount++;
        } else {
          processedCount++;
          totalQuestionsInserted += result.totalQuestions;
          console.log(`✅ Prova ID ${result.examId} processada com sucesso (+${result.totalQuestions} questões salvas).`);
        }
      } catch (err: any) {
        errorCount++;
        const errorMessage = err?.message || String(err);
        console.error(`❌ Erro ao processar prova [${itemUrl}]: ${errorMessage}`);
        errors.push({ url: itemUrl, error: errorMessage });
      }

      // 4. Aguardar o intervalo antes de ir para a próxima prova
      if (i < targetLinks.length - 1 && delaySec > 0) {
        console.log(`⏳ Aguardando intervalo de ${delaySec}s antes da próxima prova...`);
        await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
      }
    }
  } finally {
    if (createdSharedBrowser && sharedBrowser) {
      console.log(`\n🛑 [Playwright] Encerrando instância compartilhada do navegador do lote.`);
      await sharedBrowser.close().catch(() => {});
    }
  }

  // 3. Resumo Final do Lote
  console.log("\n=============================================================================");
  console.log("📊 RESUMO FINAL DO LOTE DE PROVAS");
  console.log("=============================================================================");
  console.log(`🔗 URL da Categoria                     : ${batchConfig.categoryUrl}`);
  console.log(`📑 Total de links encontrados na listagem: ${totalFound}`);
  console.log(`🎯 Provas no intervalo selecionado       : ${targetLinks.length} (itens ${start + 1} a ${end})`);
  console.log(`✅ Provas processadas com sucesso        : ${processedCount}`);
  console.log(`⏭️ Provas ignoradas (já existentes)     : ${skippedCount}`);
  console.log(`❌ Provas com erro                       : ${errorCount}`);
  console.log(`📝 Total de novas questões inseridas     : ${totalQuestionsInserted}`);
  if (errors.length > 0) {
    console.log("-----------------------------------------------------------------------------");
    console.log("⚠️ Detalhamento dos Erros:");
    errors.forEach((e, idx) => {
      console.log(`   ${idx + 1}. [${e.url}]: ${e.error}`);
    });
  }
  console.log("=============================================================================\n");

  return {
    totalFound,
    processedCount,
    skippedCount,
    errorCount,
    totalQuestionsInserted,
    errors,
  };
}

// ============================================================================
// FUNÇÃO DE INGESTÃO VIA LISTA DE ARQUIVOS (.TXT COM LINKS DIRETOS DE PDF)
// ============================================================================
export function inferMetadataFromPdfUrl(pdfUrl: string): { cargo?: string; ano?: number } {
  try {
    const parsed = new URL(pdfUrl);
    const basename = path.basename(parsed.pathname, ".pdf");
    const yearMatch = pdfUrl.match(/20\d{2}|19\d{2}/);
    const ano = yearMatch ? parseInt(yearMatch[0], 10) : undefined;
    const cleanCargo = basename
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    return { cargo: cleanCargo || undefined, ano };
  } catch {
    return {};
  }
}

export async function scrapeAndIngestFileList(
  fileListPath: string,
  cliArgs: CliArgs
): Promise<FileListSummary> {
  const resolvedPath = path.resolve(process.cwd(), fileListPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Arquivo de lista não encontrado no caminho: ${resolvedPath}`);
  }

  const rawContent = fs.readFileSync(resolvedPath, "utf-8");
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("//"));

  if (lines.length === 0) {
    console.warn(`⚠️ O arquivo [${resolvedPath}] está vazio ou não possui linhas válidas.`);
    return {
      totalInFile: 0,
      processedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      totalQuestionsInserted: 0,
      errors: [],
    };
  }

  const limit =
    typeof cliArgs.limit === "number" && !isNaN(cliArgs.limit) && cliArgs.limit > 0
      ? cliArgs.limit
      : lines.length;
  const startFrom =
    typeof cliArgs.startFrom === "number" && !isNaN(cliArgs.startFrom) && cliArgs.startFrom >= 0
      ? cliArgs.startFrom
      : 0;
  const delaySec =
    typeof cliArgs.delay === "number" && !isNaN(cliArgs.delay) && cliArgs.delay >= 0
      ? cliArgs.delay
      : 2;

  console.log("\n=============================================================================");
  console.log("📄 SYNAPSE AI - INGESTÃO DIRETA A PARTIR DE LISTA DE ARQUIVOS (.TXT)");
  console.log("=============================================================================");
  console.log(`📁 Arquivo de Lista    : ${resolvedPath}`);
  console.log(`📑 Total de Linhas     : ${lines.length}`);
  console.log(`🔢 Limite a Processar  : ${limit}`);
  console.log(`📍 Iniciar do Índice   : ${startFrom}`);
  console.log(`⏱️ Intervalo (Delay)   : ${delaySec}s`);
  if (cliArgs.model) {
    console.log(`🤖 Modelo Gemini       : ${cliArgs.model}`);
  }
  console.log("-----------------------------------------------------------------------------");

  const start = Math.min(startFrom, lines.length);
  const end = Math.min(lines.length, start + limit);
  const targetLines = lines.slice(start, end);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let totalQuestionsInserted = 0;
  const errors: { url: string; error: string }[] = [];

  for (let i = 0; i < targetLines.length; i++) {
    const rawLine = targetLines[i];
    const currentIndex = start + i + 1;

    // Remove aspas eventuais
    const line = rawLine.replace(/^["']|["']$/g, "").trim();

    // Suporta linha simples com URL ou formato CSV delimitado: url;banca;orgao;cargo;ano;gabaritoUrl
    const parts = line.split(/[;,|]/).map((p) => p.trim());
    const directUrl = parts[0];
    const inferred = inferMetadataFromPdfUrl(directUrl);

    const banca = parts[1] || cliArgs.banca || "Banca Examinadora";
    const orgao = parts[2] || cliArgs.orgao || "Órgão Público";
    const cargo = parts[3] || cliArgs.cargo || inferred.cargo || "Cargo Geral";
    const ano =
      (parts[4] ? parseInt(parts[4], 10) : undefined) ||
      cliArgs.ano ||
      inferred.ano ||
      new Date().getFullYear();
    const gabaritoUrl = parts[5] || cliArgs.gabaritoUrl;

    console.log(`\n-----------------------------------------------------------------------------`);
    console.log(`📋 [LISTA ${currentIndex}/${lines.length}] (Item ${i + 1} de ${targetLines.length} nesta execução)`);
    console.log(`🔗 PDF Direto: ${directUrl}`);
    console.log(`💼 Metadados : ${banca} | ${orgao} | ${cargo} (${ano})`);
    console.log(`-----------------------------------------------------------------------------`);

    try {
      const result = await scrapeAndIngest({
        url: directUrl,
        gabaritoUrl,
        banca,
        orgao,
        cargo,
        ano,
        model: cliArgs.model,
        skipIfExists: true,
      });

      if (result.skipped) {
        skippedCount++;
      } else {
        processedCount++;
        totalQuestionsInserted += result.totalQuestions;
        console.log(`✅ Prova ID ${result.examId} processada com sucesso (+${result.totalQuestions} questões salvas).`);
      }
    } catch (err: any) {
      errorCount++;
      const errorMessage = err?.message || String(err);
      console.error(`❌ Erro ao processar prova [${directUrl}]: ${errorMessage}`);
      errors.push({ url: directUrl, error: errorMessage });
    }

    if (i < targetLines.length - 1 && delaySec > 0) {
      console.log(`⏳ Aguardando intervalo de ${delaySec}s antes da próxima prova...`);
      await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
    }
  }

  console.log("\n=============================================================================");
  console.log("📊 RESUMO FINAL DA LISTA DE ARQUIVOS");
  console.log("=============================================================================");
  console.log(`📁 Arquivo de Origem                    : ${resolvedPath}`);
  console.log(`📑 Total de links no arquivo            : ${lines.length}`);
  console.log(`🎯 Provas no intervalo selecionado      : ${targetLines.length} (itens ${start + 1} a ${end})`);
  console.log(`✅ Provas processadas com sucesso       : ${processedCount}`);
  console.log(`⏭️ Provas ignoradas (já existentes)    : ${skippedCount}`);
  console.log(`❌ Provas com erro                      : ${errorCount}`);
  console.log(`📝 Total de novas questões inseridas    : ${totalQuestionsInserted}`);
  if (errors.length > 0) {
    console.log("-----------------------------------------------------------------------------");
    console.log("⚠️ Detalhamento dos Erros:");
    errors.forEach((e, idx) => {
      console.log(`   ${idx + 1}. [${e.url}]: ${e.error}`);
    });
  }
  console.log("=============================================================================\n");

  return {
    totalInFile: lines.length,
    processedCount,
    skippedCount,
    errorCount,
    totalQuestionsInserted,
    errors,
  };
}

// ============================================================================
// EXECUÇÃO CLI
// ============================================================================
async function main() {
  const cliArgs = parseCliArgs();

  // Auto-detecta se a URL informada via positional ou --url é na verdade uma categoria
  if (cliArgs.url && !cliArgs.categoryUrl && isPciCategoryPage(cliArgs.url)) {
    cliArgs.categoryUrl = cliArgs.url;
    delete cliArgs.url;
    console.log("💡 URL identificada como página de categoria do PCI Concursos. Redirecionando para execução em LOTE.");
  }

  // ---------------------------------------------------------------------------
  // MODO 0: EXECUÇÃO VIA LISTA DE ARQUIVOS (.TXT COM LINKS DIRETOS DE PDF)
  // ---------------------------------------------------------------------------
  if (cliArgs.fileList) {
    try {
      await scrapeAndIngestFileList(cliArgs.fileList, cliArgs);
    } catch (err) {
      console.error("\n❌ Erro durante a execução da lista de arquivos:");
      console.error(err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // MODO 1: EXECUÇÃO EM LOTE (CATEGORIA)
  // ---------------------------------------------------------------------------
  if (cliArgs.categoryUrl) {
    const batchConfig: BatchConfig = {
      categoryUrl: cliArgs.categoryUrl,
      limit: cliArgs.limit,
      startFrom: cliArgs.startFrom,
      delay: cliArgs.delay,
      banca: cliArgs.banca,
      orgao: cliArgs.orgao,
      cargo: cliArgs.cargo,
      ano: cliArgs.ano,
      model: cliArgs.model,
      headful: cliArgs.headful,
    };

    try {
      await scrapeAndIngestBatch(batchConfig);
    } catch (err) {
      console.error("\n❌ Erro durante a execução em lote:");
      console.error(err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // MODO 2: EXECUÇÃO INDIVIDUAL
  // ---------------------------------------------------------------------------
  if (!cliArgs.url) {
    console.error(
      "\n❌ Erro: Nenhuma URL ou arquivo de lista fornecido. Utilize --url (-u), --categoryUrl (-C) ou --fileList (-F)."
    );
    printHelp();
    process.exit(1);
  }

  // Se a URL for uma página HTML do PCI Concursos e faltarem metadados, busca agora
  if (!cliArgs.banca || !cliArgs.orgao || !cliArgs.cargo || !cliArgs.ano) {
    if (isPciConcursosDownloadPage(cliArgs.url) || !isDirectPdfUrl(cliArgs.url)) {
      console.log(`🔍 Buscando metadados automaticamente a partir da página: ${cliArgs.url}`);
      try {
        const html = await fetchHtml(cliArgs.url);
        const meta = extractPciMetadataFromHtml(html);
        if (!cliArgs.banca && meta.banca) {
          cliArgs.banca = meta.banca;
          console.log(`   🏛️ Banca detectada automaticamente: "${cliArgs.banca}"`);
        }
        if (!cliArgs.orgao && meta.orgao) {
          cliArgs.orgao = meta.orgao;
          console.log(`   🏢 Órgão detectado automaticamente: "${cliArgs.orgao}"`);
        }
        if (!cliArgs.cargo && meta.cargo) {
          cliArgs.cargo = meta.cargo;
          console.log(`   💼 Cargo detectado automaticamente: "${cliArgs.cargo}"`);
        }
        if (!cliArgs.ano && meta.ano) {
          cliArgs.ano = meta.ano;
          console.log(`   📅 Ano detectado automaticamente: ${cliArgs.ano}`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Não foi possível carregar a página HTML para extração prévia de metadados:`, err);
      }
    }
  }

  // Se faltar algum metadado e for PDF direto (não-HTML), alerta o usuário
  if (!cliArgs.banca || !cliArgs.orgao || !cliArgs.cargo || !cliArgs.ano) {
    console.error("\n❌ Erro: Parâmetros obrigatórios ausentes e não puderam ser inferidos.");
    console.error(
      "Campos ausentes:",
      [
        !cliArgs.banca && "--banca",
        !cliArgs.orgao && "--orgao",
        !cliArgs.cargo && "--cargo",
        !cliArgs.ano && "--ano",
      ]
        .filter(Boolean)
        .join(", ")
    );
    console.error("Forneça os parâmetros faltantes via linha de comando ou verifique a URL informada.");
    printHelp();
    process.exit(1);
  }

  const config: ScrapeAndIngestConfig = {
    url: cliArgs.url,
    gabaritoUrl: cliArgs.gabaritoUrl,
    banca: cliArgs.banca,
    orgao: cliArgs.orgao,
    cargo: cliArgs.cargo,
    ano: cliArgs.ano,
    model: cliArgs.model,
    headful: cliArgs.headful,
  };

  console.log("=============================================================================");
  console.log("🌐 SYNAPSE AI - INGESTÃO DE PROVAS VIA URL / WEB SCRAPING");
  console.log("=============================================================================");
  console.log(`🔗 URL de Origem       : ${config.url}`);
  if (config.gabaritoUrl) {
    console.log(`📋 Gabarito Oficial    : ${config.gabaritoUrl}`);
  }
  console.log(`🏛️ Banca               : ${config.banca}`);
  console.log(`🏢 Órgão               : ${config.orgao}`);
  console.log(`💼 Cargo               : ${config.cargo}`);
  console.log(`📅 Ano                 : ${config.ano}`);
  console.log(`🤖 Modelo Gemini       : ${config.model || "gemini-3.8-flash"}`);
  console.log("-----------------------------------------------------------------------------");

  try {
    const result = await scrapeAndIngest(config);
    console.log("\n=============================================================================");
    console.log(`🎉 INGESTÃO CONCLUÍDA! Exam ID: ${result.examId} (${result.totalQuestions} questões)`);
    console.log("=============================================================================\n");
  } catch (err) {
    console.error("\n❌ Erro durante o processo de raspagem e ingestão:");
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Invoca main apenas quando executado diretamente
if (require.main === module || process.argv[1]?.includes("scrape-and-ingest")) {
  main().catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  });
}
