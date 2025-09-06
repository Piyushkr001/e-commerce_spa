/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// lib/cart-sync.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCart } from "@/store/cart"

type ServerLine = { itemId: string; qty: number }
type ServerSnapshot = { ok: boolean; lines: any[]; subtotal: number; subtotalDisplay: string }

const clamp = (n: number) => Math.max(1, Math.min(99, Math.trunc(n || 0)))

/**
 * Call this RIGHT AFTER you store the auth token on login.
 * It merges any local (persisted) items into the server cart, then
 * mirrors the merged snapshot back into the local persisted store.
 */
export async function mergeLocalIntoServer(token: string) {
  if (!token) return

  // 1) read local persisted cart
  const localLines = useCart.getState().lines // [{ item, qty }]
  const localMap = new Map<string, number>()
  for (const l of localLines) {
    const id = l?.item?.id
    if (!id) continue
    localMap.set(id, clamp((localMap.get(id) || 0) + clamp(l.qty || 1)))
  }

  // 2) read server cart
  const snapRes = await fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
  const snap: ServerSnapshot = await snapRes.json()
  //@ts-ignore
  if (!snapRes.ok || !snap?.ok) throw new Error(snap?.["error"] || "Failed to read server cart")

  const serverMap = new Map<string, number>()
  for (const s of snap.lines || []) {
    const id = s?.itemId
    if (!id) continue
    serverMap.set(id, clamp(s.qty || 1))
  }

  // 3) build merged (sum quantities, clamp to 99)
  const mergedMap = new Map<string, number>(serverMap)
  for (const [id, q] of localMap) {
    mergedMap.set(id, clamp((mergedMap.get(id) || 0) + q))
  }

  // 4) apply delta to server (POST new, PATCH changed)
  for (const [id, q] of mergedMap) {
    if (!serverMap.has(id)) {
      await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: id, qty: q }),
      })
    } else if (serverMap.get(id) !== q) {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: id, qty: q }),
      })
    }
  }

  // 5) fetch final snapshot and mirror to local store
  const finalRes = await fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
  const finalSnap: ServerSnapshot = await finalRes.json()
  if (finalRes.ok && finalSnap?.ok && Array.isArray(finalSnap.lines)) {
    // @ts-ignore
    useCart.getState().setFromServer?.(finalSnap.lines)
  }
}

/**
 * Call this when logging out.
 * DO NOT clear the cart. Just remove tokens.
 * (Local persisted store already holds the latest snapshot from when you were logged in.)
 */
export async function logoutAndKeepCart() {
  try {
    // Optional: ensure local has the latest server snapshot before logout
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token") || ""
    if (token) {
      const res = await fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
      const data: ServerSnapshot = await res.json()
      if (res.ok && data?.ok && Array.isArray(data.lines)) {
        // @ts-ignore
        useCart.getState().setFromServer?.(data.lines)
      }
    }
  } catch {
    // ignore; local already has a copy
  } finally {
    // Remove ONLY auth; do NOT clear the cart store
    localStorage.removeItem("token")
    localStorage.removeItem("auth_token")
  }
}
