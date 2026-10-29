"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { invalidateUserCacheAction } from "@/actions/gamification-actions";
import { generateContentWithFallback } from "@/lib/gemini-fallback";

export interface TheorySection {
  heading: string;
  body: string;
  calloutTitle?: string;
  calloutText?: string;
  calloutType?: "info" | "warning" | "emerald";
}

export interface TheoryTableData {
  headers: string[];
  rows: string[][];
}

export interface FixationQuizData {
  question: string;
  bancaTag: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  mnemonic: string;
}

export interface FaqItemData {
  question: string;
  answer: string;
}

export interface FlashcardSeedData {
  question: string;
  answer: string;
  details?: string;
}

export interface RichTheoryData {
  canonicalKey?: string;
  semanticTokens?: string[];
  cacheSource?: "CANONICAL_CLUSTER" | "SEMANTIC_SIMILARITY" | "GEMINI_AI" | "BUILT_IN";
  moduleTag: string;
  bancaTag: string;
  introLead: string;
  sections: TheorySection[];
  tableData?: TheoryTableData;
  examTipTitle: string;
  examTipText: string;
  summaryPoints: string[];
  fixationQuiz: FixationQuizData;
  faqItems: FaqItemData[];
  flashcardsSeed: FlashcardSeedData[];
}

export interface CreateTrailSubjectInput {
  id?: string;
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  topics?: string[];
}

export interface CreateCustomTrailInput {
  title: string;
  banca: string;
  subjects: CreateTrailSubjectInput[];
  studyDays: string[];
  dailyHours: number;
  weekendHours: number;
  customInstructions?: string;
}

/**
 * Gera estrutura teórica profunda, quadro esquemático, questão comentada,
 * resumo rápido, dúvidas frequentes (FAQ) e sementes de flashcards para um tópico/matéria e banca.
 */
