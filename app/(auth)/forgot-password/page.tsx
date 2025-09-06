/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always returns ok: true, even if email doesn't exist
      await res.json()
      setSent(true)
      toast.success('Password reset email sent', { description: 'Check your inbox.' })
    } catch (err: any) {
      toast.error('Could not send reset email', { description: err?.message ?? 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Enter your email and we’ll send you a reset link.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {!sent ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-11 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading || !email} className="h-11 rounded-xl" aria-busy={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Check your inbox</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                If an account exists for <span className="font-medium">{email}</span>, you’ll receive an email with a link to reset your password.
              </p>
              <Button variant="outline" className="mt-1" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          )}

          <div className="relative py-2">
            <Separator />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-stone-800 px-3 text-xs uppercase tracking-wide text-slate-500">or</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Back to Login
            </Link>
            <Link href="/signup" className="text-blue-600 hover:underline dark:text-blue-400">
              Create an account
            </Link>
          </div>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Didn’t get the email? Check spam, or try again in a minute.
          </p>
        </CardFooter>
      </Card>
    </section>
  )
}
