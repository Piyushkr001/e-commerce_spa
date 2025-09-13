/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Item = {
  id: string;
  title: string;
  price: number;
  currency?: string;
  imageUrl?: string | null;
  displayPrice?: string;
};

export type CartLine = { item: Item; qty: number };

type CartState = {
  lines: CartLine[];
  add: (item: Item, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  /** wipes memory + localStorage (prevents “last item” ghosting) */
  hardClear: () => void;
  /** optional: sync from server snapshot */
  setFromServer?: (lines: Array<{ itemId: string; title: string; price: number; currency?: string; imageUrl?: string | null; qty: number }>) => void;
  subtotal: () => number;
};

const CART_STORAGE_KEY = "bazario-cart";

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (item: { id: any; }, qty = 1) =>
        set((state: { lines: any[]; }) => {
          const idx = state.lines.findIndex((l: { item: { id: any; }; }) => l.item.id === item.id);
          if (idx >= 0) {
            const next = [...state.lines];
            next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + qty) };
            return { lines: next };
          }
          return { lines: [...state.lines, { item, qty: Math.min(99, qty) }] };
        }),
      remove: (id: any) => set((state: { lines: any[]; }) => ({ lines: state.lines.filter((l: { item: { id: any; }; }) => l.item.id !== id) })),
      setQty: (id: any, qty: number) =>
        set((state: { lines: any[]; }) => {
          const q = Math.max(0, Math.min(99, qty));
          if (q === 0) return { lines: state.lines.filter((l: { item: { id: any; }; }) => l.item.id !== id) };
          return { lines: state.lines.map((l: { item: { id: any; }; }) => (l.item.id === id ? { ...l, qty: q } : l)) };
        }),
      clear: () => set({ lines: [] }),
      hardClear: () => {
        set({ lines: [] });
        try {
          // nuke persisted snapshot to avoid stale rehydration
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch {}
      },
      setFromServer: (serverLines: any) =>
        set({
          lines: (serverLines || []).map((s: { itemId: any; title: any; price: any; currency: any; imageUrl: any; qty: any; }) => ({
            item: {
              id: s.itemId,
              title: s.title,
              price: Number(s.price || 0),
              currency: (s.currency || "INR") as string,
              imageUrl: s.imageUrl ?? null,
            },
            qty: Number(s.qty || 1),
          })),
        }),
      subtotal: () =>
        get().lines.reduce((sum: number, l: { item: { price: any; }; qty: number; }) => {
          const price = typeof l.item.price === "string" ? parseFloat(l.item.price as any) : l.item.price;
          return sum + (Number(price) || 0) * l.qty;
        }, 0),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // ensure we only restore 'lines' from disk
      partialize: (state) => ({ lines: state.lines }),
      // replace lines on rehydrate (prevents merge ghosts)
      merge: (persisted: any, current: any) => ({
        ...current,
        lines: Array.isArray(persisted?.lines) ? persisted.lines : current.lines,
      }),
    }
  )
);