function buildRichTheoryForTopic(
  subjectName: string,
  topicTitle: string,
  banca: string,
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  orderIndex: number,
): RichTheoryData {
  const cleanBanca = banca.trim() || "Banca Examinadora";
  const lowerSub = subjectName.toLowerCase();
  const lowerTop = topicTitle.toLowerCase();

  if (lowerSub.includes("lei orgânica") || lowerTop.includes("lei orgânica") || lowerSub.includes("municipal")) {
    return {
      moduleTag: `${subjectName} • Aula ${orderIndex}`,
      bancaTag: `Foco ${cleanBanca}`,
      introLead:
        "A Lei Orgânica Municipal (LOM) equivale à 'Constituição do Município' (Art. 29 da CF/88). Ela é elaborada e promulgada pela própria Câmara Municipal em dois turnos de votação, com interstício mínimo de 10 dias, exigindo o voto favorável de 2/3 (dois terços) dos seus membros.",
      sections: [
        {
          heading: "1. Conceito, Natureza Jurídica e Quórum de Aprovação",
          body: "Diferente das leis ordinárias comuns, a Lei Orgânica não passa por sanção ou veto do Prefeito: a própria Câmara Municipal a promulga diretamente. Em provas municipais, a banca costuma trocar o quórum de 2/3 por maioria absoluta ou afirmar erroneamente que o Prefeito sanciona emendas à LOM.",
          calloutTitle: `🎯 Como a ${cleanBanca} cobra em prova`,
          calloutText: `A ${cleanBanca} adora inverter os prazos de interstício (trocando 10 dias por 15 dias) e atribuir ao Prefeito o poder de vetar emendas à Lei Orgânica. Grave: Emenda à LOM é promulgada pela Mesa da Câmara!`,
          calloutType: "info",
        },
        {
          heading: "2. Repartição de Competências (Art. 30 da CF/88 c/c LOM)",
          body: "Ao Município compete legislar sobre assuntos de interesse local (inciso I) e suplementar a legislação federal e a estadual no que couber (inciso II). Além disso, é competência municipal instituir e arrecadar os tributos de sua competência (IPTU, ISS, ITBI), organizar e prestar, diretamente ou sob regime de concessão ou permissão, os serviços públicos de interesse local, incluído o de transporte coletivo, que tem caráter essencial.",
          calloutTitle: "⚠️ Pegadinha Clássica de Competência Tributária",
          calloutText:
            "O Município NÃO possui competência residual nem pode legislar sobre Direito Penal, Processual ou Trabalho. Sua atuação legislativa limita-se ao interesse predominantemente local e suplementação.",
          calloutType: "warning",
        },
      ],
      tableData: {
        headers: ["Espécie / Ato na LOM", "Quórum de Aprovação", "Sanção do Prefeito?", "Quem Promulga?"],
        rows: [
          ["Lei Orgânica / Emenda à LOM", "2/3 dos membros (2 turnos, 10 dias)", "NÃO há sanção/veto", "Mesa da Câmara Municipal"],
          ["Lei Complementar Municipal", "Maioria Absoluta (mais da metade)", "SIM (sanciona ou veta)", "Prefeito (em regra)"],
          ["Lei Ordinária Municipal", "Maioria Simples (presentes)", "SIM (sanciona ou veta)", "Prefeito (em regra)"],
          ["Rejeição de Veto do Prefeito", "Maioria Absoluta dos Vereadores", "NÃO", "Prefeito (ou Presidente da Câmara em 48h)"],
        ],
      },
      examTipTitle: `Raio-X de Cobrança (${cleanBanca})`,
      examTipText:
        "Mais de 70% das questões de Legislação Municipal cobram: (1) Quórum de 2/3 vs Maioria Absoluta, (2) Iniciativa privativa do Prefeito (criação de cargos no Executivo, regime jurídico dos servidores e orçamento) e (3) Prazos de apreciação de veto (30 dias para a Câmara votar o veto).",
      summaryPoints: [
        "Aprovação da LOM e suas Emendas: 2 turnos + intervalo mínimo de 10 dias + 2/3 dos membros da Câmara.",
        "Promulgação da LOM: Feita diretamente pela Câmara Municipal (Prefeito NÃO sanciona nem veta Emenda à LOM).",
        "Transporte Coletivo Local: Serviço público de caráter ESSENCIAL de competência municipal.",
        "Rejeição de Veto do Prefeito: Exige Maioria Absoluta dos membros da Câmara Municipal.",
        "Iniciativa Privativa do Prefeito: Criação de cargos/funções na Prefeitura, servidores do Executivo e leis orçamentárias (PPA, LDO, LOA).",
      ],
      fixationQuiz: {
        question: `(${cleanBanca} - Simulada) Acerca do processo de alteração da Lei Orgânica Municipal e das competências locais, assinale a alternativa CORRETA:`,
        bancaTag: cleanBanca,
        options: [
          {
            id: "A",
            text: "A proposta de emenda à Lei Orgânica será discutida e votada em dois turnos, com interstício mínimo de 10 dias, considerando-se aprovada se obtiver 2/3 dos votos dos membros da Câmara, sendo promulgada pela Mesa da Câmara sem sanção do Prefeito.",
          },
          {
            id: "B",
            text: "A emenda à Lei Orgânica exige maioria absoluta em turno único e depende de sanção expressa do Prefeito Municipal no prazo de 15 dias úteis.",
          },
          {
            id: "C",
            text: "Compete privativamente ao Presidente da Câmara Municipal a iniciativa de leis que disponham sobre o regime jurídico dos servidores públicos do Poder Executivo.",
          },
          {
            id: "D",
            text: "O veto do Prefeito a projeto de lei ordinária somente poderá ser rejeitado pelo voto de 2/3 dos vereadores presentes na sessão.",
          },
        ],
        correctOptionId: "A",
        explanation:
          "Gabarito A! Conforme o Art. 29 da CF/88 espelhado nas Leis Orgânicas Municipais, a LOM e suas emendas exigem 2 turnos, interstício mínimo de 10 dias e quórum qualificado de 2/3, com promulgação direta pela Câmara (sem sanção/veto do Prefeito).",
        mnemonic: "LOM = 2 Turnos + 10 Dias + 2/3 + Zero Prefeito!",
      },
      faqItems: [
        {
          question: "Por que o Prefeito não pode vetar uma Emenda à Lei Orgânica?",
          answer:
            "Porque o Poder Constituinte Decorrente Municipal (e o poder reformador da LOM) pertence exclusivamente ao Legislativo local (Câmara). Pelo princípio da simetria com as Emendas Constitucionais (Art. 60 da CF/88), não existe participação do Chefe do Executivo na fase de sanção ou veto.",
        },
        {
          question: "Qual a diferença prática entre Maioria Simples e Maioria Absoluta na Câmara?",
          answer:
            "Em uma Câmara com 21 vereadores: Maioria Absoluta é sempre o primeiro número inteiro acima da metade do TOTAL de cadeiras (11 votos), independentemente de quantos faltaram. Já a Maioria Simples é mais da metade apenas dos PRESENTES na sessão (desde que haja ao menos 11 vereadores presentes para abrir a votação).",
        },
        {
          question: "Vereador pode apresentar projeto que gera despesa para a Prefeitura?",
          answer:
            "Segundo a tese de Repercussão Geral do STF (Tema 917), não usurpa a competência privativa do Prefeito a lei que, embora crie despesa para a Administração, não trate da estrutura ou da atribuição de seus órgãos nem do regime jurídico de servidores públicos.",
        },
      ],
      flashcardsSeed: [
        {
          question: "Qual é o quórum e o procedimento para aprovação/emenda da Lei Orgânica Municipal?",
          answer: "2 turnos de votação, interstício mínimo de 10 dias e aprovação por 2/3 dos membros da Câmara Municipal.",
          details: "Art. 29, caput, da CF/88. Promulgada diretamente pela Câmara (sem sanção ou veto do Prefeito).",
        },
        {
          question: "Qual é o quórum exigido na Câmara Municipal para derrubar (rejeitar) o veto do Prefeito?",
          answer: "Maioria Absoluta dos membros da Câmara Municipal.",
          details: "Não confunda com o quórum de 2/3 da Emenda à LOM!",
        },
        {
          question: "A quem pertence a iniciativa privativa de leis sobre o Regime Jurídico dos Servidores do Executivo Municipal?",
          answer: "Ao Prefeito Municipal (Chefe do Poder Executivo).",
          details: "Vício de iniciativa formal subjetivo se proposto por Vereador.",
        },
      ],
    };
  }

  if (lowerSub.includes("banco de dados") || lowerSub.includes("sql") || lowerTop.includes("normal") || lowerSub.includes("ti")) {
    return {
      moduleTag: `${subjectName} • Aula ${orderIndex}`,
      bancaTag: `Foco ${cleanBanca}`,
      introLead:
        "A Normalização de Dados (1FN, 2FN, 3FN e BCNF) é o processo formal de decomposição de relações para eliminar redundâncias e evitar anomalias de inserção, atualização e exclusão em bancos de dados relacionais.",
      sections: [
        {
          heading: "1. As Três Primeiras Formas Normais (1FN, 2FN e 3FN)",
          body: "Para que uma tabela esteja na 1ª Forma Normal (1FN), todos os seus atributos devem conter apenas valores atômicos (indivisíveis), sem grupos repetitivos ou atributos multivalorados. A 2ª Forma Normal (2FN) exige estar na 1FN e que todo atributo não-chave dependa totalmente da chave primária inteira (elimina a Dependência Funcional Parcial em chaves compostas). Já a 3ª Forma Normal (3FN) exige estar na 2FN e que nenhum atributo não-chave dependa de outro atributo não-chave (elimina a Dependência Funcional Transitiva).",
          calloutTitle: `🎯 Regra de Ouro para provas da ${cleanBanca}`,
          calloutText:
            "Se a tabela possui Chave Primária SIMPLES (formada por apenas 1 coluna) e já está na 1FN, ela está AUTOMATICAMENTE na 2FN! A violação da 2FN só pode ocorrer quando a chave primária é COMPOSTA.",
          calloutType: "emerald",
        },
        {
          heading: "2. Como resolver na prática durante a prova",
          body: "Ao encontrar um atributo multivalorado (ex: 'Telefones' na tabela Cliente), cria-se uma nova tabela levando a chave primária original (1FN). Ao encontrar um atributo que depende apenas de parte da chave composta (ex: 'Nome_Produto' na tabela Item_Pedido cuja PK é {ID_Pedido, ID_Produto}), move-se 'Nome_Produto' para a tabela Produto (2FN). Ao encontrar 'Nome_Departamento' dentro da tabela Funcionario dependendo de 'Cod_Departamento', separa-se a tabela Departamento (3FN).",
          calloutTitle: "⚠️ Diferença entre 3FN e Forma Normal de Boyce-Codd (BCNF)",
          calloutText:
            "Na BCNF (mais restrita que a 3FN), para toda dependência funcional não-trivial X → Y, o determinante X DEVE ser uma superchave.",
          calloutType: "info",
        },
      ],
      tableData: {
        headers: ["Forma Normal", "O que ela elimina?", "Condição Técnica Obrigatória"],
        rows: [
          ["1ª Forma Normal (1FN)", "Atributos multivalorados, compostos e grupos repetitivos", "Domínios atômicos (valores indivisíveis)"],
          ["2ª Forma Normal (2FN)", "Dependência Funcional Parcial", "Estar na 1FN + atributos não-chave dependem de TODA a chave candidata"],
          ["3ª Forma Normal (3FN)", "Dependência Funcional Transitiva (A → B → C)", "Estar na 2FN + não-chave não determina outro não-chave"],
          ["Boyce-Codd (BCNF)", "Anomalias residuais de chaves candidatas sobrepostas", "Todo determinante funcional X → Y é uma Superchave"],
        ],
      },
      examTipTitle: `Mnemônico Definitivo (${cleanBanca})`,
      examTipText:
        "'A verdade (1FN - Atômico), TODA a verdade (2FN - Dependência Total) e NADA MAIS que a verdade (3FN - Sem Transitividade), assim me ajude Codd!'",
      summaryPoints: [
        "1FN = Valores Atômicos (proíbe atributos multivalorados, arrays ou tabelas aninhadas).",
        "2FN = 1FN + Eliminação de Dependência Funcional PARCIAL (só ocorre problema se a PK for composta).",
        "3FN = 2FN + Eliminação de Dependência Funcional TRANSITIVA (atributo não-chave determinando outro não-chave).",
        "BCNF = Todo determinante funcional (lado esquerdo da seta X → Y) é obrigatoriamente uma superchave.",
        "4FN = Elimina Dependências Multivaloradas independentes.",
      ],
      fixationQuiz: {
        question: `(${cleanBanca} - Analista de TI) Considere a relação EMPREGADO (Matricula, Nome, CPF, Cod_Setor, Nome_Setor), onde 'Matricula' é a chave primária simples e todos os atributos são atômicos. Sabendo que Cod_Setor determina funcionalmente Nome_Setor, essa tabela encontra-se:`,
        bancaTag: cleanBanca,
        options: [
          {
            id: "A",
            text: "Na 1ª Forma Normal (1FN), mas viola a 2ª Forma Normal (2FN) por possuir dependência parcial.",
          },
          {
            id: "B",
            text: "Na 2ª Forma Normal (2FN), mas viola a 3ª Forma Normal (3FN) devido à dependência transitiva Matricula → Cod_Setor → Nome_Setor.",
          },
          {
            id: "C",
            text: "Na 3ª Forma Normal (3FN), pois sua chave primária é simples.",
          },
          {
            id: "D",
            text: "Não normalizada (0FN), pois contém atributos compostos.",
          },
        ],
        correctOptionId: "B",
        explanation:
          "Gabarito B! Como todos os atributos são atômicos, está na 1FN. Como a chave primária (Matricula) é simples, não existe dependência parcial, logo já está na 2FN. Porém, como Matricula → Cod_Setor e Cod_Setor → Nome_Setor (um atributo não-chave determinando outro não-chave), há Dependência Transitiva, violando a 3FN!",
        mnemonic: "1FN = Atômico | 2FN = Sem Parcial | 3FN = Sem Transitiva",
      },
      faqItems: [
        {
          question: "Por que uma tabela na 1FN com chave primária simples já está automaticamente na 2FN?",
          answer:
            "Porque a 2FN proíbe que um atributo dependa apenas de 'um pedaço' da chave primária (dependência parcial). Se a chave primária tem apenas 1 coluna, é impossível depender de metade dela — ou depende dela inteira, ou não depende.",
        },
        {
          question: "Desnormalizar um banco de dados é sempre um erro de projeto?",
          answer:
            "Em ambientes transacionais (OLTP), buscamos a 3FN para evitar anomalias de escrita. Já em Data Warehouses e OLAP (Modelagem Dimensional Star Schema), a desnormalização é intencional para reduzir JOINs e acelerar consultas analíticas.",
        },
      ],
      flashcardsSeed: [
        {
          question: "O que a 2ª Forma Normal (2FN) elimina em um banco de dados relacional?",
          answer: "Elimina a Dependência Funcional Parcial (atributos não-chave que dependem de apenas parte de uma chave candidata composta).",
          details: "Se a tabela está na 1FN e tem PK simples, já está automaticamente na 2FN.",
        },
        {
          question: "O que a 3ª Forma Normal (3FN) elimina?",
          answer: "Elimina a Dependência Funcional Transitiva (quando um atributo não-chave depende de outro atributo não-chave: A → B → C).",
          details: "Solução: extrair B e C para uma nova tabela onde B seja chave primária.",
        },
        {
          question: "Qual a exigência da Forma Normal de Boyce-Codd (BCNF)?",
          answer: "Para toda dependência funcional não-trivial X → Y, o determinante X deve ser obrigatoriamente uma superchave.",
          details: "Mais restritiva que a 3FN.",
        },
      ],
    };
  }

  // Conteúdo universal adaptável para qualquer outra matéria do edital
  return {
    moduleTag: `${subjectName} • Aula ${orderIndex}`,
    bancaTag: `Foco ${cleanBanca} • Nível ${level === "BEGINNER" ? "Base" : level === "ADVANCED" ? "Avançado" : "Intermediário"}`,
    introLead: `Estudo direcionado e esquematizado sobre "${topicTitle}" na disciplina de ${subjectName}, calibrado especificamente para o perfil de cobrança da banca ${cleanBanca}.`,
    sections: [
      {
        heading: `1. Fundamentos Essenciais de ${topicTitle}`,
        body: `O domínio de ${topicTitle} dentro de ${subjectName} exige atenção redobrada aos conceitos normativos, classificações doutrinárias consolidadas e termos técnicos exatos. A banca ${cleanBanca} costuma cobrar a distinção precisa entre a regra geral e as exceções expressas, utilizando casos práticos e troca sutil de palavras-chave nas alternativas.`,
        calloutTitle: `🎯 Padrão de Cobrança da ${cleanBanca}`,
        calloutText: `Fique atento a termos absolutos como "sempre", "nunca", "exclusivamente" ou "independentemente". Em ${subjectName}, quase toda regra geral comporta exceções que são justamente o alvo das questões de prova.`,
        calloutType: "info",
      },
      {
        heading: "2. Pontos Críticos, Exceções e Aplicação em Prova",
        body: `Na resolução de baterias da ${cleanBanca}, observe os requisitos cumulativos versus alternativos de ${topicTitle}. Quando o examinador tenta induzir o candidato ao erro, ele costuma inverter os conceitos de competência vinculada e discricionária ou trocar os prazos e hipóteses legais aplicáveis ao tema.`,
        calloutTitle: "⚠️ Alerta de Pegadinha Recorrente",
        calloutText: `Não confunda os efeitos da regra principal de ${topicTitle} com suas hipóteses de exceção. Revise a tabela comparativa abaixo antes de partir para as questões.`,
        calloutType: "warning",
      },
    ],
    tableData: {
      headers: ["Eixo de Análise", "Regra Geral Aplicável", `Pegadinha Clássica (${cleanBanca})`],
      rows: [
        [
          `Conceito Central (${topicTitle})`,
          "Aplicação direta conforme previsão expressa e sistemática",
          "Restringir o alcance do conceito usando 'exclusivamente'",
        ],
        [
          "Requisitos de Validade",
          "Observância estrita dos pressupostos formais e materiais",
          "Inverter requisito obrigatório por faculdade opcional",
        ],
        [
          "Exceções e Casos Especiais",
          "Aplicáveis apenas mediante previsão taxativa",
          "Generalizar a exceção como se fosse a regra padrão",
        ],
      ],
    },
    examTipTitle: `Diretriz Estratégica (${cleanBanca})`,
    examTipText: `Em ${subjectName}, resolver questões logo após a leitura teórica aumenta a retenção em até 65%. Responda à questão de fixação abaixo e gere seus flashcards do tópico com 1 clique.`,
    summaryPoints: [
      `Domine a definição exata de ${topicTitle} e saiba diferenciá-la dos institutos correlatos em ${subjectName}.`,
      `A banca ${cleanBanca} prioriza o conhecimento das exceções expressas e a literalidade técnica do tema.`,
      "Cuidado com alternativas que invertem causa e consequência ou trocam requisitos obrigatórios por facultativos.",
      "Sempre valide se o comando da questão pede a regra geral ou a exceção jurisprudencial/legal.",
    ],
    fixationQuiz: {
      question: `(${cleanBanca} - Questão de Fixação) No âmbito de ${subjectName}, a respeito das regras e princípios aplicáveis a "${topicTitle}", assinale a alternativa CORRETA:`,
      bancaTag: cleanBanca,
      options: [
        {
          id: "A",
          text: `A aplicação das normas e fundamentos de ${topicTitle} deve observar os limites técnicos e sistemáticos da matéria, admitindo-se as exceções expressamente previstas.`,
        },
        {
          id: "B",
          text: `Os preceitos de ${topicTitle} possuem caráter absoluto e incondicionado, não admitindo qualquer mitigação ou exceção prática.`,
        },
        {
          id: "C",
          text: `A banca examinadora dispensa a observância dos requisitos formais em ${topicTitle}, bastando a análise subjetiva.`,
        },
        {
          id: "D",
          text: `Não há distinção técnica entre a regra geral e as hipóteses excepcionais tratadas em ${topicTitle}.`,
        },
      ],
      correctOptionId: "A",
      explanation: `Gabarito A! Em ${subjectName}, o estudo de ${topicTitle} pauta-se pela aplicação sistemática da regra geral combinada com suas exceções taxativas, afastando afirmações absolutas ("caráter incondicionado").`,
      mnemonic: `${topicTitle}: Regra Sistemática + Atenção às Exceções Taxativas!`,
    },
    faqItems: [
      {
        question: `Qual a melhor forma de revisar "${topicTitle}" nas vésperas da prova da ${cleanBanca}?`,
        answer:
          "Utilize o botão '⚡ Resumo Rápido' no topo desta aula para ler os 4 pontos-chave em 2 minutos e revise os flashcards gerados automaticamente no seu baralho FSRS.",
      },
      {
        question: "Devo aprofundar na doutrina divergente ou focar no entendimento majoritário?",
        answer: `Para provas objetivas da ${cleanBanca}, concentre 90% da sua energia na literalidade normativa, nos conceitos pacificados e na resolução de questões anteriores.`,
      },
    ],
    flashcardsSeed: [
      {
        question: `[${subjectName}] Qual é o núcleo essencial e ponto de atenção sobre ${topicTitle}?`,
        answer: `Observar a regra sistemática de ${topicTitle} e memorizar suas exceções taxativas cobradas pela ${cleanBanca}.`,
        details: `Gerado a partir da Trilha Guiada (${cleanBanca}).`,
      },
      {
        question: `[${cleanBanca}] Como as pegadinhas de prova costumam cobrar ${topicTitle}?`,
        answer: "Trocando a regra geral pela exceção e utilizando palavras restritivas absolutas ('nunca', 'exclusivamente', 'jamais').",
        details: `Disciplina: ${subjectName}`,
      },
    ],
  };
}

