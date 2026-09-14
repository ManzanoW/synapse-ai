"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";
import { TimedQuizQuestion } from "@/types/quiz";

export interface ExamFilterOptions {
  bancas: string[];
  orgaos: string[];
  anos: number[];
  disciplinas: string[];
}

export interface SearchBankQuestionsParams {
  banca?: string;
  orgao?: string;
  ano?: number;
  disciplina?: string;
  tipo?: "MULTIPLA_ESCOLHA" | "CERTO_ERRADO";
  query?: string;
  page?: number;
  pageSize?: number;
  excludeAnuladas?: boolean;
  excludeDesatualizadas?: boolean;
}

export type BankQuestionWithExam = Prisma.BankQuestionGetPayload<{
  include: {
    exam: {
      select: {
        banca: true;
        orgao: true;
        cargo: true;
        ano: true;
      };
    };
  };
}>;

export interface GenerateTargetedExamParams {
  banca?: string;
  orgao?: string;
  anos?: number[];
  disciplina?: string;
  limit?: number;
}

export interface BankQuestionAlternative {
  id: string;
  texto: string;
  letra?: string;
}

/**
 * Cache de longa duração para as opções de filtros (bancas, órgãos, anos e disciplinas).
 * Evita queries repetitivas no banco em cada renderização dos seletores de filtro.
 */
const getCachedFilterOptions = unstable_cache(
  async (): Promise<ExamFilterOptions> => {
    try {
      if (!prisma?.bankExam || !prisma?.bankQuestion) {
        console.warn(
          "Modelos BankExam ou BankQuestion não estão disponíveis no cliente Prisma.",
        );
        return {
          bancas: [],
          orgaos: [],
          anos: [],
          disciplinas: [],
        };
      }

      const [bancasRaw, orgaosRaw, anosRaw, disciplinasRaw] = await Promise.all([
        prisma.bankExam.findMany({
          select: { banca: true },
          distinct: ["banca"],
          orderBy: { banca: "asc" },
        }),
        prisma.bankExam.findMany({
          select: { orgao: true },
          distinct: ["orgao"],
          orderBy: { orgao: "asc" },
        }),
        prisma.bankExam.findMany({
          select: { ano: true },
          distinct: ["ano"],
          orderBy: { ano: "desc" },
        }),
        prisma.bankQuestion.findMany({
          select: { disciplina: true },
          distinct: ["disciplina"],
          orderBy: { disciplina: "asc" },
        }),
      ]);

      const bancas = Array.from(
        new Set(
          bancasRaw
            .map((b) => b.banca?.trim())
            .filter((b): b is string => Boolean(b && b.length > 0)),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"));

      const orgaos = Array.from(
        new Set(
          orgaosRaw
            .map((o) => o.orgao?.trim())
            .filter((o): o is string => Boolean(o && o.length > 0)),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"));

      const anos = Array.from(
        new Set(
          anosRaw
            .map((a) => a.ano)
            .filter((a): a is number => typeof a === "number" && !isNaN(a)),
        ),
      ).sort((a, b) => b - a);

      const disciplinas = Array.from(
        new Set(
          disciplinasRaw
            .map((d) => d.disciplina?.trim())
            .filter((d): d is string => Boolean(d && d.length > 0)),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"));

      return {
        bancas,
        orgaos,
        anos,
        disciplinas,
      };
    } catch (err) {
      console.warn(
        "Aviso: Não foi possível carregar opções de filtros de bancas/provas (tabelas possivelmente pendentes):",
        err,
      );
      return {
        bancas: [],
        orgaos: [],
        anos: [],
        disciplinas: [],
      };
    }
  },
  ["bank-exam-filter-options"],
  {
    tags: ["bank-exam-filters"],
    revalidate: 3600, // 1 hora
  },
);

/**
 * Retorna as opções disponíveis de filtros (bancas, órgãos, anos e disciplinas)
 * utilizando agregação e distinct com cache revalidável.
 */
export async function getExamFilterOptionsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Usuário não autenticado.",
        data: { bancas: [], orgaos: [], anos: [], disciplinas: [] },
      };
    }

    if (!prisma?.bankExam || !prisma?.bankQuestion) {
      console.warn(
        "Modelos BankExam ou BankQuestion ainda não estão disponíveis no cliente Prisma.",
      );
      return {
        success: true,
        data: {
          bancas: [],
          orgaos: [],
          anos: [],
          disciplinas: [],
        },
        warning: "Tabelas de bancas ainda não sincronizadas.",
      };
    }

    const data = await getCachedFilterOptions();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Erro ao carregar opções de filtros de bancas:", error);
    return {
      success: false,
      data: {
        bancas: [],
        orgaos: [],
        anos: [],
        disciplinas: [],
      },
      error: "Falha ao carregar opções de filtros de provas. As tabelas podem não estar sincronizadas.",
    };
  }
}

/**
 * Busca questões reais de concursos com filtros compostos, paginação e contagem total.
 */
export async function searchBankQuestionsAction(params: SearchBankQuestionsParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Usuário não autenticado.",
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
      };
    }

    if (!prisma?.bankQuestion || !prisma?.bankExam) {
      console.warn(
        "Modelos BankQuestion ou BankExam ainda não estão disponíveis no cliente Prisma.",
      );
      return {
        success: true,
        data: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        warning: "Banco de questões de provas ainda não sincronizado.",
      };
    }

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.BankQuestionWhereInput = {};

    // Exclusão de anuladas e desatualizadas por padrão
    if (params.excludeAnuladas ?? true) {
      where.anulada = false;
    }

    if (params.excludeDesatualizadas ?? true) {
      where.desatualizada = false;
    }

    // Filtro por disciplina
    if (params.disciplina && params.disciplina.trim() !== "") {
      where.disciplina = {
        equals: params.disciplina.trim(),
        mode: "insensitive",
      };
    }

    // Filtro por tipo de questão
    if (params.tipo) {
      where.tipo = params.tipo;
    }

    // Filtro textual (palavra-chave no enunciado, tópico ou disciplina)
    if (params.query && params.query.trim() !== "") {
      const q = params.query.trim();
      where.OR = [
        { enunciado: { contains: q, mode: "insensitive" } },
        { topico: { contains: q, mode: "insensitive" } },
        { disciplina: { contains: q, mode: "insensitive" } },
      ];
    }

    // Filtros relacionados ao Exame/Prova
    const examFilter: Prisma.BankExamWhereInput = {};

    if (params.banca && params.banca.trim() !== "" && params.banca !== "Todas") {
      examFilter.banca = {
        equals: params.banca.trim(),
        mode: "insensitive",
      };
    }

    if (params.orgao && params.orgao.trim() !== "" && params.orgao !== "Todos") {
      examFilter.orgao = {
        equals: params.orgao.trim(),
        mode: "insensitive",
      };
    }

    if (params.ano && !isNaN(params.ano)) {
      examFilter.ano = params.ano;
    }

    if (Object.keys(examFilter).length > 0) {
      where.exam = examFilter;
    }

    // Executa contagem total e busca paginada com include dos dados essenciais do concurso
    const [totalCount, questions] = await Promise.all([
      prisma.bankQuestion.count({ where }),
      prisma.bankQuestion.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          exam: {
            select: {
              banca: true,
              orgao: true,
              cargo: true,
              ano: true,
            },
          },
        },
        orderBy: [
          { exam: { ano: "desc" } },
          { numeroQuestao: "asc" },
          { createdAt: "desc" },
        ],
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: questions,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Erro ao buscar questões de bancas:", error);
    return {
      success: false,
      data: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      error: "Falha ao consultar questões reais de provas. As tabelas podem estar em sincronização.",
    };
  }
}

