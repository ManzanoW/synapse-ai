"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateContentWithFallback } from "@/lib/gemini-fallback";
import { recordStudyActivityAction } from "@/actions/gamification-actions";

export interface JurisprudenceItem {
  id: string;
  numero: string;
  tribunal: "STF" | "STJ" | "TST" | "TSE" | "GERAL";
  disciplina: string;
  assunto: string;
  titulo: string;
  teseResumida: string;
  teseOriginal: string;
  divergenciaOuEvolucao?: string;
  pegadinhaBanca: string;
  casoPratico: string;
  flashcardFrente: string;
  flashcardVerso: string;
  isCustomGenerated?: boolean;
}

// Catálogo Curado de Alta Incidência em Concursos Públicos
export const CURATED_JURISPRUDENCE: JurisprudenceItem[] = [
  {
    id: "sv-13",
    numero: "Súmula Vinculante 13",
    tribunal: "STF",
    disciplina: "Direito Constitucional",
    assunto: "Nepotismo na Administração Pública",
    titulo: "Vedação ao Nepotismo e a Exceção dos Cargos Políticos",
    teseResumida:
      "É proibida a nomeação de cônjuge, companheiro ou parente até o terceiro grau (linha reta, colateral ou por afinidade) da autoridade nomeante ou de servidor da mesma pessoa jurídica com poder de direção/chefia para cargos em comissão ou função de confiança. O STF excepciona cargos estritamente políticos (Ministro de Estado, Secretário Estadual/Municipal), salvo hipótese de evidente falta de qualificação técnica ou fraude à lei.",
    teseOriginal:
      "A nomeação de cônjuge, companheiro ou parente em linha reta, colateral ou por afinidade, até o terceiro grau, inclusive, da autoridade nomeante ou de servidor da mesma pessoa jurídica investido em cargo de direção, chefia ou assessoramento, para o exercício de cargo em comissão ou de confiança ou, ainda, de função gratificada na administração pública direta e indireta em qualquer dos poderes da União, dos Estados, do Distrito Federal e dos Municípios, compreendido o ajuste mediante designações recíprocas, viola a Constituição Federal.",
    divergenciaOuEvolucao:
      "Evolução jurisprudencial: O STF fixou que a Súmula Vinculante 13 não incide, em regra, na nomeação para cargos de natureza política (Secretários de Estado e Ministros), mas a nomeação pode ser anulada pelo Judiciário se comprovada manifesta inaptidão técnica ou 'nepotismo cruzado'.",
    pegadinhaBanca:
      "As bancas (Cebraspe e FGV) costumam afirmar que a vedação abrange até o quarto grau (errado, é até o 3º grau: pais, filhos, avós, netos, irmãos, tios e sobrinhos) e que se aplica indistintamente a cargos políticos (errado, cargos políticos são exceção mitigada).",
    casoPratico:
      "O Prefeito nomeia seu irmão médico para Secretário Municipal de Saúde (válido por ser cargo político, se houver qualificação). Porém, nomear o mesmo irmão para Diretor de Departamento de Compras da Prefeitura viola frontalmente a Súmula Vinculante 13.",
    flashcardFrente:
      "Até qual grau de parentesco a Súmula Vinculante 13 do STF proíbe o nepotismo e qual a principal exceção mitigada?",
    flashcardVerso:
      "Até o 3º GRAU (linha reta, colateral e afinidade). Exceção: CARGOS POLÍTICOS (Secretários e Ministros), desde que haja idoneidade e qualificação técnica mínima.",
  },
  {
    id: "sv-14",
    numero: "Súmula Vinculante 14",
    tribunal: "STF",
    disciplina: "Direito Processual Penal",
    assunto: "Acesso do Defensor aos Autos do Inquérito",
    titulo: "Ampla Defesa no Inquérito e Sigilo de Diligências em Andamento",
    teseResumida:
      "O advogado/defensor tem direito assegurado de examinar em qualquer repartição policial os autos de flagrante e de investigações, mesmo sem procuração (salvo se sigiloso). No entanto, o acesso é restrito aos elementos de prova que já estejam DOCUMENTADOS nos autos. Diligências ainda em andamento (ex: escuta telefônica em curso, mandado de busca não cumprido) permanecem sob sigilo legítimo.",
    teseOriginal:
      "É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa.",
    divergenciaOuEvolucao:
      "Harmonizada com o Estatuto da OAB (Art. 7º, XIV e XXI). Se a autoridade policial negar injustificadamente o acesso a autos já encartados, cabe Reclamação Constitucional direta perante o STF e configura crime de Abuso de Autoridade (Lei 13.869/19).",
    pegadinhaBanca:
      "A banca afirma que o defensor tem acesso irrestrito a 'todos os atos da investigação, inclusive interceptações telefônicas em andamento'. Pegadinha clássica! O acesso é APENAS aos elementos JÁ DOCUMENTADOS nos autos.",
    casoPratico:
      "A Polícia Federal está monitorando comunicações em tempo real de uma quadrilha. O advogado do investigado exige cópia das escutas em curso. O delegado pode indeferir legalmente, fornecendo apenas os relatórios e perícias já finalizados e juntados.",
    flashcardFrente:
      "A Súmula Vinculante 14 garante ao defensor acesso irrestrito a interceptações telefônicas e diligências em andamento?",
    flashcardVerso:
      "NÃO! O direito de acesso alcança exclusivamente os elementos de prova que JÁ ESTEJAM DOCUMENTADOS nos autos do inquérito.",
  },
  {
    id: "sv-11",
    numero: "Súmula Vinculante 11",
    tribunal: "STF",
    disciplina: "Direito Penal & Processual",
    assunto: "Uso de Algemas e Presunção de Inocência",
    titulo: "Excepcionalidade do Uso de Algemas (Mnemônico PRSP)",
    teseResumida:
      "O uso de algemas é medida excepcional, somente admitida em casos de Resistência, Fundado Receio de Fuga ou Perigo à integridade física própria ou alheia, decorrente de conduta do preso ou de terceiros. A necessidade deve ser justificada de forma expressa e por escrito pela autoridade policial.",
    teseOriginal:
      "Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros, justificada a excepcionalidade por escrito, sob pena de responsabilidade disciplinar, civil e penal do agente ou da autoridade e de nulidade da prisão ou do ato processual a que se refere, sem prejuízo da responsabilidade civil do Estado.",
    divergenciaOuEvolucao:
      "A violação imotivada gera nulidade do ato processual (ex: julgamento no Tribunal do Júri em que o réu permaneceu algemado sem justificativa) e acarreta responsabilidade funcional dos policiais.",
    pegadinhaBanca:
      "Bancas afirmam que qualquer crime hediondo autoriza o uso automático de algemas por presunção de periculosidade. Errado! A periculosidade deve ser aferida no caso concreto pelo comportamento do réu.",
    casoPratico:
      "Durante júri popular de réu primário e cooperativo, o juiz mantém o acusado algemado alegando 'gravidade abstrata do homicídio'. O STF anula a sessão do júri por afronta à SV 11.",
    flashcardFrente:
      "Quais são os 3 únicos requisitos legais para o uso de algemas segundo a SV 11 do STF?",
    flashcardVerso:
      "Mnemônico PRSP: Perigo à integridade física (própria/alheia), Resistência à prisão, e Fundado receio de Fuga. Exige justificativa por escrito!",
  },
  {
    id: "sum-599-stj",
    numero: "Súmula 599",
    tribunal: "STJ",
    disciplina: "Direito Penal",
    assunto: "Princípio da Insignificância e Crimes Funcionais",
    titulo: "Inaplicabilidade da Insignificância nos Crimes Contra a Administração",
    teseResumida:
      "O princípio da insignificância é inaplicável aos crimes contra a Administração Pública, pois o bem jurídico tutelado não é meramente patrimonial, mas sobretudo a moralidade e a probidade administrativas.",
    teseOriginal:
      "O princípio da insignificância é inaplicável aos crimes contra a administração pública.",
    divergenciaOuEvolucao:
      "Divergência Notória STF vs STJ: O STJ aplica a súmula com rigor absoluto (salvo descaminho tributário até R$ 20.000). O STF, contudo, já admitiu insignificância em casos excepcionalíssimos de bagatela extrema (ex: furto de 2 luminárias velhas ou 5 folhas de papel A4 sem desvalor da moralidade).",
    pegadinhaBanca:
      "A banca cobra a literalidade da Súmula 599 do STJ ('inaplicável aos crimes funcionais') ou contrapõe com o crime de descaminho (ao descaminho se aplica o patamar de R$ 20 mil, pois é crime contra a ordem tributária e não corrupção/peculato).",
    casoPratico:
      "Servidor público apropria-se de um grampeador e uma caneta de R$ 15,00 da repartição. Para a jurisprudência sumulada do STJ (Súmula 599), há crime de peculato-apropriação sem incidência da insignificância, ante a tutela da moralidade administrativa.",
    flashcardFrente:
      "Segundo a Súmula 599 do STJ, é cabível o princípio da insignificância no crime de peculato de valor ínfimo praticado por servidor público?",
    flashcardVerso:
      "NÃO! É sumulado que o princípio da insignificância NÃO se aplica aos crimes contra a administração pública, pois a moralidade administrativa não pode ser mensurada em dinheiro.",
  },
  {
    id: "sum-545-stj",
    numero: "Súmula 545",
    tribunal: "STJ",
    disciplina: "Direito Penal",
    assunto: "Atenuante da Confissão Espontânea",
    titulo: "Confissão Qualificada ou Retratada e a Atenuante da Pena",
    teseResumida:
      "Quando a confissão do acusado for utilizada pelo magistrado para a formação do seu convencimento e para embasar a sentença condenatória, o réu faz jus obrigatoriamente à atenuante do art. 65, III, 'd', do Código Penal, mesmo que a confissão tenha sido qualificada (com alegação de legítima defesa) ou retratada em juízo.",
    teseOriginal:
      "Quando a confissão for utilizada para a formação do convencimento do julgador, o réu fará jus à atenuante prevista no art. 65, III, d, do Código Penal.",
    divergenciaOuEvolucao:
      "Se o juiz sequer mencionou a confissão e fundamentou a condenação exclusivamente em provas testemunhais ou periciais independentes, não incide a atenuante.",
    pegadinhaBanca:
      "Bancas adoram dizer que a 'confissão qualificada' (onde o réu confessa o fato mas alega causa excludente de ilicitude, ex: 'matei mas foi em legítima defesa') impede a redução da pena. Falso! Se o juiz usou o fato confessado na dosimetria, atenua obrigatoriamente.",
    casoPratico:
      "Réu confessa na delegacia ter subtraído o carro, mas no interrogatório judicial se retrata e fica em silêncio. Se a sentença citar a confissão policial como elemento de convicção, a atenuante deve ser aplicada compulsoriamente.",
    flashcardFrente:
      "O réu que apresenta confissão qualificada ou se retrata em juízo tem direito à atenuante da confissão?",
    flashcardVerso:
      "SIM! Conforme a Súmula 545 do STJ, sempre que a confissão for utilizada pelo magistrado para embasar a condenação, a atenuante é de aplicação OBRIGATÓRIA.",
  },
  {
    id: "tema-881-stf",
    numero: "Tema 881 & 885",
    tribunal: "STF",
    disciplina: "Direito Tributário & Constitucional",
    assunto: "Coisa Julgada Tributária e Limites Temporais",
    titulo: "Cessação de Efeitos da Coisa Julgada Diante de Decisão Superveniente do STF",
    teseResumida:
      "Decisões judiciais definitivas (com trânsito em julgado) que autorizavam um contribuinte a não pagar determinado tributo de trato sucessivo (ex: CSLL) perdem automaticamente a eficácia prospectiva a partir da publicação de acórdão do STF em controle concentrado ou com repercussão geral que considere a exação constitucional.",
    teseOriginal:
      "As decisões do STF em controle incidental ou concentrado de constitucionalidade interrompem automaticamente os efeitos futuros de coisa julgada material em relações jurídico-tributárias de trato sucessivo, observada a anterioridade aplicável ao tributo.",
    divergenciaOuEvolucao:
      "O STF não exigiu ajuizamento de ação rescisória para derrubar a coisa julgada em relações continuativas, bastando a nova decisão de mérito da Corte Suprema.",
    pegadinhaBanca:
      "Bancas afirmam que a Fazenda Pública precisa ajuizar Ação Rescisória no prazo de 2 anos para poder voltar a cobrar o tributo. Errado! A perda de eficácia da coisa julgada é automática (ex nunc), respeitadas as anterioridades.",
    casoPratico:
      "Empresa obteve em 1995 decisão transitada em julgado desobrigando o recolhimento da CSLL. Em 2007, o STF julgou a CSLL 100% constitucional em ADI. A partir da eficácia da decisão do STF, a empresa volta a ser obrigada a recolher o tributo.",
    flashcardFrente:
      "É necessária Ação Rescisória para a Fazenda cobrar tributo continuativo de contribuinte com decisão favorável após o STF declarar o tributo constitucional?",
    flashcardVerso:
      "NÃO! A decisão do STF em repercussão geral ou controle concentrado cessa automaticamente os efeitos futuros da coisa julgada (Temas 881 e 885 STF).",
  },
];

