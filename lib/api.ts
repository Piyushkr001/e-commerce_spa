export async function getJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" })
  const text = await res.text()

  // If server returned HTML (e.g., a 404 page), throw a cleaner error
  const looksHtml = text.trim().startsWith("<")
  if (!res.ok) {
    throw new Error(looksHtml ? `${res.status} ${res.statusText} for ${url}` : text)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Invalid JSON from ${url}`)
  }
}
