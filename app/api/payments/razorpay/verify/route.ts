/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/config/db";
import { orders } from "@/config/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

const Body = z.object({
  orderId: z.string().uuid(),
  rzpOrderId: z.string().min(8),
  paymentId: z.string().min(8),
  signature: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const { orderId, rzpOrderId, paymentId, signature } = Body.parse(await req.json());

    if (!KEY_SECRET) {
      return NextResponse.json({ ok: false, error: "Razorpay not configured" }, { status: 500 });
    }

    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${rzpOrderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ ok: false, error: "Invalid payment signature" }, { status: 400 });
    }

    // mark order as paid
    await db
      .update(orders)
      .set({
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        status: "confirmed",
        paymentRef: paymentId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Verification failed" }, { status: 400 });
  }
}
