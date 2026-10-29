"use server";

import { auth, getBaseUrl } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  paymentClient,
  preferenceClient,
  PLAN_PRICING,
  MP_ACCESS_TOKEN,
} from "@/lib/mercadopago";
import { revalidatePath } from "next/cache";

export interface CreatePixOrderInput {
  planTier: "PREMIUM" | "ELITE";
  billingCycle: "MONTHLY" | "ANNUAL";
}

export interface CreatePixOrderResult {
  success: boolean;
  orderId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  amount?: number;
  ticketUrl?: string;
  expiresAt?: string;
  isSimulated?: boolean;
  error?: string;
}

export interface CreatePreferenceResult {
  success: boolean;
  initPoint?: string;
  orderId?: string;
  error?: string;
}

function getAppBaseUrl(): string {
  return getBaseUrl();
}

/**
 * ⚡ Cria um pedido com pagamento via PIX Transparente (Aprovação Instantânea)
 */
export async function createPixOrderAction(
  input: CreatePixOrderInput,
): Promise<CreatePixOrderResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId || !session?.user?.email) {
      return { success: false, error: "Faça login para assinar um plano." };
    }

    const { planTier, billingCycle } = input;
    const pricing = PLAN_PRICING[planTier]?.[billingCycle];

    if (!pricing) {
      return { success: false, error: "Plano ou ciclo de cobrança inválido." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // Se o token do Mercado Pago ainda não foi configurado (ambiente local de teste):
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.startsWith("TEST-000000000000")) {
      const mockOrder = await prisma.paymentOrder.create({
        data: {
          userId: user.id,
          planTier,
          billingCycle,
          amount: pricing.price,
          paymentMethod: "pix",
          status: "PENDING",
          qrCode: "00020126580014br.gov.bcb.pix0136synapse-ai-mock-pix-test5204000053039865405" + pricing.price.toFixed(2),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        },
      });

      return {
        success: true,
        orderId: mockOrder.id,
        qrCode: mockOrder.qrCode || undefined,
        amount: pricing.price,
        expiresAt: mockOrder.expiresAt?.toISOString(),
        isSimulated: true,
      };
    }

    const baseUrl = getAppBaseUrl();
    const nameParts = (user.name || "Aluno Concurseiro").trim().split(" ");
    const firstName = nameParts[0] || "Aluno";
    const lastName = nameParts.slice(1).join(" ") || "Synapse";

    // Chamada à API oficial do Mercado Pago para gerar PIX Dinâmico
    const mpPayment = await paymentClient.create({
      body: {
        transaction_amount: pricing.price,
        description: `${pricing.title} - Synapse AI`,
        payment_method_id: "pix",
        payer: {
          email: user.email,
          first_name: firstName,
          last_name: lastName,
        },
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: user.id,
          plan_tier: planTier,
          billing_cycle: billingCycle,
        },
      },
    });

    const pointOfInteraction = mpPayment.point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;
    const qrCode = transactionData?.qr_code;
    const qrCodeBase64 = transactionData?.qr_code_base64;
    const ticketUrl = transactionData?.ticket_url;

    // Registra o pedido no banco de dados local
    const order = await prisma.paymentOrder.create({
      data: {
        userId: user.id,
        mercadoPagoId: String(mpPayment.id),
        planTier,
        billingCycle,
        amount: pricing.price,
        paymentMethod: "pix",
        status: "PENDING",
        qrCode: qrCode || null,
        qrCodeBase64: qrCodeBase64 || null,
        ticketUrl: ticketUrl || null,
        expiresAt: mpPayment.date_of_expiration
          ? new Date(mpPayment.date_of_expiration)
          : new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return {
      success: true,
      orderId: order.id,
      qrCode: qrCode || undefined,
      qrCodeBase64: qrCodeBase64 || undefined,
      amount: pricing.price,
      ticketUrl: ticketUrl || undefined,
      expiresAt: order.expiresAt?.toISOString(),
    };
  } catch (err: unknown) {
    console.error("[createPixOrderAction] Erro ao criar PIX no Mercado Pago:", err);
    const message = err instanceof Error ? err.message : "Erro ao processar pagamento via PIX.";
    return { success: false, error: message };
  }
}

/**
 * 💳 Cria uma Preferência de Checkout Pro (Cartão de Crédito Parcelado em até 12x ou Boleto)
 */
export async function createPreferenceOrderAction(
  input: CreatePixOrderInput,
): Promise<CreatePreferenceResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId || !session?.user?.email) {
      return { success: false, error: "Faça login para assinar um plano." };
    }

    const { planTier, billingCycle } = input;
    const pricing = PLAN_PRICING[planTier]?.[billingCycle];

    if (!pricing) {
      return { success: false, error: "Plano ou ciclo inválido." };
    }

    const baseUrl = getAppBaseUrl();

    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.startsWith("TEST-000000000000")) {
      return {
        success: false,
        error: "Configure a chave MERCADO_PAGO_ACCESS_TOKEN no ambiente para ativar o Checkout Pro com Cartão de Crédito.",
      };
    }

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: `${planTier}_${billingCycle}`,
            title: pricing.title,
            description: pricing.description,
            quantity: 1,
            unit_price: pricing.price,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: session.user.email,
          name: session.user.name || undefined,
        },
        back_urls: {
          success: `${baseUrl}/pricing?status=approved`,
          failure: `${baseUrl}/pricing?status=failure`,
          pending: `${baseUrl}/pricing?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: userId,
          plan_tier: planTier,
          billing_cycle: billingCycle,
        },
      },
    });

    const order = await prisma.paymentOrder.create({
      data: {
        userId,
        mercadoPagoId: preference.id,
        planTier,
        billingCycle,
        amount: pricing.price,
        paymentMethod: "credit_card",
        status: "PENDING",
      },
    });

    return {
      success: true,
      initPoint: preference.init_point,
      orderId: order.id,
    };
  } catch (err: unknown) {
    console.error("[createPreferenceOrderAction] Erro:", err);
    return {
      success: false,
      error: "Não foi possível iniciar o checkout de cartão no momento.",
    };
  }
}

/**
 * 🔍 Consulta o status de um pedido e ativa o plano caso tenha sido aprovado
 */
export async function checkOrderStatusAction(orderId: string): Promise<{
  success: boolean;
  status: string;
  isApproved: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, status: "UNAUTHORIZED", isApproved: false };
    }

    const order = await prisma.paymentOrder.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    });

    if (!order) {
      return { success: false, status: "NOT_FOUND", isApproved: false, error: "Pedido não encontrado." };
    }

    // Se já estiver aprovado no banco:
    if (order.status === "APPROVED") {
      return { success: true, status: "APPROVED", isApproved: true };
    }

    // Se ainda está pendente mas temos o ID no Mercado Pago, faz consulta direta de conciliação ativa:
    if (order.mercadoPagoId && MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.startsWith("TEST-000000000000")) {
      try {
        const mpDetails = await paymentClient.get({ id: order.mercadoPagoId });
        if (mpDetails.status === "approved") {
          await activateUserPlan(order.userId, order.planTier, order.billingCycle);
          await prisma.paymentOrder.update({
            where: { id: order.id },
            data: { status: "APPROVED", paidAt: new Date() },
          });
          revalidatePath("/pricing");
          revalidatePath("/dashboard");
          return { success: true, status: "APPROVED", isApproved: true };
        }
      } catch (mpErr) {
        // Silencioso se for preference ID ou se ainda não tiver pagamento processado
      }
    }

    return {
      success: true,
      status: order.status,
      isApproved: order.status === "APPROVED",
    };
  } catch (err) {
    console.error("[checkOrderStatusAction] Erro:", err);
    return { success: false, status: "ERROR", isApproved: false };
  }
}

/**
 * Ativa ou prorroga a assinatura Pro/Elite do concurseiro
 */
export async function activateUserPlan(
  userId: string,
  planTier: string,
  billingCycle: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true, planExpiresAt: true },
  });

  if (!user) return;

  const durationDays = billingCycle === "ANNUAL" ? 365 : 30;
  const now = new Date();
  
  // Se o aluno já tem plano ativo com data futura, prorroga a partir da data futura
  const currentExpiry = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
  const newExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      planTier,
      planExpiresAt: newExpiresAt,
    },
  });
}
