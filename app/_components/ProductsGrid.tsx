/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import ProductCard from "../cart/_components/ProductCard"
import { Item } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

type ItemsResponse = { ok?: boolean; items: Item[]; page: number; limit: number; total: number }

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

type ProductsGridProps = {
  /** If provided, the grid renders these items and SKIPS internal fetching/pagination */
  items?: Item[]
}

export default function ProductsGrid({ items: injectedItems }: ProductsGridProps) {
  // If parent provides items, render them directly (no fetch, no pagination UI)
  if (injectedItems) {
    const safeItems = injectedItems.map((i: any) => ({
      ...i,
      displayPrice: i.displayPrice ?? formatCurrency(i.price ?? 0, i.currency ?? "INR"),
    }))

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeItems.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
        {safeItems.length === 0 && (
          <p className="col-span-full text-center text-slate-600">
            No products matched your filters.
          </p>
        )}
      </div>
    )
  }

  // ---- Internal fetching mode (when no items prop is passed) ----
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const spString = sp.toString() // stable dep key

  const [data, setData] = useState<ItemsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const page = useMemo(() => Math.max(1, Number(sp.get("page") || 1)), [spString])
  const limit = useMemo(() => Math.min(50, Math.max(1, Number(sp.get("limit") || 12))), [spString])

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.total / data.limit))
  }, [data])

  useEffect(() => {
    const controller = new AbortController()
    const url = `/api/items?${spString}`

    setErr(null)
    setLoading(true)

    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        let json: ItemsResponse & { error?: string }
        try {
          json = (await res.json()) as any
        } catch {
          throw new Error("Invalid server response")
        }
        if (!res.ok || json.ok === false) {
          throw new Error(json?.error || "Failed to load products")
        }
        setData(json)
      })
      .catch((e: any) => {
        if (e?.name !== "AbortError") setErr(e?.message || "Failed to load products.")
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [spString])

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(spString)
    if (nextPage <= 1) params.delete("page")
    else params.set("page", String(nextPage))
    if (limit !== 12) params.set("limit", String(limit))
    router.push(`${pathname}?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 mt-4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (err) {
    return (
      <div className="rounded-2xl border p-6 text-center">
        <p className="text-red-600 mb-3">{err}</p>
        <Button
          onClick={() => {
            setData(null)
            router.refresh()
          }}
          className="rounded-xl"
        >
          Retry
        </Button>
      </div>
    )
  }

  const items = (data?.items ?? []).map((i: any) => ({
    ...i,
    displayPrice: i.displayPrice ?? formatCurrency(i.price, i.currency ?? "INR"),
  }))

  return (
    <div className="space-y-4">
      {data && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {data.total} result{data.total === 1 ? "" : "s"}
            {items.length > 0 && ` • Page ${data.page} of ${totalPages}`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
        {data && items.length === 0 && (
          <p className="col-span-full text-center text-slate-600">
            No products matched your filters.
          </p>
        )}
      </div>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Prev
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}
