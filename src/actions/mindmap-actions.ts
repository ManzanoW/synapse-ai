// src/actions/mindmap-actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import {
  checkAiQuota,
  consumeAiQuota,
  getUserQuotaStatus,
} from "@/lib/ai-quota-service";

export interface MindMapNode {
  id: string;
  label: string;
  type?: "root" | "branch" | "leaf" | "rule" | "mnemonic";
  description?: string;
  mnemonic?: string;
  ruleOrLaw?: string;
  trapWarning?: string;
  color?: string;
  children?: MindMapNode[];
}

export type MindmapNode = MindMapNode;

export interface MindmapData {
  id: string;
  title: string;
  subject: string;
  summary: string;
  rootNode: MindMapNode;
  createdAt: string;
}

export interface GenerateMindMapInput {
  topicTitle: string;
  subjectName: string;
  topicId?: string;
  forceRegenerate?: boolean;
}

export interface GenerateMindMapResult {
  success: boolean;
  data?: MindMapNode;
  error?: string;
  isQuotaExceeded?: boolean;
  canWatchRewardedAd?: boolean;
}

/**
 * Geração de Mapa Mental estruturado para o Edital e Modal de Tópico
 */
export async function generateTopicMindMapAction(
  input: GenerateMindMapInput,
): Promise<GenerateMindMapResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { topicTitle, subjectName, topicId, forceRegenerate } = input;

    // 1. Verifica cache no banco de dados se não for forçado
    if (!forceRegenerate && topicId) {
      const cachedTopic = await prisma.topic.findUnique({
        where: { id: topicId },
        select: { mindMap: true },
      });

      if (cachedTopic?.mindMap) {
        return {
          success: true,
          data: cachedTopic.mindMap as unknown as MindMapNode,
        };
      }
    }

    // 🛡️ Proteção de Cota Diária de IA para Mapas Mentais
    const quota = await checkAiQuota(userId, "MINDMAP");
    if (!quota.allowed) {
      return {
        success: false,
        error: quota.message || "Limite de mapas mentais com IA atingido.",
        isQuotaExceeded: true,
        canWatchRewardedAd: quota.canWatchRewardedAd,
      };
    }

    const prompt = `Você é o arquiteto pedagógico e especialista em mapas conceituais do Synapse AI.
Sua missão é sintetizar o seguinte assunto de concurso/estudo em um MAPA MENTAL HIERÁRQUICO estruturado para máxima retenção visual:

[DISCIPLINA] ${subjectName}
[TÓPICO] ${topicTitle}

Diretrizes Obrigatórias:
1. O nó raiz (root) deve ser o Tópico Principal.
2. Crie de 3 a 5 ramos principais (branch) representando as grandes divisões doutrinárias ou legais do tema (ex: Conceito & Natureza, Requisitos & Espécies, Prazos & Exceções, Jurisprudência da Banca).
3. Para cada ramo, crie de 2 a 3 folhas (leaf ou rule) detalhando regras práticas, artigos de lei ou distinções críticas.
4. Inclua pelo menos 1 nó de tipo "mnemonic" com um mnemônico memorável ou gatilho mental para decorar a matéria.
5. Seja conciso nos rótulos ('label' curto de 2 a 5 palavras) e coloque a explicação prática no campo 'description'.

Retorne APENAS um JSON válido estrito sem blocos markdown adicionais no formato:
{
  "id": "root-1",
  "label": "${topicTitle}",
  "type": "root",
  "description": "Visão geral e núcleo fundamental de ${topicTitle}",
  "children": [
    {
      "id": "branch-1",
      "label": "Conceito & Elementos",
      "type": "branch",
      "description": "Definição formal e elementos constitutivos essenciais.",
      "children": [
        {
          "id": "leaf-1-1",
          "label": "Requisito Legal",
          "type": "rule",
          "description": "Exigência expressa do dispositivo normativo.",
          "ruleOrLaw": "Artigo ou regra chave aplicável"
        }
      ]
    },
    {
      "id": "branch-2",
      "label": "Bizú de Memorização",
      "type": "mnemonic",
      "mnemonic": "Palavra ou acrônimo chave",
      "description": "Dica infalível para não esquecer os itens."
    }
  ]
}`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    let parsed: MindMapNode;
    try {
      const cleaned = aiRes.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        id: "root-fallback",
        label: topicTitle,
        type: "root",
        description: `Mapa Mental estruturado para ${topicTitle} em ${subjectName}`,
        children: [
          {
            id: "b1",
            label: "Conceito Fundamental",
            type: "branch",
            description: "Noções basilares e definição aplicável nas bancas examinadoras.",
            children: [
              {
                id: "l1-1",
                label: "Regra Geral",
                type: "rule",
                description: "Aplicação direta sem exceções iniciais.",
              },
              {
                id: "l1-2",
                label: "Exceções da Lei",
                type: "rule",
                description: "Distratores clássicos frequentemente cobrados em provas.",
              },
            ],
          },
          {
            id: "b2",
            label: "Requisitos & Prazos",
            type: "branch",
            description: "Condições objetivas e temporalidade expressa na legislação.",
            children: [
              {
                id: "l2-1",
                label: "Prazo Fatal",
                type: "leaf",
                description: "Fique atento à contagem em dias úteis ou corridos.",
              },
            ],
          },
          {
            id: "b3",
            label: "Bizú da Banca",
            type: "mnemonic",
            mnemonic: "FOCO TOTAL",
            description: "Memorize as palavras restritivas: apenas, sempre, nunca e salvo exceção.",
          },
        ],
      };
    }

    try {
      if (topicId) {
        await prisma.topic.update({
          where: { id: topicId },
          data: { mindMap: parsed as any },
        });
      }
    } catch (saveErr) {
      console.warn("[generateTopicMindMapAction] Aviso ao salvar mapa mental no banco:", saveErr);
    }

    await consumeAiQuota(userId, "MINDMAP");

    return {
      success: true,
      data: parsed,
    };
  } catch (err) {
    console.error("Erro em generateTopicMindMapAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao gerar mapa mental neural.",
    };
  }
}

