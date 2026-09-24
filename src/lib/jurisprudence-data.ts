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
