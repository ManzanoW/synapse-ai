"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { STARTER_EDITAL_TEMPLATES, EditalTemplateSubject } from "@/lib/edital-templates";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { Type } from "@google/genai";
import { checkAiQuota, consumeAiQuota } from "@/lib/ai-quota-service";

/**
 * Importa um modelo de edital pré-definido por carreira para a conta do usuário
 */
export async function importStarterEditalAction(
  templateKey: string,
  options?: { replaceExisting?: boolean },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const template = STARTER_EDITAL_TEMPLATES[templateKey];
    if (!template) {
      return { success: false, error: "Modelo de edital não encontrado." };
    }

    // Se solicitado, remove matérias anteriores para substituir a carreira de forma limpa
    if (options?.replaceExisting) {
      await prisma.subject.deleteMany({
        where: { userId },
      });
    }

    let createdCount = 0;
    let topicsCount = 0;

    // Tenta transação atômica primeiro
    try {
      if (typeof prisma.$transaction === "function") {
        const created = await prisma.$transaction(
          template.materias.map((m) =>
            prisma.subject.create({
              data: {
                userId,
                name: m.name,
                color: m.color,
                weight: m.weight,
                importance: m.weight >= 8.0 ? "Alta" : m.weight >= 6.5 ? "Média" : "Baixa",
                priority: 6.3,
                topics: {
                  create: m.topics.map((t) => ({
                    title: t.name,
                    firstStudy: "Pendente",
                    performance: 0,
                    relevance: "5/10",
                  })),
                },
              },
              include: {
                topics: true,
              },
            })
          )
        );
        createdCount = created?.length || 0;
        topicsCount = created?.reduce((acc: number, sub: any) => acc + (sub.topics?.length || 0), 0) || 0;
      } else {
        throw new Error("Transação não suportada no driver atual.");
      }
    } catch (txError) {
      console.warn("Transação falhou, criando matérias sequencialmente:", txError);
      // Fallback sequencial resiliente
      for (const m of template.materias) {
        const sub = await prisma.subject.create({
          data: {
            userId,
            name: m.name,
            color: m.color,
            weight: m.weight,
            importance: m.weight >= 8.0 ? "Alta" : m.weight >= 6.5 ? "Média" : "Baixa",
            priority: 6.3,
            topics: {
              create: m.topics.map((t) => ({
                title: t.name,
                firstStudy: "Pendente",
                performance: 0,
                relevance: "5/10",
              })),
            },
          },
          include: {
            topics: true,
          },
        });
        if (sub) {
          createdCount++;
          topicsCount += sub.topics?.length || 0;
        }
      }
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          careerFocus: template.title,
          targetRole: template.title.split("(")[0].trim(),
        },
      });
    } catch (userErr) {
      console.warn("Aviso ao atualizar foco no perfil do usuário:", userErr);
    }

    try {
      revalidatePath("/edital");
      revalidatePath("/questions");
      revalidatePath("/flashcards");
      revalidatePath("/dashboard");
      revalidatePath("/week");
      revalidatePath("/profile");
    } catch {
      // Ignora erro fora de contexto
    }

    return {
      success: true,
      data: {
        templateTitle: template.title,
        subjectsCount: createdCount,
        topicsCount,
      },
    };
  } catch (error) {
    console.error("Erro ao importar edital base:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao carregar edital inicial.",
    };
  }
}

interface CustomSubjectGenerated {
  nome: string;
  color: string;
  weight: number;
  topicos: string[];
}

/**
 * Gera e importa um plano de estudos personalizado para qualquer cargo/concurso digitado pelo usuário via IA (Gemini)
 */