/**
 * Busca súmulas e jurisprudência no catálogo curado ou gera com IA em tempo real caso não encontre
 */
export async function searchJurisprudenceAction(input: {
  query: string;
  tribunal?: string;
  disciplina?: string;
}): Promise<{ success: boolean; data: JurisprudenceItem[]; error?: string }> {
  try {
    const q = input.query.trim().toLowerCase();
    const tribunalFilter = input.tribunal?.toUpperCase();
    const disciplinaFilter = input.disciplina?.toLowerCase();

    // 1. Filtra catálogo curado
    let matches = CURATED_JURISPRUDENCE.filter((item) => {
      const matchTribunal =
        !tribunalFilter || tribunalFilter === "TODOS" || item.tribunal === tribunalFilter;
      const matchDisciplina =
        !disciplinaFilter ||
        disciplinaFilter === "todas" ||
        item.disciplina.toLowerCase().includes(disciplinaFilter);

      if (!matchTribunal || !matchDisciplina) return false;

      if (!q) return true;

      return (
        item.numero.toLowerCase().includes(q) ||
        item.titulo.toLowerCase().includes(q) ||
        item.assunto.toLowerCase().includes(q) ||
        item.teseResumida.toLowerCase().includes(q) ||
        item.pegadinhaBanca.toLowerCase().includes(q)
      );
    });

    // 2. Se houver correspondência curada, retorna imediatamente
    if (matches.length > 0) {
      return { success: true, data: matches };
    }

    // 3. Se não houver correspondência curada e o usuário buscou um termo específico, aciona a IA
    if (q.length >= 3) {
      const prompt = `Você é o maior especialista em jurisprudência do STF, STJ e tribunais superiores do Brasil para concursos públicos.
O usuário pesquisou pelo seguinte tema ou súmula jurídica: "${input.query}" (Tribunal: ${input.tribunal || "STF/STJ"}, Disciplina: ${input.disciplina || "Geral"}).

Gere um "Raio-X Jurisprudencial Cognitivo" com rigor técnico absoluto e linguagem didática para concurseiros.

Estrutura JSON obrigatória:
{
  "numero": "Identificação exata (ex: 'Súmula Vinculante X', 'Tema Y STF', 'Súmula Z STJ', ou julgado paradigmático)",
  "tribunal": "STF" | "STJ" | "TST" | "TSE" | "GERAL",
  "disciplina": "Nome da Matéria (ex: Direito Constitucional, Administrativo, Penal, Tributário)",
  "assunto": "Tópico Específico",
  "titulo": "Título didático e intuitivo da tese",
  "teseResumida": "Explicação limpa, didática e direta em português claro sem juridiquês dispensável",
  "teseOriginal": "Texto oficial da ementa ou súmula com termos técnicos",
  "divergenciaOuEvolucao": "Existe divergência entre STF e STJ sobre o tema? Houve superação de entendimento (overruling) recente? Explique em 2 parágrafos.",
  "pegadinhaBanca": "Como as bancas examinadoras (FGV, Cebraspe, FCC, Vunesp) formulam questões capciosas sobre essa tese para induzir o candidato ao erro?",
  "casoPratico": "Um exemplo hipotético breve e palpável aplicando a tese a uma situação fática.",
  "flashcardFrente": "Pergunta ativa direta sobre o ponto nevrálgico da tese.",
  "flashcardVerso": "Resposta concisa com palavra-chave ou gatilho mental de memorização."
}`;

      const aiResponse = await generateContentWithFallback({
        prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
        preferredModels: [
          "gemini-2.5-flash",
          "gemini-3.7-flash",
          "gemini-3.6-flash",
        ],
      });

      if (aiResponse?.text) {
        let cleanText = aiResponse.text.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(cleanText) as JurisprudenceItem;
        parsed.id = `ai-gen-${Date.now()}`;
        parsed.isCustomGenerated = true;

        return { success: true, data: [parsed] };
      }
    }

    return { success: true, data: [] };
  } catch (error) {
    console.error("[Search Jurisprudence Action Error]:", error);
    return {
      success: false,
      data: CURATED_JURISPRUDENCE,
      error: "Não foi possível conectar ao motor jurisprudencial de IA.",
    };
  }
}

/**
 * Cria um Flashcard FSRS a partir de uma súmula ou tese jurisprudencial
 */
export async function createJurisprudenceFlashcardAction(input: {
  front: string;
  back: string;
  details?: string;
  disciplina: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const targetDeckTitle = `Jurisprudência - ${input.disciplina}`;

    let deck = await prisma.deck.findFirst({
      where: {
        userId,
        title: { equals: targetDeckTitle, mode: "insensitive" },
      },
    });

    if (!deck) {
      deck = await prisma.deck.create({
        data: {
          userId,
          title: targetDeckTitle,
          color: "#3b82f6",
        },
      });
    }

    const card = await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        question: input.front,
        answer: input.back,
        details: input.details || null,
        stability: 1.0,
        difficulty: 5.0,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lapses: 0,
        nextReviewDate: new Date(),
      },
      select: { id: true },
    });

    revalidatePath("/flashcards");

    // Atribui XP por criação de card de jurisprudência
    await recordStudyActivityAction(userId, 15, "FLASHCARD", 1).catch(() => null);

    return { success: true, id: card.id };
  } catch (error) {
    console.error("[Create Jurisprudence Flashcard Error]:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar flashcard de jurisprudência.",
    };
  }
}
