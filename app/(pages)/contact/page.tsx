/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type FormState = {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export default function ContactPage() {
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // quick client-side checks
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    if (!emailOk) {
      toast.error("Please enter a valid email.")
      return
    }

    setPending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed to send message")

      toast.success("Message sent!", { description: "We’ll get back to you within 24 hours." })
      setForm({ name: "", email: "", phone: "", subject: "", message: "" })
    } catch (e: any) {
      toast.error("Could not send", { description: e?.message ?? "Please try again." })
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero */}
      <section className="grid gap-6 md:grid-cols-2 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Questions, feedback, or partnership ideas? We’d love to hear from you.
          </p>
        </div>
        <div className="relative h-40 md:h-48">
          <Image
            src="/Images/Contact_Illustration.png"
            alt="Contact illustration"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-5">
        {/* Left: contact details (responsive cards) */}
        <div className="md:col-span-2 space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle>Talk to us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <Link href="mailto:support@bazario.com" className="text-blue-600 hover:underline">
                    support@bazario.com
                  </Link>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-slate-600 dark:text-slate-300">+91 98765 43210</p>
                  <p className="text-xs text-slate-500">Mon–Fri, 9:00–18:00 IST</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    221B, Park Street, Bengaluru, KA 560001  
                    {/* This Address is for Testing */}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Support Hours</p>
                  <p className="text-slate-600 dark:text-slate-300">Mon–Fri: 9am–6pm • Sat: 10am–3pm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Find us</CardTitle>
            </CardHeader>
            <div className="rounded-b-2xl overflow-hidden">
              <iframe
                title="Bazario location"
                className="w-full h-56 md:h-64"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Bengaluru&output=embed"
              />
            </div>
          </Card>
        </div>

        {/* Right: form */}
        <div className="md:col-span-3">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle>Send a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name *</label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email *</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject *</label>
                    <Input
                      id="subject"
                      placeholder="I have a question about…"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Message *</label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more…"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">We typically respond within 24 hours.</p>
                  <Button type="submit" className="rounded-xl" disabled={pending} aria-busy={pending}>
                    {pending ? "Sending…" : "Send"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