/**
 * Busca a Trilha Ativa do usuário, as disciplinas/tópicos existentes no Edital Verticalizado,
 * os Cursos Externos cadastrados e a contagem de Flashcards vencidos hoje no FSRS.
 * Se o usuário ainda não tiver nenhuma trilha criada, inicializa uma trilha sincronizada com o Edital dele!
 */
export async function getStudyTrailsOverviewAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const [user, existingSubjects, existingTrails, externalCourses, dueFlashcardsCount, recentErrors] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            targetRole: true,
            careerFocus: true,
            weeklyGoalHours: true,
            activeDaysPerWeek: true,
            planTier: true,
            role: true,
          },
        }),
        prisma.subject.findMany({
          where: { userId },
          include: { topics: true },
          orderBy: { priority: "desc" },
        }),
        prisma.studyTrail.findMany({
          where: { userId },
          include: {
            lessons: {
              include: {
                subject: true,
                topic: true,
              },
              orderBy: [{ weekNumber: "asc" }, { orderIndex: "asc" }],
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.externalCourse.findMany({
          where: { userId },
          include: {
            subject: true,
            items: {
              include: { topic: true },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.flashcard
          .count({
            where: {
              deck: { userId },
              nextReviewDate: { lte: new Date() },
            },
          })
          .catch(() => 15),
        prisma.questionError
          .findMany({
            where: { userId },
            include: {
              subject: { select: { id: true, name: true } },
              topic: { select: { id: true, title: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: 25,
          })
          .catch(() => []),
      ]);

    let activeTrail: any = existingTrails.find((t: any) => t.status === "ACTIVE") || existingTrails[0] || null;
    let allTrails = existingTrails;

    // Se o usuário tinha a trilha de exemplo pré-carregada da Prefeitura de Santos
    // e seu cargo pretendido não é Santos, limpamos a trilha mock para abrir espaço para a personalizada
    if (
      activeTrail &&
      activeTrail.title === "Trilha Completa • Prefeitura Municipal de Santos • Analista de TI" &&
      user?.targetRole !== "Prefeitura Municipal de Santos • Analista de TI"
    ) {
      await prisma.studyTrail.delete({ where: { id: activeTrail.id } }).catch(() => {});
      const mockId = activeTrail.id;
      activeTrail = null;
      allTrails = allTrails.filter((t: any) => t.id !== mockId);
    }

    let coursesList = externalCourses;

    // Se o usuário ainda não tem Cursos Externos de exemplo, populamos 2 cursos sincronizados
    if (!coursesList || coursesList.length === 0) {
      coursesList = await seedDefaultExternalCourses(userId, existingSubjects);
    }

    // Recarrega matérias do edital atualizadas
    const updatedSubjects = await prisma.subject.findMany({
      where: { userId },
      include: { topics: true },
      orderBy: { priority: "desc" },
    });

    return {
      success: true,
      data: {
        user,
        activeTrail,
        allTrails,
        editalSubjects: updatedSubjects,
        externalCourses: coursesList,
        dueFlashcardsCount: dueFlashcardsCount || 15,
        recentErrors: recentErrors || [],
      },
    };
  } catch (error) {
    console.error("[getStudyTrailsOverviewAction] Erro:", error);
    return {
      success: false,
      error: "Não foi possível carregar suas trilhas e cursos.",
    };
  }
}

async function seedDefaultTrailForUser(userId: string, existingSubjects: any[], targetRole?: string | null) {
  try {
    let subjectsToUse = existingSubjects;

    // Se o edital estiver vazio, cria as matérias base sincronizadas com o Edital Verticalizado
    if (!subjectsToUse || subjectsToUse.length === 0) {
      const defaultDefs = [
        {
          name: "Língua Portuguesa",
          color: "#10B981",
          weight: 8.0,
          topics: ["Sintaxe e Pontuação na Banca", "Concordância e Regência"],
        },
        {
          name: "Lei Orgânica Municipal",
          color: "#6366F1",
          weight: 9.0,
          topics: ["Competências Municipais e Processo Legislativo (LOM)", "Administração Pública Municipal"],
        },
        {
          name: "Banco de Dados & SQL",
          color: "#06B6D4",
          weight: 8.5,
          topics: ["Consultas ANSI SQL e Joins", "Modelagem Relacional e Formas Normais (1FN, 2FN, 3FN e BCNF)"],
        },
        {
          name: "Segurança da Informação & LGPD",
          color: "#F59E0B",
          weight: 8.0,
          topics: ["Lei Geral de Proteção de Dados (Lei 13.709/18) e Criptografia"],
        },
      ];

      subjectsToUse = [];
      for (const def of defaultDefs) {
        const createdSub = await prisma.subject.create({
          data: {
            userId,
            name: def.name,
            importance: "Alta",
            color: def.color,
            weight: def.weight,
            priority: def.weight,
            topics: {
              create: def.topics.map((tTitle) => ({
                title: tTitle,
                firstStudy: "Pendente",
                performance: 0,
                relevance: "8/10",
              })),
            },
          },
          include: { topics: true },
        });
        subjectsToUse.push(createdSub);
      }
    }

    // Garante que temos disciplinas para Semana 1, 2, 3 (Atual) e 4
    const subPort = subjectsToUse[0];
    const subLei = subjectsToUse[1] || subjectsToUse[0];
    const subSql = subjectsToUse[2] || subjectsToUse[0];
    const subSec = subjectsToUse[3] || subjectsToUse[0];

    const topPort = subPort?.topics?.[0];
    const topLei = subLei?.topics?.[0];
    const topSql = subSql?.topics?.[1] || subSql?.topics?.[0];
    const topSec = subSec?.topics?.[0];

    const banca = "IBAM";
    const trailTitle =
      targetRole && targetRole !== "Concurso Geral"
        ? `${targetRole}`
        : "Prefeitura Municipal de Santos • Analista de TI";

    const lessonsPayload = [
      // Semana 1 (Concluída)
      {
        weekNumber: 1,
        dayNumber: 1,
        orderIndex: 1,
        subjectId: subPort?.id || null,
        topicId: topPort?.id || null,
        lessonType: "THEORY",
        title: `Aula 1 • ${subPort?.name || "Português"}: ${topPort?.title || "Sintaxe e Interpretação"}`,
        subtitle: "Teoria Esquematizada + 40 Questões Comentadas",
        estimatedMinutes: 30,
        level: "ADVANCED",
        isCompleted: true,
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        theoryData: buildRichTheoryForTopic(
          subPort?.name || "Língua Portuguesa",
          topPort?.title || "Sintaxe e Pontuação",
          banca,
          "ADVANCED",
          1,
        ) as any,
      },
      // Semana 2 (Concluída)
      {
        weekNumber: 2,
        dayNumber: 1,
        orderIndex: 1,
        subjectId: subSql?.id || null,
        topicId: subSql?.topics?.[0]?.id || null,
        lessonType: "THEORY",
        title: `Aula 1 • ${subSql?.name || "Banco de Dados"}: Fundamentos de SQL & Joins`,
        subtitle: "Consultas ANSI SQL, Agregações e Subqueries",
        estimatedMinutes: 30,
        level: "INTERMEDIATE",
        isCompleted: true,
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        theoryData: buildRichTheoryForTopic(
          subSql?.name || "Banco de Dados & SQL",
          "Fundamentos de SQL e Joins",
          banca,
          "INTERMEDIATE",
          1,
        ) as any,
      },
      // Semana 3 (Semana Atual - Aula 1 e Aula 2 abertas + Revisão FSRS)
      {
        weekNumber: 3,
        dayNumber: 4,
        orderIndex: 1,
        subjectId: subLei?.id || null,
        topicId: topLei?.id || null,
        lessonType: "THEORY",
        title: "Aula 1 • Lei Orgânica Municipal: Competências e Prazos",
        subtitle: "Teoria Completa + Quadro de Quóruns + Questão Comentada",
        estimatedMinutes: 20,
        level: "BEGINNER",
        isCompleted: false,
        theoryData: buildRichTheoryForTopic(
          "Lei Orgânica Municipal",
          "Competências Municipais e Processo Legislativo",
          banca,
          "BEGINNER",
          1,
        ) as any,
      },
      {
        weekNumber: 3,
        dayNumber: 4,
        orderIndex: 2,
        subjectId: subSql?.id || null,
        topicId: topSql?.id || null,
        lessonType: "THEORY",
        title: "Aula 2 • Banco de Dados: Formas Normais (1FN, 2FN, 3FN e BCNF)",
        subtitle: "Teoria + Decomposição de Tabelas + Questão de Fixação",
        estimatedMinutes: 25,
        level: "INTERMEDIATE",
        isCompleted: false,
        theoryData: buildRichTheoryForTopic(
          "Banco de Dados & SQL",
          "Formas Normais (1FN, 2FN, 3FN e BCNF)",
          banca,
          "INTERMEDIATE",
          2,
        ) as any,
      },
      {
        weekNumber: 3,
        dayNumber: 4,
        orderIndex: 3,
        subjectId: subPort?.id || null,
        topicId: topPort?.id || null,
        lessonType: "FLASHCARDS",
        title: `Revisão Diária FSRS: Flashcards de ${subPort?.name || "Português"} (${banca})`,
        subtitle: "Repetição Espaçada Sincronizada com seu Deck",
        estimatedMinutes: 15,
        level: "INTERMEDIATE",
        isCompleted: true,
        completedAt: new Date(),
        theoryData: null,
      },
      // Semana 4 (Próxima Semana - Desbloqueável a qualquer momento no Ritmo Livre)
      {
        weekNumber: 4,
        dayNumber: 1,
        orderIndex: 1,
        subjectId: subSec?.id || null,
        topicId: topSec?.id || null,
        lessonType: "THEORY",
        title: `Aula 1 • ${subSec?.name || "Segurança da Informação & LGPD"} (Lei 13.709/18)`,
        subtitle: "Bases Legais, ANPD, Criptografia e Incidentes",
        estimatedMinutes: 25,
        level: "BEGINNER",
        isCompleted: false,
        theoryData: buildRichTheoryForTopic(
          subSec?.name || "Segurança da Informação & LGPD",
          topSec?.title || "LGPD e Criptografia Aplicada",
          banca,
          "BEGINNER",
          1,
        ) as any,
      },
      {
        weekNumber: 4,
        dayNumber: 1,
        orderIndex: 2,
        subjectId: subLei?.id || null,
        topicId: topLei?.id || null,
        lessonType: "SIMULADO",
        title: `Simulado Dirigido ${banca} • 20 Questões dos Tópicos Estudados`,
        subtitle: "Correção imediata com diagnóstico de lacunas e XP em dobro",
        estimatedMinutes: 35,
        level: "INTERMEDIATE",
        isCompleted: false,
        theoryData: null,
      },
    ];

    const createdTrail = await prisma.studyTrail.create({
      data: {
        userId,
        title: trailTitle,
        banca,
        customInstructions:
          "Foco em Lei Orgânica Municipal do zero e tabelas comparativas em Banco de Dados e Engenharia de Software.",
        studyDays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        dailyHours: 2.0,
        weekendHours: 4.0,
        currentWeek: 3,
        status: "ACTIVE",
        lessons: {
          create: lessonsPayload,
        },
      },
      include: {
        lessons: {
          include: {
            subject: true,
            topic: true,
          },
          orderBy: [{ weekNumber: "asc" }, { orderIndex: "asc" }],
        },
      },
    });

    return { trail: createdTrail };
  } catch (err) {
    console.error("[seedDefaultTrailForUser] Erro:", err);
    return null;
  }
}

async function seedDefaultExternalCourses(userId: string, existingSubjects: any[]) {
  try {
    const subSql = existingSubjects.find((s) => s.name.toLowerCase().includes("banco") || s.name.toLowerCase().includes("inform")) || existingSubjects[0];
    const subLei = existingSubjects.find((s) => s.name.toLowerCase().includes("lei") || s.name.toLowerCase().includes("constit")) || existingSubjects[1] || existingSubjects[0];

    const c1 = await prisma.externalCourse.create({
      data: {
        userId,
        subjectId: subSql?.id || null,
        title: "Banco de Dados & Engenharia de Software (Pacote TI)",
        provider: "Estratégia Concursos",
        category: "PDF + Vídeo",
        items: {
          create: [
            {
              title: "PDF 00 • Conceitos de SGBD e Arquitetura ANSI/SPARC (45 págs)",
              itemType: "PDF",
              estimatedMinutes: 45,
              orderIndex: 1,
              isCompleted: true,
              completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              topicId: subSql?.topics?.[0]?.id || null,
            },
            {
              title: "PDF 01 • Modelo Relacional, Chaves e Integridade Referencial (62 págs)",
              itemType: "PDF",
              estimatedMinutes: 50,
              orderIndex: 2,
              isCompleted: true,
              completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              topicId: subSql?.topics?.[0]?.id || null,
            },
            {
              title: "PDF 02 • Normalização de Dados (1FN a BCNF) + 50 Questões Comentadas",
              itemType: "PDF",
              estimatedMinutes: 60,
              orderIndex: 3,
              isCompleted: false,
              topicId: subSql?.topics?.[1]?.id || subSql?.topics?.[0]?.id || null,
            },
          ],
        },
      },
      include: {
        subject: true,
        items: { include: { topic: true }, orderBy: { orderIndex: "asc" } },
      },
    });

    const c2 = await prisma.externalCourse.create({
      data: {
        userId,
        subjectId: subLei?.id || null,
        title: "Legislação Municipal & Direito Administrativo Intensivo",
        provider: "Gran Cursos Online",
        category: "Videoaulas",
        items: {
          create: [
            {
              title: "Videoaula 01 • Simetria Constitucional e Autonomia Municipal (Art. 29 CF)",
              itemType: "VIDEO",
              estimatedMinutes: 35,
              orderIndex: 1,
              isCompleted: true,
              completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              topicId: subLei?.topics?.[0]?.id || null,
            },
            {
              title: "Videoaula 02 • Processo Legislativo Municipal e Quóruns Qualificados",
              itemType: "VIDEO",
              estimatedMinutes: 40,
              orderIndex: 2,
              isCompleted: false,
              topicId: subLei?.topics?.[0]?.id || null,
            },
          ],
        },
      },
      include: {
        subject: true,
        items: { include: { topic: true }, orderBy: { orderIndex: "asc" } },
      },
    });

    return [c1, c2];
  } catch (err) {
    console.error("[seedDefaultExternalCourses] Erro:", err);
    return [];
  }
}

/**
 * Cria uma nova Trilha Personalizada a partir do Wizard de 3 Passos,
 * sincronizando automaticamente com o Edital Verticalizado (Subject & Topic)
 * e com as metas de carga horária do Cronograma Semanal (User).
 */
export async function createCustomStudyTrailAction(input: CreateCustomTrailInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const cleanTitle = input.title.trim() || "Trilha Personalizada de Aprovação";
    const cleanBanca = input.banca.trim() || "GERAL";
    const studyDays = input.studyDays.length > 0 ? input.studyDays : ["Seg", "Ter", "Qua", "Qui", "Sex"];
    const weeklyHours = Math.max(
      4,
      Math.round(
        studyDays.filter((d) => d !== "Sáb" && d !== "Dom").length * (input.dailyHours || 2) +
          studyDays.filter((d) => d === "Sáb" || d === "Dom").length * (input.weekendHours || 4),
      ),
    );

    // 1. Atualiza o Perfil / Cronograma do Usuário (Sincronização com /week e /edital)
    await prisma.user.update({
      where: { id: userId },
      data: {
        targetRole: cleanTitle,
        weeklyGoalHours: weeklyHours,
        activeDaysPerWeek: studyDays.length,
      },
    });

    // 2. Pausa trilhas anteriores para manter 1 Trilha Ativa limpa (Single Source of Truth)
    await prisma.studyTrail.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "PAUSED" },
    });

    // 3. Sincroniza as disciplinas com o Edital Verticalizado (Subject & Topic)
    const existingSubjects = await prisma.subject.findMany({
      where: { userId },
      include: { topics: true },
    });

    const palette = ["#6366F1", "#10B981", "#06B6D4", "#F59E0B", "#EC4899", "#8B5CF6", "#3B82F6"];
    const syncedSubjects: { subject: any; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" }[] = [];

    for (let i = 0; i < input.subjects.length; i++) {
      const subInput = input.subjects[i];
      const weightByLevel =
        subInput.level === "BEGINNER" ? 9.0 : subInput.level === "INTERMEDIATE" ? 7.5 : 6.0;
      const importanceByLevel =
        subInput.level === "BEGINNER" ? "Alta" : subInput.level === "INTERMEDIATE" ? "Média" : "Baixa";

      let dbSub = existingSubjects.find(
        (s) => s.name.trim().toLowerCase() === subInput.name.trim().toLowerCase(),
      );

      if (!dbSub) {
        const defaultTopicTitles =
          subInput.topics && subInput.topics.length > 0
            ? subInput.topics
            : [
                `Fundamentos e Teoria Base de ${subInput.name}`,
                `Pontos Avançados e Pegadinhas da ${cleanBanca} em ${subInput.name}`,
              ];

        dbSub = await prisma.subject.create({
          data: {
            userId,
            name: subInput.name.trim(),
            importance: importanceByLevel,
            color: palette[i % palette.length],
            weight: weightByLevel,
            priority: weightByLevel,
            topics: {
              create: defaultTopicTitles.map((tTitle) => ({
                title: tTitle,
                firstStudy: "Pendente",
                performance: 0,
                relevance: subInput.level === "BEGINNER" ? "9/10" : "7/10",
              })),
            },
          },
          include: { topics: true },
        });
      } else {
        // Atualiza prioridade conforme calibragem da trilha
        dbSub = await prisma.subject.update({
          where: { id: dbSub.id },
          data: {
            weight: weightByLevel,
            priority: weightByLevel,
            importance: importanceByLevel,
          },
          include: { topics: true },
        });
      }

      syncedSubjects.push({ subject: dbSub, level: subInput.level });
    }

    // 4. Monta as Aulas e Metas distribuídas em 4 Semanas (Ritmo Livre, abrindo na Semana 1 • Aula 1)
    const lessonsToCreate: any[] = [];
    for (let week = 1; week <= 4; week++) {
      const subA = syncedSubjects[(week - 1) % syncedSubjects.length];
      const subB = syncedSubjects[week % syncedSubjects.length] || subA;

      const topA = subA.subject.topics?.[0] || null;
      const topB = subB.subject.topics?.[1] || subB.subject.topics?.[0] || null;

      const topicTitleA = topA?.title || `Conceitos Essenciais de ${subA.subject.name}`;
      const topicTitleB = topB?.title || `Aplicação Prática de ${subB.subject.name}`;

      const cachedA = await findReusableTheoryInDatabase(subA.subject.name, topicTitleA, cleanBanca);
      const identityA = await resolveCanonicalTopicIdentity(subA.subject.name, topicTitleA);
      const theoryA: RichTheoryData = cachedA?.theoryData || {
        ...buildRichTheoryForTopic(subA.subject.name, topicTitleA, cleanBanca, subA.level, 1),
        canonicalKey: identityA.canonicalKey,
        semanticTokens: identityA.semanticTokens,
        cacheSource: "BUILT_IN",
      };

      const cachedB = await findReusableTheoryInDatabase(subB.subject.name, topicTitleB, cleanBanca);
      const identityB = await resolveCanonicalTopicIdentity(subB.subject.name, topicTitleB);
      const theoryB: RichTheoryData = cachedB?.theoryData || {
        ...buildRichTheoryForTopic(subB.subject.name, topicTitleB, cleanBanca, subB.level, 2),
        canonicalKey: identityB.canonicalKey,
        semanticTokens: identityB.semanticTokens,
        cacheSource: "BUILT_IN",
      };

      // Aula 1 da Semana
      lessonsToCreate.push({
        weekNumber: week,
        dayNumber: 1,
        orderIndex: 1,
        subjectId: subA.subject.id,
        topicId: topA?.id || null,
        lessonType: "THEORY",
        title: `Aula 1 • ${subA.subject.name}: ${topicTitleA}`,
        subtitle: `Teoria Direcionada (${cleanBanca}) + Quadro Comparativo + Questão`,
        estimatedMinutes: 25,
        level: subA.level,
        isCompleted: false,
        theoryData: theoryA,
      });

      // Aula 2 da Semana
      lessonsToCreate.push({
        weekNumber: week,
        dayNumber: 2,
        orderIndex: 2,
        subjectId: subB.subject.id,
        topicId: topB?.id || null,
        lessonType: "THEORY",
        title: `Aula 2 • ${subB.subject.name}: ${topicTitleB}`,
        subtitle: `Teoria Esquematizada + Raio-X da Banca ${cleanBanca}`,
        estimatedMinutes: 25,
        level: subB.level,
        isCompleted: false,
        theoryData: theoryB,
      });

      // Meta 3 da Semana (Flashcards FSRS ou Simulado Dirigido)
      if (week < 4) {
        lessonsToCreate.push({
          weekNumber: week,
          dayNumber: 3,
          orderIndex: 3,
          subjectId: subA.subject.id,
          topicId: topA?.id || null,
          lessonType: "FLASHCARDS",
          title: `Revisão FSRS • 15 Flashcards de ${subA.subject.name} (${cleanBanca})`,
          subtitle: "Repetição Espaçada Ativa no seu Baralho",
          estimatedMinutes: 15,
          level: subA.level,
          isCompleted: false,
          theoryData: null,
        });
      } else {
        lessonsToCreate.push({
          weekNumber: week,
          dayNumber: 3,
          orderIndex: 3,
          subjectId: subA.subject.id,
          topicId: topA?.id || null,
          lessonType: "SIMULADO",
          title: `Simulado Geral ${cleanBanca} • Fechamento do Ciclo`,
          subtitle: "20 questões inéditas com diagnóstico de performance no Edital",
          estimatedMinutes: 35,
          level: "ADVANCED",
          isCompleted: false,
          theoryData: null,
        });
      }
    }

    const newTrail = await prisma.studyTrail.create({
      data: {
        userId,
        title: cleanTitle,
        banca: cleanBanca,
        customInstructions: input.customInstructions || "",
        studyDays,
        dailyHours: input.dailyHours || 2,
        weekendHours: input.weekendHours || 4,
        currentWeek: 1,
        status: "ACTIVE",
        lessons: {
          create: lessonsToCreate,
        },
      },
      include: {
        lessons: {
          include: {
            subject: true,
            topic: true,
          },
          orderBy: [{ weekNumber: "asc" }, { orderIndex: "asc" }],
        },
      },
    });

    revalidatePath("/trilhas");
    revalidatePath("/edital");
    revalidatePath("/week");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: newTrail,
    };
  } catch (error) {
    console.error("[createCustomStudyTrailAction] Erro:", error);
    return {
      success: false,
      error: "Erro ao gerar sua trilha personalizada.",
    };
  }
}

/**
 * Conclui (ou desmarca) uma aula/meta da Trilha e SINCRONIZA EM CASCATA com:
 * 1. Edital Verticalizado (Topic.firstStudy = "Concluido", Topic.lastRev, Topic.nextRev)
 * 2. Cronograma Semanal / Performance (Cria StudySession com os minutos estudados)
 * 3. Gamificação (Soma +40 XP, +150 XP se fechar a semana, atualiza Streak e DailyQuests)
 */
export async function toggleTrailLessonCompletionAction(params: {
  lessonId: string;
  completed: boolean;
  studyMinutes?: number;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const lesson = await prisma.trailLesson.findUnique({
      where: { id: params.lessonId },
      include: { trail: true },
    });

    if (!lesson || (lesson.trail && lesson.trail.userId !== userId)) {
      return { success: false, error: "Aula não encontrada ou sem permissão." };
    }

    const now = new Date();
    const updatedLesson = await prisma.trailLesson.update({
      where: { id: params.lessonId },
      data: {
        isCompleted: params.completed,
        completedAt: params.completed ? now : null,
      },
    });

    let xpAwarded = 0;
    let weekCompletedBonus = false;

    if (params.completed) {
      xpAwarded += 40;

      // 1. Sincroniza com o Tópico do Edital Verticalizado (/edital)
      if (lesson.topicId) {
        const nextReviewDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        await prisma.topic
          .update({
            where: { id: lesson.topicId },
            data: {
              firstStudy: "Concluido",
              lastRev: now,
              nextRev: nextReviewDate,
              interval: 3,
              repetitions: { increment: 1 } as any,
            },
          })
          .catch(() => null);
      }

      // 2. Sincroniza com o Cronograma Semanal (/week) e Horas Líquidas (/performance)
      const mins = params.studyMinutes || lesson.estimatedMinutes || 25;
      await prisma.studySession
        .create({
          data: {
            userId,
            date: now,
            status: "COMPLETED",
            durationMinutes: mins,
            notes: `Trilha Guiada: ${lesson.title}`,
          },
        })
        .catch(() => null);

      // 3. Verifica se todas as metas desta Semana foram concluídas (Bônus de Semana Fechada!)
      const weekLessons = await prisma.trailLesson.findMany({
        where: {
          trailId: lesson.trailId,
          weekNumber: lesson.weekNumber,
        },
      });

      const allWeekDone =
        weekLessons.length > 0 &&
        weekLessons.every((l: any) => (l.id === lesson.id ? true : l.isCompleted));

      if (allWeekDone) {
        xpAwarded += 150;
        weekCompletedBonus = true;
      }

      // 4. Sincroniza com Gamificação (UserStats: XP + Streak + DailyQuests)
      const existingStats = await prisma.userStats.findUnique({ where: { userId } });
      if (existingStats) {
        await prisma.userStats.update({
          where: { userId },
          data: {
            totalXp: (existingStats.totalXp || 0) + xpAwarded,
            streakDays: Math.max(1, existingStats.streakDays || 1),
            lastStudyDate: now,
          },
        });
      } else {
        await prisma.userStats.create({
          data: {
            userId,
            totalXp: xpAwarded,
            streakDays: 1,
            lastStudyDate: now,
          },
        });
      }

      // Avança Missões Diárias pendentes
      const activeQuests = await prisma.dailyQuest.findMany({
        where: { userId, completed: false },
      });
      for (const q of activeQuests) {
        const nextCount = (q.currentCount || 0) + 1;
        await prisma.dailyQuest.update({
          where: { id: q.id },
          data: {
            currentCount: nextCount,
            completed: nextCount >= (q.targetCount || 1),
          },
        });
      }

      await invalidateUserCacheAction(userId).catch(() => null);
    } else if (lesson.topicId) {
      // Se desmarcou a aula, retorna o tópico para "Em Estudo"
      await prisma.topic
        .update({
          where: { id: lesson.topicId },
          data: { firstStudy: "Em Estudo" },
        })
        .catch(() => null);
    }

    revalidatePath("/trilhas");
    revalidatePath("/edital");
    revalidatePath("/week");
    revalidatePath("/dashboard");
    revalidatePath("/performance");

    return {
      success: true,
      data: {
        lesson: updatedLesson,
        xpAwarded,
        weekCompletedBonus,
      },
    };
  } catch (error) {
    console.error("[toggleTrailLessonCompletionAction] Erro:", error);
    return {
      success: false,
      error: "Não foi possível atualizar o status da aula.",
    };
  }
}

/**
 * Permite ao aluno avançar/alternar livremente para qualquer semana (Ritmo Livre / Self-Paced),
 * sem precisar esperar a semana virar no calendário.
 */
export async function setActiveTrailWeekAction(params: { trailId: string; weekNumber: number }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Não autorizado." };
    }

    const ownedTrail = await prisma.studyTrail.findFirst({
      where: { id: params.trailId, userId },
      select: { id: true },
    });

    if (!ownedTrail) {
      return { success: false, error: "Trilha não encontrada ou sem permissão." };
    }

    const updated = await prisma.studyTrail.update({
      where: { id: ownedTrail.id },
      data: { currentWeek: params.weekNumber },
    });
    revalidatePath("/trilhas");
    return { success: true, data: updated };
  } catch (error) {
    console.error("[setActiveTrailWeekAction] Erro:", error);
    return { success: false, error: "Erro ao alternar semana da trilha." };
  }
}

/**
 * Salva as anotações pessoais do aluno diretamente na aula no banco de dados.
 */
export async function saveTrailLessonNotesAction(params: { lessonId: string; notes: string }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Não autorizado." };
    }

    const ownedLesson = await prisma.trailLesson.findFirst({
      where: { id: params.lessonId, trail: { userId } },
      select: { id: true },
    });

    if (!ownedLesson) {
      return { success: false, error: "Aula não encontrada ou sem permissão." };
    }

    await prisma.trailLesson.update({
      where: { id: ownedLesson.id },
      data: { studentNotes: String(params.notes || "").slice(0, 20000) },
    });
    return { success: true };
  } catch (error) {
    console.error("[saveTrailLessonNotesAction] Erro:", error);
    return { success: false, error: "Erro ao salvar anotação." };
  }
}