/**
 * Aprofundamento pedagógico e expansão de sub-nó com IA (Recurso Exclusivo Synapse Pro)
 */
export async function deepenMindMapNodeAction(input: {
  nodeId: string;
  nodeLabel: string;
  nodeDescription?: string;
  topicTitle: string;
  subjectName: string;
}): Promise<{
  success: boolean;
  data?: {
    expandedExplanation: string;
    subNodes: MindMapNode[];
  };
  error?: string;
  isProRequired?: boolean;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const userQuota = await getUserQuotaStatus(userId);

    if (!userQuota.isUnlimited) {
      return {
        success: false,
        error:
          "O Aprofundamento Neural de Nós com IA é um recurso exclusivo do plano Synapse Pro.",
        isProRequired: true,
      };
    }

    const prompt = `Você é um tutor de alta performance para concursos públicos.
Sua missão é APROFUNDAR o seguinte nó do mapa mental de "${input.topicTitle}" (${input.subjectName}):
- Conceito/Ramo: "${input.nodeLabel}"
- Descrição atual: "${input.nodeDescription || "Sem descrição"}"

Forneça:
1. "expandedExplanation": Um parágrafo denso e didático explicando as pegadinhas doutrinárias, exceções e como a banca examinadora aborda esse conceito específico.
2. "subNodes": Um array com 2 a 3 nós filhos mais específicos (tipo "leaf", "rule" ou "mnemonic") com 'id', 'label' curto (2 a 4 palavras) e 'description'.

Retorne APENAS um JSON válido no formato:
{
  "expandedExplanation": "Texto detalhado com jurisprudência/doutrina...",
  "subNodes": [
    {
      "id": "${input.nodeId}-sub-1",
      "label": "Rótulo Curto",
      "type": "leaf",
      "description": "Detalhe da regra",
      "ruleOrLaw": "Artigo ou súmula se aplicável"
    }
  ]
}`;

    const aiRes = await generateContentWithFallback({
      prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const cleaned = aiRes.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      success: true,
      data: parsed,
    };
  } catch (err) {
    console.error("[deepenMindMapNodeAction] Erro:", err);
    return {
      success: false,
      error: "Não foi possível aprofundar o nó com IA.",
    };
  }
}

/**
 * Geração livre para o Hub de Mapas Mentais (/mapas-mentais)
 */
