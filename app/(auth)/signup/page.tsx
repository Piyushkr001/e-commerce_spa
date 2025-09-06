/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const redirect = sp.get('redirect') || '/'

  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree, setAgree] = useState(true)
  const [remember, setRemember] = useState(true)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })

  // redirect if already logged in (check both storages)
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) router.push('/')
  }, [router])

  const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(form.email), [form.email])
  const passLenOk = form.password.length >= 8
  const passwordsMatch = form.password && form.password === form.confirm
  const canSubmit = form.name && emailOk && passLenOk && passwordsMatch && agree && !loading

  // Classic signup → /api/auth/signup
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOk) {
      toast.error('Invalid email', { description: 'Please enter a valid email address.' })
      return
    }
    if (!passLenOk) {
      toast.error('Weak password', { description: 'Use at least 8 characters.' })
      return
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match', { description: 'Please confirm your password.' })
      return
    }
    if (!agree) {
      toast.error('Please accept the terms', { description: 'You must agree to continue.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Signup failed')

      // store token respecting "remember me"
      if (remember) {
        localStorage.setItem('token', data.token)
      } else {
        sessionStorage.setItem('token', data.token)
      }
      // 🔔 notify Navbar, etc.
      window.dispatchEvent(new Event('auth-changed'))

      toast.success('Account created!', { description: 'Welcome to Bazario 🎉' })
      router.push(redirect)
    } catch (err: any) {
      toast.error('Signup error', { description: err.message ?? 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  // Google sign up → /api/auth/google
  const onGoogleSuccess = async (cred: CredentialResponse) => {
    try {
      const idToken = cred?.credential
      if (!idToken) throw new Error('No Google credential received')

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Google sign-in failed')

      // persist (adjust to sessionStorage if you prefer)
      localStorage.setItem('token', data.token)
      // 🔔 notify Navbar
      window.dispatchEvent(new Event('auth-changed'))

      toast.success('Signed up with Google', { description: `Hi ${data?.user?.name || ''}` })
      router.push(redirect)
    } catch (err: any) {
      toast.error('Google sign-in error', { description: err.message ?? 'Something went wrong' })
    }
  }

  const onGoogleError = () => {
    toast.error('Google sign-in error', { description: 'Please try again.' })
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700 px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Join <span className="font-semibold text-blue-600 dark:text-blue-400">Bazario</span> and start shopping today!
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Social sign-up */}
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

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                className="h-11 rounded-xl"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className={`h-11 rounded-xl ${form.email && !emailOk ? 'border-red-500' : ''}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {form.email && !emailOk && (
                <p className="text-xs text-red-600">Please enter a valid email.</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  required
                  className={`h-11 rounded-xl pr-12 ${form.password && !passLenOk ? 'border-red-500' : ''}`}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500">Use at least 8 characters.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirm" className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  required
                  className={`h-11 rounded-xl pr-12 ${
                    form.confirm && !passwordsMatch ? 'border-red-500' : ''
                  }`}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.confirm && !passwordsMatch && (
                <p className="text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>

            {/* Terms + Remember */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link> and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy</Link>.
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Remember me on this device
              </label>
            </div>

            <Button type="submit" disabled={!canSubmit} className="h-11 rounded-xl" aria-busy={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  )
}
