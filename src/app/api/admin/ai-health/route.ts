import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGeminiPoolStatus, testGeminiPoolKeys } from "@/lib/gemini-fallback";

export const dynamic = "force-dynamic";

/**
 * 🏥 Endpoint de diagnóstico e saúde do pool de chaves do Google Gemini.
 * GET /api/admin/ai-health
 * Parâmetro opcional: ?ping=true (executa um teste real de geração em cada chave para medir latência)
 * 🔒 Acesso restrito a administradores.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    const isAdmin =
      user?.role === "ADMIN" ||
      Boolean(
        user?.email &&
          process.env.ADMIN_EMAIL &&
          user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
      );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso restrito a administradores." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shouldPing = searchParams.get("ping") === "true";

    const poolStatus = getGeminiPoolStatus();

    let pingResults = null;
    if (shouldPing) {
      pingResults = await testGeminiPoolKeys();
    }

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        pool: poolStatus,
        ping: pingResults,
        tip: shouldPing
          ? "Teste de ping concluído em todas as chaves."
          : "Para testar a conectividade de cada chave agora, acesse com ?ping=true",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ai-health] Erro ao verificar saúde do pool de IA:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao checar pool de IA",
      },
      { status: 500 }
    );
  }
}
