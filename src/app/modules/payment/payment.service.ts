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

  // Throw an error if payment already exists
  if (serviceRequest.payment) {
    throw new Error(
      "Payment has already been initiated for this service request.",
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
    const createdPayment = await tx.payment.create({
      data: {
        serviceRequestId: serviceRequest.id,
        citizenId,
        amount: serviceRequest.amount,
        currency: "BDT",
        stripeSessionId: session.id,
        status: "PENDING",
      },
    });

    await tx.serviceRequest.update({
      where: {
        id: serviceRequest.id,
      },
      data: {
        status: "PAYMENT_PENDING",
      },
    });

    return createdPayment;
  });

  return {
    payment,
    checkoutUrl: session.url,
  };
};

export const paymentService = {
  createPayment,
};