/**
 * Registra a resposta da Questão de Fixação da Aula:
 * - Atualiza QuizAttempt e Topic.performance no Edital Verticalizado
 * - Concede +15 XP se acertar
 */
export async function recordLessonFixationQuizAction(params: {
  lessonId: string;
  isCorrect: boolean;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const lesson = await prisma.trailLesson.findUnique({
      where: { id: params.lessonId },
      include: {
        subject: { select: { id: true, name: true } },
      },
    });

    let updatedPerf = 65;

    if (lesson?.topicId) {
      await prisma.quizAttempt
        .create({
          data: {
            userId,
            topicId: lesson.topicId,
            totalCount: 1,
            correctCount: params.isCorrect ? 1 : 0,
          },
        })
        .catch(() => null);

      const currentTopic = await prisma.topic.findUnique({ where: { id: lesson.topicId } });
      if (currentTopic) {
        const currentPerf = currentTopic.performance || 65;
        updatedPerf = params.isCorrect
          ? Math.min(100, currentPerf + 15)
          : Math.max(20, currentPerf - 10);
        await prisma.topic
          .update({
            where: { id: lesson.topicId },
            data: { performance: updatedPerf, lastQuizAt: new Date() },
          })
          .catch(() => null);
      }
    }

    if (params.isCorrect) {
      const stats = await prisma.userStats.findUnique({ where: { userId } });
      if (stats) {
        await prisma.userStats.update({
          where: { userId },
          data: { totalXp: (stats.totalXp || 0) + 15 },
        });
      }
    }

    // ========================================================================
    // 🧠🔥 AUTO-LEVEL UP (DIFICULDADE ADAPTATIVA AUTOMÁTICA)
    // ========================================================================
    let autoLevelUp: {
      triggered: boolean;
      direction: "UP" | "DOWN";
      newLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
      subjectName: string;
      updatedLessonIds: string[];
      message: string;
    } | null = null;

    if (lesson && lesson.trailId && lesson.subjectId) {
      const subjectName = lesson.subject?.name || "esta matéria";
      const currentLevel =
        (lesson.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") || "BEGINNER";

      if (params.isCorrect && currentLevel !== "ADVANCED" && updatedPerf >= 78) {
        const nextLevel: "INTERMEDIATE" | "ADVANCED" =
          currentLevel === "BEGINNER" ? "ADVANCED" : "ADVANCED";

        // Eleva automaticamente as próximas aulas não concluídas desta mesma matéria na trilha
        const futureLessons = await prisma.trailLesson.findMany({
          where: {
            trailId: lesson.trailId,
            subjectId: lesson.subjectId,
            isCompleted: false,
            id: { not: lesson.id },
          },
          select: { id: true },
        });

        const updatedIds = futureLessons.map((fl) => fl.id);
        if (updatedIds.length > 0) {
          await prisma.trailLesson.updateMany({
            where: { id: { in: updatedIds } },
            data: { level: nextLevel },
          });
        }

        autoLevelUp = {
          triggered: true,
          direction: "UP",
          newLevel: nextLevel,
          subjectName,
          updatedLessonIds: updatedIds,
          message: `🧠🔥 Auto-Level Up! Você atingiu ${updatedPerf}% de domínio em ${subjectName}! Subimos automaticamente suas próximas aulas deste tema para o nível Hardcore!`,
        };
      } else if (!params.isCorrect && currentLevel === "ADVANCED" && updatedPerf <= 45) {
        autoLevelUp = {
          triggered: true,
          direction: "DOWN",
          newLevel: "BEGINNER",
          subjectName,
          updatedLessonIds: [],
          message: `🌱 Dica Adaptativa: ${subjectName} está em nível Hardcore. Se quiser consolidar os fundamentos antes das pegadinhas, você pode alternar para 🌱 Nível Base no topo da aula!`,
        };
      }
    }

    return {
      success: true,
      xpEarned: params.isCorrect ? 15 : 0,
      autoLevelUp,
    };
  } catch (error) {
    console.error("[recordLessonFixationQuizAction] Erro:", error);
    return { success: false };
  }
}

/**
 * Botão de 1 Clique (+ Guardar no Caderno de Erros) quando o aluno erra a questão de fixação:
 * Cria o registro em QuestionError (/notebook) reaproveitando a explicação e o mnemônico já existentes na aula
 * (Zero gasto extra de tokens de IA e sem poluir o Caderno de Erros sem intenção do aluno!).
 */
export async function saveFixationQuizToErrorNotebookAction(params: {
  lessonId: string;
  userAnswer: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const lesson = await prisma.trailLesson.findUnique({
      where: { id: params.lessonId },
    });

    if (!lesson || !lesson.theoryData) {
      return { success: false, error: "Dados da questão não encontrados." };
    }

    const theory = lesson.theoryData as unknown as RichTheoryData;
    const quiz = theory.fixationQuiz;

    const createdError = await prisma.questionError.create({
      data: {
        userId,
        subjectId: lesson.subjectId || null,
        topicId: lesson.topicId || null,
        questionText: quiz.question,
        options: quiz.options.map((o) => ({ id: o.id, texto: o.text })),
        userAnswer: params.userAnswer,
        correctAnswer: quiz.correctOptionId,
        explanation: quiz.explanation,
        aiExplanation: quiz.explanation,
        mnemonic: quiz.mnemonic,
        errorReason: "CONTENT_GAP",
        status: "PENDING",
      },
    });

    revalidatePath("/notebook");
    return { success: true, data: createdError };
  } catch (error) {
    console.error("[saveFixationQuizToErrorNotebookAction] Erro:", error);
    return { success: false, error: "Não foi possível salvar no Caderno de Erros." };
  }
}

/**
 * Botão de 1 Clique (+ Transformar Aula em Flashcards):
 * Cria os Flashcards FSRS diretamente no baralho da disciplina/tópico do aluno
 * usando as sementes pré-geradas da aula (Zero requisições extras de IA!).
 */
export async function createFlashcardsFromTrailLessonAction(params: { lessonId: string }) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const lesson = await prisma.trailLesson.findUnique({
      where: { id: params.lessonId },
      include: { subject: true, topic: true },
    });

    if (!lesson || !lesson.theoryData) {
      return { success: false, error: "Conteúdo da aula não encontrado." };
    }

    const theory = lesson.theoryData as unknown as RichTheoryData;
    const seeds = theory.flashcardsSeed || [];

    // Busca ou cria o Deck vinculado à disciplina
    let deck = await prisma.deck.findFirst({
      where: {
        userId,
        subjectId: lesson.subjectId || undefined,
      },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: lesson.subject?.name || "Baralho da Trilha Guiada",
          color: lesson.subject?.color || "#6366F1",
          subjectId: lesson.subjectId || null,
          topicId: lesson.topicId || null,
        },
      });
    }

    const createdCards = [];
    for (const seed of seeds) {
      const card = await prisma.flashcard.create({
        data: {
          deckId: deck.id,
          topicId: lesson.topicId || null,
          question: seed.question,
          answer: seed.answer,
          details: seed.details || lesson.title,
          nextReviewDate: new Date(),
        },
      });
      createdCards.push(card);
    }

    revalidatePath("/flashcards");
    revalidatePath("/dashboard");

    return {
      success: true,
      count: createdCards.length,
      deckTitle: deck.title,
    };
  } catch (error) {
    console.error("[createFlashcardsFromTrailLessonAction] Erro:", error);
    return {
      success: false,
      error: "Não foi possível criar os flashcards desta aula.",
    };
  }
}

