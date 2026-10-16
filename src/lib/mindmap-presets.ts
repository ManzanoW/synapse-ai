// src/lib/mindmap-presets.ts
import { MindmapData } from "@/actions/mindmap-actions";

export const PRESET_MINDMAPS: MindmapData[] = [
  {
    id: "mm-controle-const",
    title: "Controle de Constitucionalidade",
    subject: "Direito Constitucional",
    summary: "Diferenciação precisa entre o modelo difuso e concentrado, legitimação ativa e efeitos vinculantes.",
    createdAt: "2026-01-01T00:00:00.000Z",
    rootNode: {
      id: "root-cc",
      label: "Controle de Const.",
      description: "Mecanismo de verificação de conformidade das leis com a Constituição Federal.",
      color: "indigo",
      children: [
        {
          id: "br-difuso",
          label: "Controle Difuso",
          description: "Exercido por qualquer juiz ou tribunal no caso concreto (incidental).",
          color: "cyan",
          mnemonic: "DIFUSO = Qualquer Juiz no Caso Concreto",
          trapWarning: "Cuidado: efeitos inter partes, salvo modulação ou resolução do Senado.",
          children: [
            {
              id: "sub-res-senado",
              label: "Res. do Senado (Art. 52, X)",
              description: "Suspende a execução da lei declarada inconstitucional pelo STF.",
              mnemonic: "Senado suspende, não revoga!",
            },
            {
              id: "sub-clausula-reserva",
              label: "Cláusula de Reserva (Art. 97)",
              description: "Órgão especial ou plenário do tribunal deve decidir.",
              trapWarning: "SV 10: Violação se órgão fracionário afasta lei sem declarar expressamente.",
            },
          ],
        },
        {
          id: "br-concentrado",
          label: "Controle Concentrado",
          description: "Exercido pelo STF via ações autônomas do controle abstrato.",
          color: "emerald",
          mnemonic: "Ações: ADI, ADC, ADO, ADPF",
          children: [
            {
              id: "sub-legitimados",
              label: "Legitimados (Art. 103)",
              description: "4 mesas, 4 autoridades, 4 entidades.",
              mnemonic: "3 Mesas + 3 Autoridades + 3 Entidades (PGR, AGU, OAB, etc.)",
            },
            {
              id: "sub-efeitos",
              label: "Efeitos da Decisão",
              description: "Eficácia contra todos (erga omnes) e efeito vinculante.",
              trapWarning: "Vincula o Executivo e Judiciário, mas NÃO o Legislativo em sua função típica!",
            },
          ],
        },
        {
          id: "br-modulacao",
          label: "Modulação de Efeitos",
          description: "Segurança jurídica ou excepcional interesse social.",
          color: "amber",
          mnemonic: "Quórum: 2/3 dos ministros do STF",
          trapWarning: "Banca adora trocar: a regra é ex tunc (retroativo); a modulação é a exceção!",
        },
      ],
    },
  },
  {
    id: "mm-atos-admin",
    title: "Atos Administrativos",
    subject: "Direito Administrativo",
    summary: "Requisitos de validade, atributos do ato e distinção clássica entre revogação e anulação.",
    createdAt: "2026-01-01T00:00:00.000Z",
    rootNode: {
      id: "root-atos",
      label: "Atos Administrativos",
      description: "Manifestação unilateral de vontade da Administração Pública sob regime de direito público.",
      color: "indigo",
      children: [
        {
          id: "br-requisitos",
          label: "Requisitos de Validade",
          description: "Elementos constitutivos indispensáveis para a higidez do ato.",
          color: "emerald",
          mnemonic: "CO-FI-FO-MO-OB (Competência, Finalidade, Forma, Motivo, Objeto)",
          children: [
            {
              id: "sub-convalidacao",
              label: "Convalidação",
              description: "Admissível apenas para vícios sanáveis de Competência e Forma.",
              mnemonic: "Só convalida 'CO' e 'FO' se não for exclusivo nem solene!",
            },
          ],
        },
        {
          id: "br-atributos",
          label: "Atributos do Ato",
          description: "Prerrogativas de autoridade que diferenciam o ato público do ato privado.",
          color: "rose",
          mnemonic: "P-A-T-I (Presunção de Legitimidade, Autoexecutoriedade, Tipicidade, Imperatividade)",
          trapWarning: "Nem todo ato é autoexecutório! Ex: multas necessitam de execução fiscal judicial.",
        },
        {
          id: "br-extincao",
          label: "Anulação vs. Revogação",
          description: "Desfazimento do ato por ilegalidade ou por conveniência e oportunidade.",
          color: "amber",
          mnemonic: "Anulação = Ilegalidade (Ex Tunc) | Revogação = Mérito (Ex Nunc)",
          trapWarning: "Súmulas 346 e 473 STF: Administração pode anular os próprios atos pelo princípio da autotutela.",
        },
      ],
    },
  },
  {
    id: "mm-crimes-adm",
    title: "Crimes Contra a Administração",
    subject: "Direito Penal",
    summary: "Distinção rápida entre Peculato, Concussão, Corrupção Passiva e Prevaricação.",
    createdAt: "2026-01-01T00:00:00.000Z",
    rootNode: {
      id: "root-crimes",
      label: "Crimes Funcionais",
      description: "Crimes praticados por funcionário público contra a administração em geral.",
      color: "rose",
      children: [
        {
          id: "br-peculato",
          label: "Peculato (Art. 312)",
          description: "Apropriar-se de dinheiro, valor ou qualquer outro bem móvel público ou particular.",
          color: "indigo",
          mnemonic: "Peculato = Apropriação/Desvio de Bem em razão do Cargo",
        },
        {
          id: "br-concussao",
          label: "Concussão (Art. 316)",
          description: "Exigir, para si ou para outrem, direta ou indiretamente, vantagem indevida.",
          color: "cyan",
          mnemonic: "Concussão = EXIGIR (não solicita nem recebe, exige!)",
        },
        {
          id: "br-corr-passiva",
          label: "Corrupção Passiva (Art. 317)",
          description: "Solicitar ou receber vantagem indevida, ou aceitar promessa de tal vantagem.",
          color: "emerald",
          mnemonic: "Corrupção Passiva = SOLICITAR ou RECEBER",
        },
        {
          id: "br-prevaricacao",
          label: "Prevaricação (Art. 319)",
          description: "Retardar ou deixar de praticar ato para satisfazer interesse ou sentimento pessoal.",
          color: "amber",
          mnemonic: "Prevaricação = Interesse ou Sentimento PESSOAL (não há vantagem financeira!)",
        },
      ],
    },
  },
];
