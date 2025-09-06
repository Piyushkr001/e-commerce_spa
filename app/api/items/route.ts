/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { items as itemsTable } from "@/config/schema"
import { and, asc, desc, ilike, gte, lte, or, sql } from "drizzle-orm"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount))
}

// ---------- GET: list with filters & pagination ----------
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get("q") || "").trim()
  const category = (url.searchParams.get("category") || "").trim()
  const min = url.searchParams.get("min")
  const max = url.searchParams.get("max")
  const sort = (url.searchParams.get("sort") || "new").toLowerCase() // "price-asc" | "price-desc" | "new"
  const page = Math.max(1, Number(url.searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 12)))
  const offset = (page - 1) * limit

  try {
    const whereParts = []
    if (q) whereParts.push(or(ilike(itemsTable.title, `%${q}%`), ilike(itemsTable.description, `%${q}%`)))
    if (category) whereParts.push(ilike(itemsTable.category, `%${category}%`))
    if (min) whereParts.push(gte(itemsTable.price, Number(min)))
    if (max) whereParts.push(lte(itemsTable.price, Number(max)))

    const orderBy =
      sort === "price-asc" ? asc(itemsTable.price)
      : sort === "price-desc" ? desc(itemsTable.price)
      : desc(itemsTable.createdAt)

    let rowsQ = db.select().from(itemsTable).orderBy(orderBy).limit(limit).offset(offset)
    //@ts-ignore
    if (whereParts.length) rowsQ = rowsQ.where(and(...whereParts))

    let countQ = db.select({ count: sql<number>`count(*)` }).from(itemsTable)
    //@ts-ignore
    if (whereParts.length) countQ = countQ.where(and(...whereParts))

    const [rows, [{ count }]] = await Promise.all([rowsQ, countQ])
    const total = Number(count || 0)

    const items = rows.map((i) => ({
      ...i,
      displayPrice: formatCurrency(i.price, i.currency || "INR"),
    }))

    return NextResponse.json({ ok: true, items, page, limit, total })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to list items" }, { status: 500 })
  }
}

// ---------- POST: create item (auth required) -----------
const ItemCreate = z.object({
  title: z.string().min(1).trim(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: z.union([z.number(), z.string()]).transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((n) => Number.isInteger(n) && n >= 0, { message: "price must be integer (minor units)" }),
  currency: z.string().default("INR").transform((c) => c.toUpperCase()),
  imageUrl: z.string().url().optional(),
  category: z.string().trim().optional(),
}).transform(d => {
  const slug = (d.slug && d.slug.length ? d.slug : d.title)
    .toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-")
  return { ...d, slug }
})

export async function POST(req: Request) {
  try {
    requireAuth(req)
    const body = await req.json()
    const data = ItemCreate.parse(body)

    const existing = await db.select().from(itemsTable).where(ilike(itemsTable.slug, data.slug)).limit(1)
    if (existing.length) return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 409 })

    const [row] = await db.insert(itemsTable).values({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      price: data.price,
      currency: data.currency,
      imageUrl: data.imageUrl ?? null,
      category: data.category ?? null,
    }).returning()

    const item = { ...row, displayPrice: formatCurrency(row.price, row.currency || "INR") }
    return NextResponse.json({ ok: true, item }, { status: 201 })
  } catch (e: any) {
    const isZod = e?.issues && Array.isArray(e.issues)
    const status = e?.status ?? (isZod ? 422 : 400)
    return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
  }
}