/**
 * Marca/desmarca um PDF ou Videoaula de um Curso Externo (Estratégia, Gran, etc.)
 * e sincroniza com o Tópico do Edital (/edital), Sessão de Estudo (/week) e Gamificação (+30 XP).
 */
export async function toggleExternalCourseItemAction(params: {
  itemId: string;
  completed: boolean;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const item = await prisma.externalCourseItem.findUnique({
      where: { id: params.itemId },
    });

    if (!item) {
      return { success: false, error: "Item do curso não encontrado." };
    }

    const now = new Date();
    const updated = await prisma.externalCourseItem.update({
      where: { id: params.itemId },
      data: {
        isCompleted: params.completed,
        completedAt: params.completed ? now : null,
      },
    });

    if (params.completed) {
      if (item.topicId) {
        await prisma.topic
          .update({
            where: { id: item.topicId },
            data: {
              firstStudy: "Concluido",
              lastRev: now,
              nextRev: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            },
          })
          .catch(() => null);
      }

      await prisma.studySession
        .create({
          data: {
            userId,
            date: now,
            status: "COMPLETED",
            durationMinutes: item.estimatedMinutes || 45,
            notes: `Curso Externo: ${item.title}`,
          },
        })
        .catch(() => null);

      const stats = await prisma.userStats.findUnique({ where: { userId } });
      if (stats) {
        await prisma.userStats.update({
          where: { userId },
          data: {
            totalXp: (stats.totalXp || 0) + 30,
            lastStudyDate: now,
          },
        });
      }
    }

    revalidatePath("/trilhas");
    revalidatePath("/edital");
    revalidatePath("/week");
    revalidatePath("/dashboard");

    return { success: true, data: updated, xpAwarded: params.completed ? 30 : 0 };
  } catch (error) {
    console.error("[toggleExternalCourseItemAction] Erro:", error);
    return { success: false, error: "Erro ao atualizar item do curso externo." };
  }
}

