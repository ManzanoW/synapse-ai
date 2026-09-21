// In-memory mock database client for Synapse AI
// Adheres to AI Studio GitHub Migration guidelines (Section 2.2: Database & Data Layer Mock)

export interface MockStore {
  users: any[];
  userStats: any[];
  subjects: any[];
  topics: any[];
  decks: any[];
  flashcards: any[];
  quizzes: any[];
  quizAttempts: any[];
  reviewHistories: any[];
  studySessions: any[];
  userAchievementProgress: any[];
  dailyQuests: any[];
  questionErrors: any[];
  accounts: any[];
  sessions: any[];
}

function createInitialStore(): MockStore {
  const now = new Date();
  const userId = "demo-user-id";

  const sub1Id = "sub-constitucional";
  const sub2Id = "sub-portugues";
  const sub3Id = "sub-informatica";
  const sub4Id = "sub-rlm";

  const top1Id = "top-art5";
  const top2Id = "top-poderes";
  const top3Id = "top-interpretacao";
  const top4Id = "top-concordancia";
  const top5Id = "top-seguranca";
  const top6Id = "top-tabelas";

  const deck1Id = "deck-cf88";
  const deck2Id = "deck-crase";
  const deck3Id = "deck-cripto";

  // Past dates for review history
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  return {
    users: [
      {
        id: userId,
        name: "Estudante Synapse",
        email: "estudante@synapse.ai",
        emailVerified: null,
        image: null,
        targetExamDate: new Date(now.getTime() + 65 * 24 * 60 * 60 * 1000),
        studyMode: "WEEKLY",
        weeklyGoalHours: 15,
        activeDaysPerWeek: 5,
        cycleCurrentIndex: 1,
        cycleLap: 1,
        streakFreezes: 1,
        createdAt: daysAgo(30),
        updatedAt: now,
      },
    ],
    userStats: [
      {
        id: "stats-1",
        userId,
        totalXp: 850,
        streakDays: 7,
        streakFreezes: 1,
        prestige: 0,
        claimedAchievements: "",
        lastStudyDate: now,
        createdAt: daysAgo(30),
        updatedAt: now,
      },
    ],
    subjects: [
      {
        id: sub1Id,
        name: "Direito Constitucional",
        importance: "Alta",
        color: "#6366F1",
        weight: 8.5,
        priority: 8.5,
        assignedDay: null,
        lastReviewed: daysAgo(1),
        nextReview: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        interval: 3,
        easiness: 2.5,
        userId,
        createdAt: daysAgo(25),
        updatedAt: now,
      },
      {
        id: sub2Id,
        name: "Língua Portuguesa",
        importance: "Alta",
        color: "#10B981",
        weight: 9.0,
        priority: 9.0,
        assignedDay: null,
        lastReviewed: daysAgo(2),
        nextReview: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        interval: 4,
        easiness: 2.6,
        userId,
        createdAt: daysAgo(25),
        updatedAt: now,
      },
      {
        id: sub3Id,
        name: "Informática & Tecnologia",
        importance: "Média",
        color: "#06B6D4",
        weight: 7.5,
        priority: 7.5,
        assignedDay: null,
        lastReviewed: daysAgo(3),
        nextReview: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        interval: 2,
        easiness: 2.4,
        userId,
        createdAt: daysAgo(25),
        updatedAt: now,
      },
      {
        id: sub4Id,
        name: "Raciocínio Lógico-Matemático",
        importance: "Média",
        color: "#F59E0B",
        weight: 7.0,
        priority: 7.0,
        assignedDay: null,
        lastReviewed: daysAgo(4),
        nextReview: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        interval: 3,
        easiness: 2.5,
        userId,
        createdAt: daysAgo(25),
        updatedAt: now,
      },
    ],
    topics: [
      {
        id: top1Id,
        title: "Direitos e Deveres Individuais e Coletivos (Art. 5º)",
        subjectId: sub1Id,
        firstStudy: "Em Estudo",
        performance: 85,
        easiness: 2.5,
        relevance: "9/10",
        interval: 3,
        repetitions: 2,
        lastRev: daysAgo(1),
        nextRev: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: top2Id,
        title: "Organização dos Poderes e Controle de Constitucionalidade",
        subjectId: sub1Id,
        firstStudy: "Pendente",
        performance: 60,
        easiness: 2.5,
        relevance: "8/10",
        interval: 1,
        repetitions: 0,
        lastRev: null,
        nextRev: now,
      },
      {
        id: top3Id,
        title: "Interpretação e Coesão Textual",
        subjectId: sub2Id,
        firstStudy: "Concluido",
        performance: 92,
        easiness: 2.6,
        relevance: "10/10",
        interval: 7,
        repetitions: 4,
        lastRev: daysAgo(2),
        nextRev: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: top4Id,
        title: "Concordância Verbal, Nominal e Crase",
        subjectId: sub2Id,
        firstStudy: "Em Estudo",
        performance: 75,
        easiness: 2.4,
        relevance: "9/10",
        interval: 2,
        repetitions: 1,
        lastRev: daysAgo(2),
        nextRev: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: top5Id,
        title: "Segurança da Informação, Criptografia e Backup",
        subjectId: sub3Id,
        firstStudy: "Em Estudo",
        performance: 80,
        easiness: 2.5,
        relevance: "8/10",
        interval: 3,
        repetitions: 2,
        lastRev: daysAgo(3),
        nextRev: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: top6Id,
        title: "Proposições Lógicas e Tabelas Verdade",
        subjectId: sub4Id,
        firstStudy: "Concluido",
        performance: 88,
        easiness: 2.5,
        relevance: "8/10",
        interval: 5,
        repetitions: 3,
        lastRev: daysAgo(4),
        nextRev: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    ],
    decks: [
      {
        id: deck1Id,
        title: "Constituição Federal - Artigo 5º",
        color: "bg-indigo-600",
        subjectId: sub1Id,
        topicId: top1Id,
        userId,
        createdAt: daysAgo(20),
      },
      {
        id: deck2Id,
        title: "Crase e Regência Essencial",
        color: "bg-emerald-600",
        subjectId: sub2Id,
        topicId: top4Id,
        userId,
        createdAt: daysAgo(18),
      },
      {
        id: deck3Id,
        title: "Segurança e Criptografia",
        color: "bg-cyan-600",
        subjectId: sub3Id,
        topicId: top5Id,
        userId,
        createdAt: daysAgo(15),
      },
    ],
    flashcards: [
      {
        id: "card-1",
        question: "A inviolabilidade de domicílio comporta quais exceções para entrada sem consentimento do morador durante o dia?",
        answer: "Flagrante delito, desastre, prestação de socorro, ou por determinação judicial (durante o dia).",
        details: "Art. 5º, XI da CF/88. À noite, determinação judicial NÃO autoriza entrada sem consentimento.",
        interval: 4,
        easeFactor: 2.5,
        stability: 3.2,
        difficulty: 4.0,
        repetitions: 2,
        lapses: 0,
        nextReviewDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        lastReviewed: daysAgo(1),
        deckId: deck1Id,
        topicId: top1Id,
        createdAt: daysAgo(20),
        updatedAt: now,
      },
      {
        id: "card-2",
        question: "É cabível mandado de segurança coletivo impetrado por qual partido político?",
        answer: "Partido político com representação no Congresso Nacional (pelo menos um deputado ou senador).",
        details: "Art. 5º, LXX, 'a' da CF/88.",
        interval: 3,
        easeFactor: 2.5,
        stability: 2.8,
        difficulty: 4.5,
        repetitions: 1,
        lapses: 0,
        nextReviewDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        lastReviewed: daysAgo(2),
        deckId: deck1Id,
        topicId: top1Id,
        createdAt: daysAgo(20),
        updatedAt: now,
      },
      {
        id: "card-3",
        question: "Ocorre crase diante de pronomes de tratamento em geral?",
        answer: "Regra geral: Não há crase antes de pronomes de tratamento. Exceções: Senhora, Senhorita e Dona.",
        details: "Exemplo: Dirigi-me à Senhora diretora. / Entreguei o relatório a Vossa Excelência.",
        interval: 5,
        easeFactor: 2.6,
        stability: 4.1,
        difficulty: 3.8,
        repetitions: 3,
        lapses: 0,
        nextReviewDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        lastReviewed: daysAgo(2),
        deckId: deck2Id,
        topicId: top4Id,
        createdAt: daysAgo(18),
        updatedAt: now,
      },
      {
        id: "card-4",
        question: "Qual a diferença central entre criptografia simétrica e assimétrica?",
        answer: "Simétrica usa a mesma chave para cifrar e decifrar (ex: AES). Assimétrica usa um par de chaves pública e privada (ex: RSA).",
        details: "A chave pública cifra ou valida assinaturas; a chave privada decifra ou assina.",
        interval: 4,
        easeFactor: 2.5,
        stability: 3.0,
        difficulty: 4.0,
        repetitions: 2,
        lapses: 0,
        nextReviewDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        lastReviewed: daysAgo(3),
        deckId: deck3Id,
        topicId: top5Id,
        createdAt: daysAgo(15),
        updatedAt: now,
      },
    ],
    quizzes: [],
    quizAttempts: [
      {
        id: "attempt-1",
        userId,
        topicId: top1Id,
        totalCount: 10,
        correctCount: 9,
        completedAt: daysAgo(1),
      },
      {
        id: "attempt-2",
        userId,
        topicId: top3Id,
        totalCount: 10,
        correctCount: 10,
        completedAt: daysAgo(2),
      },
    ],
    reviewHistories: [
      { id: "rev-1", topicId: top1Id, grade: "BOM", durationSeconds: 75, reviewedAt: daysAgo(0) },
      { id: "rev-2", topicId: top4Id, grade: "FACIL", durationSeconds: 60, reviewedAt: daysAgo(0) },
      { id: "rev-3", topicId: top1Id, grade: "BOM", durationSeconds: 90, reviewedAt: daysAgo(1) },
      { id: "rev-4", topicId: top3Id, grade: "FACIL", durationSeconds: 50, reviewedAt: daysAgo(2) },
      { id: "rev-5", topicId: top5Id, grade: "BOM", durationSeconds: 85, reviewedAt: daysAgo(3) },
      { id: "rev-6", topicId: top6Id, grade: "FACIL", durationSeconds: 65, reviewedAt: daysAgo(4) },
      { id: "rev-7", topicId: top1Id, grade: "BOM", durationSeconds: 70, reviewedAt: daysAgo(5) },
      { id: "rev-8", topicId: top4Id, grade: "BOM", durationSeconds: 80, reviewedAt: daysAgo(6) },
    ],
    studySessions: [
      { id: "sess-1", userId, date: daysAgo(0), status: "COMPLETED", durationMinutes: 45, notes: "Artigo 5º e Crase", createdAt: daysAgo(0) },
      { id: "sess-2", userId, date: daysAgo(1), status: "COMPLETED", durationMinutes: 50, notes: "Revisão CF88", createdAt: daysAgo(1) },
      { id: "sess-3", userId, date: daysAgo(2), status: "COMPLETED", durationMinutes: 40, notes: "Interpretação e sintaxe", createdAt: daysAgo(2) },
      { id: "sess-4", userId, date: daysAgo(3), status: "COMPLETED", durationMinutes: 35, notes: "Criptografia", createdAt: daysAgo(3) },
      { id: "sess-5", userId, date: daysAgo(4), status: "COMPLETED", durationMinutes: 60, notes: "Raciocínio lógico e tabelas", createdAt: daysAgo(4) },
    ],
    userAchievementProgress: [
      { id: "ach-1", userId, achievementId: "first_flashcard", currentValue: 10, isUnlocked: true, isClaimed: true, unlockedAt: daysAgo(20), createdAt: daysAgo(20), updatedAt: now },
      { id: "ach-2", userId, achievementId: "streak_3", currentValue: 7, isUnlocked: true, isClaimed: true, unlockedAt: daysAgo(4), createdAt: daysAgo(20), updatedAt: now },
      { id: "ach-3", userId, achievementId: "streak_7", currentValue: 7, isUnlocked: true, isClaimed: false, unlockedAt: now, createdAt: daysAgo(20), updatedAt: now },
      { id: "ach-4", userId, achievementId: "quiz_master", currentValue: 2, isUnlocked: false, isClaimed: false, unlockedAt: null, createdAt: daysAgo(20), updatedAt: now },
    ],
    dailyQuests: [
      {
        id: "quest-1",
        userId,
        title: "Revisão Espaçada Diária",
        description: "Complete pelo menos 10 revisões de flashcards hoje.",
        xpReward: 50,
        targetCount: 10,
        currentCount: 8,
        completed: false,
        claimed: false,
        questDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "quest-2",
        userId,
        title: "Mapeamento do Edital",
        description: "Avance ou conclua 1 tópico do seu cronograma de estudos.",
        xpReward: 75,
        targetCount: 1,
        currentCount: 1,
        completed: true,
        claimed: false,
        questDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "quest-3",
        userId,
        title: "Alta Concentração",
        description: "Conclua uma sessão de estudos ou simulado no cronômetro.",
        xpReward: 60,
        targetCount: 1,
        currentCount: 0,
        completed: false,
        claimed: false,
        questDate: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    questionErrors: [
      {
        id: "err-1",
        userId,
        subjectId: sub1Id,
        topicId: top1Id,
        quizId: null,
        questionText: "Acerca dos direitos e garantias fundamentais, a quebra de sigilo telefônico pode ser determinada diretamente pela autoridade policial em caso de urgência?",
        options: [
          { id: "A", texto: "Sim, desde que fundamentada e ratificada pelo juiz em 24 horas." },
          { id: "B", texto: "Não, a interceptação telefônica depende de estrita ordem judicial." },
          { id: "C", texto: "Sim, apenas para crimes hediondos ou equiparados." },
          { id: "D", texto: "Não, depende de deliberação prévia do Ministério Público." }
        ],
        userAnswer: "A",
        correctAnswer: "B",
        explanation: "A interceptação das comunicações telefônicas (Art. 5º, XII) está sob reserva de jurisdição: somente a autoridade JUDICIAL pode determinar.",
        errorReason: "CONTENT_GAP",
        status: "PENDING",
        masteredAt: null,
        aiExplanation: "Lembre-se: interceptação telefônica é cláusula de reserva de jurisdição. Delegado NUNCA pode decretar, apenas solicitar ao juiz.",
        mnemonic: "Telefone grampeado? Só com a caneta do Juizado!",
        drillQuestion: null,
        createdAt: daysAgo(1),
        updatedAt: now,
      },
    ],
    accounts: [],
    sessions: [],
  };
}

// In-memory singleton state
let globalStore: MockStore | null = null;
function getStore(): MockStore {
  if (!globalStore) {
    globalStore = createInitialStore();
  }
  return globalStore;
}

function matchesWhere(item: any, where: any, store: MockStore): boolean {
  if (!where || typeof where !== "object") return true;

  for (const key of Object.keys(where)) {
    const condition = where[key];
    if (condition === undefined) continue;

    if (key === "AND") {
      const arr = Array.isArray(condition) ? condition : [condition];
      if (!arr.every((sub) => matchesWhere(item, sub, store))) return false;
      continue;
    }
    if (key === "OR") {
      const arr = Array.isArray(condition) ? condition : [condition];
      if (!arr.some((sub) => matchesWhere(item, sub, store))) return false;
      continue;
    }
    if (key === "NOT") {
      const arr = Array.isArray(condition) ? condition : [condition];
      if (arr.some((sub) => matchesWhere(item, sub, store))) return false;
      continue;
    }

    // Relation joins
    if (key === "subject" && typeof condition === "object") {
      const sub = store.subjects.find((s) => s.id === item.subjectId);
      if (!sub || !matchesWhere(sub, condition, store)) return false;
      continue;
    }
    if (key === "topic" && typeof condition === "object") {
      const top = store.topics.find((t) => t.id === item.topicId);
      if (!top || !matchesWhere(top, condition, store)) return false;
      continue;
    }
    if (key === "deck" && typeof condition === "object") {
      const deck = store.decks.find((d) => d.id === item.deckId);
      if (!deck || !matchesWhere(deck, condition, store)) return false;
      continue;
    }
    if (key === "user" && typeof condition === "object") {
      const user = store.users.find((u) => u.id === item.userId);
      if (!user || !matchesWhere(user, condition, store)) return false;
      continue;
    }

    const val = item[key];

    if (condition === null) {
      if (val !== null && val !== undefined) return false;
      continue;
    }

    if (typeof condition === "object" && !(condition instanceof Date)) {
      if ("equals" in condition && val !== condition.equals) return false;
      if ("not" in condition && val === condition.not) return false;
      if ("in" in condition && (!Array.isArray(condition.in) || !condition.in.includes(val))) return false;
      if ("notIn" in condition && Array.isArray(condition.notIn) && condition.notIn.includes(val)) return false;
      if ("contains" in condition) {
        const needle = String(condition.contains).toLowerCase();
        if (!String(val || "").toLowerCase().includes(needle)) return false;
      }
      if ("gte" in condition) {
        const v = val instanceof Date ? val.getTime() : val;
        const c = condition.gte instanceof Date ? condition.gte.getTime() : condition.gte;
        if (v < c) return false;
      }
      if ("lte" in condition) {
        const v = val instanceof Date ? val.getTime() : val;
        const c = condition.lte instanceof Date ? condition.lte.getTime() : condition.lte;
        if (v > c) return false;
      }
      if ("gt" in condition) {
        const v = val instanceof Date ? val.getTime() : val;
        const c = condition.gt instanceof Date ? condition.gt.getTime() : condition.gt;
        if (v <= c) return false;
      }
      if ("lt" in condition) {
        const v = val instanceof Date ? val.getTime() : val;
        const c = condition.lt instanceof Date ? condition.lt.getTime() : condition.lt;
        if (v >= c) return false;
      }
      continue;
    }

    if (val !== condition) return false;
  }

  return true;
}

function expandRelations(item: any, include: any, store: MockStore): any {
  if (!include || typeof include !== "object" || !item) return item;
  const copy = { ...item };

  if (include.topics) {
    copy.topics = store.topics.filter((t) => t.subjectId === item.id);
  }
  if (include.subject) {
    copy.subject = store.subjects.find((s) => s.id === item.subjectId) || null;
  }
  if (include.topic) {
    copy.topic = store.topics.find((t) => t.id === item.topicId) || null;
  }
  if (include.decks) {
    copy.decks = store.decks.filter((d) => d.subjectId === item.id || d.topicId === item.id);
  }
  if (include.flashcards) {
    copy.flashcards = store.flashcards.filter((f) => f.deckId === item.id || f.topicId === item.id);
  }
  if (include.userStats) {
    copy.userStats = store.userStats.find((s) => s.userId === item.id) || null;
  }
  if (include.dailyQuests) {
    copy.dailyQuests = store.dailyQuests.filter((q) => q.userId === item.id);
  }
  if (include._count) {
    copy._count = {};
    if (include._count.select?.flashcards) {
      copy._count.flashcards = store.flashcards.filter((f) => f.deckId === item.id).length;
    }
    if (include._count.select?.topics) {
      copy._count.topics = store.topics.filter((t) => t.subjectId === item.id).length;
    }
  }

  return copy;
}

function applySelect(item: any, select: any): any {
  if (!select || typeof select !== "object" || !item) return item;
  const result: any = {};
  for (const key of Object.keys(select)) {
    if (select[key]) {
      result[key] = item[key];
    }
  }
  return result;
}

function createModelHandler(getCollection: (store: MockStore) => any[]) {
  return {
    async findMany(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      let filtered = list.filter((item) => matchesWhere(item, args.where, store));

      if (args.orderBy) {
        const orderKey = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[orderKey];
        filtered.sort((a, b) => {
          const valA = a[orderKey];
          const valB = b[orderKey];
          if (valA < valB) return dir === "desc" ? 1 : -1;
          if (valA > valB) return dir === "desc" ? -1 : 1;
          return 0;
        });
      }

      if (args.skip) filtered = filtered.slice(args.skip);
      if (args.take) filtered = filtered.slice(0, args.take);

      return filtered.map((item) => {
        let result = expandRelations(item, args.include, store);
        if (args.select) result = applySelect(result, args.select);
        return { ...result };
      });
    },

    async findFirst(args: any = {}) {
      const items = await this.findMany({ ...args, take: 1 });
      return items[0] || null;
    },

    async findUnique(args: any = {}) {
      return this.findFirst(args);
    },

    async count(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      return list.filter((item) => matchesWhere(item, args.where, store)).length;
    },

    async create(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      const dataCopy = { ...args.data };

      // Extrai tópicos aninhados se houver (ex: subject.create com topics: { create: [...] })
      const nestedTopicsCreate = dataCopy.topics?.create;
      delete dataCopy.topics;

      const newItem = {
        id: dataCopy.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dataCopy,
      };
      list.push(newItem);

      if (nestedTopicsCreate) {
        const topicsList = Array.isArray(nestedTopicsCreate)
          ? nestedTopicsCreate
          : [nestedTopicsCreate];
        for (const t of topicsList) {
          store.topics.push({
            id: t.id || `mock-top-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            subjectId: newItem.id,
            firstStudy: t.firstStudy || "Pendente",
            performance: t.performance || 0,
            relevance: t.relevance || "5/10",
            createdAt: new Date(),
            updatedAt: new Date(),
            ...t,
          });
        }
      }

      let result = expandRelations(newItem, args.include, store);
      if (args.select) result = applySelect(result, args.select);
      return { ...result };
    },

    async update(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      const index = list.findIndex((item) => matchesWhere(item, args.where, store));
      if (index === -1) {
        return this.create({ data: { ...args.where, ...args.data }, include: args.include, select: args.select });
      }
      const existing = list[index];
      const updated = {
        ...existing,
        ...args.data,
        updatedAt: new Date(),
      };
      list[index] = updated;
      let result = expandRelations(updated, args.include, store);
      if (args.select) result = applySelect(result, args.select);
      return { ...result };
    },

    async updateMany(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        if (matchesWhere(list[i], args.where, store)) {
          list[i] = { ...list[i], ...args.data, updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    },

    async upsert(args: any = {}) {
      const existing = await this.findFirst({ where: args.where });
      if (existing) {
        return this.update({ where: args.where, data: args.update, include: args.include, select: args.select });
      } else {
        return this.create({ data: { ...args.where, ...args.create }, include: args.include, select: args.select });
      }
    },

    async delete(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      const index = list.findIndex((item) => matchesWhere(item, args.where, store));
      if (index !== -1) {
        const [removed] = list.splice(index, 1);
        return removed;
      }
      return {};
    },

    async deleteMany(args: any = {}) {
      const store = getStore();
      const list = getCollection(store);
      const before = list.length;
      for (let i = list.length - 1; i >= 0; i--) {
        if (matchesWhere(list[i], args.where, store)) {
          list.splice(i, 1);
        }
      }
      return { count: before - list.length };
    },
  };
}

export function createMockPrismaClient(): any {
  return {
    user: createModelHandler((s) => s.users),
    userStats: createModelHandler((s) => s.userStats),
    subject: createModelHandler((s) => s.subjects),
    topic: createModelHandler((s) => s.topics),
    deck: createModelHandler((s) => s.decks),
    flashcard: createModelHandler((s) => s.flashcards),
    quiz: createModelHandler((s) => s.quizzes),
    quizAttempt: createModelHandler((s) => s.quizAttempts),
    reviewHistory: createModelHandler((s) => s.reviewHistories),
    studySession: createModelHandler((s) => s.studySessions),
    userAchievementProgress: createModelHandler((s) => s.userAchievementProgress),
    dailyQuest: createModelHandler((s) => s.dailyQuests),
    questionError: createModelHandler((s) => s.questionErrors),
    account: createModelHandler((s) => s.accounts),
    session: createModelHandler((s) => s.sessions),
    $transaction: async (arg: any) => {
      if (typeof arg === "function") {
        return arg(createMockPrismaClient());
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    },
    $connect: async () => {},
    $disconnect: async () => {},
  };
}
