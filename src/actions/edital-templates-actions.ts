"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { STARTER_EDITAL_TEMPLATES, EditalTemplateSubject } from "@/lib/edital-templates";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { Type } from "@google/genai";

/**
 * Importa um modelo de edital pré-definido por carreira para a conta do usuário
 */
export async function importStarterEditalAction(templateKey: string) {
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
      revalidatePath("/edital");
      revalidatePath("/questions");
      revalidatePath("/flashcards");
      revalidatePath("/dashboard");
      revalidatePath("/week");
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
export async function generateCustomEditalAction(targetRoleOrExam: string) {
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
      revalidatePath("/edital");
      revalidatePath("/questions");
      revalidatePath("/flashcards");
      revalidatePath("/dashboard");
      revalidatePath("/week");
    } catch {
      // Ignora erro fora de contexto
    }

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