/**
 * Permite ao aluno cadastrar um novo Curso Externo / Pacote de PDFs sincronizado com uma matéria do Edital.
 */
export async function createExternalCourseAction(params: {
  title: string;
  provider: string;
  subjectId?: string;
  items: { title: string; itemType: "PDF" | "VIDEO"; estimatedMinutes: number }[];
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "demo-user-id";

    const course = await prisma.externalCourse.create({
      data: {
        userId,
        title: params.title.trim(),
        provider: params.provider.trim() || "Curso Externo",
        subjectId: params.subjectId || null,
        category: "PDF + Vídeo",
        items: {
          create: params.items.map((it, idx) => ({
            title: it.title,
            itemType: it.itemType,
            estimatedMinutes: it.estimatedMinutes || 45,
            orderIndex: idx + 1,
            isCompleted: false,
          })),
        },
      },
      include: {
        subject: true,
        items: { include: { topic: true }, orderBy: { orderIndex: "asc" } },
      },
    });

    revalidatePath("/trilhas");
    return { success: true, data: course };
  } catch (error) {
    console.error("[createExternalCourseAction] Erro:", error);
    return { success: false, error: "Erro ao cadastrar curso externo." };
  }
}

// ============================================================================
// 🧠 MOTOR DE NORMALIZAÇÃO CANÔNICA & SIMILARIDADE SEMÂNTICA ENTRE USUÁRIOS
// ============================================================================

