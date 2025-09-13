/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { db } from "@/config/db";
import { orders } from "@/config/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
if (!KEY_ID || !KEY_SECRET) {
  console.warn("[Razorpay] Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET");
}

const Body = z.object({ orderId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    if (!KEY_ID || !KEY_SECRET) {
      return NextResponse.json({ ok: false, error: "Razorpay not configured" }, { status: 500 });
    }
    const { orderId } = Body.parse(await req.json());
    const [ord] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!ord) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
    // Stripe uses paise too; if your totals are rupees, convert to paise:
    const amountInPaise = (ord.total || 0) * 100;

    const rzpOrder = await rzp.orders.create({
      amount: amountInPaise,
      currency: (ord.currency || "INR").toUpperCase(),
      receipt: ord.id,
      notes: { bazario_order_id: ord.id },
    });

    // (Optional) store provider order id
    await db.update(orders).set({ paymentRef: rzpOrder.id }).where(eq(orders.id, ord.id));

    return NextResponse.json({
      ok: true,
      orderId: ord.id,
      rzpOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: KEY_ID,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to create Razorpay order" }, { status: 400 });
  }
}
