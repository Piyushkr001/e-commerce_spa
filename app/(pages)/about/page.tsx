import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Leaf, ShieldCheck, Truck, Sparkles, Recycle, Handshake } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"


export const metadata = {
  title: "About • Bazario",
  description: "Learn about Bazario — our story, values, and the team powering your favorite marketplace.",
}

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            About <span className="text-blue-600">Bazario</span>
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            We’re on a mission to make online shopping fast, fair, and delightful—powered by thoughtful design and
            customer-first engineering.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/shopping">
              <Button className="rounded-xl">
                Shop now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="rounded-xl">Contact us</Button>
            </Link>
          </div>
        </div>

        <div className="relative h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700">
          <Image
            src="/Images/about-hero.png" // replace with your illustration
            alt="Bazario team at work"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "Products", v: "10k+" },
          { k: "Happy Customers", v: "250k+" },
          { k: "Sellers", v: "1,200+" },
          { k: "Countries Served", v: "35+" },
        ].map((s) => (
          <Card key={s.k} className="rounded-2xl text-center">
            <CardContent className="py-6">
              <div className="text-2xl md:text-3xl font-bold">{s.v}</div>
              <div className="text-slate-600 dark:text-slate-300">{s.k}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Story */}
      <section className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Bazario began with a simple belief: great commerce is built on trust. From day one, we invested in
              transparent pricing, quick delivery, and service you can count on.
            </p>
            <p>
              Today, we help thousands of brands connect with customers across the world—while keeping the experience
              effortless and joyful.
            </p>
            <p>
              We obsess over the details so you don’t have to: curated catalogs, reliable logistics, and secure
              checkout—wrapped in a sleek, modern interface.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>What drives us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>• Customer delight over short-term wins</p>
            <p>• Craftsmanship in design & engineering</p>
            <p>• Sustainability and fair partnerships</p>
            <p>• Privacy, security, and reliability</p>
          </CardContent>
        </Card>
      </section>

      {/* Values */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold">Our Values</h2>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <ShieldCheck className="h-5 w-5" />, t: "Trust & Safety", d: "Secure payments and verified sellers." },
            { icon: <Truck className="h-5 w-5" />, t: "Fast Delivery", d: "Optimized logistics across regions." },
            { icon: <Sparkles className="h-5 w-5" />, t: "Delightful UX", d: "Shopping that feels effortless." },
            { icon: <Leaf className="h-5 w-5" />, t: "Sustainability", d: "Eco-friendly packaging & operations." },
            { icon: <Recycle className="h-5 w-5" />, t: "Circularity", d: "Returns & refurb done responsibly." },
            { icon: <Handshake className="h-5 w-5" />, t: "Fair Partners", d: "Transparent policies for sellers." },
          ].map((v) => (
            <Card key={v.t} className="rounded-2xl">
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-white/10">
                    {v.icon}
                  </span>
                  <div>
                    <div className="font-semibold">{v.t}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{v.d}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
 
      {/* CTA */}
      <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-sky-100 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700">
        <div className="grid gap-4 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Join our journey</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Browse our latest collections and experience shopping the Bazario way.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link href="/shopping">
              <Button className="rounded-xl">Start shopping</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
