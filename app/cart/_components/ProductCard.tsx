/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

interface Item {
  id: string
  title: string
  price?: number
  currency?: string
  imageUrl?: string
  displayPrice?: string
}

function formatPrice(p?: number, ccy = "INR") {
  if (p == null) return ""
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: ccy }).format(p)
  } catch {
    return `${ccy} ${p}`
  }
}

export default function ProductCard({ item }: { item: Item }) {
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const priceDisplay = useMemo(
    () => item.displayPrice || formatPrice(item.price, item.currency ?? "INR"),
    [item.displayPrice, item.price, item.currency]
  )

  const safeImage = item.imageUrl ? encodeURI(item.imageUrl) : "/placeholder.png"

  async function addToCart() {
    if (!item?.id) {
      toast.error("This product is missing an ID.")
      return
    }

    const token =
      (typeof window !== "undefined" &&
        (localStorage.getItem("token") || localStorage.getItem("auth_token"))) ||
      ""

    if (!token) {
      toast.message("Please log in to add items", {
        description: "You'll be redirected to login.",
      })
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/shopping")}`)
      return
    }

    setPending(true)
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId: item.id, qty: 1 }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Add to cart failed")
      }
      toast.success(`Added "${item.title}" to cart`)
    } catch (e: any) {
      toast.error(e?.message || "Failed to add to cart")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border p-4 flex flex-col">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl">
        <Image src={safeImage} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>

      <div className="mt-3">
        <h3 className="font-medium line-clamp-1">{item.title}</h3>
        <p className="text-slate-600 text-sm">{priceDisplay}</p>
      </div>

      <Button className="mt-auto rounded-xl" onClick={addToCart} disabled={pending}>
        {pending ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  )
}
