/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ModeToggle } from './ModeToggle'
import { logoutAndKeepCart } from '@/lib/cart-sync' // ✅ keeps cart on logout
import { toast } from 'sonner'

const menuItems = [
  { name: 'Home', link: '/' },
  { name: 'About', link: '/about' },
  { name: 'Shop', link: '/shopping' },
  { name: 'Cart', link: '/cart' },
  { name: 'Orders', link: '/orderhistory' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      // ✅ read BOTH storages and both keys
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('token')
      setIsAuthenticated(!!token)
    }

    // initial
    checkAuth()

    // ✅ update on custom auth event (same tab)
    window.addEventListener('auth-changed', checkAuth)
    // ✅ update when tab regains focus
    window.addEventListener('focus', checkAuth)
    // ✅ update if storage changes in another tab
    window.addEventListener('storage', checkAuth)

    return () => {
      window.removeEventListener('auth-changed', checkAuth)
      window.removeEventListener('focus', checkAuth)
      window.removeEventListener('storage', checkAuth)
    }
  }, [])

  const handleLogout = async () => {
    try {
      // ✅ mirror latest server cart -> local, then remove tokens (do NOT clear cart)
      await logoutAndKeepCart()
      // notify listeners in this tab
      window.dispatchEvent(new Event('auth-changed'))
      setIsAuthenticated(false)
      toast.success('Logged out', { description: 'Your cart is saved on this device.' })
      router.push('/')
    } catch (e: any) {
      toast.error('Logout failed', { description: e?.message ?? 'Please try again.' })
    } finally {
      setOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-3 mt-2 rounded-2xl bg-gradient-to-br from-sky-200 via-white to-blue-300 dark:from-stone-200 dark:via-neutral-600 dark:to-stone-700 shadow-md">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Images/Logo/logo.svg"
              width={120}
              height={120}
              alt="Bazario logo"
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Menu (centered) */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-8">
            {menuItems.map((menu) => {
              const isActive = pathname === menu.link
              return (
                <Link href={menu.link} key={menu.link}>
                  <h2
                    className={`text-lg transition-all hover:scale-105 ${
                      isActive
                        ? 'text-blue-600 font-semibold underline underline-offset-4'
                        : 'hover:text-blue-600'
                    }`}
                  >
                    {menu.name}
                  </h2>
                </Link>
              )
            })}
          </div>

          {/* Auth + ModeToggle */}
          <div className="hidden md:flex items-center gap-3">
            <ModeToggle />

            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg border border-slate-300/70 bg-white/50 backdrop-blur hover:bg-white transition dark:border-white/20 dark:bg-white/10 ${
                    pathname === '/login' ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className={`px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition dark:bg-blue-500 dark:hover:bg-blue-600 ${
                    pathname === '/signup' ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <Button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500"
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <Button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 hover:bg-white/60 dark:hover:bg-white/10 transition"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg className={`h-6 w-6 ${open ? 'hidden' : 'block'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className={`h-6 w-6 ${open ? 'block' : 'hidden'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </nav>

        {/* Mobile Menu Panel */}
        <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-4 pt-0 flex flex-col gap-3">
            {menuItems.map((m) => {
              const isActive = pathname === m.link
              return (
                <Link
                  key={m.name}
                  href={m.link}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 transition ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-white/60 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 dark:text-white'
                  }`}
                >
                  {m.name}
                </Link>
              )
            })}

            {!isAuthenticated ? (
              <div className="mt-1 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-center border transition ${
                    pathname === '/login'
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-300/70 bg-white/60 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-center transition ${
                    pathname === '/signup'
                      ? 'bg-primary text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }`}
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <Button
                onClick={async () => {
                  await handleLogout()
                  setOpen(false)
                }}
                className="mt-2 w-full rounded-lg bg-red-600 text-white hover:bg-red-500"
              >
                Logout
              </Button>
            )}

            {/* ModeToggle for mobile */}
            <div className="mt-3">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
