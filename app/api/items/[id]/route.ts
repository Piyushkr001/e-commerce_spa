/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { items } from "@/config/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount))
}

const Params = z.object({ id: z.string().uuid("Invalid id") })

const ItemUpdate = z.object({
  title: z.string().trim().min(1).optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: z.union([z.number(), z.string()]).transform((v)=>typeof v==="string"?Number(v):v)
    .refine((n)=> n===undefined || (Number.isInteger(n) && n>=0), { message:"price must be integer (minor units)" }).optional(),
  currency: z.string().trim().transform((c)=>c.toUpperCase()).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().trim().optional(),
}).refine(obj => Object.values(obj).some(v=>v!==undefined), { message:"Provide at least one field" })

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAuth(req)
    const { id } = Params.parse(params)
    const patch = ItemUpdate.parse(await req.json())

    const [current] = await db.select().from(items).where(eq(items.id, id)).limit(1)
    if (!current) return NextResponse.json({ ok:false, error:"Not found" }, { status:404 })

    // slug uniqueness if changed
    if (patch.slug && patch.slug !== current.slug) {
      const dup = await db.select({ id: items.id }).from(items).where(eq(items.slug, patch.slug)).limit(1)
      if (dup.length) return NextResponse.json({ ok:false, error:"Slug already exists" }, { status:409 })
    }

    const [row] = await db.update(items).set({ ...patch, updatedAt: new Date() }).where(eq(items.id, id)).returning()
    const item = { ...row, displayPrice: formatCurrency(row.price, row.currency || "INR") }
    return NextResponse.json({ ok:true, item })
  } catch (e:any) {
    const isZod = e?.issues && Array.isArray(e.issues)
    const status = e?.status ?? (isZod ? 422 : 400)
    return NextResponse.json({ ok:false, error:e?.message || "Bad Request" }, { status })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAuth(req)
    const { id } = Params.parse(params)
    const [row] = await db.delete(items).where(eq(items.id, id)).returning()
    if (!row) return NextResponse.json({ ok:false, error:"Not found" }, { status:404 })
    const item = { ...row, displayPrice: formatCurrency(row.price, row.currency || "INR") }
    return NextResponse.json({ ok:true, item })
  } catch (e:any) {
    if (e?.code === "23503") {
      return NextResponse.json({ ok:false, error:"Cannot delete: referenced elsewhere" }, { status:409 })
    }
    const isZod = e?.issues && Array.isArray(e.issues)
    const status = e?.status ?? (isZod ? 422 : 400)
    return NextResponse.json({ ok:false, error:e?.message || "Bad Request" }, { status })
  }
}
