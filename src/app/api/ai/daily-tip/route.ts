import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export interface DailyStudyTip {
  technique: string;
  category: string;
  summary: string;
  howToApply: string[];
  evidenceBase: string;
  estimatedTime: string;
  source: "gemini" | "curated_cache";
  date: string;
}

// Catálogo curado de técnicas de alto impacto baseadas em evidências científicas (Dunlosky et al., 2013)
const CURATED_TIPS: Omit<DailyStudyTip, "source" | "date">[] = [
  {
    technique: "Active Recall (Prática de Recuperação Ativa)",
    category: "Retenção & Memória de Longo Prazo",
    summary:
      "Forçar o cérebro a recuperar a informação da memória consolida as vias neurais sinápticas com eficácia comprovadamente 300% superior à releitura passiva.",
    howToApply: [
      "Após ler um bloco teórico, feche imediatamente o material ou pause o vídeo.",
      "Em uma folha ou editor, escreva ou explique em voz alta os pontos centrais sem consultar.",
      "Abra o material apenas para conferir omissões e sanar os pontos cegos identificados.",
    ],
    evidenceBase: "Karpicke & Roediger (Science, 2008); Dunlosky et al. (PSPI, 2013)",
    estimatedTime: "5 a 10 minutos após cada bloco",
  },
  {
    technique: "Spaced Repetition (Repetição Espaçada com Curva de Ebbinghaus)",
    category: "Combate à Curva do Esquecimento",
    summary:
      "Revisões distribuídas em intervalos crescentes (1 dia, 7 dias, 15 dias, 30 dias) resetam a curva de esquecimento e transferem o aprendizado para a memória de longo prazo.",
    howToApply: [
      "Revise tópicos novos 24 horas após o primeiro contato focando em 3 a 5 questões.",
      "Agende a segunda revisão para 7 dias depois, usando flashcards de alta dificuldade.",
      "Aumente o intervalo para tópicos dominados e reduza para conceitos em que errou.",
    ],
    evidenceBase: "Hermann Ebbinghaus; Cepeda et al. (Psychological Bulletin, 2006)",
    estimatedTime: "15 a 20 minutos no início do dia",
  },
  {
    technique: "Técnica Pomodoro Adaptativo (25m Foco / 5m Descompressão)",
    category: "Foco Profundo & Gestão de Fadiga",
    summary:
      "Períodos de foco de alta densidade cognitiva intercalados por pausas estratégicas previnem a fadiga pré-frontal e mantêm os níveis de dopamina estáveis durante a jornada.",
    howToApply: [
      "Elimine todas as notificações do celular e feche abas secundárias do navegador.",
      "Defina um único objetivo micro para o bloco (ex: 'resolver 10 questões de Direito').",
      "No intervalo de 5 minutos, levante-se, beba água e evite redes sociais para descansar a visão.",
    ],
    evidenceBase: "Francesco Cirillo; Ariga & Lleras (Cognition, 2011)",
    estimatedTime: "Blocos de 25 min (Foco) + 5 min (Pausa)",
  },
  {
    technique: "Técnica Feynman (Simplificação e Ensino)",
    category: "Compreensão Profunda & Detecção de Ilusão de Competência",
    summary:
      "Explicar um conceito complexo em termos leigos simples revela imediatamente se você realmente compreendeu a lógica interna ou se apenas memorizou jargões.",
    howToApply: [
      "Escolha a regra ou conceito mais difícil que estudou na sessão de hoje.",
      "Imagine explicar esse conceito para alguém de 12 anos sem usar palavras técnicas complexas.",
      "Quando travar ou recorrer a vocabulário vago, volte à teoria e destrinche esse elo fraco.",
    ],
    evidenceBase: "Richard Feynman; Chi et al. (Cognitive Science, 1989)",
    estimatedTime: "8 a 12 minutos ao finalizar o resumo",
  },
  {
    technique: "Interleaving (Estudo Intercalado de Disciplinas)",
    category: "Discriminação Conceitual & Agilidade",
    summary:
      "Alternar entre duas ou mais matérias ou tipos de problemas na mesma sessão treina o cérebro a categorizar e selecionar a estratégia correta sob pressão de prova.",
    howToApply: [
      "Evite estudar a mesma disciplina por 4 horas ininterruptas em blocos únicos.",
      "Intercale 50 minutos de matéria teórica (ex: Constitucional) com 50 minutos de lógica/cálculo.",
      "Misture questões de bancas ou assuntos diferentes no mesmo simulado rápido.",
    ],
    evidenceBase: "Rohrer & Taylor (Instructional Science, 2007); Dunlosky (2013)",
    estimatedTime: "Blocos alternados de 45 a 60 min",
  },
  {
    technique: "Interrogação Elaborativa (O Método do 'Por quê?')",
    category: "Associação Semântica & Raciocínio",
    summary:
      "Questionar ativamente a causa e a consequência de cada fato ou norma jurídica conecta o novo dado ao conhecimento prévio existente, fixando a memória profunda.",
    howToApply: [
      "Ao ler um artigo de lei, fórmula ou fato histórico, pergunte-se: 'Por que isso faz sentido?'",
      "Procure a razão de existir daquela regra e qual problema prático ela resolve.",
      "Conecte com um exemplo da vida real ou um caso prático emblemático.",
    ],
    evidenceBase: "Pressley et al. (Educational Psychologist, 1992); Dunlosky et al.",
    estimatedTime: "Durante a leitura de qualquer texto novo",
  },
  {
    technique: "Dual Coding (Codificação Dupla: Visual + Verbal)",
    category: "Eficiência de Processamento Cerebral",
    summary:
      "Combinar representações verbais (textos/áudios) com diagramas visuais (fluxogramas/mapas mentais) ativa dois canais de memória independentes simultaneamente.",
    howToApply: [
      "Transforme uma sequência de procedimentos ou prazos legais em uma linha do tempo gráfica.",
      "Use setas, caixas conceituais e cores funcionais para mapear relações de causa e efeito.",
      "Ao revisar, cubra as legendas e tente reconstruir o diagrama mentalmente.",
    ],
    evidenceBase: "Allan Paivio (Mental Representations, 1986); Clark & Paivio (1991)",
    estimatedTime: "10 minutos ao final de capítulos densos",
  },
  {
    technique: "Blurting Method (Despejo Cognitivo Guiado)",
    category: "Validação Imediata de Retenção",
    summary:
      "Escrever rapidamente tudo o que se lembra sobre um subtema sem censura cria um diagnóstico objetivo das lacunas de conhecimento antes de realizar simulados.",
    howToApply: [
      "Leia intensamente uma seção por 15 minutos.",
      "Marque 5 minutos no cronômetro e anote tudo o que lembrar em tópicos rápidos (blurt).",
      "Compare seu rascunho com a fonte usando caneta vermelha para assinalar o que faltou.",
    ],
    evidenceBase: "Roediger & Butler (Trends in Cognitive Sciences, 2011)",
    estimatedTime: "5 minutos por subtema",
  },
];

