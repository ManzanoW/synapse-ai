// ============================================================================
// SISTEMA DE LIGAS SEMANAIS & DESAFIOS DA SEMANA (GAMIFICAÇÃO D30)
// ============================================================================

export type LeagueTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface LeagueConfig {
  tier: LeagueTier;
  name: string;
  badge: string;
  icon: string;
  color: string;
  gradient: string;
  lightGradient: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  minTotalXp: number;
  promotionTopPercent: number; // Ex: 0.25 (Top 25% sobem)
  demotionBottomPercent: number; // Ex: 0.20 (Bottom 20% caem)
  description: string;
  weeklyPerks: string[];
}

export const LEAGUE_TIERS: Record<LeagueTier, LeagueConfig> = {
  BRONZE: {
    tier: "BRONZE",
    name: "Liga Bronze",
    badge: "🥉",
    icon: "Shield",
    color: "amber-700",
    gradient: "from-amber-900/40 via-amber-800/20 to-stone-900/60",
    lightGradient: "from-amber-100/80 via-orange-50/60 to-white",
    borderColor: "border-amber-700/40 dark:border-amber-600/30",
    glowColor: "rgba(180, 83, 9, 0.25)",
    textColor: "text-amber-600 dark:text-amber-400",
    minTotalXp: 0,
    promotionTopPercent: 0.25, // Top 5 de 20 sobem
    demotionBottomPercent: 0, // Não há rebaixamento no Bronze
    description: "A porta de entrada dos concurseiros. Crie o hábito e construa sua base de aprovação.",
    weeklyPerks: ["Acesso às missões diárias", "Multiplicador de XP 1.0x", "Troféu de estreante"],
  },
  SILVER: {
    tier: "SILVER",
    name: "Liga Prata",
    badge: "🥈",
    icon: "ShieldCheck",
    color: "slate-400",
    gradient: "from-slate-700/40 via-slate-800/20 to-slate-900/60",
    lightGradient: "from-slate-200/80 via-slate-100/60 to-white",
    borderColor: "border-slate-400/40 dark:border-slate-400/30",
    glowColor: "rgba(148, 163, 184, 0.3)",
    textColor: "text-slate-600 dark:text-slate-200",
    minTotalXp: 1200,
    promotionTopPercent: 0.2, // Top 4 de 20 sobem
    demotionBottomPercent: 0.15, // Últimos 3 caem
    description: "Zona de consistência ativa. Concurseiros com rotina diária estabelecida de simulados e FSRS.",
    weeklyPerks: ["Multiplicador de XP 1.1x", "Desafios Semanais desbloqueados", "Badge Prata no perfil"],
  },
  GOLD: {
    tier: "GOLD",
    name: "Liga Ouro",
    badge: "🥇",
    icon: "Award",
    color: "amber-400",
    gradient: "from-amber-500/30 via-yellow-600/15 to-slate-950/70",
    lightGradient: "from-amber-100 via-yellow-50 to-white",
    borderColor: "border-amber-500/50 dark:border-amber-400/40",
    glowColor: "rgba(245, 158, 11, 0.4)",
    textColor: "text-amber-600 dark:text-amber-300",
    minTotalXp: 3500,
    promotionTopPercent: 0.15, // Top 3 de 20 sobem
    demotionBottomPercent: 0.2, // Últimos 4 caem
    description: "Alto rendimento em concurso. Foco em acurácia de banca, redações e alta retenção de memória.",
    weeklyPerks: ["Multiplicador de XP 1.25x", "Bônus no Baú Semanal (+150 XP)", "Moldura Dourada no ranking"],
  },
  DIAMOND: {
    tier: "DIAMOND",
    name: "Liga Diamante",
    badge: "💎",
    icon: "Crown",
    color: "cyan-400",
    gradient: "from-cyan-500/30 via-indigo-600/20 to-slate-950/80",
    lightGradient: "from-cyan-100 via-indigo-50 to-white",
    borderColor: "border-cyan-400/60 dark:border-cyan-300/40",
    glowColor: "rgba(6, 182, 212, 0.45)",
    textColor: "text-cyan-600 dark:text-cyan-300",
    minTotalXp: 8000,
    promotionTopPercent: 0, // Já é a divisão máxima
    demotionBottomPercent: 0.25, // Últimos 5 caem
    description: "A elite dos aprovados. Disputa direta pelo primeiro lugar do pódio nacional.",
    weeklyPerks: ["Multiplicador de XP 1.5x", "Título Lendário 'Soberano dos Concursos'", "1x Streak Freeze semanal para o Pódio"],
  },
};

