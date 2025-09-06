// scripts/seed.ts
import { db } from "../config/db"
import { items } from "../config/schema"
import { sql } from "drizzle-orm"

async function seed() {
  await db
    .insert(items)
    .values([
      {
        title: "Blue Hoodie",
        slug: "blue-hoodie",
        price: 1999,
        currency: "INR",
        category: "Clothing",
        // avoid spaces in local paths or URL encode them
        imageUrl: "/Images/Blue Hoodie.avif",
      },
      {
        title: "Wireless Headphones",
        slug: "wireless-headphones",
        price: 2999,
        currency: "INR",
        category: "Electronics",
        imageUrl: "/Images/headphones.png",
      },
      {
        title: "Wireless Keyboard",
        slug: "wireless-keyboard",
        price: 999,
        currency: "INR",
        category: "Electronics",
        imageUrl: "/Images/keyboard.png",
      },
      {
        title: "Monitor",
        slug: "monitor",
        price: 29999,
        currency: "INR",
        category: "Electronics",
        imageUrl: "/Images/Monitor.png",
      },
    ])
    .onConflictDoUpdate({
      target: items.slug,
      // use EXCLUDED.* to update existing rows
      set: {
        title: sql`excluded.title`,
        price: sql`excluded.price`,
        currency: sql`excluded.currency`,
        category: sql`excluded.category`,
        // column name in DB is snake_case; adjust to your schema if different
        imageUrl: sql`excluded.image_url`,
        updatedAt: new Date(),
      },
    })
}

seed().then(() => {
  console.log("Seed complete (upsert).")
  process.exit(0)
})
