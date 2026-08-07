import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import {
  getPaddle,
  isActivePaddleSubscription,
  roleFromPaddleProduct,
  subscriptionEndDate,
  transactionCustomData,
} from "@/lib/paddle";

type PaddleTransactionLike = {
  id: string;
  customData?: Record<string, unknown> | null;
  subscriptionId?: string | null;
};

type PaddleSubscriptionLike = {
  id: string;
  status: string;
  customerId: string;
  customData?: Record<string, unknown> | null;
  currentBillingPeriod?: { endsAt: string } | null;
  nextBilledAt?: string | null;
};

function paddleCustomData(value?: Record<string, unknown> | null) {
  return (value || {}) as {
    userId?: string;
    reportId?: string;
    product?: string;
    plan?: string;
  };
}

async function hasTrackedEvent(
  type: string,
  userId: string,
  metadata: Prisma.InputJsonObject
) {
  const existing = await prisma.event.findFirst({
    where: {
      type,
      userId,
      metadata: { equals: metadata },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function cancelPreviousSubscription(
  previousSubscriptionId: string | null | undefined,
  nextSubscriptionId: string | null | undefined
) {
  if (!previousSubscriptionId || !nextSubscriptionId || previousSubscriptionId === nextSubscriptionId) {
    return;
  }

  try {
    await getPaddle().subscriptions.cancel(previousSubscriptionId, {
      effectiveFrom: "immediately",
    });
  } catch (error) {
    console.error("Previous Paddle subscription cancellation failed:", error);
  }
}

export async function provisionPaddleTransaction(transaction: PaddleTransactionLike) {
  const customData = paddleCustomData(transaction.customData);
  const userId = customData.userId;

  if (!userId) {
    return;
  }

  if (customData.product === "full_audit_unlock" && customData.reportId) {
    await prisma.upload.updateMany({
      where: {
        id: customData.reportId,
        userId,
      },
      data: {
        unlocked: true,
        unlockedAt: new Date(),
        checkoutTransactionId: transaction.id,
      },
    });

    const eventMetadata = {
      transactionId: transaction.id,
      product: customData.product,
      provider: "paddle",
    };

    if (!(await hasTrackedEvent("full_audit_unlocked", userId, eventMetadata))) {
      await trackEvent({
        type: "full_audit_unlocked",
        userId,
        reportId: customData.reportId,
        metadata: eventMetadata,
      });
    }
  }

  if (transaction.subscriptionId) {
    const subscription = await getPaddle().subscriptions.get(transaction.subscriptionId);
    await syncPaddleSubscription(subscription, userId);
  }
}

export async function syncPaddleSubscription(
  subscription: PaddleSubscriptionLike,
  fallbackUserId?: string
) {
  const customData = paddleCustomData(subscription.customData);
  const userId = customData.userId || fallbackUserId;

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({
        where: { paddleSubscriptionId: subscription.id },
      });

  if (!user) {
    return;
  }

  const nextRole = roleFromPaddleProduct(customData.product);
  const active = isActivePaddleSubscription(subscription.status);
  const role =
    active
      ? nextRole
        ? nextRole === "PRO"
          ? Role.PRO
          : Role.BUSINESS
        : user.role
      : subscription.status === "past_due"
        ? user.role
        : Role.FREE;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      paddleCustomerId: subscription.customerId,
      paddleSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionEndDate:
        subscriptionEndDate(subscription as any) ||
        (subscription.status === "canceled" ? new Date() : null),
    },
  });

  if (active && nextRole) {
    await cancelPreviousSubscription(user.paddleSubscriptionId, subscription.id);

    const eventType = `${customData.product}_activated`;
    const eventMetadata = {
      subscriptionId: subscription.id,
      plan: customData.plan || "unknown",
      provider: "paddle",
    };

    if (!(await hasTrackedEvent(eventType, user.id, eventMetadata))) {
      await trackEvent({
        type: eventType,
        userId: user.id,
        metadata: eventMetadata,
      });
    }
  }

  if (subscription.status === "canceled") {
    const eventMetadata = {
      subscriptionId: subscription.id,
      provider: "paddle",
    };

    if (!(await hasTrackedEvent("subscription_cancelled", user.id, eventMetadata))) {
      await trackEvent({
        type: "subscription_cancelled",
        userId: user.id,
        metadata: eventMetadata,
      });
    }
  }
}

export async function syncPaddleTransactionById(
  transactionId: string,
  authenticatedUserId: string
) {
  const transaction = await getPaddle().transactions.get(transactionId);
  const customData = transactionCustomData(transaction);

  if (customData.userId !== authenticatedUserId) {
    throw new Error("Paddle transaction does not belong to authenticated user");
  }

  if (transaction.status !== "completed" && transaction.status !== "paid") {
    throw new Error("Paddle transaction is not paid");
  }

  await provisionPaddleTransaction(transaction);

  return customData;
}
