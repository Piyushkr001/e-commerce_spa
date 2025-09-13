/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { items, orders, orderLines, cartLines } from "@/config/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   Schemas
========================= */
const ShippingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2).default("India"),
});

const LineSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
});

const BodySchema = z.object({
  shipping: ShippingSchema,
  /** If omitted and user is authenticated, server cart will be used */
  lines: z.array(LineSchema).optional(),
});

/* =========================
   Shared helpers (single definitions!)
========================= */
const INR = (n: number) => Math.max(0, Math.trunc(n));
const JWT_SECRET = process.env.JWT_SECRET || "";

/** tolerant auth: handles tokens with sub | userId | id */
function tryAuthLoose(req: Request): string | null {
  try {
    const hdr = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!hdr.startsWith("Bearer ")) return null;
    const token = hdr.slice("Bearer ".length).trim();
    if (!JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded?.sub || decoded?.userId || decoded?.id;
    return userId ? String(userId) : null;
  } catch {
    return null;
  }
}

function formatCurrency(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "INR" ? 0 : 2,
      minimumFractionDigits: currency === "INR" ? 0 : 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

/* =========================
   POST /api/orders
========================= */
export async function POST(req: Request) {
  try {
    // 1) Auth (strict → loose → guest)
    let userId: string | null = null;
    try {
      userId = requireAuth(req).userId; // prefers sub | userId (your helper)
    } catch {
      userId = tryAuthLoose(req); // also accepts 'id' claim
    }

    // 2) Validate body
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      return NextResponse.json(
        { ok: false, error: first?.message || "Invalid input" },
        { status: 422 }
      );
    }
    const { shipping } = parsed.data;

    // 3) Determine source lines
    //    Prefer client-provided lines; fallback to server cart (when logged in)
    let sourceLines: { itemId: string; qty: number }[] =
      parsed.data.lines && parsed.data.lines.length ? parsed.data.lines : [];

    if (!sourceLines.length && userId) {
      const rows = await db
        .select({ itemId: cartLines.itemId, qty: cartLines.qty })
        .from(cartLines)
        .where(eq(cartLines.userId, userId));
      sourceLines = rows;
    }

    if (!sourceLines.length) {
      return NextResponse.json(
        { ok: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // 4) Load items and validate
    const itemIds = Array.from(new Set(sourceLines.map((l) => l.itemId)));
    const dbItems = await db.select().from(items).where(inArray(items.id, itemIds));
    const byId = new Map(dbItems.map((i) => [i.id, i]));

    const missing = itemIds.find((id) => !byId.has(id));
    if (missing) {
      return NextResponse.json(
        { ok: false, error: `Item not found: ${missing}` },
        { status: 404 }
      );
    }

    // 5) Build lines + totals
    let subtotal = 0;
    const currency = "INR";
    const linesToInsert = sourceLines.map((l) => {
      const it = byId.get(l.itemId)!;
      const price = INR(it.price);
      const lineTotal = price * l.qty;
      subtotal += lineTotal;
      return {
        itemId: it.id,
        title: it.title,
        price,
        currency,
        qty: l.qty,
        imageUrl: it.imageUrl ?? null,
      };
    });

    const shippingFee = subtotal >= 5000 || subtotal === 0 ? 0 : 99;
    const total = subtotal + shippingFee;

    // 6) Create order
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        email: shipping.email,
        name: shipping.name,
        phone: shipping.phone ?? null,
        addressLine1: shipping.addressLine1,
        addressLine2: shipping.addressLine2 ?? null,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        country: shipping.country || "India",
        subtotal: INR(subtotal),
        shipping: INR(shippingFee),
        total: INR(total),
        currency,
        status: "pending",
      })
      .returning();

    // 7) Insert order lines
    await db.insert(orderLines).values(
      linesToInsert.map((l) => ({ ...l, orderId: order.id }))
    );

    // 8) ALWAYS clear server cart for authenticated users
    if (userId) {
      await db.delete(cartLines).where(eq(cartLines.userId, userId));
    }

    // 9) Respond with a small snapshot to help the client clear instantly
    return NextResponse.json(
      {
        ok: true,
        id: order.id,
        amount: total,
        currency,
        cartCleared: Boolean(userId),
        lines: [] as any[], // client can use this to sync UI to empty
      },
      { status: 201 }
    );
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json(
      { ok: false, error: e?.message || "Bad Request" },
      { status }
    );
  }
}

/* =========================
   GET /api/orders
   query: page?=1  limit?=10  expand?=0|1
========================= */
export async function GET(req: Request) {
  try {
    // auth (strict → loose)
    let userId: string | null = null;
    try {
      userId = requireAuth(req).userId;
    } catch {
      userId = tryAuthLoose(req);
    }
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 10)));
    const expand = url.searchParams.get("expand") === "1";
    const offset = (page - 1) * limit;

    // list orders for this user
    const listQ = db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const countQ = db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, userId));

    const [rows, [{ count }]] = await Promise.all([listQ, countQ]);
    const total = Number(count || 0);

    // optionally get lines for these orders
    let linesByOrder: Record<string, any[]> = {};
    if (rows.length && expand) {
      const ids = rows.map((o) => o.id);
      const lines = await db.select().from(orderLines).where(inArray(orderLines.orderId, ids));
      linesByOrder = lines.reduce<Record<string, any[]>>((acc, l) => {
        (acc[l.orderId] ||= []).push(l);
        return acc;
      }, {});
    }

    const out = rows.map((o) => {
      const currency = o.currency || "INR";
      const base = {
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        total: o.total,
        subtotal: o.subtotal,
        shipping: o.shipping,
        currency,
        totalDisplay: formatCurrency(o.total, currency),
        subtotalDisplay: formatCurrency(o.subtotal, currency),
        shippingDisplay: formatCurrency(o.shipping, currency),
      };
      if (expand) {
        const lines = (linesByOrder[o.id] || []).map((l) => ({
          id: l.id,
          itemId: l.itemId,
          title: l.title,
          qty: l.qty,
          price: l.price,
          imageUrl: l.imageUrl,
          currency: l.currency || currency,
          lineTotal: l.price * l.qty,
          lineTotalDisplay: formatCurrency(l.price * l.qty, l.currency || currency),
          priceDisplay: formatCurrency(l.price, l.currency || currency),
        }));
        return { ...base, lineCount: lines.length, lines };
      }
      return { ...base, lineCount: Number(linesByOrder[o.id]?.length ?? 0) };
    });

    return NextResponse.json({ ok: true, page, limit, total, orders: out });
  } catch (e: any) {
    const status = e?.status ?? 400;
    return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status });
  }
}
