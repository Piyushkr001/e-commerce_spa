/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { items as itemsTable } from "@/config/schema"
import { and, asc, desc, ilike, gte, lte, or, sql } from "drizzle-orm"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount))
}

const isRelOrAbsUrl = (v: string) =>
  /^https?:\/\//i.test(v) || v.startsWith("/") // allow CDN/http(s) OR app-relative paths

// ---------- GET: list with filters & pagination ----------
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get("q") || "").trim()
  const category = (url.searchParams.get("category") || "").trim()

  const minRaw = url.searchParams.get("min")
  const maxRaw = url.searchParams.get("max")
  const min = minRaw != null && minRaw !== "" && !Number.isNaN(Number(minRaw)) ? Number(minRaw) : undefined
  const max = maxRaw != null && maxRaw !== "" && !Number.isNaN(Number(maxRaw)) ? Number(maxRaw) : undefined

  const sort = (url.searchParams.get("sort") || "new").toLowerCase() // "price-asc" | "price-desc" | "new"
  const page = Math.max(1, Number(url.searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 12)))
  const offset = (page - 1) * limit

  try {
    const whereParts: any[] = []
    if (q) whereParts.push(or(ilike(itemsTable.title, `%${q}%`), ilike(itemsTable.description, `%${q}%`)))
    if (category) whereParts.push(ilike(itemsTable.category, `%${category}%`))
    if (min !== undefined) whereParts.push(gte(itemsTable.price, min))
    if (max !== undefined) whereParts.push(lte(itemsTable.price, max))

    const orderBy =
      sort === "price-asc" ? asc(itemsTable.price)
      : sort === "price-desc" ? desc(itemsTable.price)
      : desc(itemsTable.createdAt)

    // base queries
    let rowsQ = db.select().from(itemsTable).orderBy(orderBy).limit(limit).offset(offset)
    // @ts-ignore drizzle types are strict about .where() chaining on the builder variable
    if (whereParts.length) rowsQ = rowsQ.where(and(...whereParts))

    // cast count(*) to int so drivers don’t return strings
    let countQ = db.select({ count: sql<number>`cast(count(*) as int)` }).from(itemsTable)
    // @ts-ignore
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
  imageUrl: z.string().trim().refine((v) => !v || isRelOrAbsUrl(v), {
    message: "imageUrl must be http(s) or app-relative (e.g. /Images/product.png)",
  }).optional(),
  category: z.string().trim().optional(),
}).transform(d => {
  const base = (d.slug && d.slug.length ? d.slug : d.title).toLowerCase().trim()
  const slug = base
    .replace(/[^\w\s-]/g, "")  // keep word chars, space, hyphen
    .replace(/\s+/g, "-")      // spaces -> hyphen
    .replace(/-+/g, "-")       // dedupe hyphens
    .replace(/^-+|-+$/g, "")   // trim hyphens
  return { ...d, slug }
})

export async function POST(req: Request) {
  try {
    requireAuth(req)

    const body = await req.json()
    const data = ItemCreate.parse(body)

    // Case-insensitive slug existence check: lower(slug) = lower($1)
    const existing = await db
      .select({ id: itemsTable.id })
      .from(itemsTable)
      .where(sql`lower(${itemsTable.slug}) = lower(${data.slug})`)
      .limit(1)

    if (existing.length) {
      return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 409 })
    }

    try {
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
      // Unique violation fallback (race condition)
      if (e?.code === "23505" || /duplicate key value/i.test(String(e?.message))) {
        return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 409 })
      }
      throw e
    }
  } catch (e: any) {
    const isZod = e?.issues && Array.isArray(e.issues)
    const status = e?.status ?? (isZod ? 422 : 400)
    return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status })
  }
}
