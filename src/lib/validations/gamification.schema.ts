import { z } from "zod";

export const RecordStudyActivitySchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  earnedXp: z
    .number()
    .int()
    .min(0, "XP não pode ser negativo")
    .max(1000, "Limite de XP por atividade excedido"),
  activityType: z.string().min(1).default("GENERAL"),
  durationMinutes: z.number().min(0).max(720).default(1),
});

export type ValidatedRecordStudyActivityInput = z.infer<typeof RecordStudyActivitySchema>;
