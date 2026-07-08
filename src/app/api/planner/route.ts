// src/app/api/planner/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Função auxiliar para inicializar o Supabase com os cookies da requisição
async function getSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
          }
        },
      },
    }
  );
}

// GET: Busca os dados do Planner do usuário logado
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    // 1. Verifica se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Busca os dados relacionados (Boards -> Colunas -> Tarefas)
    const { data: plannerData, error: dbError } = await supabase
      .from('planner_boards')
      .select(`
        id,
        title,
        created_at,
        planner_columns (
          id,
          title,
          order,
          planner_tasks (
            id,
            title,
            description,
            status,
            priority,
            due_date,
            order
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (dbError) throw dbError;

    return NextResponse.json({ data: plannerData }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar dados do Planner', details: message },
      { status: 500 }
    );
  }
}

// POST: Cria uma nova tarefa no Planner
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    // 1. Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Recebe o payload da requisição
    const body = await request.json();
    const { title, description, column_id, priority, due_date, order } = body;

    if (!title || !column_id) {
      return NextResponse.json(
        { error: 'Título e ID da coluna são obrigatórios' },
        { status: 400 }
      );
    }

    // 3. Insere no banco
    const { data: newTask, error: dbError } = await supabase
      .from('planner_tasks')
      .insert([
        {
          user_id: user.id,
          column_id,
          title,
          description,
          priority: priority || 'medium',
          due_date,
          order: order || 0
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ message: 'Tarefa criada com sucesso!', data: newTask }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro interno ao criar tarefa', details: message },
      { status: 500 }
    );
  }
}

// PATCH: Atualiza campos de uma tarefa (ex: mover de coluna, mudar ordem ou editar texto)
export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    // 1. Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Recebe o payload
    const body = await request.json();
    const { id, ...updates } = body; // Destrutura pegando o ID e o resto dos campos modificados

    if (!id) {
      return NextResponse.json(
        { error: 'O ID da tarefa é obrigatório para atualização' },
        { status: 400 }
      );
    }

    // 3. Atualiza a tarefa garantindo que ela pertence ao usuário logado
    const { data: updatedTask, error: dbError } = await supabase
      .from('planner_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Segurança extra: impede alterar dados de outros usuários
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ message: 'Tarefa atualizada com sucesso!', data: updatedTask }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar tarefa', details: message },
      { status: 500 }
    );
  }
}

// DELETE: Remove uma tarefa do Planner
export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    // 1. Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Pega o ID da tarefa através dos parâmetros da URL (ex: /api/planner?id=XXXX)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'O ID da tarefa é obrigatório para exclusão' },
        { status: 400 }
      );
    }

    // 3. Deleta a tarefa associada ao usuário
    const { error: dbError } = await supabase
      .from('planner_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Alinhado com as políticas de segurança (RLS)

    if (dbError) throw dbError;

    return NextResponse.json({ message: 'Tarefa excluída com sucesso!' }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir tarefa', details: message },
      { status: 500 }
    );
  }
}