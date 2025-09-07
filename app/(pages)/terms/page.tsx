import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

const UPDATED = "September 7, 2025"

export const metadata = {
  title: "Terms & Conditions • Bazario",
  description: "Read the terms that govern your use of Bazario.",
}

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "accounts", title: "Accounts & Eligibility" },
  { id: "orders", title: "Orders, Pricing & Payments" },
  { id: "shipping", title: "Shipping, Returns & Refunds" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "ip", title: "Intellectual Property" },
  { id: "warranty", title: "Warranty Disclaimer" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "law", title: "Governing Law" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact" },
]

export default function TermsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Terms & Conditions</h1>
        <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-12">
        <aside className="md:col-span-3">
          <Card className="rounded-2xl sticky top-24">
            <CardContent className="py-4">
              <nav className="text-sm space-y-2">
                {SECTIONS.map(s => (
                  <a key={s.id} href={`#${s.id}`} className="block hover:underline">{s.title}</a>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <article className="md:col-span-9 space-y-8 leading-relaxed text-slate-700 dark:text-slate-300">
          <section id="acceptance">
            <h2 className="text-xl md:text-2xl font-semibold">Acceptance of Terms</h2>
            <Separator className="my-3" />
            <p>By accessing or using Bazario, you agree to these Terms. If you do not agree, do not use the services.</p>
          </section>

          <section id="accounts">
            <h2 className="text-xl md:text-2xl font-semibold">Accounts & Eligibility</h2>
            <Separator className="my-3" />
            <p>You must be at least 13 and capable of forming a binding contract. You are responsible for keeping credentials secure.</p>
          </section>

          <section id="orders">
            <h2 className="text-xl md:text-2xl font-semibold">Orders, Pricing & Payments</h2>
            <Separator className="my-3" />
            <p>All prices are subject to change. We may cancel orders due to errors or suspected fraud. Payments are processed via trusted gateways.</p>
          </section>

          <section id="shipping">
            <h2 className="text-xl md:text-2xl font-semibold">Shipping, Returns & Refunds</h2>
            <Separator className="my-3" />
            <p>Delivery ETAs are estimates. Returns are accepted per our return policy; refunds may take 5–7 business days to reflect.</p>
          </section>

          <section id="acceptable-use">
            <h2 className="text-xl md:text-2xl font-semibold">Acceptable Use</h2>
            <Separator className="my-3" />
            <p>No unlawful, infringing, or abusive activity; no interference with the platform or misuse of features.</p>
          </section>

          <section id="ip">
            <h2 className="text-xl md:text-2xl font-semibold">Intellectual Property</h2>
            <Separator className="my-3" />
            <p>All content is the property of Bazario or its licensors. You may not copy, modify, or distribute without authorization.</p>
          </section>

          <section id="warranty">
            <h2 className="text-xl md:text-2xl font-semibold">Warranty Disclaimer</h2>
            <Separator className="my-3" />
            <p>Services are provided “as is” without warranties of any kind, to the maximum extent permitted by law.</p>
          </section>

          <section id="liability">
            <h2 className="text-xl md:text-2xl font-semibold">Limitation of Liability</h2>
            <Separator className="my-3" />
            <p>Bazario shall not be liable for indirect, incidental, or consequential damages.</p>
          </section>

          <section id="law">
            <h2 className="text-xl md:text-2xl font-semibold">Governing Law</h2>
            <Separator className="my-3" />
            <p>These Terms are governed by the laws of India, without regard to conflict of law principles.</p>
          </section>

          <section id="changes">
            <h2 className="text-xl md:text-2xl font-semibold">Changes to Terms</h2>
            <Separator className="my-3" />
            <p>We may update these Terms. Continued use constitutes acceptance.</p>
          </section>

          <section id="contact">
            <h2 className="text-xl md:text-2xl font-semibold">Contact</h2>
            <Separator className="my-3" />
            <p>Email: <Link href="mailto:support@bazario.com" className="text-blue-600 hover:underline">support@bazario.com</Link></p>
          </section>
        </article>
      </div>
    </main>
  )
}
