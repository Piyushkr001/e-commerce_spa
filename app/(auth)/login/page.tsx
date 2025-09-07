// app/(auth)/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./login-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const redirect = searchParams?.redirect ?? "/";

  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <LoginClient redirect={redirect} />
    </Suspense>
  );
}
