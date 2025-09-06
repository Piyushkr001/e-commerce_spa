/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { cartLines, items } from "@/config/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

function formatCurrency(amount: number, currency = "INR") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount))
}

const AddSchema = z.object({ itemId: z.string().uuid("Invalid item id"), qty: z.number().int().min(1).max(99).default(1) })
const PatchSchema = z.object({ itemId: z.string().uuid("Invalid item id"), qty: z.number().int().min(0).max(99) })
const DeleteQuery = z.object({ itemId: z.string().uuid("Invalid item id").optional() })

export async function GET(req: Request) {
    try {
        const { userId } = requireAuth(req)
        const rows = await db
            .select({
                id: cartLines.id, itemId: cartLines.itemId, qty: cartLines.qty,
                title: items.title, price: items.price, currency: items.currency, imageUrl: items.imageUrl, category: items.category,
            })
            .from(cartLines)
            .leftJoin(items, eq(items.id, cartLines.itemId))
            .where(eq(cartLines.userId, userId))

        const lines = rows.map(r => ({
            id: r.id, itemId: r.itemId, qty: r.qty,
            title: r.title ?? "Unavailable item",
            price: r.price ?? 0,
            currency: r.currency ?? "INR",
            imageUrl: r.imageUrl ?? null,
            category: r.category ?? null,
            displayPrice: formatCurrency(r.price ?? 0, (r.currency ?? "INR") as string),
        }))
        const subtotal = lines.reduce((s, r) => s + r.price * r.qty, 0)
        const subtotalDisplay = formatCurrency(subtotal, (lines[0]?.currency ?? "INR") as string)

        return NextResponse.json({ ok: true, lines, subtotal, subtotalDisplay })
    } catch (e: any) {
        const status = e.status ?? 401
        return NextResponse.json({ ok: false, error: e?.message || "Unauthorized" }, { status })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = requireAuth(req)
        const { itemId, qty } = AddSchema.parse(await req.json())

        const item = await db.select().from(items).where(eq(items.id, itemId)).limit(1)
        if (!item.length) return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 })

        const existing = await db.select().from(cartLines)
            .where(and(eq(cartLines.userId, userId), eq(cartLines.itemId, itemId))).limit(1)

        if (existing.length) {
            const newQty = Math.min(99, existing[0].qty + qty)
            await db.update(cartLines)
                .set({ qty: newQty, updatedAt: new Date() })
                .where(eq(cartLines.id, existing[0].id))
        } else {
            await db.insert(cartLines).values({ userId, itemId, qty })
        }

        // ⬇️ return fresh snapshot so UI can sync
        const rows = await db
            .select({
                id: cartLines.id, itemId: cartLines.itemId, qty: cartLines.qty,
                title: items.title, price: items.price, currency: items.currency, imageUrl: items.imageUrl, category: items.category,
            })
            .from(cartLines)
            .leftJoin(items, eq(items.id, cartLines.itemId))
            .where(eq(cartLines.userId, userId))

        const lines = rows.map(r => ({
            id: r.id, itemId: r.itemId, qty: r.qty,
            title: r.title ?? "Unavailable item",
            price: r.price ?? 0,
            currency: r.currency ?? "INR",
            imageUrl: r.imageUrl ?? null,
            category: r.category ?? null,
            displayPrice: formatCurrency(r.price ?? 0, (r.currency ?? "INR") as string),
        }))
        const subtotal = lines.reduce((s, r) => s + r.price * r.qty, 0)
        const subtotalDisplay = formatCurrency(subtotal, (lines[0]?.currency ?? "INR") as string)

        return NextResponse.json({ ok: true, lines, subtotal, subtotalDisplay }, { status: 201 })
    } catch (e: any) {
        const isZod = e?.issues && Array.isArray(e.issues)
        const status = e?.status ?? (isZod ? 422 : 400)
        return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
    }
}


export async function PATCH(req: Request) {
    try {
        const { userId } = requireAuth(req)
        const { itemId, qty } = PatchSchema.parse(await req.json())

        const existing = await db.select().from(cartLines).where(and(eq(cartLines.userId, userId), eq(cartLines.itemId, itemId))).limit(1)
        if (!existing.length) return NextResponse.json({ ok: false, error: "Line not found" }, { status: 404 })

        if (qty === 0) {
            await db.delete(cartLines).where(eq(cartLines.id, existing[0].id))
            return NextResponse.json({ ok: true, removed: true })
        }

        const clamped = Math.min(99, Math.max(1, qty))
        const [row] = await db.update(cartLines).set({ qty: clamped, updatedAt: new Date() }).where(eq(cartLines.id, existing[0].id)).returning()
        return NextResponse.json({ ok: true, line: row })
    } catch (e: any) {
        const isZod = e?.issues && Array.isArray(e.issues)
        const status = e?.status ?? (isZod ? 422 : 400)
        return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
    }
}

export async function DELETE(req: Request) {
    try {
        const { userId } = requireAuth(req)
        const url = new URL(req.url)
        const parsed = DeleteQuery.safeParse({ itemId: url.searchParams.get("itemId") || undefined })
        if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues?.[0]?.message || "Invalid query" }, { status: 422 })

        const { itemId } = parsed.data
        if (itemId) {
            const res = await db.delete(cartLines).where(and(eq(cartLines.userId, userId), eq(cartLines.itemId, itemId))).returning()
            if (!res.length) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
            return NextResponse.json({ ok: true, removed: true })
        }

        await db.delete(cartLines).where(eq(cartLines.userId, userId))
        return NextResponse.json({ ok: true, cleared: true })
    } catch (e: any) {
        const status = e.status ?? 400
        return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
    }
}