export interface LeaderboardMember {
  id: string;
  rank: number;
  name: string;
  avatar?: string | null;
  targetRole?: string | null;
  weeklyXp: number;
  isCurrentUser: boolean;
  zone: "PROMOTION" | "MAINTENANCE" | "DEMOTION";
  streakDays: number;
}

export interface WeeklyChallengeItem {
  id: string;
  title: string;
  description: string;
  iconName: "FileStack" | "Layers" | "PenTool" | "Headphones" | "Flame";
  currentCount: number;
  targetCount: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  unit: string;
}

export interface WeeklyChestStatus {
  totalChallenges: number;
  completedChallenges: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  xpReward: number;
  streakFreezeReward: number;
}

/**
 * Retorna os timestamps de início (Segunda 00:00:00) e fim (Domingo 23:59:59) da semana atual
 */
export function getWeeklyCycleBounds(referenceDate = new Date()): {
  startOfWeek: Date;
  endOfWeek: Date;
  cycleKey: string;
} {
  const date = new Date(referenceDate);
  const day = date.getDay(); // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  const diffToMonday = (day + 6) % 7; // Segunda vira 0, Domingo vira 6

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Chave identificadora única da semana (ex: "2026-W39")
  const year = startOfWeek.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const daysDiff = Math.floor(
    (startOfWeek.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((daysDiff + firstJan.getDay() + 1) / 7);
  const cycleKey = `${year}-W${weekNumber.toString().padStart(2, "0")}`;

  return { startOfWeek, endOfWeek, cycleKey };
}

/**
 * Determina a Liga em que o usuário se encontra baseado no XP acumulado e prestígio
 */
export function determineUserLeague(totalXp: number, prestige = 0): LeagueTier {
  if (prestige >= 2 || totalXp >= LEAGUE_TIERS.DIAMOND.minTotalXp) {
    return "DIAMOND";
  }
  if (prestige >= 1 || totalXp >= LEAGUE_TIERS.GOLD.minTotalXp) {
    return "GOLD";
  }
  if (totalXp >= LEAGUE_TIERS.SILVER.minTotalXp) {
    return "SILVER";
  }
  return "BRONZE";
}

/**
 * Lista de competidores modelo para calibrar chaves completas e realistas de 20 concurseiros
 */
const PEER_CANDIDATES: Record<
  LeagueTier,
  Array<{ name: string; targetRole: string; baseXp: number; streak: number }>
> = {
  BRONZE: [
    { name: "Lucas F. Ferreira", targetRole: "Técnico Judiciário TRT", baseXp: 280, streak: 3 },
    { name: "Camila Duarte", targetRole: "Polícia Rodoviária Federal", baseXp: 260, streak: 2 },
    { name: "Rodrigo Alencar", targetRole: "Analista Judiciário TJ", baseXp: 240, streak: 4 },
    { name: "Beatriz Monteiro", targetRole: "Escriturário Banco do Brasil", baseXp: 210, streak: 1 },
    { name: "Gabriel Sampaio", targetRole: "Auditor Fiscal ISS", baseXp: 190, streak: 2 },
    { name: "Juliana Neves", targetRole: "Polícia Federal (Agente)", baseXp: 170, streak: 5 },
    { name: "Felipe Bernardes", targetRole: "Concurso Nacional Unificado", baseXp: 150, streak: 1 },
    { name: "Aline Medeiros", targetRole: "Técnico do INSS", baseXp: 130, streak: 2 },
    { name: "Matheus Nogueira", targetRole: "Polícia Civil SP", baseXp: 110, streak: 3 },
    { name: "Larissa Pires", targetRole: "Carreira Bancária", baseXp: 90, streak: 1 },
    { name: "Thiago Vasconcelos", targetRole: "Tribunais Gerais", baseXp: 80, streak: 0 },
    { name: "Renata Barreto", targetRole: "Área Fiscal", baseXp: 60, streak: 1 },
    { name: "Eduardo Guimarães", targetRole: "Agente Administrativo", baseXp: 50, streak: 0 },
    { name: "Fernanda Silveira", targetRole: "TRT 2ª Região", baseXp: 40, streak: 2 },
    { name: "Diego Castilho", targetRole: "Área Policial", baseXp: 30, streak: 0 },
    { name: "Bruna Cavalcanti", targetRole: "Área de Controle", baseXp: 20, streak: 1 },
    { name: "Rafael Fontes", targetRole: "Técnico Judiciário", baseXp: 15, streak: 0 },
    { name: "Sabrina Rocha", targetRole: "Defensoria Pública", baseXp: 10, streak: 0 },
    { name: "Vinicius Tavares", targetRole: "Ministério Público", baseXp: 5, streak: 0 },
  ],
  SILVER: [
    { name: "Mariana R. Queiroz", targetRole: "Analista Judiciário TRF3", baseXp: 620, streak: 8 },
    { name: "Gustavo Paiva", targetRole: "Auditor da Receita Federal", baseXp: 580, streak: 7 },
    { name: "Carla Antunes", targetRole: "Oficial de Promotoria MPSP", baseXp: 540, streak: 6 },
    { name: "Danilo Valente", targetRole: "Perito Criminal PF", baseXp: 510, streak: 5 },
    { name: "Priscila Gouveia", targetRole: "Técnico Judiciário STJ", baseXp: 470, streak: 9 },
    { name: "Leonardo Brandão", targetRole: "Polícia Civil MG (Escrivão)", baseXp: 440, streak: 4 },
    { name: "Carolina Borges", targetRole: "Analista de Controle TCE", baseXp: 410, streak: 5 },
    { name: "Marcelo Dantas", targetRole: "Auditor Fiscal SEFAZ-SP", baseXp: 380, streak: 3 },
    { name: "Vanessa Lemos", targetRole: "Defensoria Pública DPU", baseXp: 360, streak: 6 },
    { name: "Hugo Rezende", targetRole: "Polícia Rodoviária Federal", baseXp: 330, streak: 4 },
    { name: "Patrícia Viana", targetRole: "Analista de TI SERPRO", baseXp: 310, streak: 2 },
    { name: "Alexandre Gusmão", targetRole: "Tribunal de Contas TCU", baseXp: 290, streak: 3 },
    { name: "Débora Prado", targetRole: "Carreira Jurídica Geral", baseXp: 270, streak: 2 },
    { name: "Arthur Magalhães", targetRole: "Polícia Federal (Escrivão)", baseXp: 250, streak: 1 },
    { name: "Leticia Xavier", targetRole: "Auditoria Interna", baseXp: 230, streak: 2 },
    { name: "Igor Meireles", targetRole: "Técnico Judiciário TRE", baseXp: 210, streak: 3 },
    { name: "Flávia Sanches", targetRole: "Banco Central BACEN", baseXp: 190, streak: 1 },
    { name: "Otávio Martins", targetRole: "Área Fiscal Municipal", baseXp: 170, streak: 0 },
    { name: "Tatiane Morais", targetRole: "Procuradoria Municipal", baseXp: 150, streak: 1 },
  ],
  GOLD: [
    { name: "Bruno Henrique Dias", targetRole: "Auditor Fiscal SEFAZ", baseXp: 1350, streak: 18 },
    { name: "Natália Albuquerque", targetRole: "Delegado de Polícia Civil", baseXp: 1220, streak: 14 },
    { name: "Caio Figueiredo", targetRole: "Auditor Federal TCU", baseXp: 1140, streak: 12 },
    { name: "Helena Bittencourt", targetRole: "Analista Judiciário TST", baseXp: 1080, streak: 15 },
    { name: "Ricardo Mendonça", targetRole: "Polícia Federal (Delegado)", baseXp: 1010, streak: 11 },
    { name: "Tatiana Dornelles", targetRole: "Promotor de Justiça MP", baseXp: 960, streak: 9 },
    { name: "Samuel Villas", targetRole: "Auditor da Receita Federal", baseXp: 910, streak: 13 },
    { name: "Luciana Fontoura", targetRole: "Defensor Público DPE", baseXp: 860, streak: 8 },
    { name: "Fábio Meirelles", targetRole: "Analista Legislativo Senado", baseXp: 820, streak: 10 },
    { name: "Marina Castello", targetRole: "Procurador do Estado PGE", baseXp: 780, streak: 7 },
    { name: "Renan Esteves", targetRole: "Juiz do Trabalho Substituto", baseXp: 740, streak: 6 },
    { name: "Isabela Zanetti", targetRole: "Auditor de Controle CGU", baseXp: 700, streak: 8 },
    { name: "Murilo Araripe", targetRole: "Analista Judiciário STF", baseXp: 670, streak: 5 },
    { name: "Daniela Furtado", targetRole: "Diplomacia CACD", baseXp: 630, streak: 6 },
    { name: "Cristiano Peixoto", targetRole: "Carreira Fiscal Geral", baseXp: 600, streak: 4 },
    { name: "Viviane Soares", targetRole: "Técnico Judiciário Federal", baseXp: 570, streak: 5 },
    { name: "Guilherme Salgado", targetRole: "Polícia Civil DF (Agente)", baseXp: 540, streak: 3 },
    { name: "Bárbara Quintão", targetRole: "Auditoria Governamental", baseXp: 510, streak: 4 },
    { name: "Leonardo Cyrino", targetRole: "Analista Judiciário TRF", baseXp: 480, streak: 2 },
  ],
  DIAMOND: [
    { name: "Dr. Alexandre M. Toledo", targetRole: "Juiz Federal TRF1", baseXp: 2450, streak: 42 },
    { name: "Dra. Valéria Drummond", targetRole: "Procuradora da República MPF", baseXp: 2280, streak: 38 },
    { name: "Eng. Maurício Padilha", targetRole: "Auditor-Fiscal do Trabalho AFT", baseXp: 2150, streak: 31 },
    { name: "Juliana Fagundes", targetRole: "Auditora Fiscal RFB", baseXp: 1980, streak: 27 },
    { name: "Sérgio Cavalcante", targetRole: "Defensor Público Geral", baseXp: 1840, streak: 25 },
    { name: "Amanda Linhares", targetRole: "Analista do Banco Central", baseXp: 1720, streak: 22 },
    { name: "Paulo Henrique Lins", targetRole: "Consultor Legislativo Câmara", baseXp: 1610, streak: 20 },
    { name: "Cíntia Gusmão", targetRole: "Auditora de Controle TCU", baseXp: 1530, streak: 19 },
    { name: "Rodrigo Campelo", targetRole: "Delegado de Polícia Federal", baseXp: 1460, streak: 16 },
    { name: "Beatriz Dorneles", targetRole: "Procuradora da Fazenda PGFN", baseXp: 1390, streak: 18 },
    { name: "Fernando Zveiter", targetRole: "Auditor Fiscal SEFAZ-RJ", baseXp: 1320, streak: 15 },
    { name: "Gabriela Rios", targetRole: "Analista Judiciária STJ", baseXp: 1250, streak: 14 },
    { name: "Roberto Maia", targetRole: "Magistratura Estadual TJSP", baseXp: 1190, streak: 12 },
    { name: "Carla Meirelles", targetRole: "Ministério Público MPE", baseXp: 1130, streak: 13 },
    { name: "Wagner Couto", targetRole: "Perito Oficial Forense", baseXp: 1070, streak: 11 },
    { name: "Lorena Calheiros", targetRole: "Auditoria Internacional", baseXp: 1020, streak: 10 },
    { name: "Marcio Pamplona", targetRole: "Tribunal Regional Federal", baseXp: 960, streak: 8 },
    { name: "Débora Brandão", targetRole: "Conselho Nacional de Justiça", baseXp: 900, streak: 9 },
    { name: "Icaro Boaventura", targetRole: "Controladoria Geral CGU", baseXp: 850, streak: 7 },
  ],
};

/**
 * Monta o ranking da chave de 20 concurseiros combinando o usuário atual
 * e concorrentes da mesma liga, ordenando por XP semanal.
 */
export function buildLeagueLeaderboard(
  tier: LeagueTier,
  currentUser: {
    id: string;
    name: string;
    avatar?: string | null;
    targetRole?: string | null;
    weeklyXp: number;
    streakDays: number;
  },
  otherRealUsers: Array<{
    id: string;
    name: string;
    avatar?: string | null;
    targetRole?: string | null;
    weeklyXp: number;
    streakDays: number;
  }> = []
): LeaderboardMember[] {
  const config = LEAGUE_TIERS[tier];
  const allMembers: Array<{
    id: string;
    name: string;
    avatar?: string | null;
    targetRole?: string | null;
    weeklyXp: number;
    isCurrentUser: boolean;
    streakDays: number;
  }> = [
    {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      targetRole: currentUser.targetRole || "Concurseiro Geral",
      weeklyXp: currentUser.weeklyXp,
      isCurrentUser: true,
      streakDays: currentUser.streakDays,
    },
  ];

  // Adiciona usuários reais adicionais se existirem
  otherRealUsers.forEach((user) => {
    if (user.id !== currentUser.id) {
      allMembers.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        targetRole: user.targetRole || "Concurso Público",
        weeklyXp: user.weeklyXp,
        isCurrentUser: false,
        streakDays: user.streakDays,
      });
    }
  });

  // Preenche a chave até completar 20 vagas com candidatos calibrados
  const needed = 20 - allMembers.length;
  if (needed > 0) {
    const peers = PEER_CANDIDATES[tier];
    for (let i = 0; i < needed && i < peers.length; i++) {
      const peer = peers[i];
      // Flutuação semanal orgânica leve para realismo
      const seed = (peer.name.length * 7 + i * 13) % 25;
      const weeklyXp = Math.max(0, peer.baseXp + seed);

      allMembers.push({
        id: `peer-${tier.toLowerCase()}-${i}`,
        name: peer.name,
        avatar: null,
        targetRole: peer.targetRole,
        weeklyXp,
        isCurrentUser: false,
        streakDays: peer.streak,
      });
    }
  }

  // Ordena decrescente por XP semanal
  allMembers.sort((a, b) => b.weeklyXp - a.weeklyXp);

  const total = allMembers.length;
  const promoCount = Math.max(1, Math.round(total * config.promotionTopPercent));
  const demoCount = Math.round(total * config.demotionBottomPercent);
  const demotionStartIndex = total - demoCount;

  return allMembers.map((member, index) => {
    const rank = index + 1;
    let zone: "PROMOTION" | "MAINTENANCE" | "DEMOTION" = "MAINTENANCE";

    if (config.promotionTopPercent > 0 && rank <= promoCount) {
      zone = "PROMOTION";
    } else if (config.demotionBottomPercent > 0 && index >= demotionStartIndex) {
      zone = "DEMOTION";
    }

    return {
      ...member,
      rank,
      zone,
    };
  });
}
