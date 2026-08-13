// src/lib/srs-service.ts
import { prisma } from "@/lib/prisma";
import { calculateSM2FromLabel } from "@/lib/sm2";

export async function updateSubjectSRS(
  subjectId: string,
  performance: "bom" | "dificil" | "errei",
) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return;

  const { nextInterval, nextEasiness, nextReviewDate } = calculateSM2FromLabel(
    subject.interval || 1,
    subject.easiness || 2.5,
    1,
    performance,
  );

  return await prisma.subject.update({
    where: { id: subjectId },
    data: {
      lastReviewed: new Date(),
      nextReview: nextReviewDate,
      interval: nextInterval,
      easiness: nextEasiness,
    },
  });
}
