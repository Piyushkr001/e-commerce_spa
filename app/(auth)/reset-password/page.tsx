/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const token = sp.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const passLenOk = password.length >= 8
  const match = password && confirm && password === confirm
  const canSubmit = token && passLenOk && match && !loading

  const tokenMissing = useMemo(() => !token, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tokenMissing) {
      toast.error('Invalid link', { description: 'Missing reset token.' })
      return
    }
    if (!passLenOk) {
      toast.error('Weak password', { description: 'Use at least 8 characters.' })
      return
    }
    if (!match) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Reset failed')

      toast.success('Password updated', { description: 'You can now log in with your new password.' })
      router.push('/login')
    } catch (err: any) {
      toast.error('Reset error', { description: err.message ?? 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  required
                  className={`h-11 rounded-xl pr-12 ${password && !passLenOk ? 'border-red-500' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500">Use at least 8 characters.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  required
                  className={`h-11 rounded-xl pr-12 ${confirm && !match ? 'border-red-500' : ''}`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirm && !match && (
                <p className="text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>

            <Button type="submit" disabled={!canSubmit} className="h-11 rounded-xl" aria-busy={loading}>
              {loading ? 'Updating…' : 'Reset password'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </section>
  )
}
