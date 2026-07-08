import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 🔑 DEFINIR AQUI O ID REAL DO USUÁRIO
const REAL_USER_ID = "test"; 

// GET: Busca o Edital Verticalizado ou a Lista de Tópicos do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'topics';

    if (mode === 'subjects') {
      const subjects = await prisma.subject.findMany({
        where: { userId: REAL_USER_ID },
        include: {
          _count: {
            select: { topics: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      return NextResponse.json({ data: subjects }, { status: 200 });
    }

    const topics = await prisma.topic.findMany({
      where: {
        subject: { userId: REAL_USER_ID }
      },
      include: {
        subject: {
          select: { name: true }
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

// POST: Trata tanto a criação de novos conteúdos quanto a atualização da curva de Ebbinghaus
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🌟 FLUXO A: Criação de Novo Conteúdo / Tópico
    if (body.action === 'CREATE') {
      const { title, subjectName, relevance } = body;

      if (!title || !subjectName) {
        return NextResponse.json({ error: 'Título e Matéria são obrigatórios' }, { status: 400 });
      }

      let subject = await prisma.subject.findFirst({
        where: {
          name: {
            equals: subjectName.trim(),
            mode: 'insensitive'
          },
          userId: REAL_USER_ID
        }
      });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subjectName.trim(),
            userId: REAL_USER_ID,
            importance: "5" // Ótima sacada colocar o campo obrigatório aqui!
          }
        });
      }

      const newTopic = await prisma.topic.create({
        data: {
          title: title.trim(),
          subjectId: subject.id,
          firstStudy: 'Pendente',
          performance: 0,
          relevance: relevance || '5/10'
        }
      });

      return NextResponse.json({ message: 'Conteúdo criado com sucesso!', data: newTopic }, { status: 201 });
    }

    // 🧠 FLUXO B: Atualizar histórico e curva de esquecimento (Ebbinghaus clássico)
    const { topicId, grade, performance } = body;

    if (!topicId || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.reviewHistory.create({
      data: { topicId, grade }
    });

    let daysToAdd = 1;
    if (grade === 'Bom') daysToAdd = 7;
    if (grade === 'Difícil') daysToAdd = 3;

    const nextRevisionDate = new Date();
    nextRevisionDate.setDate(nextRevisionDate.getDate() + daysToAdd);

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
    console.error("❌ ERRO CRÍTICO NO PRISMA 7:", error);

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}