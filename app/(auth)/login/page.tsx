// app/(auth)/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./login-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = { redirect?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>; // 👈 Next 15 types this as a Promise
}) {
  const { redirect = "/" } = await searchParams; // 👈 await it

  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <LoginClient redirect={redirect} />
    </Suspense>
  );
}
