// Define a estrutura de uma questão individual
export interface Question {
  isCorrect: boolean;
  difficulty: string;
}

// Define a estrutura do objeto 'quiz' que vem do banco
export interface Quiz {
  subject: string;
  questions: Question[];
}

// Define a estrutura do acumulador do reduce
interface SubjectStats {
  total: number;
  hits: number;
}

export const calculatePerformance = (quizzes: Quiz[]) => {
  const summary = { bom: 0, dificil: 0, errei: 0 };
  let totalQuestions = 0;
  let totalCorrect = 0;

  // Usamos Record<string, SubjectStats> para tipar o objeto dinâmico
  const performanceBySubject: Record<string, SubjectStats> = quizzes.reduce(
    (acc: Record<string, SubjectStats>, q: Quiz) => {
      if (!acc[q.subject]) {
        acc[q.subject] = { total: 0, hits: 0 };
      }

      const correctCount = q.questions.filter((item) => item.isCorrect).length;

      acc[q.subject].total += q.questions.length;
      acc[q.subject].hits += correctCount;

      totalQuestions += q.questions.length;
      totalCorrect += correctCount;

      return acc;
    },
    {},
  );

  quizzes.forEach((q) => {
    q.questions.forEach((item) => {
      if (item.isCorrect === true) {
        summary.bom += 1;
      } else {
        if (item.difficulty === "Difícil") {
          summary.errei += 1;
        } else {
          summary.dificil += 1;
        }
      }
    });
  });

  return { summary, performanceBySubject, totalQuestions, totalCorrect };
};
