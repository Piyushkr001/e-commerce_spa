export type Item = {
  id: string
  title: string
  slug: string
  description?: string | null
  price: number | string
  currency?: string
  imageUrl?: string | null
  categoryId?: string | null
}

export type CartLine = {
  item: Item
  qty: number
}