export async function generateCustomEditalAction(
  targetRoleOrExam: string,
  options?: { replaceExisting?: boolean },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const trimmedInput = targetRoleOrExam?.trim();
    if (!trimmedInput || trimmedInput.length < 3) {
      return { success: false, error: "Por favor, informe o cargo ou concurso desejado com mais detalhes (mínimo 3 caracteres)." };
    }

    // 🛡️ Proteção de Cota Diária de IA para Personalização de Edital
    const quota = await checkAiQuota(userId, "EDITAL");
    if (!quota.allowed) {
      return {
        success: false,
        error: quota.message || "Limite diário de personalização de editais com IA atingido.",
      };
    }

    // Se solicitado substituição limpa, remove matérias anteriores antes de gerar o novo foco
    if (options?.replaceExisting) {
      await prisma.subject.deleteMany({
        where: { userId },
      });
    }

    const prompt = `Você é um coordenador pedagógico especialista em concursos públicos brasileiros.
O concurseiro deseja se preparar para o seguinte concurso e/ou cargo:
"${trimmedInput}"

Gere uma matriz curricular recomendada, realista e otimizada com as matérias mais cobradas e estratégicas para esse cargo específico (gere de 4 a 6 matérias essenciais).
Para cada matéria:
- "nome": Nome oficial da disciplina (ex: "Língua Portuguesa", "Banco de Dados & SQL", "Direito Constitucional", "Contabilidade Geral", "Legislação do SUS")
- "color": Uma cor hexadecimal vibrante coerente com o domínio (ex: #3B82F6, #10B981, #8B5CF6, #F59E0B, #EF4444, #EC4899, #06B6D4)
- "weight": Peso relativo de 6.0 a 10.0 (onde as mais cruciais para o cargo têm maior peso)
- "topicos": Lista com 4 a 6 tópicos mais recorrentes nas bancas para esse cargo.`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materias: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  color: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  topicos: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["nome", "color", "weight", "topicos"],
              },
            },
          },
          required: ["materias"],
        },
      },
      timeoutMs: 45000,
    });

    const parsed = JSON.parse(aiRes.text || "{}");
    const materias: CustomSubjectGenerated[] = Array.isArray(parsed.materias) ? parsed.materias : [];

    if (materias.length === 0) {
      return { success: false, error: "A IA não conseguiu estruturar as disciplinas para este cargo. Tente refinar a busca." };
    }

    let createdCount = 0;
    let topicsCount = 0;

    for (const m of materias) {
      const sub = await prisma.subject.create({
        data: {
          userId,
          name: m.nome,
          color: m.color || "#3B82F6",
          weight: m.weight || 7.0,
          importance: (m.weight || 7.0) >= 8.0 ? "Alta" : (m.weight || 7.0) >= 6.5 ? "Média" : "Baixa",
          priority: 6.5,
          topics: {
            create: (m.topicos || []).map((t) => ({
              title: t,
              firstStudy: "Pendente",
              performance: 0,
              relevance: "5/10",
            })),
          },
        },
        include: {
          topics: true,
        },
      });

      if (sub) {
        createdCount++;
        topicsCount += sub.topics?.length || 0;
      }
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          careerFocus: trimmedInput,
          targetRole: trimmedInput,
        },
      });
    } catch (userErr) {
      console.warn("Aviso ao atualizar foco no perfil do usuário:", userErr);
    }

    try {
      revalidatePath("/edital");
      revalidatePath("/questions");
      revalidatePath("/flashcards");
      revalidatePath("/dashboard");
      revalidatePath("/week");
      revalidatePath("/profile");
    } catch {
      // Ignora erro fora de contexto
    }

    // Consome cota diária de Personalização de Edital com IA
    await consumeAiQuota(userId, "EDITAL");

    return {
      success: true,
      data: {
        targetRole: trimmedInput,
        subjectsCount: createdCount,
        topicsCount,
      },
    };
  } catch (error) {
    console.error("Erro ao gerar edital personalizado por IA:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao gerar disciplinas com IA.",
    };
  }
}

/**
 * Salva as preferências de carga horária e rotina do onboarding no banco de dados do usuário
 */
export async function saveOnboardingPreferencesAction({
  dailyHours,
  profileMode,
}: {
  dailyHours: number;
  profileMode: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Calcula meta semanal em horas (ex: 2h/dia * 5 dias = 10h; 3h * 5 = 15h; 5h * 5 = 25h)
    const validDaily = Math.max(1, Math.min(12, Number(dailyHours) || 2));
    const weeklyGoalHours = validDaily * 5;

    await prisma.user.update({
      where: { id: userId },
      data: {
        weeklyGoalHours,
        studyMode: "WEEKLY",
      },
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath("/week");
      revalidatePath("/profile");
    } catch {
      // Ignora erro fora de contexto
    }

    return {
      success: true,
      weeklyGoalHours,
    };
  } catch (error) {
    console.error("Erro ao salvar preferências de onboarding:", error);
    return { success: false, error: "Não foi possível salvar a meta no perfil." };
  }
}

/**
 * Consulta a carreira / foco atual configurado no perfil do usuário
 */
export async function getUserCareerFocusAction(): Promise<{
  success: boolean;
  careerFocus?: string | null;
  targetRole?: string | null;
  targetExamDate?: Date | null;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        careerFocus: true,
        targetRole: true,
        targetExamDate: true,
      },
    });

    return {
      success: true,
      careerFocus: user?.careerFocus || "Tecnologia da Informação & Dados",
      targetRole: user?.targetRole || "Concurso Geral",
      targetExamDate: user?.targetExamDate,
    };
  } catch (err) {
    console.error("[getUserCareerFocusAction] Erro:", err);
    return { success: false, error: "Falha ao consultar foco de estudo." };
  }
}

/**
 * Atualiza o foco / cargo alvo e data de prova do concurseiro
 */
export async function updateUserCareerFocusAction(input: {
  careerFocus?: string;
  targetRole?: string;
  targetExamDate?: string | Date | null;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const updateData: {
      careerFocus?: string;
      targetRole?: string;
      targetExamDate?: Date | null;
    } = {};

    if (input.careerFocus !== undefined) updateData.careerFocus = input.careerFocus;
    if (input.targetRole !== undefined) updateData.targetRole = input.targetRole;
    if (input.targetExamDate !== undefined) {
      updateData.targetExamDate = input.targetExamDate
        ? new Date(input.targetExamDate)
        : null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    try {
      revalidatePath("/profile");
      revalidatePath("/edital");
      revalidatePath("/dashboard");
    } catch {
      // Ignora erro fora de contexto
    }

    return {
      success: true,
      message: "Foco de carreira e objetivo salvos com sucesso!",
    };
  } catch (err) {
    console.error("[updateUserCareerFocusAction] Erro:", err);
    return { success: false, error: "Falha ao salvar preferências de carreira." };
  }
}

