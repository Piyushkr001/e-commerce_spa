/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = pk ? loadStripe(pk) : null;

function InnerForm({
  orderId,
  clientSecret,
  onPaid,
}: {
  orderId: string;
  clientSecret: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);

  const confirm = useCallback(async () => {
    if (!stripe || !elements) return;
    setPending(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: typeof window !== "undefined" ? window.location.href : undefined,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setPending(false);
        return;
      }

      const status = paymentIntent?.status || "requires_payment_method";
      const intentId = paymentIntent?.id || "";

      // tell backend the result (simple client-confirm flow)
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "stripe", intentId, status }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to update order");

      if (status === "succeeded") {
        toast.success("Payment successful");
        onPaid();
      } else if (status === "processing") {
        toast.message("Payment processing", { description: "We’ll email you when it’s confirmed." });
        onPaid();
      } else if (status === "requires_action") {
        toast.message("Action required", { description: "Please complete the additional steps." });
      } else {
        toast.error("Payment incomplete");
      }
    } catch (e: any) {
      toast.error(e?.message || "Payment confirmation failed");
    } finally {
      setPending(false);
    }
  }, [stripe, elements, orderId, onPaid]);

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button className="w-full rounded-xl" onClick={confirm} disabled={!stripe || pending}>
        {pending ? "Processing…" : "Pay now"}
      </Button>
    </div>
  );
}

export default function StripeCardForm({
  orderId,
  clientSecret,
  onPaid,
}: {
  orderId: string;
  clientSecret: string;
  onPaid: () => void;
}) {
  if (!stripePromise || !clientSecret) {
    return <p className="text-sm text-red-600">Stripe is not configured.</p>;
  }

  const options: StripeElementsOptions = useMemo(
    () => ({ clientSecret, appearance: { theme: "stripe" } }),
    [clientSecret]
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerForm orderId={orderId} clientSecret={clientSecret} onPaid={onPaid} />
    </Elements>
  );
}
