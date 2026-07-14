export interface Subject {
  id: string;
  name: string;
  importance?: string;
  priority?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  // Campos do motor SM-2
  easiness?: number;
  interval?: number;
  repetitions?: number;
  // Relacionamento
  subject?: { name: string };
  subjectId: string;
  flashcards?: Flashcard[];
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
  subject?: { name: string }; // Adicionando o campo de relação
  _count: {
    flashcards: number;
  };
}
