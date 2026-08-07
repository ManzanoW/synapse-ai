import { ToastAchievement } from "@/components/achievements/achievement-toast";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function checkNewAchievements(
  notifyFn: (achievement: ToastAchievement) => void
) {
  try {
    const res = await fetch("/api/achievements");
    if (!res.ok) return;

    const data = await res.json();
    const progressList = data.progress || [];

    // Busca o histórico local para não repetir notificações já exibidas
    const notifiedIds: string[] = JSON.parse(
      localStorage.getItem("notified_achievements") || "[]"
    );

    // Filtra conquistas recém-desbloqueadas
    const newUnlocked = progressList.filter(
      (item: { isUnlocked: boolean; achievementId: string }) =>
        item.isUnlocked && !notifiedIds.includes(item.achievementId)
    );

    if (newUnlocked.length > 0) {
      for (const item of newUnlocked) {
        // Busca os dados diretamente da constante centralizada em achievements.ts
        const badge = ACHIEVEMENTS.find((b) => b.id === item.achievementId);

        if (badge) {
          notifyFn({
            id: badge.id,
            title: badge.title,
            description: badge.description,
            icon: badge.icon,
            xpReward: badge.xpReward,
          });

          notifiedIds.push(badge.id);
        }
      }

      // Atualiza o histórico local
      localStorage.setItem("notified_achievements", JSON.stringify(notifiedIds));
    }
  } catch (error) {
    console.error("Erro ao verificar conquistas:", error);
  }
}
