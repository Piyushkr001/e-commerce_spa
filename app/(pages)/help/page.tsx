"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, MessageCircle, Package, ShieldCheck, CreditCard, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"

type Faq = { q: string; a: string; tags?: string[] }

const FAQS: Faq[] = [
  { q: "Where is my order?", a: "Go to Orders → Track. Most orders arrive within 2–5 business days.", tags: ["order", "delivery", "shipping"] },
  { q: "How do I return an item?", a: "Visit Orders → Return/Replace within 7 days of delivery to generate a pickup.", tags: ["return", "refund", "replace"] },
  { q: "Which payment methods are accepted?", a: "We accept UPI, major cards, net banking and COD in select locations.", tags: ["payment", "billing"] },
  { q: "Is my data secure?", a: "Yes. We use TLS, tokenized payments and follow strict access controls.", tags: ["security", "privacy"] },
  { q: "Can I change my address after ordering?", a: "Address changes are possible until the order is packed. Contact support ASAP.", tags: ["order", "address"] },
]

const QUICK_LINKS = [
  { href: "/orders", icon: <Package className="h-5 w-5" />, label: "Your Orders" },
  { href: "/contact", icon: <MessageCircle className="h-5 w-5" />, label: "Contact Support" },
  { href: "/privacy", icon: <ShieldCheck className="h-5 w-5" />, label: "Privacy Policy" },
  { href: "/payments", icon: <CreditCard className="h-5 w-5" />, label: "Payments" },
  { href: "/shipping", icon: <Truck className="h-5 w-5" />, label: "Shipping" },
]

export default function HelpPage() {
  const [query, setQuery] = useState("")
  const normalized = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalized) return FAQS
    return FAQS.filter(f =>
      [f.q, f.a, ...(f.tags || [])].some(t => t.toLowerCase().includes(normalized))
    )
  }, [normalized])

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Hero + Search */}
      <section className="grid gap-6 md:grid-cols-3 md:items-center">
        <div className="md:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Help Center</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Search FAQs or reach out—our team is here to help.
          </p>
          <div className="mt-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: order status, return, payment…"
              className="pl-9 h-11 rounded-xl"
              aria-label="Search help"
            />
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Need more help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Can’t find an answer? Start a conversation with us.
            </p>
            <div className="flex gap-3">
              <Link href="/contact">
                <Button className="rounded-xl">Contact us</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="rounded-xl">About Bazario</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold">Quick links</h2>
        <Separator className="my-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="rounded-2xl hover:shadow-md transition">
                <CardContent className="py-5 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-white/10">
                    {l.icon}
                  </span>
                  <span className="font-medium">{l.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold">FAQs</h2>
        <Separator className="my-4" />
        <Accordion type="single" collapsible className="w-full">
          {filtered.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {!filtered.length && (
          <p className="mt-3 text-sm text-slate-600">No results. Try different keywords.</p>
        )}
      </section>
    </main>
  )
}
