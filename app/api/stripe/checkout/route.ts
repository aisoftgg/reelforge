import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      {
        error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout."
      },
      { status: 501 }
    );
  }

  return NextResponse.json({
    message: "Stripe placeholder is configured. Replace this stub with a real checkout session."
  });
}
