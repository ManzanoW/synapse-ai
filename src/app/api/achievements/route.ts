import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserAchievementsProgress } from "@/lib/achievements-engine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const progress = await getUserAchievementsProgress(session.user.id);
    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Erro ao buscar conquistas:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
