"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function unlockAchievementEventAction(achievementId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false };

    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { claimedAchievements: true },
    });

    const currentClaimed = (userStats?.claimedAchievements || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const unlockFlag = `${achievementId}_unlocked`;

    if (!currentClaimed.includes(unlockFlag)) {
      currentClaimed.push(unlockFlag);

      await prisma.userStats.upsert({
        where: { userId },
        update: { claimedAchievements: currentClaimed.join(",") },
        create: { userId, claimedAchievements: currentClaimed.join(",") },
      });

      revalidatePath("/achievements");
      return { success: true, newlyUnlocked: true };
    }

    return { success: true, newlyUnlocked: false };
  } catch (err) {
    console.warn("Aviso ao registrar evento de conquista:", err);
    return { success: false };
  }
}
