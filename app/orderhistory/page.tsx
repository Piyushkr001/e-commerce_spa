"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { toast } from "sonner"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type OrderLine = {
  id: string
  itemId: string
  title: string
  qty: number
  price: number
  currency: string
  imageUrl: string | null
  lineTotal: number
  lineTotalDisplay: string
  priceDisplay: string
}

type OrderRow = {
  id: string
  status: string
  createdAt: string
  total: number
  subtotal: number
  shipping: number
  currency: string
  totalDisplay: string
  subtotalDisplay: string
  shippingDisplay: string
  lineCount: number
  lines?: OrderLine[]
}

type OrdersPayload = {
  ok: boolean
  page: number
  limit: number
  total: number
  orders: OrderRow[]
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default"|"warning"|"success"|"danger" }) {
  const map: Record<string, string> = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    danger: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  }
  return <span className={`px-2 py-0.5 text-xs rounded-full ${map[tone]}`}>{children}</span>
}

function statusTone(s: string): "default"|"warning"|"success"|"danger" {
  const x = (s || "").toLowerCase()
  if (x.includes("pending")) return "warning"
  if (x.includes("paid") || x.includes("completed") || x.includes("shipped")) return "success"
  if (x.includes("canceled") || x.includes("failed")) return "danger"
  return "default"
}

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
    if (!r.ok) throw new Error(`Failed (${r.status})`)
    return r.json()
  })

export default function OrderHistoryPage() {
  const [token, setToken] = useState<string>("")
  const [page, setPage] = useState(1)
  const [expand, setExpand] = useState(true) // show lines by default

  useEffect(() => {
    const t = (localStorage.getItem("token") || localStorage.getItem("auth_token") || "") as string
    setToken(t)

    const onAuthChanged = () => {
      const nt = (localStorage.getItem("token") || localStorage.getItem("auth_token") || "") as string
      setToken(nt)
    }
    window.addEventListener("auth-changed", onAuthChanged)
    window.addEventListener("storage", onAuthChanged)
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged)
      window.removeEventListener("storage", onAuthChanged)
    }
  }, [])

  const key = token ? `/api/orders?page=${page}&limit=10&expand=${expand ? 1 : 0}` : null
  const { data, error, isLoading, mutate } = useSWR<OrdersPayload>(
    key,
    (url) => fetcher(url!, token),
    { revalidateOnFocus: true }
  )

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to load orders")
  }, [error])

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.total / data.limit))
  }, [data])

  if (!token) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-slate-600">You’re not logged in.</p>
            <Link href="/login?redirect=/orders" className="text-blue-600 hover:underline">
              Log in to view your orders
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => mutate()}>Refresh</Button>
          <Button variant="outline" onClick={() => setExpand((e) => !e)}>
            {expand ? "Collapse items" : "Expand items"}
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          </CardContent>
        </Card>
      ) : !data?.orders?.length ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">
            When you place an order, it will appear here.
          </CardContent>
          <CardFooter>
            <Link href="/shopping" className="text-blue-600 hover:underline">Continue shopping</Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.orders.map((o) => (
            <Card key={o.id} className="rounded-2xl">
              <CardHeader className="flex gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Order #{o.id.slice(0, 8)}</CardTitle>
                  <div className="text-sm text-slate-600">
                    Placed on {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                  <span className="font-semibold">{o.totalDisplay}</span>
                </div>
              </CardHeader>

              {expand && (
                <CardContent className="space-y-4">
                  {o.lines && o.lines.length > 0 ? (
                    o.lines.map((l) => (
                      <div key={l.id} className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white">
                          <Image
                            src={l.imageUrl || "/Images/placeholder.png"}
                            alt={l.title}
                            fill
                            className="object-contain p-1.5"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">{l.title}</p>
                          <p className="text-sm text-slate-600">
                            {l.qty} × {l.priceDisplay}
                          </p>
                        </div>
                        <div className="w-28 text-right font-semibold">
                          {l.lineTotalDisplay}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">({o.lineCount} items)</div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex justify-between sm:block">
                      <span className="text-slate-600 sm:block">Subtotal</span>
                      <span className="font-medium">{o.subtotalDisplay}</span>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-slate-600 sm:block">Shipping</span>
                      <span className="font-medium">{o.shippingDisplay}</span>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-slate-600 sm:block">Total</span>
                      <span className="font-semibold">{o.totalDisplay}</span>
                    </div>
                  </div>
                </CardContent>
              )}

              <CardFooter className="flex justify-between">
                <div className="text-sm text-slate-600">
                  Order ID: <span className="font-mono">{o.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="text-blue-600 hover:underline" href={`/orders/${o.id}`}>
                    View details
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!!data?.orders?.length && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <div className="text-sm text-slate-600">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  )
}
