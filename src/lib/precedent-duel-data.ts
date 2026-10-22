export interface PrecedentDuelRound {
  id: string;
  tribunal: "STF" | "STJ" | "STF/STJ";
  subject: string;
  topicBadge: string;
  scenario: string;
  question: string;
  optionA: {
    label: string;
    isCorrect: boolean;
  };
  optionB: {
    label: string;
    isCorrect: boolean;
  };
  rationale: string;
  citation: string;
  mnemonicRule: string;
}

export const PRECEDENT_DUELS: PrecedentDuelRound[] = [
  {
    id: "duel-1",
    tribunal: "STJ",
    subject: "Processo Penal",
    topicBadge: "Inviolabilidade de Domicílio",
    scenario:
      "Durante patrulhamento preventivo, policiais usaram um cão farejador que indicou a provável presença de drogas no interior de uma residência habitada. Sem mandado judicial e sem nenhuma investigação prévia, os agentes arrombaram a porta e apreenderam 40kg de maconha.",
    question: "A invasão domiciliar e as provas obtidas são LÍCITAS?",
    optionA: {
      label: "LÍCITAS (Flagrante permanente autoriza)",
      isCorrect: false,
    },
    optionB: {
      label: "ILÍCITAS (Cão farejador isolado não basta)",
      isCorrect: true,
    },
    rationale:
      "O STJ estabeleceu que o faro de cão na área externa, desacompanhado de atos prévios de investigação ou outros elementos seguros de flagrância, NÃO configura fundada razão para violar o domicílio sem mandado judicial.",
    citation: "STJ, 6ª Turma, REsp 1.977.027/PR (Informativo 740)",
    mnemonicRule: "Cão farejador isolado ≠ Fundadas Razões para invadir casa!",
  },
  {
    id: "duel-2",
    tribunal: "STF",
    subject: "Direito Penal & Execução",
    topicBadge: "Perfil Genético Compulsório",
    scenario:
      "Condenado definitivamente por roubo circunstanciado praticado com violência real recusou-se a fornecer material biológico para traçar seu perfil genético no banco nacional (Art. 9º-A da LEP), sustentando violação à vedação de autoincriminação (nemo tenetur se detegere).",
    question: "A coleta compulsória de DNA prevista no Art. 9º-A da LEP é CONSTITUCIONAL?",
    optionA: {
      label: "CONSTITUCIONAL (Interesse público prevalece)",
      isCorrect: true,
    },
    optionB: {
      label: "INCONSTITUCIONAL (Fere o nemo tenetur se detegere)",
      isCorrect: false,
    },
    rationale:
      "O Plenário do STF julgou constitucional a identificação compulsória do perfil genético de condenados por crimes hediondos ou violentos. O princípio da não autoincriminação não é absoluto e a coleta é procedimento indolor de identificação criminal pós-condenação.",
    citation: "STF, Plenário, Tema 1070 (RE 973.837)",
    mnemonicRule: "Condenado por crime hediondo/violento: Coleta de DNA é 100% Constitucional!",
  },
  {
    id: "duel-3",
    tribunal: "STF",
    subject: "Direito Constitucional & Segurança",
    topicBadge: "Guarda Municipal & Busca Pessoal",
    scenario:
      "Guardas Municipais em ronda ostensiva avistaram indivíduo comercializando entorpecentes em logradouro público. Realizaram busca pessoal, apreenderam dezenas de porções de cocaína e efetuaram a prisão em flagrante.",
    question: "A atuação da Guarda Municipal e a busca pessoal foram VÁLIDAS?",
    optionA: {
      label: "VÁLIDAS (Integram o Susp e flagrante delito)",
      isCorrect: true,
    },
    optionB: {
      label: "INVÁLIDAS (Guarda só protege patrimônio municipal)",
      isCorrect: false,
    },
    rationale:
      "O STF decidiu que as Guardas Municipais integram formalmente o Sistema Único de Segurança Pública (SUSP) e têm legitimidade para executar busca pessoal e prisão em flagrante quando houver fundada suspeita vinculada à atividade de segurança ou preservação de bens e serviços públicos.",
    citation: "STF, Plenário, ADPF 995 e RE 1.309.919",
    mnemonicRule: "Guarda Municipal integra a Segurança Pública (STF ADPF 995). Pode busca e prisão!",
  },
  {
    id: "duel-4",
    tribunal: "STF",
    subject: "Direito Administrativo",
    topicBadge: "Retroatividade da Improbidade",
    scenario:
      "Servidor público respondia a ação de improbidade administrativa por ato negligente culposo (Art. 10 da Lei 8.429/92). Antes do trânsito em julgado, sobreveio a Lei 14.230/2021, que revogou a modalidade culposa e exige dolo específico para todos os tipos de improbidade.",
    question: "A revogação do ato culposo RETROAGE para beneficiar o réu na ação em curso?",
    optionA: {
      label: "SIM, RETROAGE (Ações sem trânsito em julgado)",
      isCorrect: true,
    },
    optionB: {
      label: "NÃO RETROAGE (Apenas na seara penal estrita)",
      isCorrect: false,
    },
    rationale:
      "O STF definiu expressamente no Tema 1199 que o novo regime benéfico da Lei 14.230/21 aplica-se retroativamente aos atos culposos de improbidade praticados na vigência da lei anterior, desde que não haja condenação transitada em julgado.",
    citation: "STF, Plenário, Tema 1199 (ARE 843.989)",
    mnemonicRule: "Improbidade Culposa: Retroage SIM se NÃO houver trânsito em julgado!",
  },
  {
    id: "duel-5",
    tribunal: "STJ",
    subject: "Processo Penal",
    topicBadge: "Reconhecimento Fotográfico (Art. 226)",
    scenario:
      "O Ministério Público ofereceu denúncia por roubo apoiado unicamente na palavra da vítima, que havia reconhecido o réu através de uma fotografia individual exibida no WhatsApp pela polícia judiciária, sem colocação de pessoas com traços semelhantes.",
    question: "O reconhecimento fotográfico informal isolado é SUFICIENTE para condenação?",
    optionA: {
      label: "SUFICIENTE (Vigora a livre convicção motivada)",
      isCorrect: false,
    },
    optionB: {
      label: "INSUFICIENTE (Art. 226 CPP é garantia cogente)",
      isCorrect: true,
    },
    rationale:
      "A 3ª Seção do STJ superou entendimento antigo e fixou que as formalidades do Art. 226 do CPP constituem garantia essencial. O reconhecimento fotográfico informal isolado não pode fundamentar, por si só, uma condenação penal.",
    citation: "STJ, 3ª Seção, HC 598.886/SC e HC 712.781/RJ",
    mnemonicRule: "Foto avulsa no WhatsApp = Prova NULA para condenação isolada!",
  },
  {
    id: "duel-6",
    tribunal: "STF/STJ",
    subject: "Processo Penal",
    topicBadge: "Acesso a Dados de Celular no Flagrante",
    scenario:
      "Logo após prenderem em flagrante um assaltante, os policiais pegaram o celular desbloqueado do detido e leram as mensagens do WhatsApp e registros de ligações para prender os comparsas que aguardavam em outro local.",
    question: "O acesso direto aos dados telefônicos no flagrante SEM ordem judicial é LÍCITO?",
    optionA: {
      label: "LÍCITO (Efeito imediato do flagrante delito)",
      isCorrect: false,
    },
    optionB: {
      label: "ILÍCITO (Exige prévia autorização judicial)",
      isCorrect: true,
    },
    rationale:
      "A jurisprudência uniforme do STF e STJ afirma que a apreensão do aparelho celular em flagrante é lícita, mas o ACESSO aos dados telemáticos e conversas de aplicativos exige expressa AUTORIZAÇÃO JUDICIAL, sob pena de ilicitude probatória por quebra do sigilo de comunicações.",
    citation: "STJ RHC 51.531/RO e STF RE 1.301.250 (Tema 977)",
    mnemonicRule: "Apreender celular pode; Acessar WhatsApp sem juiz é Prova Ilícita!",
  },
];
