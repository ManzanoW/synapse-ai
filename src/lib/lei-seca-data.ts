// src/lib/lei-seca-data.ts

export interface ArtigoLeiSeca {
  id: string;
  lei: string;
  siglaLei: string;
  ramo: "Constitucional" | "Administrativo" | "Penal" | "Processo Penal" | "Tributário";
  artigoNumero: string;
  caput: string;
  paragrafos?: string[];
  incisos?: string[];
  termosOcultaveis: {
    termo: string;
    nivel: 1 | 2 | 3 | 4; // 1: Prazos/números (25%), 2: Exceções/salvo (50%), 3: Verbos/condições (75%), 4: Conceitos fundamentais (100%)
    dica?: string;
  }[];
  pegadinhaBanca: string;
  bancasFrequentes: string[];
  mnemonico?: string;
}

export const LEI_SECA_ARTIGOS: ArtigoLeiSeca[] = [
  // --- CONSTITUIÇÃO FEDERAL ---
  {
    id: "cf-art-5-xi",
    lei: "Constituição da República Federativa do Brasil de 1988",
    siglaLei: "CF/88",
    ramo: "Constitucional",
    artigoNumero: "Art. 5º, XI",
    caput: "A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.",
    termosOcultaveis: [
      { termo: "asilo inviolável", nivel: 4, dica: "Proteção constitucional da moradia" },
      { termo: "sem consentimento do morador", nivel: 3, dica: "Regra geral de vedação" },
      { termo: "flagrante delito", nivel: 1, dica: "Qualquer hora (dia ou noite)" },
      { termo: "desastre", nivel: 1, dica: "Qualquer hora (dia ou noite)" },
      { termo: "prestar socorro", nivel: 1, dica: "Qualquer hora (dia ou noite)" },
      { termo: "durante o dia", nivel: 1, dica: "Condição temporal estrita para ordem judicial" },
      { termo: "determinação judicial", nivel: 2, dica: "Exige mandado de juiz competente" },
    ],
    pegadinhaBanca: "Bancas (Cebraspe/FGV) trocam 'durante o dia' por 'a qualquer hora por determinação judicial'. Ordem judicial SOMENTE de dia! Flagrante, desastre e socorro podem ocorrer a qualquer hora.",
    bancasFrequentes: ["Cebraspe", "FGV", "FCC", "Vunesp"],
    mnemonico: "FLAGRA, DESASTRE e SOCORRO = Noite ou Dia. JUIZ com MANDADO = Somente de DIA!",
  },
  {
    id: "cf-art-5-xii",
    lei: "Constituição da República Federativa do Brasil de 1988",
    siglaLei: "CF/88",
    ramo: "Constitucional",
    artigoNumero: "Art. 5º, XII",
    caput: "É inviolável o sigilo da correspondência e das comunicações telegráficas, de dados e das comunicações telefônicas, salvo, no último caso, por ordem judicial, nas hipóteses e na forma que a lei estabelecer para fins de investigação criminal ou instrução processual penal.",
    termosOcultaveis: [
      { termo: "no último caso", nivel: 1, dica: "Abreviação que se refere exclusivamente às comunicações telefônicas" },
      { termo: "por ordem judicial", nivel: 2, dica: "Reserva de jurisdição necessária" },
      { termo: "investigação criminal", nivel: 2, dica: "Inquérito policial ou PIC do MP" },
      { termo: "instrução processual penal", nivel: 2, dica: "Ação penal em juízo" },
    ],
    pegadinhaBanca: "A quebra de interceptação telefônica 'salvo no último caso' NÃO pode ser autorizada para Processo Administrativo Disciplinar (PAD) nem Ação Civil Pública. Somente investigação criminal ou processo PENAL!",
    bancasFrequentes: ["Cebraspe", "FGV", "FCC"],
    mnemonico: "Telefônica = Apenas para Processo ou Investigação CRIMINAL / PENAL.",
  },
  {
    id: "cf-art-37-xvi",
    lei: "Constituição da República Federativa do Brasil de 1988",
    siglaLei: "CF/88",
    ramo: "Constitucional",
    artigoNumero: "Art. 37, XVI",
    caput: "É vedada a acumulação remunerada de cargos públicos, exceto, quando houver compatibilidade de horários, observado em qualquer caso o disposto no inciso XI:",
    incisos: [
      "a) a de dois cargos de professor;",
      "b) a de um cargo de professor com outro técnico ou científico;",
      "c) a de dois cargos ou empregos privativos de profissionais de saúde, com profissões regulamentadas.",
    ],
    termosOcultaveis: [
      { termo: "vedada", nivel: 3, dica: "Regra geral constitucional" },
      { termo: "compatibilidade de horários", nivel: 1, dica: "Requisito indispensável em todas as hipóteses" },
      { termo: "dois cargos de professor", nivel: 1, dica: "Hipótese 'a'" },
      { termo: "um cargo de professor com outro técnico ou científico", nivel: 2, dica: "Hipótese 'b'" },
      { termo: "dois cargos ou empregos privativos de profissionais de saúde", nivel: 1, dica: "Hipótese 'c'" },
      { termo: "profissões regulamentadas", nivel: 2, dica: "Exigência expressa para a área de saúde" },
    ],
    pegadinhaBanca: "As bancas tentam permitir acumulação de dois cargos técnicos (proibido!) ou omitem a necessidade de compatibilidade de horários.",
    bancasFrequentes: ["Cebraspe", "FCC", "FGV", "Vunesp"],
    mnemonico: "Acumula apenas: 2 Prof, 1 Prof + 1 Técnico, ou 2 de Saúde Regulamentada (sempre com horários compatíveis).",
  },

  // --- LEI 8.112/1990 (REGIME DOS SERVIDORES PÚBLICOS FEDERAIS) ---
  {
    id: "lei-8112-art-13-15",
    lei: "Regime Jurídico dos Servidores Públicos Civis da União (Lei nº 8.112/1990)",
    siglaLei: "Lei 8.112/90",
    ramo: "Administrativo",
    artigoNumero: "Art. 13 e 15",
    caput: "A posse dar-se-á pela assinatura do respectivo termo, no qual deverão constar as atribuições, os deveres, as responsabilidades e os direitos inerentes ao cargo ocupado.",
    paragrafos: [
      "§ 1º A posse ocorrerá no prazo de trinta dias contados da publicação do ato de provimento.",
      "§ 6º Será tornado sem efeito o ato de provimento se a posse não ocorrer no prazo previsto.",
      "Art. 15. Exercício é o efetivo desempenho das atribuições do cargo público ou da função de confiança.",
      "§ 1º É de quinze dias o prazo para o servidor empossado em cargo público entrar em exercício, contados da data da posse.",
    ],
    termosOcultaveis: [
      { termo: "trinta dias", nivel: 1, dica: "Prazo para posse após nomeação" },
      { termo: "tornado sem efeito", nivel: 1, dica: "Consequência se NÃO tomar posse (não é exoneração!)" },
      { termo: "quinze dias", nivel: 1, dica: "Prazo para entrar em exercício após posse" },
      { termo: "exonerado", nivel: 2, dica: "Consequência se tomar posse mas NÃO entrar em exercício" },
    ],
    pegadinhaBanca: "Nomeou e não tomou posse em 30 dias? Ato tornado SEM EFEITO (não é exonerado pois ainda não era servidor!). Tomou posse e não entrou em exercício em 15 dias? EXONERADO!",
    bancasFrequentes: ["Cebraspe", "FCC", "FGV", "Cesgranrio"],
    mnemonico: "30 dias p/ Posse (Sem efeito se perder) -> 15 dias p/ Exercício (Exoneração se perder).",
  },
  {
    id: "lei-8112-art-132",
    lei: "Regime Jurídico dos Servidores Públicos Civis da União (Lei nº 8.112/1990)",
    siglaLei: "Lei 8.112/90",
    ramo: "Administrativo",
    artigoNumero: "Art. 132",
    caput: "A demissão será aplicada nos seguintes casos:",
    incisos: [
      "I - crime contra a administração pública;",
      "II - abandono de cargo;",
      "III - inassiduidade habitual;",
      "IV - improbidade administrativa;",
      "VII - ofensa física, em serviço, a servidor ou a particular, salvo em legítima defesa própria ou de outrem;",
      "X - lesão aos cofres públicos e dilapidação do patrimônio nacional;",
      "XI - corrupção;",
    ],
    termosOcultaveis: [
      { termo: "demissão", nivel: 3, dica: "Penalidade capital aplicada ao servidor estável ou não" },
      { termo: "abandono de cargo", nivel: 1, dica: "Mais de 30 dias consecutivos sem justificativa" },
      { termo: "inassiduidade habitual", nivel: 1, dica: "Mais de 60 dias interpolados no período de 12 meses" },
      { termo: "improbidade administrativa", nivel: 2, dica: "Enseja demissão direta após apuração em PAD" },
      { termo: "salvo em legítima defesa", nivel: 2, dica: "Excludente de punibilidade expressa no inciso VII" },
      { termo: "corrupção", nivel: 2, dica: "Inciso XI" },
    ],
    pegadinhaBanca: "Bancas adoram trocar demissão por suspensão de 90 dias nos casos de improbidade ou abandono de cargo.",
    bancasFrequentes: ["Cebraspe", "FCC", "FGV"],
    mnemonico: "Abandono = 30 dias consecutivos. Inassiduidade = 60 dias interpolados em 12 meses.",
  },

  // --- LEI 14.133/2021 (NOVA LEI DE LICITAÇÕES) ---
  {
    id: "lei-14133-art-28",
    lei: "Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021)",
    siglaLei: "Lei 14.133/21",
    ramo: "Administrativo",
    artigoNumero: "Art. 28",
    caput: "São modalidades de licitação:",
    incisos: [
      "I - pregão;",
      "II - concorrência;",
      "III - concurso;",
      "IV - leilão;",
      "V - diálogo competitivo.",
    ],
    termosOcultaveis: [
      { termo: "pregão", nivel: 1, dica: "Modalidade obrigatória para bens e serviços comuns" },
      { termo: "concorrência", nivel: 1, dica: "Modalidade para obras e serviços especiais" },
      { termo: "concurso", nivel: 1, dica: "Para escolha de trabalho técnico, científico ou artístico" },
      { termo: "leilão", nivel: 1, dica: "Alienação de bens móveis ou imóveis" },
      { termo: "diálogo competitivo", nivel: 1, dica: "Nova modalidade para inovações e soluções complexas" },
    ],
    pegadinhaBanca: "Na Lei 14.133/2021 NÃO existem mais 'Tomada de Preços' e 'Convite'! Foram extintas. O 'Diálogo Competitivo' é a grande novidade cobrada em prova.",
    bancasFrequentes: ["Cebraspe", "FGV", "FCC", "Vunesp"],
    mnemonico: "Não existe mais Convite nem Tomada de Preços! Lembre-se: P-C-C-L-D (Pregão, Concorrência, Concurso, Leilão, Diálogo Competitivo).",
  },
  {
    id: "lei-14133-art-74-75",
    lei: "Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021)",
    siglaLei: "Lei 14.133/21",
    ramo: "Administrativo",
    artigoNumero: "Art. 74 e 75",
    caput: "Art. 74. É inexigível a licitação quando inviável a competição. Art. 75. É dispensável a licitação:",
    termosOcultaveis: [
      { termo: "inviável a competição", nivel: 1, dica: "Conceito essencial de inexigibilidade" },
      { termo: "inexigível", nivel: 2, dica: "Rol exemplificativo (fornecedor exclusivo, artista consagrado, etc.)" },
      { termo: "dispensável", nivel: 2, dica: "Rol taxativo (baixo valor, emergência, guerra, etc.)" },
      { termo: "notória especialização", nivel: 2, dica: "Requisito de inexigibilidade para serviços técnicos com profissional destacado" },
    ],
    pegadinhaBanca: "Inexigibilidade = Inviabilidade de competição (rol exemplificativo). Dispensa = Competição possível, mas a lei autoriza não licitar (rol taxativo).",
    bancasFrequentes: ["Cebraspe", "FGV", "FCC"],
    mnemonico: "INexigível = INviável competir. Dispensável = Dá pra competir, mas a lei dispensa.",
  },

  // --- CÓDIGO PENAL ---
  {
    id: "cp-art-14-tentativa",
    lei: "Código Penal Brasileiro (Decreto-Lei nº 2.848/1940)",
    siglaLei: "CP",
    ramo: "Penal",
    artigoNumero: "Art. 14, II",
    caput: "Diz-se o crime: tentado, quando, iniciada a execução, não se consuma por circunstâncias alheias à vontade do agente.",
    paragrafos: [
      "Parágrafo único - Salvo disposição em contrário, pune-se a tentativa com a pena correspondente à do crime consumado, diminuída de um a dois terços.",
    ],
    termosOcultaveis: [
      { termo: "iniciada a execução", nivel: 2, dica: "Atos preparatórios não são puníveis como regra" },
      { termo: "não se consuma", nivel: 3, dica: "Ausência do resultado típico" },
      { termo: "circunstâncias alheias à vontade do agente", nivel: 1, dica: "Diferencia da desistência voluntária e arrependimento eficaz" },
      { termo: "diminuída de um a dois terços", nivel: 1, dica: "Fração redutora da tentativa" },
    ],
    pegadinhaBanca: "Se o agente parar por vontade própria, é Desistência Voluntária (Art. 15). Se parar por interferência externa (ex: polícia chegou), é TENTATIVA!",
    bancasFrequentes: ["Cebraspe", "FGV", "Vunesp"],
    mnemonico: "Tentativa = 'Eu quero continuar, mas não posso'. Desistência = 'Eu posso continuar, mas não quero'.",
  },
  {
    id: "cp-art-312-peculato",
    lei: "Código Penal Brasileiro (Decreto-Lei nº 2.848/1940)",
    siglaLei: "CP",
    ramo: "Penal",
    artigoNumero: "Art. 312",
    caput: "Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem móvel, público ou particular, de que tem a posse em razão do cargo, ou desviá-lo, em proveito próprio ou alheio:",
    paragrafos: [
      "§ 1º - Aplica-se a mesma pena, se o funcionário público, embora não tendo a posse do dinheiro, valor ou bem, o subtrai, ou concorre para que seja subtraído, em proveito próprio ou alheio, valendo-se de facilidade que lhe proporciona a qualidade de funcionário. (Peculato-furto)",
      "§ 2º - Se o funcionário concorre culposamente para o crime de outrem: (Peculato culposo)",
      "§ 3º - No caso do parágrafo anterior, a reparação do dano, se precede à sentença irrecorrível, extingue a punibilidade; se lhe é posterior, reduz de metade a pena imposta.",
    ],
    termosOcultaveis: [
      { termo: "posse em razão do cargo", nivel: 1, dica: "Elementar do peculato-apropriação" },
      { termo: "desviá-lo", nivel: 2, dica: "Peculato-desvio" },
      { termo: "Peculato-furto", nivel: 2, dica: "§ 1º subtrai valendo-se da facilidade do cargo" },
      { termo: "reparação do dano", nivel: 1, dica: "Benefício exclusivo do peculato CULPOSO" },
      { termo: "precede à sentença irrecorrível", nivel: 1, dica: "Marco temporal para extinção da punibilidade" },
      { termo: "extingue a punibilidade", nivel: 1, dica: "Efeito da reparação antes do trânsito em julgado" },
      { termo: "reduz de metade a pena", nivel: 1, dica: "Efeito da reparação após a sentença definitiva" },
    ],
    pegadinhaBanca: "A reparação do dano extinguir a punibilidade ANTES do trânsito em julgado SÓ vale para o PECULATO CULPOSO! No peculato doloso apenas atenua a pena.",
    bancasFrequentes: ["Cebraspe", "FGV", "FCC", "Vunesp"],
    mnemonico: "Reparação no Peculato Culposo: Antes do trânsito = ZERA a pena (extingue). Depois do trânsito = METADE da pena.",
  },

  // --- CÓDIGO DE PROCESSO PENAL ---
  {
    id: "cpp-art-301-302",
    lei: "Código de Processo Penal Brasileiro (Decreto-Lei nº 3.689/1941)",
    siglaLei: "CPP",
    ramo: "Processo Penal",
    artigoNumero: "Art. 301 e 302",
    caput: "Art. 301. Qualquer do povo poderá e as autoridades policiais e seus agentes deverão prender quem quer que seja encontrado em flagrante delito. Art. 302. Considera-se em flagrante delito quem:",
    incisos: [
      "I - está cometendo a infração penal; (Flagrante próprio)",
      "II - acaba de cometê-la; (Flagrante próprio)",
      "III - é perseguido, logo após, pela autoridade, pelo ofendido ou por qualquer pessoa, em situação que faça presumir ser autor da infração; (Flagrante impróprio)",
      "IV - é encontrado, logo depois, com instrumentos, armas, objetos ou papéis que façam presumir ser ele autor da infração. (Flagrante presumido ou ficto)",
    ],
    termosOcultaveis: [
      { termo: "poderá", nivel: 2, dica: "Facultativo para qualquer do povo" },
      { termo: "deverão", nivel: 1, dica: "Obrigatório para policiais e agentes da lei" },
      { termo: "logo após", nivel: 1, dica: "Exige perseguição contínua (flagrante impróprio)" },
      { termo: "logo depois", nivel: 1, dica: "Encontrado com objetos sem perseguição (flagrante presumido)" },
    ],
    pegadinhaBanca: "O povo 'pode' (flagrante facultativo); a polícia 'deve' (flagrante compulsório/obrigatório). Logo APÓS com perseguição = Impróprio. Logo DEPOIS encontrado com armas/objetos = Presumido.",
    bancasFrequentes: ["Cebraspe", "FGV", "Vunesp"],
    mnemonico: "Povo PODE, Polícia DEVE. Perseguiu = Impróprio. Encontrou com a arma = Presumido.",
  },

  // --- CÓDIGO TRIBUTÁRIO NACIONAL ---
  {
    id: "ctn-art-151-suspensao",
    lei: "Código Tributário Nacional (Lei nº 5.172/1966)",
    siglaLei: "CTN",
    ramo: "Tributário",
    artigoNumero: "Art. 151",
    caput: "Suspendem a exigibilidade do crédito tributário:",
    incisos: [
      "I - moratória;",
      "II - o depósito do seu montante integral;",
      "III - as reclamações e os recursos, nos termos das leis reguladoras do processo tributário administrativo;",
      "IV - a concessão de medida liminar em mandado de segurança;",
      "V - a concessão de medida liminar ou de tutela antecipada, em outras espécies de ação judicial;",
      "VI - o parcelamento.",
    ],
    termosOcultaveis: [
      { termo: "moratória", nivel: 1, dica: "Inciso I (Dilação de prazo)" },
      { termo: "depósito do seu montante integral", nivel: 1, dica: "Inciso II (depósito parcial não suspende!)" },
      { termo: "reclamações e os recursos", nivel: 2, dica: "Inciso III (processo administrativo)" },
      { termo: "medida liminar em mandado de segurança", nivel: 2, dica: "Inciso IV" },
      { termo: "tutela antecipada", nivel: 2, dica: "Inciso V" },
      { termo: "parcelamento", nivel: 1, dica: "Inciso VI" },
    ],
    pegadinhaBanca: "Depósito precisa ser INTEGRAL e em DINHEIRO para suspender. As bancas misturam causas de SUSPENSÃO (Art. 151) com EXTINÇÃO (Art. 156, ex: pagamento, compensação, prescrição, decadência) e EXCLUSÃO (Art. 175, isenção e anistia).",
    bancasFrequentes: ["Cebraspe", "FGV", "FCC"],
    mnemonico: "MODEREPALOPA: MO (Moratória) - DE (Depósito) - RE (Recursos) - PA (Parcelamento) - LIMINARES.",
  },
];
