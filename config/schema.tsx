import {
  pgTable, uuid, varchar, timestamp, text,
  integer,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";

/* -------------------- Users -------------------- */
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  imageUrl: varchar("image_url", { length: 255 }),
  // IMPORTANT: backend uses this column
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* -------- Password reset tokens (one-time) ----- */
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull(), // store only hash
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: integer("price").notNull(), // minor units (paise)
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  imageUrl: varchar("image_url", { length: 512 }),
  category: varchar("category", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  categoryIdx: index("items_category_idx").on(t.category),
  slugUq: uniqueIndex("items_slug_uq").on(t.slug),
  priceIdx: index("items_price_idx").on(t.price),
}));

export const cartLines = pgTable("cart_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  itemId: uuid("item_id").notNull(),
  qty: integer("qty").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userItemUq: uniqueIndex("cart_user_item_uq").on(t.userId, t.itemId),
  byUser: index("cart_user_idx").on(t.userId),
  byItem: index("cart_item_idx").on(t.itemId),
}));