// Cache em memória compartilhado por data para garantir exatamente 1 chamada por dia para todos os usuários
const serverTipCache: { [dateKey: string]: DailyStudyTip } = {};
let inFlightDailyPromise: Promise<DailyStudyTip> | null = null;

function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getCuratedTipForDate(dateKey: string): DailyStudyTip {
  // Deterministic index baseado na data do dia para rotatividade uniforme
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_TIPS.length;
  const base = CURATED_TIPS[index];

  return {
    ...base,
    source: "curated_cache",
    date: dateKey,
  };
}

async function generateOrGetDailyTip(todayKey: string): Promise<DailyStudyTip> {
  // Se já existe no cache do dia, retorna direto com 0 chamadas ao Gemini
  if (serverTipCache[todayKey]) {
    return serverTipCache[todayKey];
  }

  // Se já há uma requisição em andamento neste momento, aguarda ela terminar (evita concorrência simultânea)
  if (inFlightDailyPromise) {
    return inFlightDailyPromise;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const tip = getCuratedTipForDate(todayKey);
    serverTipCache[todayKey] = tip;
    return tip;
  }

  inFlightDailyPromise = (async () => {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Dica de estudo baseada em evidências científicas para concursos e alta performance mental para a data ${todayKey}.
Gere uma técnica de estudo comprovada por neurociência e psicologia cognitiva (ex: Active Recall, Spaced Repetition, Pomodoro Adaptativo, Interleaving, Feynman, Blurting, Dual Coding, etc.).

Responda ESTRITAMENTE em formato JSON válido, sem crases markdown adicionais ao redor se possível, com a seguinte estrutura:
{
  "technique": "Nome Claro da Técnica (ex: Active Recall / Prática de Recuperação)",
  "category": "Categoria da Técnica (ex: Retenção & Memória, Foco Profundo, Gestão de Tempo, etc.)",
  "summary": "1 ou 2 frases resumindo a base científica e o impacto na aprendizagem.",
  "howToApply": [
    "Passo 1 prático e acionável para hoje",
    "Passo 2 prático e acionável para hoje",
    "Passo 3 prático e acionável para hoje"
  ],
  "evidenceBase": "Nome dos pesquisadores ou estudos de referência (ex: Dunlosky et al., 2013; Karpicke & Roediger)",
  "estimatedTime": "Tempo estimado de aplicação (ex: 5 a 10 min)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "";
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const generatedTip: DailyStudyTip = {
        technique: parsed.technique || "Active Recall (Recuperação Ativa)",
        category: parsed.category || "Alta Performance Cognitiva",
        summary:
          parsed.summary ||
          "Prática de recuperação ativa fortalece as conexões neurais e aumenta a retenção a longo prazo.",
        howToApply:
          Array.isArray(parsed.howToApply) && parsed.howToApply.length > 0
            ? parsed.howToApply
            : [
                "Feche o material de leitura após terminar um tópico.",
                "Escreva os pontos principais em uma folha sem consultar.",
                "Confira o material para identificar e sanar lacunas.",
              ],
        evidenceBase:
          parsed.evidenceBase || "Dunlosky et al. (2013); Karpicke & Roediger (2008)",
        estimatedTime: parsed.estimatedTime || "5 a 10 minutos",
        source: "gemini",
        date: todayKey,
      };

      serverTipCache[todayKey] = generatedTip;
      return generatedTip;
    } catch (error) {
      console.warn(
        "⚠️ [DailyTip] Gemini indisponível ou cota esgotada. Usando catálogo curado científico:",
        error
      );
      const fallbackTip = getCuratedTipForDate(todayKey);
      serverTipCache[todayKey] = fallbackTip;
      return fallbackTip;
    } finally {
      inFlightDailyPromise = null;
    }
  })();

  return inFlightDailyPromise;
}

export async function GET() {
  const todayKey = getTodayKey();
  const tip = await generateOrGetDailyTip(todayKey);

  return NextResponse.json({
    success: true,
    data: tip,
  });
}