/**
 * Gera um caderno/simulado direcionado com questões reais de bancas selecionadas,
 * formatado especificamente para o modo de simulado cronometrado.
 */
export async function generateTargetedExamAction(params: GenerateTargetedExamParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (!prisma?.bankQuestion || !prisma?.bankExam) {
      console.warn(
        "Modelos BankQuestion ou BankExam ainda não estão disponíveis no cliente Prisma.",
      );
      return {
        success: false,
        error: "Banco de questões de provas reais ainda não sincronizado.",
      };
    }

    const where: Prisma.BankQuestionWhereInput = {
      anulada: false,
      desatualizada: false,
    };

    const examFilter: Prisma.BankExamWhereInput = {};

    if (params.banca && params.banca.trim() !== "" && params.banca !== "Todas") {
      examFilter.banca = {
        equals: params.banca.trim(),
        mode: "insensitive",
      };
    }

    if (params.orgao && params.orgao.trim() !== "") {
      examFilter.orgao = {
        equals: params.orgao.trim(),
        mode: "insensitive",
      };
    }

    if (params.anos && params.anos.length > 0) {
      const validAnos = params.anos.filter((a) => typeof a === "number" && !isNaN(a));
      if (validAnos.length > 0) {
        examFilter.ano = { in: validAnos };
      }
    }

    if (Object.keys(examFilter).length > 0) {
      where.exam = examFilter;
    }

    if (params.disciplina && params.disciplina.trim() !== "") {
      where.disciplina = {
        equals: params.disciplina.trim(),
        mode: "insensitive",
      };
    }

    // 1. Busca rápida de IDs candidatos que atendam estritamente aos critérios
    const candidates = await prisma.bankQuestion.findMany({
      where,
      select: { id: true },
    });

    if (candidates.length === 0) {
      return {
        success: false,
        error: "Nenhuma questão encontrada para os critérios selecionados.",
      };
    }

    // 2. Amostragem aleatória até o limite solicitado (default: 30)
    const limit = Math.min(100, Math.max(1, params.limit || 30));
    const allIds = candidates.map((c) => c.id);

    // Fisher-Yates shuffle
    for (let i = allIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
    }
    const selectedIds = allIds.slice(0, limit);

    // 3. Busca dos dados completos das questões selecionadas
    const questions = await prisma.bankQuestion.findMany({
      where: { id: { in: selectedIds } },
      include: {
        exam: {
          select: {
            banca: true,
            orgao: true,
            cargo: true,
            ano: true,
          },
        },
      },
    });

    // Preserva a ordem aleatória do sorteio
    const questionsMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = selectedIds
      .map((id) => questionsMap.get(id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    // 4. Converte e normaliza para o formato esperado pelo TimedQuiz (TimedQuizQuestion)
    const formattedQuestions: TimedQuizQuestion[] = orderedQuestions.map((q) => {
      let rawAlternatives: unknown = q.alternativas;

      if (typeof rawAlternatives === "string") {
        try {
          rawAlternatives = JSON.parse(rawAlternatives);
        } catch {
          rawAlternatives = [];
        }
      }

      const alternativesArray = Array.isArray(rawAlternatives) ? rawAlternatives : [];

      let alternativas = alternativesArray.map((alt: any, idx: number) => {
        const id = (alt.id || alt.letra || String.fromCharCode(65 + idx))
          .toString()
          .trim()
          .toUpperCase();
        const texto = (alt.texto || alt.text || "").toString().trim();
        return { id, texto };
      });

      // Fallback para estilo Cebraspe (Certo / Errado) caso não haja alternativas detalhadas no banco
      if (q.tipo === "CERTO_ERRADO" && alternativas.length === 0) {
        alternativas = [
          { id: "C", texto: "Certo" },
          { id: "E", texto: "Errado" },
        ];
      }

      const banca = q.exam?.banca || params.banca || "Banca Oficial";
      const orgao = q.exam?.orgao || "";
      const ano = q.exam?.ano || "";
      const cargo = q.exam?.cargo || "";

      let gabaritoCorreto = q.gabarito.trim().toUpperCase();
      if (q.tipo === "CERTO_ERRADO") {
        if (gabaritoCorreto === "CERTO" || gabaritoCorreto === "C") {
          gabaritoCorreto = "C";
        } else if (gabaritoCorreto === "ERRADO" || gabaritoCorreto === "E") {
          gabaritoCorreto = "E";
        }
      }

      return {
        id: q.id,
        enunciado: q.enunciado,
        formato: q.tipo === "CERTO_ERRADO" ? "certo_errado" : "multipla",
        alternativas,
        gabaritoCorreto,
        justificativa:
          q.justificativa ||
          `Questão de prova real: ${banca} (${ano}) - ${orgao} / ${cargo}.`,
        pegadinhaBanca: `Banca: ${banca} | Concurso: ${orgao} (${ano}) - Cargo: ${cargo}`,
        explicacaoErro: q.justificativa || undefined,
      };
    });

    return {
      success: true,
      data: formattedQuestions,
      count: formattedQuestions.length,
      metadata: {
        banca: params.banca || "Todas as Bancas",
        orgao: params.orgao,
        anos: params.anos,
        disciplina: params.disciplina,
        totalAvailable: candidates.length,
      },
    };
  } catch (error) {
    console.error("Erro ao gerar simulado direcionado de bancas:", error);
    return {
      success: false,
      error: "Falha ao gerar simulado direcionado de provas reais.",
    };
  }
}

/**
 * Ação utilitária para invalidar o cache de filtros de bancas
 * ao realizar ingestão ou scrapers de novos cadernos/provas.
 */
export async function invalidateBankExamFiltersCacheAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    (revalidateTag as (tag: string) => void)("bank-exam-filters");
    return { success: true };
  } catch (error) {
    console.error("Erro ao invalidar cache de filtros de bancas:", error);
    return { success: false, error: "Falha ao invalidar cache." };
  }
}
