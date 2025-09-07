/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { items } from "@/config/schema"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

const IdSchema = z.string().uuid("Invalid id")

const isRelOrAbsUrl = (v: string) => /^https?:\/\//i.test(v) || v.startsWith("/")

const ItemUpdate = z
  .object({
    title: z.string().trim().min(1).optional(),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    price: z
      .union([z.number(), z.string()])
      .transform((v) => (typeof v === "string" ? Number(v) : v))
      .refine((n) => n === undefined || (Number.isInteger(n) && n >= 0), {
        message: "price must be integer (minor units)",
      })
      .optional(),
    currency: z
      .string()
      .trim()
      .transform((c) => c.toUpperCase())
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .refine((v) => !v || isRelOrAbsUrl(v), {
        message: "imageUrl must be http(s) or app-relative (e.g. /Images/pic.png)",
      })
      .optional(),
    category: z.string().trim().optional(),
  })
  .refine((obj) => Object.values(obj).some((v) => v !== undefined), {
    message: "Provide at least one field",
  })

function getIdFromReq(req: Request) {
  const { pathname } = new URL(req.url)
  const parts = pathname.replace(/\/+$/g, "").split("/")
  return parts[parts.length - 1] || ""
}

/* ---------- PUT /api/items/:id ---------- */
export async function PUT(req: Request) {
  try {
    requireAuth(req)

    const id = IdSchema.parse(getIdFromReq(req))
    const patch = ItemUpdate.parse(await req.json())

    const [current] = await db.select().from(items).where(eq(items.id, id)).limit(1)
    if (!current) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    // Enforce case-insensitive slug uniqueness (excluding current row)
    if (patch.slug && patch.slug !== current.slug) {
      const clash = await db
        .select({ id: items.id })
        .from(items)
        .where(sql`lower(${items.slug}) = lower(${patch.slug}) AND ${items.id} <> ${id}`)
        .limit(1)

      if (clash.length) {
        return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 409 })
      }
    }

    const [row] = await db
      .update(items)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning()

    const item = { ...row, displayPrice: formatCurrency(row.price, row.currency || "INR") }
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    const isZod = e?.issues && Array.isArray(e.issues)
    const status = e?.status ?? (isZod ? 422 : 400)
    return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
  }
}

/* ---------- DELETE /api/items/:id ---------- */
export async function DELETE(req: Request) {
  try {
    requireAuth(req)

    const id = IdSchema.parse(getIdFromReq(req))
    const [row] = await db.delete(items).where(eq(items.id, id)).returning()

    if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    const item = { ...row, displayPrice: formatCurrency(row.price, row.currency || "INR") }
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    if (e?.code === "23503") {
      return NextResponse.json({ ok: false, error: "Cannot delete: referenced elsewhere" }, { status: 409 })
    }
    const isZod = e?.issues && Array.isArray(e.issues)
    const status = e?.status ?? (isZod ? 422 : 400)
    return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
  }
}
