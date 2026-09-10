export function calculateIdealPace(
  remainingTopics: number,
  targetExamDate: Date | string | null,
) {
  if (!targetExamDate || remainingTopics <= 0) return null;

  const now = new Date();
  const examDate = new Date(targetExamDate);
  const diffTime = examDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return null;

  const remainingWeeks = diffDays / 7;
  // Arredonda para 1 casa decimal (ex: 2.7 tópicos/semana)
  const topicsPerWeek = (remainingTopics / remainingWeeks).toFixed(1);

  return {
    daysRemaining: diffDays,
    weeksRemaining: Math.ceil(remainingWeeks),
    topicsPerWeek: parseFloat(topicsPerWeek),
  };
}
