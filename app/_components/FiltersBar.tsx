"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ALL = "__all__" // sentinel; never an empty string

export default function FiltersBar() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const setParam = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(sp.toString())
      if (!value) params.delete(key)
      else params.set(key, value)
      params.delete("page") // reset paging on filter change
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, sp]
  )

  // current values (map missing/empty to sentinel for Selects)
  const categoryValue = sp.get("category") ?? ALL
  const sortValue = sp.get("sort") ?? "new"

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        placeholder="Search…"
        defaultValue={sp.get("q") || ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const v = (e.target as HTMLInputElement).value.trim()
            setParam("q", v === "" ? undefined : v)
          }
        }}
      />

      <Input
        type="number"
        placeholder="Min ₹"
        defaultValue={sp.get("min") || ""}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim()
          setParam("min", v === "" ? undefined : v)
        }}
      />
      <Input
        type="number"
        placeholder="Max ₹"
        defaultValue={sp.get("max") || ""}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim()
          setParam("max", v === "" ? undefined : v)
        }}
      />

      {/* Category (never use value="") */}
      <Select
        value={categoryValue}
        onValueChange={(v) => setParam("category", v === ALL ? undefined : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          <SelectItem value="audio">Audio</SelectItem>
          <SelectItem value="displays">Displays</SelectItem>
          <SelectItem value="peripherals">Peripherals</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort (uses concrete non-empty values) */}
      <Select value={sortValue} onValueChange={(v) => setParam("sort", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">Newest</SelectItem>
          <SelectItem value="price-asc">Price ↑</SelectItem>
          <SelectItem value="price-desc">Price ↓</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={() => router.push(pathname)}>
        Reset
      </Button>
    </div>
  )
}
