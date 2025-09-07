import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

const UPDATED = "September 7, 2025"

export const metadata = {
  title: "Cookies Policy • Bazario",
  description: "How Bazario uses cookies and how you can control them.",
}

export default function CookiesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Cookies Policy</h1>
        <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-12">
        <aside className="md:col-span-4">
          <Card className="rounded-2xl sticky top-24">
            <CardContent className="py-4 space-y-2 text-sm">
              <a href="#what" className="block hover:underline">What are cookies</a>
              <a href="#how-we-use" className="block hover:underline">How we use cookies</a>
              <a href="#types" className="block hover:underline">Types of cookies</a>
              <a href="#manage" className="block hover:underline">Manage preferences</a>
              <a href="#updates" className="block hover:underline">Updates</a>
            </CardContent>
          </Card>
        </aside>

        <article className="md:col-span-8 space-y-8 leading-relaxed text-slate-700 dark:text-slate-300">
          <section id="what">
            <h2 className="text-xl md:text-2xl font-semibold">What are cookies</h2>
            <Separator className="my-3" />
            <p>Cookies are small text files stored on your device that help websites function, remember preferences, and analyze usage.</p>
          </section>

          <section id="how-we-use">
            <h2 className="text-xl md:text-2xl font-semibold">How we use cookies</h2>
            <Separator className="my-3" />
            <ul className="list-disc pl-6 space-y-1">
              <li>Essential: authentication, security, load balancing</li>
              <li>Functional: remember preferences like theme and language</li>
              <li>Analytics: understand usage to improve the app</li>
              <li>Marketing: show relevant offers (where applicable)</li>
            </ul>
          </section>

          <section id="types">
            <h2 className="text-xl md:text-2xl font-semibold">Types of cookies we use</h2>
            <Separator className="my-3" />
            <p>First-party (set by Bazario) and third-party (set by partners). Session cookies expire when you close the browser; persistent cookies last longer.</p>
          </section>

          <section id="manage">
            <h2 className="text-xl md:text-2xl font-semibold">Manage your preferences</h2>
            <Separator className="my-3" />
            <p>You can control cookies in your browser settings. You can also adjust preferences here:</p>
            <p className="mt-2">
              <Link href="/cookies/preferences" className="text-blue-600 hover:underline">
                Open cookie preferences
              </Link>{" "}
              <span className="text-xs text-slate-500">(Coming soon)</span>
            </p>
          </section>

          <section id="updates">
            <h2 className="text-xl md:text-2xl font-semibold">Updates</h2>
            <Separator className="my-3" />
            <p>We may update this policy. Check this page for the latest version.</p>
          </section>
        </article>
      </section>
    </main>
  )
}
