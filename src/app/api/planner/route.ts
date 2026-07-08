import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importa a instância centralizada

export const dynamic = 'force-dynamic';

// GET: Busca o Edital Verticalizado ou a Lista de Tópicos do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'topics'; // 'topics' ou 'subjects'
    const userId = "id-do-usuario-temporario"; // TODO: Substituir pelo ID do Auth quando integrarmos o Next-Auth/Supabase Auth

    if (mode === 'subjects') {
      // Retorna o Edital Macro agrupado por Matérias
      const subjects = await prisma.subject.findMany({
        where: { userId },
        include: {
          _count: {
            select: { topics: true } // Conta quantos tópicos a matéria tem ao todo
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      return NextResponse.json({ data: subjects }, { status: 200 });
    }

    // Por padrão (mode = topics), retorna a listagem detalhada de todos os tópicos
    const topics = await prisma.topic.findMany({
      where: {
        subject: { userId }
      },
      include: {
        subject: {
          select: { name: true } // Traz o nome da matéria vinculada
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: topics }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}

// POST: Alimenta o histórico e atualiza a curva de esquecimento (Ebbinghaus) de um tópico
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, grade, performance } = body; // grade: "Bom", "Difícil", "Errei"

    if (!topicId || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Registra a sessão de revisão no histórico para alimentar nossa IA futura
    await prisma.reviewHistory.create({
      data: { topicId, grade }
    });

    // 2. Calcula a próxima revisão baseado na resposta (Simulando o motor de Ebbinghaus)
    let daysToAdd = 1;
    if (grade === 'Bom') daysToAdd = 7;
    if (grade === 'Difícil') daysToAdd = 3;

    const nextRevisionDate = new Date();
    nextRevisionDate.setDate(nextRevisionDate.getDate() + daysToAdd);

    // 3. Atualiza os dados do Tópico
    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        firstStudy: 'Em Revisão',
        performance: performance !== undefined ? performance : 0,
        lastRev: new Date(),
        nextRev: nextRevisionDate
      }
    });

    return NextResponse.json({ message: 'Progress updated successfully!', data: updatedTopic }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}