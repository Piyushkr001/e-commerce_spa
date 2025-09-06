/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import Image from "next/image";

interface Item {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  imageUrl?: string | null;
  displayPrice?: string;
  qty?: number;
}

function formatPrice(p?: number, ccy = "INR") {
  if (p == null) return "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy }).format(p);
  } catch {
    return `${ccy} ${p}`;
  }
}

export default function ProductCard({ item }: { item: Item }) {
  const [pending, setPending] = useState(false);
  const { add: addLocal } = useCart();

  const priceDisplay = useMemo(
    () => item.displayPrice || formatPrice(item.price, item.currency ?? "INR"),
    [item.displayPrice, item.price, item.currency]
  );

  const safeImage = item.imageUrl ? encodeURI(item.imageUrl) : "/placeholder.png";

  async function addToCart() {
    if (!item?.id) {
      toast.error("This product is missing an ID.");
      return;
    }

    setPending(true);
    try {
      const token =
        (typeof window !== "undefined" &&
          (localStorage.getItem("token") || localStorage.getItem("auth_token"))) ||
        "";

      if (token) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itemId: item.id, qty: 1 }),
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          /* tolerate empty body */
        }

        if (res.status === 401) {
          // ✅ Fallback to local persisted cart (correct call signature)
          addLocal(
            {
                id: item.id,
                title: item.title,
                price: item.price ?? 0,
                currency: item.currency ?? "INR",
                imageUrl: item.imageUrl ?? null,
                slug: ""
            },
            1
          );
          toast.success(`Added "${item.title}" to cart (local). Log in to sync.`);
          return;
        }

        if (!res.ok || data?.ok === false) {
          const msg = data?.error || `Add to cart failed (${res.status})`;
          throw new Error(msg);
        }

        // ✅ Success via server: sync local store if snapshot provided
        if (Array.isArray(data?.lines)) {
          // @ts-ignore — method exists in our store
          useCart.getState().setFromServer?.(data.lines);
        } else {
          // Fallback: fetch snapshot if server didn't include it
          try {
            const snapRes = await fetch("/api/cart", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const snap = await snapRes.json();
            if (snapRes.ok && Array.isArray(snap?.lines)) {
              // @ts-ignore
              useCart.getState().setFromServer?.(snap.lines);
            }
          } catch {
            /* ignore */
          }
        }

        toast.success(`Added "${item.title}" to cart`);
        return;
      }

      // ✅ No token: local persisted cart (correct call signature)
      addLocal(
        {
            id: item.id,
            title: item.title,
            price: item.price ?? 0,
            currency: item.currency ?? "INR",
            imageUrl: item.imageUrl ?? null,
            slug: ""
        },
        1
      );
      toast.success(`Added "${item.title}" to cart`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to add to cart");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4 flex flex-col">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl">
        <Image
          src={safeImage}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="mt-3">
        <h3 className="font-medium line-clamp-1">{item.title}</h3>
        <p className="text-slate-600 text-sm">{priceDisplay}</p>
      </div>

      <Button className="mt-auto rounded-xl" onClick={addToCart} disabled={pending}>
        {pending ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  );
}
