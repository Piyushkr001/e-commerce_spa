// app/checkout/page.tsx
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function Skeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border p-6 h-72 animate-pulse" />
        <div className="rounded-2xl border p-6 h-40 animate-pulse" />
      </section>
      <aside>
        <div className="rounded-2xl border p-6 h-64 animate-pulse" />
      </aside>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CheckoutClient/>
    </Suspense>
  );
}
