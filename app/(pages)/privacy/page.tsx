import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

const UPDATED = "September 7, 2025"

export const metadata = {
  title: "Privacy Policy • Bazario",
  description: "How Bazario collects, uses, and protects your information.",
}

const SECTIONS = [
  { id: "info-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Information" },
  { id: "sharing", title: "Sharing & Disclosure" },
  { id: "retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights" },
  { id: "security", title: "Security" },
  { id: "children", title: "Children’s Privacy" },
  { id: "updates", title: "Policy Updates" },
  { id: "contact", title: "Contact Us" },
]

export default function PrivacyPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-12">
        <aside className="md:col-span-3">
          <Card className="rounded-2xl sticky top-24">
            <CardContent className="py-4">
              <nav className="text-sm space-y-2">
                {SECTIONS.map(s => (
                  <a key={s.id} href={`#${s.id}`} className="block hover:underline">
                    {s.title}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <article className="md:col-span-9 space-y-8 leading-relaxed text-slate-700 dark:text-slate-300">
          <section id="info-we-collect">
            <h2 className="text-xl md:text-2xl font-semibold">Information We Collect</h2>
            <Separator className="my-3" />
            <ul className="list-disc pl-6 space-y-1">
              <li>Account data (name, email, phone, addresses)</li>
              <li>Order & payments (masked card details, UPI ref, billing)</li>
              <li>Device & usage data (cookies, IP, analytics events)</li>
              <li>Support communications and feedback</li>
            </ul>
          </section>

          <section id="how-we-use">
            <h2 className="text-xl md:text-2xl font-semibold">How We Use Information</h2>
            <Separator className="my-3" />
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and improve shopping, fulfillment, and support</li>
              <li>Fraud prevention, security, and abuse monitoring</li>
              <li>Comms: order updates, service notices, and optional marketing</li>
              <li>Legal compliance and accounting</li>
            </ul>
          </section>

          <section id="sharing">
            <h2 className="text-xl md:text-2xl font-semibold">Sharing & Disclosure</h2>
            <Separator className="my-3" />
            <p>We share limited data with service providers (payments, logistics, support). We may disclose information when required by law or to protect rights, property, or safety.</p>
          </section>

          <section id="retention">
            <h2 className="text-xl md:text-2xl font-semibold">Data Retention</h2>
            <Separator className="my-3" />
            <p>We retain data as long as needed for the purposes above and to comply with legal obligations. You may request deletion where applicable.</p>
          </section>

          <section id="your-rights">
            <h2 className="text-xl md:text-2xl font-semibold">Your Rights</h2>
            <Separator className="my-3" />
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, correct, or delete your data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent where applicable</li>
              <li>Complain to your supervisory authority</li>
            </ul>
          </section>

          <section id="security">
            <h2 className="text-xl md:text-2xl font-semibold">Security</h2>
            <Separator className="my-3" />
            <p>We employ TLS encryption, tokenized payments, and strict access controls. No method is 100% secure; please use a strong, unique password.</p>
          </section>

          <section id="children">
            <h2 className="text-xl md:text-2xl font-semibold">Children’s Privacy</h2>
            <Separator className="my-3" />
            <p>Our services are not directed to children under 13. If you believe a child provided us data, contact us to remove it.</p>
          </section>

          <section id="updates">
            <h2 className="text-xl md:text-2xl font-semibold">Policy Updates</h2>
            <Separator className="my-3" />
            <p>We may update this policy. Significant changes will be announced via the app or email.</p>
          </section>

          <section id="contact">
            <h2 className="text-xl md:text-2xl font-semibold">Contact Us</h2>
            <Separator className="my-3" />
            <p>Email: <Link href="mailto:support@bazario.com" className="text-blue-600 hover:underline">support@bazario.com</Link></p>
          </section>
        </article>
      </div>
    </main>
  )
}
