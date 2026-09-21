"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface EditalTemplateTopic {
  name: string;
}

export interface EditalTemplateSubject {
  name: string;
  color: string;
  weight: number;
  topics: EditalTemplateTopic[];
}

export interface EditalTemplate {
  id: string;
  title: string;
  shortDescription: string;
  icon: string; // emoji or identifier
  badge: string;
  materias: EditalTemplateSubject[];
}

export const STARTER_EDITAL_TEMPLATES: Record<string, EditalTemplate> = {
  policial: {
    id: "policial",
    title: "Carreiras Policiais (PF, PRF e PC)",
    shortDescription: "Foco nas matérias mais pesadas da área de segurança pública e penal.",
    icon: "👮",
    badge: "Mais Escolhido",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Compreensão e Interpretação de Textos" },
          { name: "Ortografia e Acentuação Gráfica" },
          { name: "Morfologia e Classes de Palavras" },
          { name: "Sintaxe do Período e Concordância" },
          { name: "Regência e Emprego do Sinal de Crase" },
          { name: "Pontuação e Coesão Textual" },
        ],
      },
      {
        name: "Direito Constitucional",
        color: "#8B5CF6",
        weight: 7.5,
        topics: [
          { name: "Direitos e Deveres Individuais e Coletivos (Art. 5º)" },
          { name: "Direitos Sociais e Nacionalidade" },
          { name: "Organização Político-Administrativa do Estado" },
          { name: "Segurança Pública (Art. 144 da CF/88)" },
          { name: "Poder Executivo e Atribuições" },
        ],
      },
      {
        name: "Direito Administrativo",
        color: "#EC4899",
        weight: 7.0,
        topics: [
          { name: "Princípios Expressos e Implícitos da Administração" },
          { name: "Atos Administrativos (Requisitos, Atributos e Espécies)" },
          { name: "Poderes Administrativos e Poder de Polícia" },
          { name: "Responsabilidade Civil do Estado" },
          { name: "Regime Jurídico dos Servidores Públicos (Lei 8.112/90)" },
        ],
      },
      {
        name: "Direito Penal & Processo Penal",
        color: "#EF4444",
        weight: 8.5,
        topics: [
          { name: "Aplicação da Lei Penal no Tempo e Espaço" },
          { name: "Teoria Geral do Crime (Fato Típico, Ilicitude e Culpabilidade)" },
          { name: "Crimes Contra a Pessoa e Contra o Patrimônio" },
          { name: "Inquérito Policial e Notitia Criminis" },
          { name: "Prisão em Flagrante, Preventiva e Temporária" },
        ],
      },
      {
        name: "Raciocínio Lógico & Matemática",
        color: "#F59E0B",
        weight: 6.5,
        topics: [
          { name: "Lógica Proposicional, Conectivos e Tabelas-Verdade" },
          { name: "Equivalências e Negações Lógicas" },
          { name: "Diagramas Lógicos e Conjuntos" },
          { name: "Análise Combinatória e Probabilidade Básica" },
        ],
      },
      {
        name: "Informática & Tecnologia",
        color: "#10B981",
        weight: 8.0,
        topics: [
          { name: "Sistemas Operacionais (Windows e Linux)" },
          { name: "Redes de Computadores e Protocolos de Internet" },
          { name: "Segurança da Informação, Malwares e Golpes Digitais" },
          { name: "Computação em Nuvem e Ferramentas Colaborativas" },
        ],
      },
    ],
  },
  administrativo: {
    id: "administrativo",
    title: "Tribunais & Administrativo (TJ, TRT, INSS, CNU)",
    shortDescription: "Base sólida para concursos administrativos, agências e tribunais.",
    icon: "🏛️",
    badge: "Geral",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Compreensão e Interpretação de Textos" },
          { name: "Ortografia e Acentuação" },
          { name: "Classes de Palavras e Concordância" },
          { name: "Regência e Sinal Indicativo de Crase" },
          { name: "Pontuação e Coerência" },
        ],
      },
      {
        name: "Direito Constitucional",
        color: "#8B5CF6",
        weight: 7.5,
        topics: [
          { name: "Princípios Fundamentais da República" },
          { name: "Direitos e Garantias Fundamentais" },
          { name: "Organização dos Poderes (Judiciário e Executivo)" },
          { name: "Funções Essenciais à Justiça" },
        ],
      },
      {
        name: "Direito Administrativo",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Conceito, Fontes e Princípios da Administração" },
          { name: "Organização Administrativa (Direta e Indireta)" },
          { name: "Atos e Processo Administrativo" },
          { name: "Licitações e Contratos Administrativos (Lei 14.133/21)" },
          { name: "Estatuto dos Servidores Públicos" },
        ],
      },
      {
        name: "Administração Geral & Pública",
        color: "#6366F1",
        weight: 7.0,
        topics: [
          { name: "Funções da Administração: Planejamento, Organização, Direção e Controle" },
          { name: "Gestão por Processos e Indicadores de Desempenho" },
          { name: "Atendimento ao Cidadão e Eficiência no Setor Público" },
        ],
      },
      {
        name: "Raciocínio Lógico & Matemática",
        color: "#F59E0B",
        weight: 6.0,
        topics: [
          { name: "Estruturas Lógicas e Conectivos" },
          { name: "Razão, Proporção e Regra de Três" },
          { name: "Porcentagem e Matemática Financeira Básica" },
        ],
      },
      {
        name: "Noções de Informática",
        color: "#10B981",
        weight: 6.0,
        topics: [
          { name: "Suíte de Escritório (Word, Excel, Documentos)" },
          { name: "Navegação na Web e Segurança Básica" },
          { name: "Conceitos de Armazenamento e Nuvem" },
        ],
      },
    ],
  },
  bancario: {
    id: "bancario",
    title: "Carreiras Bancárias & Fiscais (Caixa, BB, Receita)",
    shortDescription: "Com foco em atendimento bancário, finanças e raciocínio lógico.",
    icon: "💼",
    badge: "Alta Procura",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.5,
        topics: [
          { name: "Interpretação e Compreensão de Textos" },
          { name: "Norma Culta e Redação Oficial" },
          { name: "Sintaxe, Concordância e Regência" },
        ],
      },
      {
        name: "Conhecimentos Bancários & Mercado",
        color: "#10B981",
        weight: 9.0,
        topics: [
          { name: "Sistema Financeiro Nacional (CMN, Banco Central e CVM)" },
          { name: "Produtos e Serviços Bancários (Contas, Depósitos e Empréstimos)" },
          { name: "Mercado Financeiro, Moeda e Inflação" },
          { name: "Prevenção à Lavagem de Dinheiro (PLD/FT)" },
          { name: "Segurança Digital e Open Finance" },
        ],
      },
      {
        name: "Matemática Financeira & Raciocínio Lógico",
        color: "#F59E0B",
        weight: 8.0,
        topics: [
          { name: "Juros Simples e Compostos" },
          { name: "Taxas Equivalentes e Nominais" },
          { name: "Sistemas de Amortização (SAC e Price)" },
          { name: "Lógica Proposicional e Negações" },
        ],
      },
      {
        name: "Atendimento, Vendas & Ética",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Técnicas de Vendas e Negociação no Setor Bancário" },
          { name: "Código de Defesa do Consumidor Aplicado a Bancos" },
          { name: "Ética e Sigilo Bancário (Lei Complementar 105/01)" },
        ],
      },
      {
        name: "Tecnologia da Informação & Inovação",
        color: "#8B5CF6",
        weight: 7.0,
        topics: [
          { name: "Ferramentas Digitais e Cultura de Dados" },
          { name: "Privacidade e Proteção de Dados (LGPD)" },
          { name: "Segurança da Informação e Golpes Bancários" },
        ],
      },
    ],
  },
  comum: {
    id: "comum",
    title: "Tronco Comum de Concursos (Geral)",
    shortDescription: "As 5 matérias que caem em praticamente 90% dos concursos públicos.",
    icon: "📚",
    badge: "Essencial",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Interpretação e Compreensão Textual" },
          { name: "Ortografia, Acentuação e Morfologia" },
          { name: "Sintaxe da Oração, Concordância e Regência" },
          { name: "Crase e Pontuação" },
        ],
      },
      {
        name: "Direito Constitucional",
        color: "#8B5CF6",
        weight: 7.5,
        topics: [
          { name: "Direitos e Garantias Fundamentais (Art. 5º)" },
          { name: "Nacionalidade e Direitos Políticos" },
          { name: "Princípios da Administração Pública na CF/88" },
        ],
      },
      {
        name: "Direito Administrativo",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Princípios da Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência" },
          { name: "Poderes da Administração e Poder de Polícia" },
          { name: "Atos Administrativos e Agentes Públicos" },
        ],
      },
      {
        name: "Raciocínio Lógico & Matemática",
        color: "#F59E0B",
        weight: 6.5,
        topics: [
          { name: "Conectivos Lógicos e Tabelas-Verdade" },
          { name: "Equivalências e Negações" },
          { name: "Razão, Proporção e Porcentagem" },
        ],
      },
      {
        name: "Informática Básica",
        color: "#10B981",
        weight: 6.0,
        topics: [
          { name: "Conceitos de Internet, Navegadores e E-mail" },
          { name: "Segurança na Internet e Vírus/Malware" },
          { name: "Manipulação de Arquivos e Pastas no Windows" },
        ],
      },
    ],
  },
};

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

    // Cria as matérias e tópicos em uma única transação
    const created = await prisma.$transaction(
      template.materias.map((m) =>
        prisma.subject.create({
          data: {
            userId,
            name: m.name,
            color: m.color,
            weight: m.weight,
            importance: m.weight >= 8.0 ? "HIGH" : m.weight >= 6.5 ? "MEDIUM" : "LOW",
            topics: {
              create: m.topics.map((t) => ({
                title: t.name,
                firstStudy: "Pendente",
                performance: 0,
              })),
            },
          },
          include: {
            topics: true,
          },
        })
      )
    );

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
        subjectsCount: created.length,
        topicsCount: created.reduce((acc, sub) => acc + sub.topics.length, 0),
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
