import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";
import { activateUserPlan } from "@/actions/mercadopago-actions";

export async function POST(request: NextRequest) {
  try {
    const searchParams =
      request.nextUrl?.searchParams ||
      new URL(request.url, "https://synapseconcursos.vercel.app").searchParams;
    const body = await request.json().catch(() => ({}));

    // O ID pode vir no corpo (v2) ou como query param (v1/IPN)
    const paymentId =
      body?.data?.id ||
      searchParams.get("data.id") ||
      searchParams.get("id");

    const eventType =
      body?.type ||
      body?.action ||
      searchParams.get("type") ||
      searchParams.get("topic");

    console.log(`[Mercado Pago Webhook] Recebido evento: ${eventType}, ID: ${paymentId}`);

    // Se o evento não for sobre pagamento, responde 200 imediatamente
    if (!paymentId || (eventType && !String(eventType).includes("payment"))) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1. Consulta segura dos dados do pagamento direto no Mercado Pago
    const payment = await paymentClient.get({ id: String(paymentId) });

    if (!payment || !payment.id) {
      console.warn(`[Mercado Pago Webhook] Pagamento ${paymentId} não localizado na API.`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const status = payment.status; // "approved", "pending", "rejected", etc.
    const metadata = payment.metadata || {};
    const userId = metadata.user_id;
    const planTier = (metadata.plan_tier || "PREMIUM").toUpperCase();
    const billingCycle = (metadata.billing_cycle || "MONTHLY").toUpperCase();

    // 2. Localiza o pedido correspondente no banco pelo mercadoPagoId ou userId
    let order = await prisma.paymentOrder.findFirst({
      where: {
        OR: [
          { mercadoPagoId: String(payment.id) },
          ...(userId ? [{ userId, status: "PENDING" }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (order) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: status ? status.toUpperCase() : "PENDING",
          mercadoPagoId: String(payment.id),
          paymentMethod: payment.payment_method_id || order.paymentMethod,
          paidAt: status === "approved" ? new Date() : undefined,
        },
      });
    }

    // 3. Se o pagamento foi APROVADO, ativa imediatamente o plano do aluno
    if (status === "approved") {
      const targetUserId = userId || order?.userId;
      if (targetUserId) {
        console.log(`[Mercado Pago Webhook] 🚀 Pagamento APROVADO! Ativando plano ${planTier} para o usuário: ${targetUserId}`);
        await activateUserPlan(targetUserId, planTier, billingCycle);
      }
    }

    return NextResponse.json({ received: true, status }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Mercado Pago Webhook] Erro ao processar webhook:", error);
    // Sempre retorna 200 para evitar retentativas agressivas em caso de erro interno
    return NextResponse.json({ error: "Internal processing error" }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  // Alguns testes de ping do Mercado Pago disparam GET
  return NextResponse.json({ status: "Webhook endpoint active" }, { status: 200 });
}