const STOPWORDS_PT = new Set([
  "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "para", "por",
  "com", "sem", "sob", "sobre", "entre", "ate", "a", "o", "as", "os", "e", "ou",
  "um", "uma", "uns", "umas", "nocoes", "nocao", "conceito", "conceitos", "basicos",
  "basico", "introducao", "estudo", "geral", "gerais", "aspectos", "aplicada",
  "aplicado", "aula", "topico", "modulo", "parte", "capitulo", "item", "lei", "n",
]);

const CANONICAL_TAXONOMY_CLUSTERS: { clusterId: string; keywords: string[] }[] = [
  {
    clusterId: "cluster::lgpd-lei-13709-seguranca",
    keywords: ["lgpd", "13709", "protecao", "dados", "pessoais", "anpd", "sensivel", "anonimizacao"],
  },
  {
    clusterId: "cluster::lei-organica-competencias-municipais",
    keywords: ["organica", "municipal", "municipio", "competencia", "camara", "prefeito", "vereador", "artigo 29", "simetria"],
  },
  {
    clusterId: "cluster::banco-dados-formas-normais-sql",
    keywords: ["banco", "dados", "sql", "relacional", "normalizacao", "1fn", "2fn", "3fn", "bcnf", "join", "ddl", "dml"],
  },
  {
    clusterId: "cluster::portugues-sintaxe-crase-regencia",
    keywords: ["portugues", "crase", "regencia", "concordancia", "pontuacao", "reescrita", "sintaxe", "oracao", "conjuncao"],
  },
  {
    clusterId: "cluster::adm-licitacoes-contratos-14133",
    keywords: ["licitacao", "licitacoes", "14133", "pregao", "concorrencia", "dispensa", "inexigibilidade", "contrato"],
  },
  {
    clusterId: "cluster::adm-atos-poderes-administrativos",
    keywords: ["ato", "atos", "administrativo", "administrativos", "atributo", "anulacao", "revogacao", "poderes", "vinculado", "discricionario"],
  },
  {
    clusterId: "cluster::const-direitos-garantias-art5",
    keywords: ["constitucional", "direitos", "garantias", "fundamentais", "habeas", "mandado", "seguranca", "inviolabilidade"],
  },
  {
    clusterId: "cluster::ti-engenharia-software-agil",
    keywords: ["engenharia", "software", "scrum", "kanban", "agil", "requisitos", "uml", "arquitetura", "devops", "git"],
  },
  {
    clusterId: "cluster::ti-redes-criptografia-seguranca",
    keywords: ["redes", "tcp", "osi", "firewall", "criptografia", "assinatura", "certificado", "27001", "27002", "owasp"],
  },
];

/**
 * Normaliza qualquer nome de matéria + tópico (mesmo quando escrito de forma diferente pela IA ou pelo usuário)
 * extraindo:
 * 1. `canonicalKey`: Identificador do cluster conceitual (ex: `cluster::lgpd-lei-13709-seguranca`)
 * 2. `semanticTokens`: Lista ordenada de radicais/palavras-chave limpas para cálculo de Jaccard (>= 55%)
 */
