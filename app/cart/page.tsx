/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, useCallback } from "react"
import { toast } from "sonner"

import { useCart } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

// ---------- utils ----------
function formatCurrency(amount: number | string, currency = "INR") {
  const n = typeof amount === "string" ? Number(amount) : amount
  const safe = Number.isFinite(n) ? n : 0
  const cur = (currency || "INR").toUpperCase()
  const isINR = cur === "INR"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: isINR ? 0 : 2,
    minimumFractionDigits: isINR ? 0 : 2,
  }).format(safe)
}

// ---------- shapes for server cart ----------
type ServerLine = {
  id: string           // cart line id (server row id)
  itemId: string
  title: string
  price: number
  currency: string
  imageUrl: string | null
  qty: number
  displayPrice?: string
}

type ServerSnapshot = {
  error?: string
  ok: boolean
  lines: ServerLine[]
  subtotal: number
  subtotalDisplay: string
}

// ===================================================
// CartPage — uses server cart if JWT token is present
// ===================================================
export default function CartPage() {
  // local cart store (existing)
  const {
    lines: localLines,
    setQty: localSetQty,
    remove: localRemove,
    clear: localClear,
    subtotal: localSubtotal,
  } = useCart()

  // token & server snapshot
  const [token, setToken] = useState<string>("")
  const [serverSnap, setServerSnap] = useState<ServerSnapshot | null>(null)
  const [mounted, setMounted] = useState(false)

  // derive mode from token (no hook conditionals)
  const serverMode = token.length > 0

  // read token once on mount
  useEffect(() => {
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("token") || localStorage.getItem("auth_token"))) ||
      ""
    setToken(t)
    setMounted(true)
  }, [])

  // fetch server cart if logged in
  const fetchServerCart = useCallback(async () => {
    if (!token) return null
    const res = await fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
    const data: ServerSnapshot = await res.json()
    if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to load cart")
    setServerSnap(data)
    // @ts-ignore
    useCart.getState().setFromServer?.(data.lines)
    return data
  }, [token])

  useEffect(() => {
    if (serverMode) {
      fetchServerCart().catch((e) => {
        toast.error(e?.message || "Failed to load cart")
        setServerSnap(null)
      })
    }
  }, [serverMode, fetchServerCart])

  // compute local subtotal with a hook UNCONDITIONALLY
  const localSubtotalMemo = useMemo(() => localSubtotal(), [localLines, localSubtotal])

  // Normalize lines for rendering (no hook conditionals)
  const renderLines: ServerLine[] = serverMode
    ? serverSnap?.lines || []
    : localLines.map((l: any) => ({
        id: l.item?.id ?? l.id, // local line id fallback
        itemId: l.item?.id ?? l.itemId ?? l.id,
        title: l.item?.title ?? l.title ?? "Item",
        price: Number(l.item?.price ?? l.price ?? 0),
        currency: (l.item?.currency ?? l.currency ?? "INR") as string,
        imageUrl: l.item?.imageUrl ?? l.imageUrl ?? null,
        qty: Number(l.qty ?? 1),
        displayPrice: l.item?.displayPrice ?? l.displayPrice,
      }))

  const subtotalNumber = serverMode ? serverSnap?.subtotal ?? 0 : localSubtotalMemo
  const subtotalText = formatCurrency(subtotalNumber, "INR")

  // mutation handlers (server vs local) — defensive sync, no conditional hooks
  const setQty = async (itemId: string, qty: number) => {
    if (!serverMode) {
      localSetQty(itemId, qty)
      return
    }
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId, qty }),
      })
      const data: ServerSnapshot = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to update line")

      if (Array.isArray(data?.lines)) {
        setServerSnap(data)
        // @ts-ignore
        useCart.getState().setFromServer?.(data.lines)
      } else {
        await fetchServerCart() // ⬅️ recover if API didn't include snapshot
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to update quantity")
    }
  }

  const remove = async (itemId: string) => {
    if (!serverMode) {
      localRemove(itemId)
      return
    }
    try {
      const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: ServerSnapshot = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to remove item")

      if (Array.isArray(data?.lines)) {
        setServerSnap(data)
        // @ts-ignore
        useCart.getState().setFromServer?.(data.lines)
      } else {
        await fetchServerCart()
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove item")
    }
  }

  const clear = async () => {
    if (!serverMode) {
      localClear()
      return
    }
    try {
      const res = await fetch(`/api/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: ServerSnapshot = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to clear cart")

      if (Array.isArray(data?.lines)) {
        setServerSnap(data)
        // @ts-ignore
        useCart.getState().setFromServer?.(data.lines)
      } else {
        await fetchServerCart()
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear cart")
    }
  }

  const onCheckout = () => {
    if (!renderLines.length) {
      toast.error("Your cart is empty")
      return
    }
    toast.success("Proceeding to checkout (stub)")
    // TODO: navigate to /checkout or create payment session
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Your Cart</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {!mounted ? (
              <div className="text-center py-10 text-slate-600">Loading cart…</div>
            ) : !renderLines.length ? (
              <div className="text-center py-10">
                <p className="text-slate-600">Your cart is empty.</p>
                <Link href="/shopping" className="text-blue-600 hover:underline">
                  Continue shopping
                </Link>
              </div>
            ) : (
              renderLines.map((line) => {
                const unitPriceText =
                  line.displayPrice ?? formatCurrency(line.price, line.currency ?? "INR")
                const lineTotalText = formatCurrency((Number(line.price) || 0) * line.qty, line.currency ?? "INR")

                const dec = () => setQty(line.itemId, Math.max(1, line.qty - 1))
                const inc = () => setQty(line.itemId, Math.min(99, line.qty + 1))

                return (
                  <div key={line.itemId} className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                      <Image
                        src={line.imageUrl || "/Images/placeholder.png"}
                        alt={line.title}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1" suppressHydrationWarning>
                        {line.title}
                      </p>
                      <p className="text-sm text-slate-600" suppressHydrationWarning>
                        {unitPriceText}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-8 w-8"
                        onClick={dec}
                        disabled={line.qty <= 1}
                        aria-label={`Decrease quantity of ${line.title}`}
                      >
                        -
                      </Button>
                      <Input
                        value={line.qty}
                        onChange={(e) => {
                          const n = parseInt(e.target.value || "0", 10)
                          setQty(line.itemId, Math.max(1, Number.isNaN(n) ? 1 : Math.min(99, n)))
                        }}
                        inputMode="numeric"
                        className="h-8 w-16 text-center"
                        aria-label={`Quantity for ${line.title}`}
                      />
                      <Button
                        variant="outline"
                        className="h-8 w-8"
                        onClick={inc}
                        aria-label={`Increase quantity of ${line.title}`}
                      >
                        +
                      </Button>
                    </div>

                    <div className="w-28 text-right font-semibold" suppressHydrationWarning>
                      {lineTotalText}
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => remove(line.itemId)}
                      className="text-red-600 hover:text-red-700"
                      aria-label={`Remove ${line.title}`}
                    >
                      Remove
                    </Button>
                  </div>
                )
              })
            )}
          </CardContent>

          {!!renderLines.length && mounted && (
            <CardFooter className="justify-end">
              <Button variant="outline" onClick={clear} className="rounded-xl">
                Clear cart
              </Button>
            </CardFooter>
          )}
        </Card>
      </section>

      <aside className="space-y-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold" suppressHydrationWarning>
                {mounted ? subtotalText : "—"}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span className="font-bold" suppressHydrationWarning>
                {mounted ? subtotalText : "—"}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-xl" onClick={onCheckout}>
              Checkout
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Continue Shopping</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/shopping" className="text-blue-600 hover:underline">
              Browse more products
            </Link>
          </CardContent>
        </Card>
      </aside>
    </main>
  )
}
