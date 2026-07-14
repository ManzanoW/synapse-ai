import { prisma } from "@/lib/prisma";

export async function updateSubjectSRS(
  subjectId: string,
  performance: "bom" | "dificil" | "errei",
) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return;

  let { interval, easiness } = subject;
  let nextInterval = interval;

  // Lógica do Algoritmo SM-2 adaptada
  if (performance === "bom") {
    easiness += 0.1;
    nextInterval = interval === 1 ? 6 : Math.round(interval * easiness);
  } else if (performance === "dificil") {
    easiness = Math.max(1.3, easiness - 0.2);
    nextInterval = Math.max(1, Math.round(interval * 0.5));
  } else {
    // "errei" -> Reset total
    easiness = Math.max(1.3, easiness - 0.5);
    nextInterval = 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return await prisma.subject.update({
    where: { id: subjectId },
    data: {
      lastReviewed: new Date(),
      nextReview: nextReviewDate,
      interval: nextInterval,
      easiness: easiness,
    },
  });
}
