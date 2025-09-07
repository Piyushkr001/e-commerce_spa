/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";

export default function LoginClient({ redirect }: { redirect: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });

  // Auto redirect if already logged in (check both storages)
  useEffect(() => {
    const token =
      typeof window !== "undefined" &&
      (localStorage.getItem("token") || sessionStorage.getItem("token"));
    if (token) router.push("/");
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      // Save token
      if (remember) {
        localStorage.setItem("token", data.token);
      } else {
        sessionStorage.setItem("token", data.token);
      }

      // 🔔 notify Navbar (same-tab) to update immediately
      window.dispatchEvent(new Event("auth-changed"));

      toast.success("Welcome back!", { description: "You are now logged in." });
      router.push(redirect);
    } catch (err: any) {
      toast.error("Login error", {
        description: err.message ?? "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = async (cred: CredentialResponse) => {
    try {
      const idToken = cred?.credential;
      if (!idToken) throw new Error("No Google credential received");

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Google sign-in failed");

      // Google sign-in always persists (adjust if you want session-only)
      localStorage.setItem("token", data.token);

      // 🔔 notify Navbar (same-tab)
      window.dispatchEvent(new Event("auth-changed"));

      toast.success("Signed in with Google", {
        description: `Hi ${data?.user?.name || ""}`,
      });
      router.push(redirect);
    } catch (err: any) {
      toast.error("Google sign-in error", {
        description: err.message ?? "Something went wrong",
      });
    }
  };

  const onGoogleError = () => {
    toast.error("Google sign-in error", { description: "Please try again." });
  };

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Sign in to your{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Bazario
            </span>{" "}
            account
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Social sign-in */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <GoogleLogin onSuccess={onGoogleSuccess} onError={onGoogleError} />
            </div>
          </div>

          <div className="relative py-2">
            <Separator />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-stone-800 px-3 text-xs uppercase tracking-wide text-slate-500">
                or
              </span>
            </span>
          </div>

          {/* Email / Password form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11 rounded-xl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-xl pr-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="h-11 rounded-xl" aria-busy={loading}>
              {loading ? "Logging in…" : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