export async function generateMindmapAction(input: {
  topic: string;
  subject?: string;
  careerFocus?: string;
  banca?: string;
}): Promise<{ success: boolean; data?: MindmapData; error?: string }> {
  try {
    const prompt = `
Você é o Especialista em Mapas Mentais de Alta Retenção e Mnemônicos para Concursos da Synapse AI.
Crie um MAPA MENTAL ESQUEMATIZADO E HIERÁRQUICO para o seguinte tema:

TEMA/TÓPICO: "${input.topic}"
DISCIPLINA: "${input.subject || "Geral"}"
CARREIRA: "${input.careerFocus || "Geral"}"
BANCA: "${input.banca || "Cebraspe / FGV / FCC"}"

DIRETRIZES:
1. Nó raiz com conceito central.
2. 3 a 5 ramos principais coloridos (indigo, emerald, amber, rose, cyan, purple).
3. 2 a 4 sub-nós com regras, artigos de lei ou mnemônicos.
4. "mnemonic" (macete) e "trapWarning" (pegadinha clássica).

Retorne EXCLUSIVAMENTE um JSON:
{
  "title": "Título do Mapa",
  "subject": "${input.subject || "Geral"}",
  "summary": "Resumo de 2 frases",
  "rootNode": {
    "id": "root",
    "label": "Conceito Central",
    "description": "Definição nuclear",
    "color": "indigo",
    "children": [
      {
        "id": "b1",
        "label": "Ramo 1",
        "description": "Explicação",
        "color": "cyan",
        "mnemonic": "Macete opcional",
        "trapWarning": "Pegadinha opcional",
        "children": [
          {
            "id": "s1-1",
            "label": "Subtópico",
            "description": "Detalhe"
          }
        ]
      }
    ]
  }
}
`;

    const { text } = await generateContentWithFallback({
      prompt,
      timeoutMs: 40000,
    });

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const mindmap: MindmapData = {
      id: `mm-${Date.now()}`,
      title: parsed.title || input.topic,
      subject: parsed.subject || input.subject || "Geral",
      summary: parsed.summary || "Esquematização cognitiva de alto impacto para fixação rápida.",
      rootNode: parsed.rootNode,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: mindmap,
    };
  } catch (err) {
    console.error("Erro ao gerar mapa mental:", err);
    return {
      success: false,
      error: "Não foi possível gerar o mapa mental no momento.",
    };
  }
}

/**
 * Converte ramos e nós de um mapa mental em um Baralho de Flashcards FSRS
 */
export async function convertMindmapToDeckAction(input: {
  title: string;
  subject?: string;
  rootNode: MindMapNode;
}): Promise<{
  success: boolean;
  deckId?: string;
  deckTitle?: string;
  cardsCount?: number;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { title, subject, rootNode } = input;

    // Extrai cartões de forma recursiva da árvore do mapa mental
    const cardsToCreate: { question: string; answer: string; details?: string }[] = [];

    function traverse(node: MindMapNode, parentPath: string = "") {
      const currentPath = parentPath ? `${parentPath} › ${node.label}` : node.label;

      // Se tiver descrição, mnemônico ou pegadinha, cria um flashcard
      if (node.description || node.mnemonic || node.trapWarning) {
        const answerText = node.description || "Conceito estrutural.";
        const detailsParts: string[] = [];

        if (node.mnemonic) {
          detailsParts.push(`💡 Mnemônico: ${node.mnemonic}`);
        }
        if (node.trapWarning) {
          detailsParts.push(`⚠️ Pegadinha da Banca: ${node.trapWarning}`);
        }
        if (node.ruleOrLaw) {
          detailsParts.push(`📜 Base Legal / Súmula: ${node.ruleOrLaw}`);
        }

        const detailsText = detailsParts.length > 0 ? detailsParts.join("\n\n") : undefined;

        cardsToCreate.push({
          question: `[${subject || "Geral"}] ${node.label} (${title})\nQual é a síntese, regra ou macete deste conceito?`,
          answer: answerText,
          details: detailsText,
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => traverse(child, currentPath));
      }
    }

    traverse(rootNode);

    if (cardsToCreate.length === 0) {
      return {
        success: false,
        error: "O mapa mental não possui ramos suficientes para gerar flashcards.",
      };
    }

    // Busca assunto compatível para vincular ao Deck
    let matchedSubject = null;
    if (subject && subject !== "Geral") {
      matchedSubject = await prisma.subject.findFirst({
        where: { userId, name: { contains: subject, mode: "insensitive" } },
      });
    }

    const deckTitle = `[Mapa Mental] ${title}`;

    const deck = await prisma.deck.create({
      data: {
        title: deckTitle,
        color: "indigo",
        userId,
        subjectId: matchedSubject?.id || null,
        flashcards: {
          create: cardsToCreate.map((card) => ({
            question: card.question,
            answer: card.answer,
            details: card.details,
            easeFactor: 2.5,
            interval: 1,
            nextReviewDate: new Date(),
          })),
        },
      },
    });

    return {
      success: true,
      deckId: deck.id,
      deckTitle: deck.title,
      cardsCount: cardsToCreate.length,
    };
  } catch (err) {
    console.error("[convertMindmapToDeckAction] Erro:", err);
    return {
      success: false,
      error: "Erro ao criar baralho a partir do mapa mental.",
    };
  }
}
