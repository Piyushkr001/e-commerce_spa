/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/store/cart";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import StripeCardForm from "./components/payments/StripeCardForm";

type ServerLine = {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  qty: number;
  displayPrice?: string;
};

type ServerSnapshot = {
  ok: boolean;
  lines: ServerLine[];
  subtotal: number;
  subtotalDisplay: string;
  error?: string;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function formatCurrency(amount: number | string, currency = "INR") {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(safe);
}

const SHIPPING_THRESHOLD = 5000; // INR
const SHIPPING_FEE = 99;

async function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutClient() {
  const router = useRouter();

  // local cart store (guest)
  const { lines: localLines, subtotal: localSubtotal, clear: localClear } = useCart();

  // server mode (auth)
  const [token, setToken] = useState<string>("");
  const [serverSnap, setServerSnap] = useState<ServerSnapshot | null>(null);
  const serverMode = token.length > 0;

  useEffect(() => {
    const t = (localStorage.getItem("token") || sessionStorage.getItem("token")) ?? "";
    setToken(t);
  }, []);

  const fetchServerCart = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } });
      const data: ServerSnapshot = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to load cart");
      setServerSnap(data);
      // optional: mirror to local
      // @ts-ignore
      useCart.getState().setFromServer?.(data.lines);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load cart");
      setServerSnap(null);
    }
  }, [token]);

  useEffect(() => {
    if (serverMode) fetchServerCart();
  }, [serverMode, fetchServerCart]);

  // shipping address form
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  // payment method: 'cod' | 'card' | 'razorpay'
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "razorpay">("cod");

  // stripe state
  const [orderId, setOrderId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");

  const renderLines: ServerLine[] = serverMode
    ? serverSnap?.lines || []
    : localLines.map((l: any) => ({
        itemId: l.item?.id ?? l.itemId ?? l.id,
        title: l.item?.title ?? l.title ?? "Item",
        price: Number(l.item?.price ?? l.price ?? 0),
        currency: (l.item?.currency ?? l.currency ?? "INR") as string,
        imageUrl: l.item?.imageUrl ?? l.imageUrl ?? null,
        qty: Number(l.qty ?? 1),
        displayPrice: l.item?.displayPrice ?? l.displayPrice,
      }));

  const localSubtotalMemo = useMemo(() => localSubtotal(), [localSubtotal, localLines]);
  const subtotalNumber = serverMode ? serverSnap?.subtotal ?? 0 : localSubtotalMemo;

  const shipping = subtotalNumber >= SHIPPING_THRESHOLD || subtotalNumber === 0 ? 0 : SHIPPING_FEE;
  const total = subtotalNumber + shipping;

  const onPaid = useCallback(() => {
    if (!serverMode) localClear();
    router.push("/shopping");
  }, [serverMode, localClear, router]);

  const startRazorpayPayment = useCallback(
    async (createdOrderId: string) => {
      // ask server to create Razorpay order
      const res = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createdOrderId }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to init Razorpay");

      const ok = await loadRazorpayCheckout();
      if (!ok || !window.Razorpay) throw new Error("Failed to load Razorpay");

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || data.key; // prefer public env, fallback to backend
      const options = {
        key,
        amount: data.amount, // paise
        currency: data.currency || "INR",
        name: "Bazario",
        description: `Order ${createdOrderId}`,
        order_id: data.rzpOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone || "",
        },
        notes: { bazario_order_id: createdOrderId },
        theme: { color: "#0ea5e9" },
        handler: async function (resp: any) {
          try {
            const vRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: createdOrderId,
                rzpOrderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
              }),
            });
            const vData = await vRes.json();
            if (!vRes.ok || vData?.ok === false) throw new Error(vData?.error || "Verification failed");
            toast.success("Payment successful");
            onPaid();
          } catch (e: any) {
            toast.error(e?.message || "Verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            toast.message("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    [form.name, form.email, form.phone, onPaid]
  );

  const onPlaceOrder = async () => {
    if (!renderLines.length) {
      toast.error("Your cart is empty");
      return;
    }
    // required fields
    const required = ["name", "email", "addressLine1", "city", "state", "postalCode"] as const;
    for (const k of required) {
      if (!String(form[k]).trim()) {
        toast.error("Please fill all required fields");
        return;
      }
    }

    try {
      const body: any = {
        shipping: form,
        lines: renderLines.map((l) => ({ itemId: l.itemId, qty: l.qty })), // always send snapshot
        paymentMethod, // cod | card | razorpay
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (serverMode) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/orders", { method: "POST", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Order failed");

      // Flows:
      if (paymentMethod === "cod") {
        if (!serverMode) localClear();
        toast.success("Order placed (Cash on Delivery)", { description: `Order ID: ${data.id}` });
        router.push("/shopping");
        return;
      }

      if (paymentMethod === "card") {
        // Stripe flow
        setOrderId(data.id);
        const piRes = await fetch("/api/payments/stripe/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.id }),
        });
        const pi = await piRes.json();
        if (!piRes.ok || pi?.ok === false || !pi?.clientSecret) {
          throw new Error(pi?.error || "Failed to initialize payment");
        }
        setClientSecret(pi.clientSecret);
        toast.message("Secure payment", { description: "Enter your card details below." });
        return;
      }

      if (paymentMethod === "razorpay") {
        await startRazorpayPayment(data.id);
        return;
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to place order");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Shipping form */}
      <section className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Full name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            <Input className="md:col-span-2" placeholder="Address line 1 *" value={form.addressLine1} onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))} />
            <Input className="md:col-span-2" placeholder="Address line 2" value={form.addressLine2} onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))} />
            <Input placeholder="City *" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <Input placeholder="State *" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            <Input placeholder="Postal code *" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!renderLines.length ? (
              <p className="text-slate-600">Your cart is empty.</p>
            ) : (
              renderLines.map((l) => (
                <div key={l.itemId} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white">
                    <Image src={l.imageUrl || "/Images/placeholder.png"} alt={l.title} fill className="object-contain p-2" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1">{l.title}</div>
                    <div className="text-sm text-slate-600">
                      {l.displayPrice ?? formatCurrency(l.price, l.currency)} × {l.qty}
                    </div>
                  </div>
                  <div className="w-24 text-right font-semibold">
                    {formatCurrency(l.price * l.qty, l.currency)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Stripe card element appears here after PI is created */}
        {paymentMethod === "card" && orderId && clientSecret && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle>Card Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <StripeCardForm orderId={orderId} clientSecret={clientSecret} onPaid={onPaid} />
            </CardContent>
          </Card>
        )}
      </section>

      {/* Right: Summary */}
      <aside className="space-y-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotalNumber, "INR")}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold">
                {shipping === 0 ? "Free" : formatCurrency(shipping, "INR")}
              </span>
            </div>

            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Payment method</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  Cash on Delivery
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="pay" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
                  Card (Stripe, test)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                  />
                  UPI / Card (Razorpay)
                </label>
              </div>
            </div>

            <Separator className="my-3" />
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span className="font-bold">{formatCurrency(total, "INR")}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-xl" onClick={onPlaceOrder} disabled={!renderLines.length}>
              {paymentMethod === "cod"
                ? "Place order"
                : paymentMethod === "card"
                ? (orderId && clientSecret ? "Recreate order" : "Place order & pay")
                : "Place order & pay"}
            </Button>
          </CardFooter>
        </Card>
      </aside>
    </main>
  );
}
