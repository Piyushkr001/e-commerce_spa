/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine, Item } from '@/types'

type CartState = {
  lines: CartLine[]                           // [{ item: Item, qty: number }]
  add: (item: Item, qty?: number) => void
  remove: (itemId: string) => void
  setQty: (itemId: string, qty: number) => void
  clear: () => void
  subtotal: () => number

  /** Replace local cart from server snapshot; ignores bad/undefined input */
  setFromServer: (serverLines?: any[]) => void
}

/* ---------- helpers ---------- */
const clampQty = (n: number) => Math.max(1, Math.min(99, Math.trunc(Number(n) || 0)))
const safePrice = (p: unknown) => {
  const n = typeof p === 'string' ? parseFloat(p) : (typeof p === 'number' ? p : 0)
  return Number.isFinite(n) ? n : 0
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (item, qty = 1) =>
        set((state) => {
          const q = clampQty(qty)
          const idx = state.lines.findIndex((l) => l.item.id === item.id)
          if (idx >= 0) {
            const next = [...state.lines]
            next[idx] = { ...next[idx], qty: clampQty(next[idx].qty + q) }
            return { lines: next }
          }
          return { lines: [...state.lines, { item, qty: q }] }
        }),

      remove: (itemId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.item.id !== itemId) })),

      setQty: (itemId, qty) =>
        set((state) => {
          const q = clampQty(qty)
          const idx = state.lines.findIndex((l) => l.item.id === itemId)
          if (idx < 0) return { lines: state.lines }
          const next = [...state.lines]
          next[idx] = { ...next[idx], qty: q }
          return { lines: next }
        }),

      clear: () => set({ lines: [] }),

      subtotal: () =>
        get().lines.reduce((sum, l) => sum + safePrice(l.item.price) * (l.qty || 0), 0),

      // ✅ only set when it's an actual array; otherwise no-op (prevents wipes)
      setFromServer: (serverLines) => {
        if (!Array.isArray(serverLines)) return

        // Normalize possible server shapes to local { item, qty }
        const mapped: CartLine[] = []
        for (const s of serverLines) {
          try {
            if (s?.item && s?.item?.id) {
              // already local-like
              const itm: Item = {
                id: String(s.item.id),
                title: String(s.item.title ?? 'Item'),
                price: safePrice(s.item.price),
                currency: String(s.item.currency ?? 'INR'),
                imageUrl: s.item.imageUrl ?? null,
                //@ts-ignore
                displayPrice: s.item.displayPrice,
              }
              mapped.push({ item: itm, qty: clampQty(s.qty ?? 1) })
            } else if (s?.itemId) {
              const itm: Item = {
                id: String(s.itemId),
                title: String(s.title ?? 'Item'),
                price: safePrice(s.price),
                currency: String(s.currency ?? 'INR'),
                imageUrl: s.imageUrl ?? null,
                //@ts-ignore
                displayPrice: s.displayPrice,
              }
              mapped.push({ item: itm, qty: clampQty(s.qty ?? 1) })
            }
          } catch {
            // ignore bad rows
          }
        }

        if (mapped.length) set({ lines: mapped })
        // if mapping produced nothing, keep current cart as-is
      },
    }),
    { name: 'bazario-cart' } // persisted key
  )
)
