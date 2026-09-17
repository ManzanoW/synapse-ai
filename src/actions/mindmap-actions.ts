"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/gemini-fallback";

export interface MindMapNode {
  id: string;
  label: string;
  type: "root" | "branch" | "leaf" | "rule" | "mnemonic";
  description?: string;
  mnemonic?: string;
  ruleOrLaw?: string;
  children?: MindMapNode[];
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
}

export async function generateTopicMindMapAction(
  input: GenerateMindMapInput,
): Promise<GenerateMindMapResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const { topicTitle, subjectName, topicId, forceRegenerate = false } = input;

    // 1. Verificação de Cache no Banco de Dados (Zero tokens gastos ao reabrir)
    if (!forceRegenerate) {
      let cachedTopic = null;
      if (topicId) {
        cachedTopic = await prisma.topic.findUnique({
          where: { id: topicId },
          select: { id: true, mindMap: true },
        });
      } else {
        cachedTopic = await prisma.topic.findFirst({
          where: {
            title: topicTitle,
            subject: { userId },
          },
          select: { id: true, mindMap: true },
        });
      }

      if (cachedTopic?.mindMap) {
        return {
          success: true,
          data: cachedTopic.mindMap as unknown as MindMapNode,
        };
      }
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
      "label": "Mnemônico da Banca",
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
      const cleaned = aiRes.text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback estruturado inteligente
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

    // 2. Persiste o mapa mental gerado no banco de dados para evitar chamadas redundantes
    try {
      if (topicId) {
        await prisma.topic.update({
          where: { id: topicId },
          data: { mindMap: parsed as any },
        });
      } else {
        const found = await prisma.topic.findFirst({
          where: { title: topicTitle, subject: { userId } },
          select: { id: true },
        });
        if (found) {
          await prisma.topic.update({
            where: { id: found.id },
            data: { mindMap: parsed as any },
          });
        }
      }
    } catch (saveErr) {
      console.warn("[generateTopicMindMapAction] Aviso ao salvar mapa mental no banco:", saveErr);
    }

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
