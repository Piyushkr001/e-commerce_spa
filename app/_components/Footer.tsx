'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Facebook, Instagram, Twitter, Youtube, Mail } from 'lucide-react'
import React from 'react'

export default function Footer() {
  return (
    <footer className="w-full border-t bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800">
      {/* Top: Newsletter */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Join the Bazario newsletter
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Get fresh deals and product drops—no spam, ever.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full md:w-auto gap-3"
            aria-label="Newsletter subscription"
          >
            <div className="relative flex-1 min-w-[240px]">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                placeholder="you@example.com"
                className="pl-9 h-11 rounded-xl"
                required
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl px-6">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Middle: Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-wrap gap-10 md:gap-14">
          {/* Brand + Social */}
          <div className="flex-1 min-w-[260px]">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/Images/Logo/logo.svg"
                alt="Bazario"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-sm">
              Your modern marketplace for everything you love—fast, safe, and delightful.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <Social href="#" label="Twitter">
                <Twitter className="h-5 w-5" />
              </Social>
              <Social href="#" label="Instagram">
                <Instagram className="h-5 w-5" />
              </Social>
              <Social href="#" label="Facebook">
                <Facebook className="h-5 w-5" />
              </Social>
              <Social href="#" label="YouTube">
                <Youtube className="h-5 w-5" />
              </Social>
            </div>
          </div>

          <FooterCol title="Support">
            <FooterLink href="/help">Help Center</FooterLink>
            <FooterLink href="/shipping">Shipping & Delivery</FooterLink>
            <FooterLink href="/returns">Returns & Refunds</FooterLink>
            <FooterLink href="/contact">Contact Us</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/careers">Careers</FooterLink>
            <FooterLink href="/press">Press</FooterLink>
            <FooterLink href="/blog">Blog</FooterLink>
          </FooterCol>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Bottom: Legal + Payments */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            © {new Date().getFullYear()} Bazario. All rights reserved.
          </p>

          <div className="flex items-center gap-5 text-sm">
            <Link className="hover:underline" href="/privacy">Privacy</Link>
            <Link className="hover:underline" href="/terms">Terms</Link>
            <Link className="hover:underline" href="/cookies">Cookies</Link>
          </div>

          {/* Simple payment badges (SVG text placeholders) */}
          <div className="flex items-center gap-2 opacity-80">
            <Badge>VISA</Badge>
            <Badge>Mastercard</Badge>
            <Badge>UPI</Badge>
            <Badge>PayPal</Badge>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ---------- helpers ---------- */

function FooterCol({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex-1 min-w-[160px]">
      <h4 className="text-base font-semibold mb-3">{title}</h4>
      <nav className="flex flex-col gap-2 text-slate-700 dark:text-slate-300">
        {children}
      </nav>
    </div>
  )
}

function FooterLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link
      href={href}
      className="hover:text-slate-900 hover:underline underline-offset-4 dark:hover:text-white transition"
    >
      {children}
    </Link>
  )
}

function Social({
  href,
  label,
  children,
}: React.PropsWithChildren<{ href: string; label: string }>) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition dark:border-white/10 dark:bg-white/10"
    >
      {children}
    </Link>
  )
}

function Badge({ children }: React.PropsWithChildren) {
  return (
    <span className="px-2.5 py-1 rounded-md border text-xs bg-white border-slate-200 dark:bg-white/10 dark:border-white/10">
      {children}
    </span>
  )
}
