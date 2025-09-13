/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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

// ---------- server cart shapes ----------
type ServerLine = {
  id: string
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

const CART_STORAGE_KEY = "bazario-cart"

export default function CartPage() {
  const router = useRouter()

  // local store only used for server sync/hardClear; NOT used to render when logged out
  const { clear: localClear } = useCart()

  const [token, setToken] = useState<string>("")
  const [serverSnap, setServerSnap] = useState<ServerSnapshot | null>(null)
  const [mounted, setMounted] = useState(false)

  const serverMode = token.length > 0

  // read token once; when logged out, nuke any old local cart
  useEffect(() => {
    const readToken = () =>
      (localStorage.getItem("token") || localStorage.getItem("auth_token") || "") as string

    const t = readToken()
    setToken(t)
    setMounted(true)

    if (!t) {
      try {
        localStorage.removeItem(CART_STORAGE_KEY)
      } catch {}
      localClear()
    }

    // react to log-in/out in this tab and other tabs
    const onAuthChanged = () => {
      const nt = readToken()
      setToken(nt)
      if (!nt) {
        try {
          localStorage.removeItem(CART_STORAGE_KEY)
        } catch {}
        localClear()
        setServerSnap(null)
      } else {
        // refetch when just logged in
        fetchServerCart(nt).catch(() => {})
      }
    }

    window.addEventListener("auth-changed", onAuthChanged)
    window.addEventListener("storage", onAuthChanged)
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged)
      window.removeEventListener("storage", onAuthChanged)
    }
  }, [localClear])

  const fetchServerCart = useCallback(async (tok = token) => {
    if (!tok) return null
    const res = await fetch("/api/cart", { headers: { Authorization: `Bearer ${tok}` } })
    const data: ServerSnapshot = await res.json()
    if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to load cart")
    setServerSnap(data)
    // optional sync into zustand (not used for rendering)
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

  // when logged out, show empty
  const renderLines: ServerLine[] = serverMode ? serverSnap?.lines || [] : []
  const subtotalNumber = serverMode ? serverSnap?.subtotal ?? 0 : 0
  const subtotalText = formatCurrency(subtotalNumber, "INR")

  const setQty = async (itemId: string, qty: number) => {
    if (!serverMode) {
      toast.message("Please log in to edit your cart.")
      router.push("/login?redirect=/cart")
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
      setServerSnap(data)
      // @ts-ignore
      useCart.getState().setFromServer?.(data.lines)
    } catch (e: any) {
      toast.error(e?.message || "Failed to update quantity")
    }
  }

  const remove = async (itemId: string) => {
    if (!serverMode) {
      toast.message("Please log in to edit your cart.")
      router.push("/login?redirect=/cart")
      return
    }
    try {
      const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: ServerSnapshot = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to remove item")
      setServerSnap(data)
      // @ts-ignore
      useCart.getState().setFromServer?.(data.lines)
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove item")
    }
  }

  const clear = async () => {
    if (!serverMode) {
      toast.message("Please log in to edit your cart.")
      router.push("/login?redirect=/cart")
      return
    }
    try {
      const res = await fetch(`/api/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: ServerSnapshot = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to clear cart")
      setServerSnap(data)
      // @ts-ignore
      useCart.getState().setFromServer?.(data.lines)
    } catch (e: any) {
      toast.error(e?.message || "Failed to clear cart")
    }
  }

  const onCheckout = () => {
    if (!serverMode) {
      toast.message("Please log in to checkout.")
      router.push("/login?redirect=/checkout")
      return
    }
    if (!renderLines.length) {
      toast.error("Your cart is empty")
      return
    }
    router.push("/checkout")
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
              <div className="text-center py-10 text-slate-600">Loading…</div>
            ) : !serverMode ? (
              <div className="text-center py-10">
                <p className="text-slate-600 mb-3">You’re not logged in.</p>
                <Link href="/login?redirect=/cart" className="text-blue-600 hover:underline">
                  Log in to view your cart
                </Link>
              </div>
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
                const lineTotalText = formatCurrency(
                  (Number(line.price) || 0) * line.qty,
                  line.currency ?? "INR"
                )

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

          {!!renderLines.length && mounted && serverMode && (
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
                {serverMode ? subtotalText : "—"}
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
                {serverMode ? subtotalText : "—"}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-xl" onClick={onCheckout}>
              {serverMode ? "Checkout" : "Log in to checkout"}
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
