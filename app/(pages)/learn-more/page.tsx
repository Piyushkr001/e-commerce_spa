import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Package, ShieldCheck, Zap, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Learn More • Bazario",
  description: "Explore how Bazario makes shopping fast, fair, and delightful.",
}

const FEATURES = [
  { icon: <Zap className="h-5 w-5" />, t: "Fast checkout", d: "UPI & cards with saved addresses." },
  { icon: <Package className="h-5 w-5" />, t: "Reliable delivery", d: "Real-time tracking & easy returns." },
  { icon: <ShieldCheck className="h-5 w-5" />, t: "Secure by default", d: "TLS, tokenized payments, privacy-first." },
  { icon: <Sparkles className="h-5 w-5" />, t: "Curated catalog", d: "Hand-picked items across categories." },
]

export default function LearnMorePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <section className="grid gap-6 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Shopping, reimagined.</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Bazario blends thoughtful design with dependable logistics—so you enjoy shopping, not waiting.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/shopping"><Button className="rounded-xl">Start shopping</Button></Link>
            <Link href="/about"><Button variant="outline" className="rounded-xl">About us</Button></Link>
          </div>
        </div>
        <div className="relative h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700">
          <Image src="/Images/learn-hero.png" alt="Bazario experience" fill className="object-contain" sizes="(max-width:768px) 100vw, 50vw" priority />
        </div>
      </section>

      <section>
        <h2 className="text-xl md:text-2xl font-semibold">Why you’ll love Bazario</h2>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(f => (
            <Card key={f.t} className="rounded-2xl">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-white/10">{f.icon}</span>
                  <div>
                    <div className="font-semibold">{f.t}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{f.d}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle>How it works</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-slate-700 dark:text-slate-300">
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" /> Browse curated products with rich filters.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" /> Add to cart—your items persist even if you log out.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" /> Pay securely with UPI/cards; track deliveries in real time.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" /> Easy returns & responsive support from our Help Center.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle>For sellers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>Modern dashboards, transparent fees, and fast payouts. Get in touch to learn more.</p>
            <Link href="/contact"><Button className="rounded-xl">Become a partner</Button></Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
