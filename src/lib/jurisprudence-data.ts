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
  drillQuestion?: {
    banca: string;
    enunciado: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    explanation: string;
  };
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
    drillQuestion: {
      banca: "Cebraspe",
      enunciado:
        "Governador de Estado nomeou seu sobrinho, advogado com dez anos de prática jurídica ilibada, para o cargo em comissão de Secretário de Estado da Segurança Pública. À luz da jurisprudência vinculante do STF:",
      options: [
        {
          id: "A",
          text: "A nomeação é válida, pois cargos estritamente políticos não se submetem, em regra, à vedação da Súmula Vinculante 13, ressalvada inaptidão manifesta.",
        },
        {
          id: "B",
          text: "A nomeação é nula de pleno direito, pois sobrinho é parente em 3º grau colateral, vedado sem qualquer exceção pela SV 13.",
        },
        {
          id: "C",
          text: "A vedação ao nepotismo atinge somente parentes até o segundo grau, razão pela qual o sobrinho poderia ser nomeado para qualquer cargo.",
        },
        {
          id: "D",
          text: "Apenas Ministros de Estado gozam da exceção de natureza política, não se estendendo aos Secretários Estaduais.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O STF consolidou que os cargos de natureza política (Secretários e Ministros) não são atingidos pela vedação da SV 13, salvo hipótese de fraude ou falta patente de qualificação técnica.",
    },
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
    drillQuestion: {
      banca: "FGV",
      enunciado:
        "Advogado constituído comparece à Delegacia e requer cópia integral de inquérito sigiloso em que se apura crime de lavagem de capitais. O delegado defere o acesso aos laudos periciais já acostados, mas nega vistas de mandados de busca e apreensão que aguardam cumprimento no dia seguinte. Diante do caso concreto:",
      options: [
        {
          id: "A",
          text: "A conduta do Delegado é legal e compatível com a SV 14, pois o acesso não abrange diligências investigatórias em andamento.",
        },
        {
          id: "B",
          text: "O Delegado cometeu crime de abuso de autoridade, haja vista que o defensor tem direito a ter acesso a 100% dos procedimentos.",
        },
        {
          id: "C",
          text: "A SV 14 garante acesso integral inclusive a mandados de busca pendentes de cumprimento para assegurar o contraditório prévio.",
        },
        {
          id: "D",
          text: "Apenas o Ministério Público tem legitimidade para restringir o acesso a atos documentados em inquérito policial.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O direito do defensor de consultar inquérito policial alcança tão somente as diligências findas e já documentadas nos autos (SV 14). Diligências pendentes ficam sob sigilo sob pena de frustrar a investigação.",
    },
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
    drillQuestion: {
      banca: "FCC",
      enunciado:
        "Em audiência de instrução criminal, o réu, acusado de furto simples, foi mantido algemado sob a alegação genérica do magistrado de 'garantia da segurança do prédio do fórum'. Nos termos da jurisprudência do STF:",
      options: [
        {
          id: "A",
          text: "A medida acarreta a nulidade do ato processual praticado se não demonstrada por escrito a excepcionalidade nos moldes da SV 11.",
        },
        {
          id: "B",
          text: "O ato é plenamente válido, cabendo discricionariedade ao magistrado na condução da segurança da sala de audiências.",
        },
        {
          id: "C",
          text: "A nulidade decorrente do uso indevido de algemas é sempre relativa e depende de comprovação de prejuízo concreto à dosimetria da pena.",
        },
        {
          id: "D",
          text: "Apenas no plenário do Tribunal do Júri é proibido o uso de algemas, sendo livre a utilização nas audiências com juiz togado.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O descumprimento injustificado da Súmula Vinculante 11 enseja a nulidade da prisão ou do ato processual correspondente, além da apuração de responsabilidade administrativa e civil.",
    },
  },
  {
    id: "sv-25",
    numero: "Súmula Vinculante 25",
    tribunal: "STF",
    disciplina: "Direito Constitucional & Processual Civil",
    assunto: "Prisão Civil de Depositário Infiel",
    titulo: "Ilicitude da Prisão Civil do Depositário Infiel e Status Supralegal",
    teseResumida:
      "É ilícita a prisão civil de depositário infiel, qualquer que seja a modalidade do depósito. O Pacto de San José da Costa Rica (CADH) ingressou no ordenamento brasileiro com status SUPRALEGAL (abaixo da Constituição, porém acima de todas as leis ordinárias), revogando a eficácia da legislação infraconstitucional que permitia a prisão.",
    teseOriginal:
      "É ilícita a prisão civil de depositário infiel, qualquer que seja a modalidade do depósito.",
    divergenciaOuEvolucao:
      "O art. 5º, LXVII da CF ainda prevê textualmente a prisão do devedor de alimentos e do depositário infiel, porém a regra do depositário infiel teve sua eficácia paralisada em razão do status supralegal dos tratados internacionais de direitos humanos ratificados pelo Brasil.",
    pegadinhaBanca:
      "Bancas tentam confundir afirmando que o Pacto de San José foi aprovado pelo rito do art. 5º, § 3º da CF com força de emenda constitucional (falso, ele foi ratificado antes da EC 45/2004, logo seu status é supralegal e não constitucional).",
    casoPratico:
      "Juiz cível determina a prisão civil de devedor que alienou veículo gravado com alienação fiduciária em garantia. A decisão é flagrantemente ilegal e violadora da SV 25.",
    flashcardFrente:
      "Qual é a única hipótese de prisão civil por dívida admitida no direito brasileiro atualmente?",
    flashcardVerso:
      "Apenas a do DEVEDOR DE ALIMENTOS (inadimplemento voluntário e inescusável de obrigação alimentícia). A prisão do depositário infiel é ilícita (SV 25).",
    drillQuestion: {
      banca: "Cebraspe",
      enunciado:
        "Considerando o entendimento do Supremo Tribunal Federal e a disciplina constitucional dos direitos fundamentais, assinale a opção correta a respeito da prisão civil por dívidas:",
      options: [
        {
          id: "A",
          text: "A prisão civil do depositário infiel tornou-se inaplicável em virtude do status supralegal conferido ao Pacto de São José da Costa Rica.",
        },
        {
          id: "B",
          text: "A Constituição Federal de 1988 foi formalmente emendada para suprimir a menção à prisão civil do depositário infiel.",
        },
        {
          id: "C",
          text: "É admitida a prisão civil do depositário infiel apenas quando se tratar de alienação fiduciária em garantia de instituições financeiras.",
        },
        {
          id: "D",
          text: "O Pacto de São José da Costa Rica tem equivalência de Emenda Constitucional por ter sido aprovado pelo quórum de três quintos.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O STF fixou a tese de que os tratados de direitos humanos anteriores à EC 45/04 têm estatura supralegal, paralisando a eficácia da lei que previa a prisão do depositário infiel (SV 25).",
    },
  },
  {
    id: "sv-37",
    numero: "Súmula Vinculante 37",
    tribunal: "STF",
    disciplina: "Direito Administrativo & Constitucional",
    assunto: "Remuneração de Servidores e Separação de Poderes",
    titulo: "Impossibilidade de o Poder Judiciário Aumentar Vencimentos por Isonomia",
    teseResumida:
      "Não cabe ao Poder Judiciário, que não tem função legislativa, aumentar vencimentos de servidores públicos sob o fundamento de isonomia. A criação ou majoração de vencimentos exige lei formal e específica de iniciativa privativa do Chefe do Executivo respectivo.",
    teseOriginal:
      "Não cabe ao Poder Judiciário, que não tem função legislativa, aumentar vencimentos de servidores públicos sob o fundamento de isonomia.",
    divergenciaOuEvolucao:
      "Originada da conversão da antiga Súmula 339 do STF em Súmula Vinculante 37. Aplica-se inclusive em casos de equiparação salarial por desvio de função (o servidor recebe indenização correspondente às diferenças, mas não tem direito ao reenquadramento no cargo).",
    pegadinhaBanca:
      "As bancas costumam alegar que havendo omissão inconstitucional do Executivo, o Judiciário pode fixar índice remuneratório por equidade. Errado! O Judiciário não atua como legislador positivo.",
    casoPratico:
      "Analistas de determinado órgão ajuízam ação civil requerendo equiparação de seus vencimentos aos analistas da Receita Federal por exercerem funções análogas. O pedido deve ser julgado improcedente com base na SV 37.",
    flashcardFrente:
      "Pode o Poder Judiciário conceder aumento salarial a servidores públicos invocando o princípio da isonomia?",
    flashcardVerso:
      "NÃO! Súmula Vinculante 37 do STF: O Judiciário não possui função legislativa e não pode conceder reajustes ou aumentos salariais sob o argumento de isonomia.",
    drillQuestion: {
      banca: "FGV",
      enunciado:
        "Determinada associação de servidores públicos estaduais obteve sentença judicial favorável que lhes estendeu gratificação instituída em prol de outra carreira análoga, sob a justificativa de preservação do princípio da isonomia. Essa decisão judicial:",
      options: [
        {
          id: "A",
          text: "Viola frontalmente a Súmula Vinculante 37 do STF e a separação de poderes, pois o Judiciário não atua como legislador positivo.",
        },
        {
          id: "B",
          text: "É legítima em sede de controle difuso, vez que o Poder Judiciário detém prerrogativa de suprir omissões inconstitucionais.",
        },
        {
          id: "C",
          text: "Poderá ser mantida caso o Estado comprove disponibilidade orçamentária para custear a extensão do benefício.",
        },
        {
          id: "D",
          text: "Encontra amparo no princípio da inafastabilidade da tutela jurisdicional e da isonomia federativa.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: Conforme a SV 37 (antiga Súmula 339), ao Judiciário é defeso conceder aumentos remuneratórios invocando isonomia, por ausência de função legislativa e reserva legal estrita.",
    },
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
    drillQuestion: {
      banca: "Cebraspe",
      enunciado:
        "Técnico judiciário subtraiu para uso particular três resmas de papel e duas canetas da seção em que trabalha, avaliadas em R$ 40,00. Denunciado por peculato-furto, a defesa requereu a absolvição pela insignificância. De acordo com a súmula do STJ:",
      options: [
        {
          id: "A",
          text: "O pleito defensivo não prospera, sendo inaplicável o princípio da insignificância aos crimes contra a administração pública (Súmula 599).",
        },
        {
          id: "B",
          text: "Deverá ser aplicado o princípio da bagatela própria, afastando a tipicidade material em virtude do prejuízo ínfimo.",
        },
        {
          id: "C",
          text: "A insignificância só pode ser afastada caso o crime seja praticado mediante violência ou grave ameaça à pessoa.",
        },
        {
          id: "D",
          text: "O valor diminuto desclassifica automaticamente a conduta para infração disciplinar sem repercussão penal.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O STJ consolidou na Súmula 599 que não cabe insignificância em crimes funcionais contra a Administração Pública, preservando a probidade do serviço público.",
    },
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
    drillQuestion: {
      banca: "Vunesp",
      enunciado:
        "Em processo por homicídio, o acusado confirmou ter desferido os disparos de arma de fogo, alegando, contudo, ter agido em legítima defesa putativa. Na sentença, o juiz afastou a excludente e condenou o réu, utilizando a confissão dos disparos para fixar a autoria. Em relação à dosimetria:",
      options: [
        {
          id: "A",
          text: "Incide a atenuante da confissão espontânea, pois a confissão qualificada utilizada para embasar a condenação atrai a aplicação da Súmula 545 do STJ.",
        },
        {
          id: "B",
          text: "Não incide a atenuante, pois a confissão qualificada é incompatível com o instituto da confissão espontânea simples.",
        },
        {
          id: "C",
          text: "A aplicação da atenuante fica a critério subjetivo e discricionário do juiz, não vinculando a segunda fase da dosimetria.",
        },
        {
          id: "D",
          text: "Apenas se o réu tiver confessado sem invocar nenhuma excludente é que teria direito ao benefício penal.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O STJ pacificou na Súmula 545 que mesmo a confissão qualificada enseja a aplicação da atenuante da pena se foi aproveitada na formação do convencimento do juiz.",
    },
  },
  {
    id: "sum-385-stj",
    numero: "Súmula 385",
    tribunal: "STJ",
    disciplina: "Direito Civil & Consumidor",
    assunto: "Dano Moral e Negativação Preexistente",
    titulo: "Inocorrência de Dano Moral em Inscrição Indevida Havendo Registro Anterior Legítimo",
    teseResumida:
      "Da anotação irregular em cadastro de proteção ao crédito, não cabe indenização por dano moral quando preexistente legítima inscrição, ressalvado o direito ao cancelamento do registro indevido.",
    teseOriginal:
      "Da anotação irregular em cadastro de proteção ao crédito, não cabe indenização por dano moral, quando preexistente legítima inscrição, ressalvado o direito ao cancelamento.",
    divergenciaOuEvolucao:
      "O STJ já pacificou que a súmula 385 se aplica também às ações ajuizadas contra o credor que efetuou a inscrição irregular, e não apenas contra os órgãos mantenedores do cadastro (SPC/Serasa).",
    pegadinhaBanca:
      "A banca afirma que havendo negativação prévia legítima, o devedor não tem direito nem sequer de cancelar o registro indevido (falso! O direito ao cancelamento persiste; o que não cabe é a indenização pecuniária por dano moral).",
    casoPratico:
      "Consumidor já possui 3 inscrições legítimas e vencidas no Serasa. Uma empresa de telefonia inclui indevidamente uma 4ª anotação. O consumidor pode exigir a baixa do registro, mas não receberá indenização por danos morais.",
    flashcardFrente:
      "O consumidor que já possui inscrição legítima nos órgãos de proteção ao crédito tem direito a danos morais por nova inscrição indevida?",
    flashcardVerso:
      "NÃO! Súmula 385 do STJ: Não cabe dano moral havendo legítima inscrição preexistente, cabendo apenas o cancelamento do registro indevido.",
    drillQuestion: {
      banca: "FGV",
      enunciado:
        "João, que já possuía duas inscrições legítimas nos cadastros de inadimplentes decorrentes de dívidas bancárias não quitadas, teve seu nome inscrito indevidamente pela concessionária de água por débito de terceiro. Inconformado, João ajuizou ação com pedidos de cancelamento do registro e de indenização por danos morais. De acordo com o STJ:",
      options: [
        {
          id: "A",
          text: "Procede o pedido de cancelamento da anotação irregular, mas improcede o pedido de indenização por dano moral (Súmula 385 STJ).",
        },
        {
          id: "B",
          text: "Procedem ambos os pedidos, pois toda anotação indevida gera dano moral presumido (in re ipsa).",
        },
        {
          id: "C",
          text: "Improcedem ambos os pedidos, porque o devedor contumaz perde a prerrogativa de impugnar cadastros restritivos.",
        },
        {
          id: "D",
          text: "O dano moral deve ser deferido com redução equitativa de cinquenta por cento pelo juiz.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: Pela Súmula 385 do STJ, quem já possui anotação legítima anterior não sofre abalo moral indenizável por novo registro, mas preserva o direito de exclusão do gravame indevido.",
    },
  },
  {
    id: "sum-17-stj",
    numero: "Súmula 17",
    tribunal: "STJ",
    disciplina: "Direito Penal",
    assunto: "Consunção entre Falsidade e Estelionato",
    titulo: "Absorção do Crime de Falso pelo Estelionato",
    teseResumida:
      "Quando o falso se exaure no estelionato, sem mais potencialidade lesiva, é por este absorvido. Aplica-se o princípio da consunção (o crime-meio de falsificação é consumido pelo crime-fim de estelionato).",
    teseOriginal:
      "Quando o falso se exaure no estelionato, sem mais potencialidade lesiva, é por este absorvido.",
    divergenciaOuEvolucao:
      "Atenção crucial à ressalva: se a falsificação mantiver potencialidade lesiva para a prática de novos crimes futuros (ex: carteira de identidade falsa com foto do agente que permanece em seu poder), haverá concurso material entre estelionato e falsificação.",
    pegadinhaBanca:
      "As bancas adoram dizer que a falsificação JAMAIS é absorvida pelo estelionato por ter pena máxima maior que a deste. Errado! A gravidade da pena abstrata não impede a consunção quando o falso é apenas meio instrumental exaurido.",
    casoPratico:
      "Indivíduo falsifica um único cheque no valor de R$ 5.000 e o desconta no comércio local para comprar mercadorias. Como a falsificação do cheque se esgotou naquele ato, ele responde apenas por estelionato.",
    flashcardFrente:
      "Em que condição o crime de falso é absorvido pelo estelionato, segundo a Súmula 17 do STJ?",
    flashcardVerso:
      "Quando o falso se EXAURE no estelionato, ficando SEM potencialidade lesiva para outros crimes futuros.",
    drillQuestion: {
      banca: "Cebraspe",
      enunciado:
        "Agente falsifica a assinatura de terceiro em cheque avulso e o utiliza exclusivamente para efetuar o pagamento de compras em estabelecimento comercial, logrando êxito na empreitada. O cheque fica retido no caixa e não há outros títulos adulterados. Nessa situação:",
      options: [
        {
          id: "A",
          text: "O agente responderá unicamente por estelionato, sendo o crime de falso por este absorvido em face da Súmula 17 do STJ.",
        },
        {
          id: "B",
          text: "O agente responderá em concurso formal impróprio pelos crimes de falsificação de documento público e estelionato.",
        },
        {
          id: "C",
          text: "A falsificação absorve o estelionato por ser delito dotado de pena cominada em abstrato mais gravosa.",
        },
        {
          id: "D",
          text: "A absorção é vedada pelo ordenamento jurídico brasileiro em crimes de espécies tributárias distintas.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: Incide o princípio da consunção expresso na Súmula 17 do STJ: exaurindo-se a potencialidade lesiva da falsidade na obtenção da vantagem ilícita do estelionato, subsiste apenas este último.",
    },
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
    drillQuestion: {
      banca: "FCC",
      enunciado:
        "Contribuinte possui sentença transitada em julgado que o declarou desobrigado do recolhimento de contribuição social continuada. Anos depois, o STF, em controle concentrado, julgou o tributo constitucional. À luz dos Temas 881 e 885:",
      options: [
        {
          id: "A",
          text: "A eficácia da coisa julgada cessa automaticamente em relação a fatos geradores futuros, sem necessidade de ação rescisória.",
        },
        {
          id: "B",
          text: "A coisa julgada permanece hígida até o trânsito em julgado de ação rescisória ajuizada pela Fazenda Pública no prazo bienal.",
        },
        {
          id: "C",
          text: "A decisão do STF produz efeitos ex tunc, autorizando a cobrança retroativa dos últimos cinco anos de tributo não recolhido.",
        },
        {
          id: "D",
          text: "A imunidade tributária adquirida por coisa julgada é cláusula pétrea individual infensa a superação jurisprudencial.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O STF fixou que a decisão em repercussão geral ou controle concentrado cessa a eficácia prospectiva da coisa julgada em relações de trato sucessivo, observadas as anterioridades tributárias.",
    },
  },
  {
    id: "tema-1042-stf",
    numero: "Tema 1042 STF",
    tribunal: "STF",
    disciplina: "Direito Processual Penal",
    assunto: "Busca Pessoal e Fundada Suspeita",
    titulo: "Requisitos da Busca Pessoal sem Mandado e Atitude Suspeita",
    teseResumida:
      "A busca pessoal (revista) sem mandado judicial depende da existência de fundada suspeita (justa causa), baseada em elementos fáticos concretos e objetivos da posse de arma de fogo ou de objetos que constituam corpo de delito. Intuição policial, 'nervosismo' subjetivo ou características genéricas do indivíduo não autorizam a abordagem invasiva.",
    teseOriginal:
      "A busca pessoal sem mandado judicial exige justa causa fundada em elementos objetivos devidamente justificados, sob pena de ilicitude da prova obtida e de todas as que dela derivarem.",
    divergenciaOuEvolucao:
      "Tanto o STF (Tema 1042) quanto o STJ (RHC 158.580) anulam apreensões de drogas ou armas quando a revista decorrer de mera 'atitude suspeita' sem descrição prévia do comportamento delitivo concreto.",
    pegadinhaBanca:
      "As bancas afirmam que a apreensão posterior de entorpecentes convalida a busca pessoal que fora realizada sem justa causa prévia. Errado! O resultado posterior favorável não legitima a ilegalidade originária da revista.",
    casoPratico:
      "Polícia avista homem caminhando à noite que 'olhou para trás e acelerou o passo'. Abordado e revistado, localizam-se 10g de cocaína em seu bolso. As cortes superiores declaram a busca ilícita e trancam a ação penal.",
    flashcardFrente:
      "O encontro casual de drogas na posse do agente convalida a busca pessoal realizada sem fundada suspeita prévia objetiva?",
    flashcardVerso:
      "NÃO! A justa causa deve ser prévia e objetiva. O resultado favorável posterior não sana a nulidade da busca pessoal imotivada.",
    drillQuestion: {
      banca: "Cebraspe",
      enunciado:
        "Durante patrulhamento de rotina, policiais militares decidiram revistar um indivíduo unicamente porque este demonstrou 'nervosismo ao avistar a viatura'. Na revista pessoal, encontraram um revólver calibre 38. Segundo a orientação dos tribunais superiores:",
      options: [
        {
          id: "A",
          text: "A prova é ilícita, pois a busca pessoal sem mandado exige justa causa amparada em elementos prévios objetivos, não suprida pelo nervosismo subjetivo.",
        },
        {
          id: "B",
          text: "A prova é válida, porquanto o estado de flagrância de porte ilegal de arma de fogo convalida retrospectivamente a abordagem.",
        },
        {
          id: "C",
          text: "A legalidade da revista decorre do poder de polícia preventivo ostensivo dos agentes de segurança pública.",
        },
        {
          id: "D",
          text: "Trata-se de nulidade relativa que somente pode ser arguida após a sentença condenatória de mérito.",
        },
      ],
      correctAnswer: "A",
      explanation:
        "Gabarito A: O STF e o STJ firmaram entendimento de que nervosismo genérico não configura fundada suspeita para busca pessoal, tornando a apreensão ilícita por derivação (fruit of the poisonous tree).",
    },
  },
];