export async function resolveCanonicalTopicIdentity(
  subjectName: string,
  topicTitle: string,
): Promise<{ canonicalKey: string; semanticTokens: string[] }> {
  const raw = `${subjectName} ${topicTitle}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)\.(\d{3})/g, "$1$2") // une números de leis ("13.709" -> "13709", "14.133" -> "14133", "8.112" -> "8112")
    .replace(/\b(\d+(\.\d+)*|[ivxlcdm]+)\s*[-.)]\s*/gi, " ") // remove numeração de edital ("1.2 -", "II.")
    .replace(/[^a-z0-9\s]/g, " ");

  const rawTokens = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS_PT.has(t));

  // Stemming leve para português (unifica plural/singular básico)
  const stemmedTokens = Array.from(
    new Set(
      rawTokens.map((tok) => {
        if (tok.endsWith("coes") && tok.length > 5) return tok.slice(0, -4) + "cao";
        if (tok.endsWith("ais") && tok.length > 5) return tok.slice(0, -3) + "al";
        if (tok.endsWith("s") && tok.length > 4 && !tok.endsWith("ss")) return tok.slice(0, -1);
        return tok;
      }),
    ),
  ).sort();

  // Verifica se pertence a algum cluster taxonômico oficial
  let bestCluster = "";
  let bestClusterHits = 0;

  for (const cluster of CANONICAL_TAXONOMY_CLUSTERS) {
    let hits = 0;
    for (const kw of cluster.keywords) {
      if (raw.includes(kw) || stemmedTokens.includes(kw)) {
        hits++;
      }
    }
    if (hits > bestClusterHits) {
      bestClusterHits = hits;
      bestCluster = cluster.clusterId;
    }
  }

  const canonicalKey =
    bestClusterHits >= 2
      ? bestCluster
      : `custom::${stemmedTokens.slice(0, 5).join("-") || "topico-geral"}`;

  return {
    canonicalKey,
    semanticTokens: stemmedTokens,
  };
}

function computeTokenSimilarity(tokensA: string[], tokensB: string[]): number {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  const containment = Math.min(setA.size, setB.size) > 0
    ? intersection / Math.min(setA.size, setB.size)
    : 0;
  // Combina Jaccard + Containment para lidar com títulos curtos vs títulos longos de edital
  return Math.max(jaccard, containment * 0.85);
}

/**
 * Procura em todas as aulas salvas no banco (de qualquer usuário) se já existe uma Teoria 2.0
 * para o mesmo conceito canônico ou com alta similaridade semântica de tokens (>= 55%).
 */
async function findReusableTheoryInDatabase(
  subjectName: string,
  topicTitle: string,
  banca: string,
  targetLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" = "INTERMEDIATE",
  excludeLessonId?: string,
): Promise<{ theoryData: RichTheoryData; matchType: "CANONICAL_CLUSTER" | "SEMANTIC_SIMILARITY"; similarityScore: number } | null> {
  try {
    const targetIdentity = await resolveCanonicalTopicIdentity(subjectName, topicTitle);

    const existingLessons = await prisma.trailLesson.findMany({
      where: {
        lessonType: "THEORY",
      },
      include: {
        subject: true,
        topic: true,
      },
      take: 150,
    });

    let bestCandidate: {
      theory: RichTheoryData;
      matchType: "CANONICAL_CLUSTER" | "SEMANTIC_SIMILARITY";
      score: number;
    } | null = null;

    for (const candidate of existingLessons) {
      if (excludeLessonId && candidate.id === excludeLessonId) continue;

      // Garante que o nível de dificuldade seja compatível (se o aluno pediu ADVANCED/Hardcore, nunca entrega BEGINNER!)
      const candLevel = (candidate.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") || "BEGINNER";
      if (candLevel !== targetLevel) continue;

      const tData = candidate.theoryData as RichTheoryData | null;
      if (!tData || !tData.sections || tData.sections.length === 0) continue;

      const candSub = candidate.subject?.name || "";
      const candTop = candidate.topic?.title || candidate.title || "";
      const candIdentity =
        tData.canonicalKey && tData.semanticTokens
          ? { canonicalKey: tData.canonicalKey.split("::")[0] + "::" + (tData.canonicalKey.split("::")[1] || ""), semanticTokens: tData.semanticTokens }
          : await resolveCanonicalTopicIdentity(candSub, candTop);

      // 1. Match por Cluster Canônico (ex: ambos são sobre LGPD no mesmo nível de dificuldade)
      if (
        targetIdentity.canonicalKey.startsWith("cluster::") &&
        candIdentity.canonicalKey === targetIdentity.canonicalKey
      ) {
        const bancaBonus =
          tData.bancaTag?.toLowerCase().includes(banca.toLowerCase()) ? 0.08 : 0;
        const score = 0.92 + bancaBonus;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = {
            theory: {
              ...tData,
              canonicalKey: `${targetIdentity.canonicalKey}::${targetLevel}`,
              semanticTokens: targetIdentity.semanticTokens,
              cacheSource: "CANONICAL_CLUSTER",
              bancaTag: `Banca ${banca} • Nível ${targetLevel === "ADVANCED" ? "Hardcore 🔥" : targetLevel === "INTERMEDIATE" ? "Padrão ⚖️" : "Base 🌱"}`,
            },
            matchType: "CANONICAL_CLUSTER",
            score,
          };
        }
        continue;
      }

      // 2. Match por Similaridade de Tokens-Raiz (Jaccard / Containment >= 55%)
      const sim = computeTokenSimilarity(
        targetIdentity.semanticTokens,
        candIdentity.semanticTokens,
      );
      if (sim >= 0.55) {
        if (!bestCandidate || sim > bestCandidate.score) {
          bestCandidate = {
            theory: {
              ...tData,
              canonicalKey: `${targetIdentity.canonicalKey}::${targetLevel}`,
              semanticTokens: targetIdentity.semanticTokens,
              cacheSource: "SEMANTIC_SIMILARITY",
              bancaTag: `Banca ${banca} • Cache Semântico (${Math.round(sim * 100)}%)`,
            },
            matchType: "SEMANTIC_SIMILARITY",
            score: sim,
          };
        }
      }
    }

    if (bestCandidate) {
      return {
        theoryData: bestCandidate.theory,
        matchType: bestCandidate.matchType,
        similarityScore: Math.min(100, Math.round(bestCandidate.score * 100)),
      };
    }

    return null;
  } catch (err) {
    console.error("[findReusableTheoryInDatabase] Erro:", err);
    return null;
  }
}

/**
 * Gera ou Reutiliza (via Cache Canônico/Semântico entre Usuários + Nível de Dificuldade) uma Teoria Profunda 2.0
 * para uma aula da trilha, permitindo ao aluno subir ou descer a dificuldade ("BEGINNER" | "INTERMEDIATE" | "ADVANCED").
 */
export async function generateOrReuseTheoryForLessonAction(params: {
  lessonId: string;
  targetLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  forceRegenerateAI?: boolean;
}) {
  try {
    const session = await auth();
    const _userId = session?.user?.id || "demo-user-id";

    const lesson = await prisma.trailLesson.findUnique({
      where: { id: params.lessonId },
      include: {
        subject: true,
        topic: true,
        trail: true,
      },
    });

    if (!lesson) {
      return { success: false, error: "Aula não encontrada na trilha." };
    }

    const subjectName = lesson.subject?.name || "Disciplina do Concurso";
    const topicTitle = lesson.topic?.title || lesson.title;
    const banca = lesson.trail?.banca || "IBAM";
    const level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" =
      params.targetLevel ||
      (lesson.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") ||
      "BEGINNER";

    const identity = await resolveCanonicalTopicIdentity(subjectName, topicTitle);
    const scopedCanonicalKey = `${identity.canonicalKey}::${level}`;

    // 1. Se não forçou regeneração, tenta primeiro o Cache Canônico/Semântico Global no mesmo Nível de Dificuldade!
    if (!params.forceRegenerateAI) {
      const cached = await findReusableTheoryInDatabase(
        subjectName,
        topicTitle,
        banca,
        level,
        lesson.id,
      );
      if (cached) {
        const updatedLesson = await prisma.trailLesson.update({
          where: { id: lesson.id },
          data: {
            level,
            theoryData: cached.theoryData as any,
          },
          include: { subject: true, topic: true },
        });

        revalidatePath("/trilhas");
        return {
          success: true,
          lesson: updatedLesson,
          source: cached.matchType,
          canonicalKey: scopedCanonicalKey,
          level,
          similarityScore: cached.similarityScore,
          aiTokensUsed: 0,
        };
      }
    }

    // 2. Se for um tópico inédito naquele nível de dificuldade (ex: o aluno pediu nível ADVANCED/Hardcore), chama o Gemini IA!
    const levelDirective =
      level === "ADVANCED"
        ? "NÍVEL AVANÇADO / HARDCORE 🔥: O aluno já domina a base e achou o conteúdo fácil! Aprofunde em exceções legais sutis, jurisprudência do STF/STJ/TCU, casos práticos complexos e elabore uma questão de fixação de alta dificuldade com pegadinha pesada da banca."
        : level === "INTERMEDIATE"
          ? "NÍVEL INTERMEDIÁRIO / PROVA PADRÃO ⚖️: Equilibre conceitos centrais, letra da lei grifada, tabela comparativa e questão estilo prova oficial."
          : "NÍVEL INICIANTE / BASE DO ZERO 🌱: Explique de forma extremamente didática, passo a passo, construindo a base essencial sem jargões obscuros.";

    let aiGeneratedTheory: RichTheoryData | null = null;
    try {
      const prompt = `Você é um Professor Especialista em Concursos Públicos focado na banca "${banca}".
Elabore uma Aula Teórica Esquematizada Completa 2.0 sobre:
- Disciplina: "${subjectName}"
- Tópico: "${topicTitle}"
- Diretriz de Dificuldade: ${levelDirective}

Retorne APENAS um JSON válido seguindo exatamente esta estrutura:
{
  "canonicalKey": "${scopedCanonicalKey}",
  "moduleTag": "MÓDULO ${level === "ADVANCED" ? "HARDCORE 🔥" : level === "INTERMEDIATE" ? "INTERMEDIÁRIO ⚖️" : "BASE 🌱"} • ${subjectName.toUpperCase()}",
  "bancaTag": "Foco ${banca} • Nível ${level === "ADVANCED" ? "Avançado / Pegadinhas Pesadas" : level === "INTERMEDIATE" ? "Padrão de Prova" : "Essencial"}",
  "introLead": "Parágrafo introdutório direto ao ponto explicando o que mais despenca na prova.",
  "sections": [
    {
      "heading": "1. Fundamentos, Base Legal e Doutrina/Jurisprudência",
      "body": "Explicação densa, didática e com exemplos reais cobrados em prova.",
      "calloutTitle": "📌 Artigo / Súmula / Regra de Ouro Grifada",
      "calloutText": "Citação literal ou entendimento mais cobrado pela banca.",
      "calloutType": "info"
    },
    {
      "heading": "2. Pegadinhas de Prova da Banca ${banca} e Casos Práticos",
      "body": "Detalhamento das exceções e inversões de conceitos que a banca faz.",
      "calloutTitle": "⚠️ Cuidado com a Pegadinha (${level})",
      "calloutText": "Alerta prático do que não confundir na hora da prova.",
      "calloutType": "warning"
    }
  ],
  "tableData": {
    "headers": ["Critério / Conceito", "Regra Geral", "Exceção / Pegadinha de Prova (${level})"],
    "rows": [
      ["Aspecto Principal", "Como funciona na regra padrão", "Como a banca ${banca} tenta induzir ao erro"],
      ["Prazo / Quórum / Chave", "Detalhe técnico exato", "Diferença essencial para memorizar"]
    ]
  },
  "examTipTitle": "🧠 Macete Mnemônico (${level})",
  "examTipText": "Frase ou sigla mnemônica curta para acertar qualquer questão em 15 segundos.",
  "summaryPoints": [
    "Ponto-chave 1 direto ao ponto para revisão de 1 minuto.",
    "Ponto-chave 2 sobre a principal exceção cobrada pela banca.",
    "Ponto-chave 3 resumindo a tabela comparativa."
  ],
  "fixationQuiz": {
    "question": "(${banca} - Nível ${level === "ADVANCED" ? "Difícil / Hardcore" : "Padrão"}) Enunciado técnico de questão estilo prova sobre ${topicTitle}:",
    "bancaTag": "Banca ${banca} • ${level}",
    "options": [
      { "id": "A", "text": "Alternativa A plausível porém incorreta." },
      { "id": "B", "text": "Alternativa B correta e fundamentada." },
      { "id": "C", "text": "Alternativa C com pegadinha clássica." },
      { "id": "D", "text": "Alternativa D incorreta." }
    ],
    "correctOptionId": "B",
    "explanation": "Gabarito Comentado explicando por que a B está correta e o erro das demais.",
    "mnemonic": "Resumo do macete para nunca mais errar."
  },
  "faqItems": [
    {
      "question": "Qual a pegadinha mais difícil da banca ${banca} neste tópico?",
      "answer": "Resposta objetiva e clara."
    },
    {
      "question": "Como esse tema é cobrado em questões de nível ${level}?",
      "answer": "Resposta orientando o estudo estratégico."
    }
  ],
  "flashcardsSeed": [
    {
      "question": "[${level}] Pergunta direta de frente de flashcard sobre ${topicTitle}?",
      "answer": "Resposta curta e objetiva no verso.",
      "details": "Resumo extra."
    },
    {
      "question": "[${level}] Qual a principal exceção/pegadinha da banca ${banca} em ${topicTitle}?",
      "answer": "Explicação curta da pegadinha.",
      "details": "Atenção redobrada."
    }
  ]
}`;

      const { text } = await generateContentWithFallback({
        prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          temperature: 0.65,
        },
      });

      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        aiGeneratedTheory = {
          ...parsed,
          canonicalKey: scopedCanonicalKey,
          semanticTokens: identity.semanticTokens,
          cacheSource: "GEMINI_AI",
        };
      }
    } catch (aiErr) {
      console.warn("[generateOrReuseTheoryForLessonAction] Fallback para gerador estruturado local:", aiErr);
    }

    const baseBuiltIn = buildRichTheoryForTopic(
      subjectName,
      topicTitle,
      banca,
      level,
      lesson.orderIndex || 1,
    );

    const finalTheory: RichTheoryData = aiGeneratedTheory || {
      ...baseBuiltIn,
      moduleTag: `MÓDULO ${level === "ADVANCED" ? "HARDCORE 🔥" : level === "INTERMEDIATE" ? "INTERMEDIÁRIO ⚖️" : "BASE 🌱"} • ${subjectName.toUpperCase()}`,
      bancaTag: `Banca ${banca} • Nível ${level === "ADVANCED" ? "Hardcore 🔥 (Exceções & Jurisprudência)" : level === "INTERMEDIATE" ? "Padrão de Prova ⚖️" : "Base Essencial 🌱"}`,
      canonicalKey: scopedCanonicalKey,
      semanticTokens: identity.semanticTokens,
      cacheSource: "GEMINI_AI",
    };

    const updatedLesson = await prisma.trailLesson.update({
      where: { id: lesson.id },
      data: {
        level,
        theoryData: finalTheory as any,
      },
      include: { subject: true, topic: true },
    });

    revalidatePath("/trilhas");
    return {
      success: true,
      lesson: updatedLesson,
      source: aiGeneratedTheory ? "GEMINI_AI" : "STRUCTURED_ENGINE",
      canonicalKey: scopedCanonicalKey,
      level,
      similarityScore: 100,
      aiTokensUsed: aiGeneratedTheory ? 1 : 0,
    };
  } catch (error) {
    console.error("[generateOrReuseTheoryForLessonAction] Erro:", error);
    return {
      success: false,
      error: "Não foi possível sincronizar ou gerar a teoria desta aula.",
    };
  }
}


export async function deleteStudyTrailAction(trailId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Não autenticado" };

    const trail = await prisma.studyTrail.findFirst({
      where: { id: trailId, userId },
    });

    if (!trail) {
      return { success: false, error: "Trilha não encontrada" };
    }

    await prisma.studyTrail.delete({
      where: { id: trailId },
    });

    revalidatePath("/trilhas");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteStudyTrailAction] Erro:", error);
    return { success: false, error: "Falha ao excluir trilha" };
  }
}
