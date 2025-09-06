/* eslint-disable @typescript-eslint/no-explicit-any */
export async function addToCartServer(itemId: string, qty = 1) {
  const token = localStorage.getItem("auth_token") // wherever you store your backend JWT
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch("/api/cart", {
    method: "POST",
    headers,
    body: JSON.stringify({ itemId, qty }),
  })

  let data: any = null
  try { data = await res.json() } catch {}

  if (!res.ok) {
    const msg = data?.error || `Cart error ${res.status}`
    throw new Error(msg)
  }
  return data // { ok, lines, subtotal, ... } or { ok: true }
}
