import { Quiz } from "@prisma/client";

export interface Subject {
  id: string;
  name: string;
  importance?: string;
  priority?: number | string;
  color?: string | null;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    topics: number;
  };
  topics?: Topic[];
}

export interface DashboardSubject extends Subject {
  progress?: number;
  accuracy?: number;
  domain?: number;
  weight?: number;
  timeSpent?: string;
  _count?: {
    topics: number;
  };
}

// src/types/index.ts

export interface BaseFlashcard {
  id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Flashcard extends BaseFlashcard {
  // Suporte à estrutura por Decks / SM-2
  front?: string;
  back?: string;
  deckId?: string | null;
  interval?: number;
  repetitions?: number;
  easeFactor?: number;
  dueDate?: string | Date;

  // Suporte ao formato legado / baseado em Tópicos
  question?: string;
  answer?: string;
  details?: string | null;
  topicId?: string | null;
  topicTitle?: string;
  subjectName?: string;
}

export interface Topic {
  id: string;
  title: string;
  firstStudy: string;
  performance: number;
  lastRev: string | null;
  nextRev: string | null;
  relevance?: string;
  color?: string | null;
  // ID do simulado gerado vinculando ao Planner
  quizId?: string | null;
  // Campos do motor SM-2
  easiness?: number;
  interval?: number;
  repetitions?: number;
  // RELACIONAMENTO ATUALIZADO:
  subject?: {
    id?: string;
    name: string;
    color?: string | null;
  };
  subjectId: string;
  flashcards?: Flashcard[];
  questions?: Quiz[];
}

export interface ReviewTopic {
  id: string;
  title: string;
  firstStudy: string;
  performance?: number;
  subject?: {
    name: string;
    color?: string;
  };
}

export interface ReviewHistory {
  id: string;
  topicId: string;
  grade: string;
  createdAt: Date;
}

export interface FlashcardRaw {
  question: string;
  answer: string;
  details: string;
}

export interface Deck {
  id: string;
  title: string;
  color?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  subjectId?: string | null;

  subject?: {
    id?: string;
    name: string;
    color?: string | null;
  } | null;

  flashcards?: Flashcard[];
  _count?: {
    flashcards: number;
  };
}
