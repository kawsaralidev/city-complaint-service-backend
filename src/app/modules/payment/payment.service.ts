import config from "../../config";
import { prisma } from "../../lib/prisma";
import stripe from "../../lib/stripe";
import { ICreatePaymentPayload } from "./payment.interface";

const createPayment = async (
  citizenId: string,
  payload: ICreatePaymentPayload,
) => {
  // Check if service request exists
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: payload.serviceRequestId,
      citizenId,
      deletedAt: null,
    },
    include: {
      service: true,
      payment: true,
    },
  });

  // Throw an error if service request does not exist
  if (!serviceRequest) {
    throw new Error("Service request not found.");
  }

  // Check if service request is approved
  if (serviceRequest.status !== "APPROVED") {
    throw new Error("Only approved service requests can proceed to payment.");
  }

  // Throw an error if payment is already completed
  if (serviceRequest.payment?.status === "PAID") {
    throw new Error(
      "Payment has already been completed for this service request.",
    );
  }

  const amount = Number(serviceRequest.amount);

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: serviceRequest.service.name,
            description: serviceRequest.service.description || undefined,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      serviceRequestId: serviceRequest.id,
      citizenId,
    },
    success_url: config.stripe_success_url,
    cancel_url: config.stripe_cancel_url,
  });

  // Save payment and update service request
  const payment = await prisma.$transaction(async (tx) => {
    if (serviceRequest.payment) {
      // Update existing pending payment
      return tx.payment.update({
        where: {
          id: serviceRequest.payment.id,
        },
        data: {
          stripeSessionId: session.id,
          status: "PENDING",
          initiatedAt: new Date(),
        },
      });
    }

    // Create payment for the first time
    return tx.payment.create({
      data: {
        serviceRequestId: serviceRequest.id,
        citizenId,
        amount: serviceRequest.amount,
        currency: "BDT",
        stripeSessionId: session.id,
        status: "PENDING",
      },
    });
  });

  // Update service request status
  if (serviceRequest.status === "APPROVED") {
    await prisma.serviceRequest.update({
      where: {
        id: serviceRequest.id,
      },
      data: {
        status: "PAYMENT_PENDING",
      },
    });
  }

  return {
    payment,
    checkoutUrl: session.url,
  };
};

// Handle Stripe webhook
const handleStripeWebhook = async (signature: string, rawBody: Buffer) => {
  // Verify Stripe webhook signature
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe_webhook_secret as string,
  );

  // Process successful Checkout Session
  if (event.type !== "checkout.session.completed") {
    return;
  }

  const session = event.data.object;

  const serviceRequestId = session.metadata?.serviceRequestId;

  // Throw an error if service request ID is missing
  if (!serviceRequestId) {
    throw new Error("Service request ID not found in Stripe metadata.");
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  // Update payment and service request
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: {
        stripeSessionId: session.id,
      },
    });

    // Throw an error if payment does not exist
    if (!payment) {
      throw new Error("Payment not found.");
    }

    // Ignore duplicate webhook events
    if (payment.status === "PAID") {
      return;
    }

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "PAID",
        stripePaymentId: paymentIntentId,
        paidAt: new Date(),
      },
    });

    await tx.serviceRequest.update({
      where: {
        id: serviceRequestId,
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
  });
};

export const paymentService = {
  createPayment,
  handleStripeWebhook,
};
