import { Quiz } from "@prisma/client";

export interface Subject {
  id: string;
  name: string;
  importance?: string;
  priority?: string;
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
  timeSpent?: string;
  _count?: {
    topics: number;
  };
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  details: string | null;
  topicId: string;
  topicTitle: string;
  subjectName: string;
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
  // Campos do motor SM-2
  easiness?: number;
  interval?: number;
  repetitions?: number;
  // 🟢 RELACIONAMENTO ATUALIZADO:
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
  color: string;
  // 🟢 RELACIONAMENTO ATUALIZADO:
  subject?: {
    id?: string;
    name: string;
    color?: string | null;
  };
  _count: {
    flashcards: number;
  };
}
