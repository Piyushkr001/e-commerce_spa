/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/config/db"
import { contactMessages } from "@/config/schema"
import { Resend } from "resend"
import nodemailer from "nodemailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().optional().nullable(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5),
})

function sanitize(s: string) {
  return String(s ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim()
}
function escapeHtml(s: string) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

/** ------- Env wiring (works with your .env as-is) ------- */
const RESEND_API_KEY = process.env.RESEND_API_KEY || ""
const RESEND_FROM = process.env.RESEND_FROM || "" // e.g. 'Bazario <noreply@yourdomain.com>' (verified in Resend)

const SMTP_HOST = process.env.SMTP_HOST || ""
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER || "" // receiver & auth user for Gmail
const SMTP_PASS = process.env.SMTP_PASS || ""
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER // sender when using SMTP

// Who receives contact notifications:
const CONTACT_TO =
  process.env.CONTACT_TO || // if you set it explicitly
  SMTP_FROM ||              // otherwise send to your from-address
  SMTP_USER                 // or to the SMTP user as a fallback

// Prefer Resend only when we have a proper from (non-Gmail) & API key
const looksLikeGmail = (addr: string) => /@gmail\.com$/i.test(addr || "")
const canUseResend = Boolean(RESEND_API_KEY && RESEND_FROM && !looksLikeGmail(RESEND_FROM))

const resend = canUseResend ? new Resend(RESEND_API_KEY) : null

/** ------- SMTP transporter (fallback / default for your env) ------- */
const smtpTransport =
  !canUseResend && SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues?.[0]
      return NextResponse.json({ ok: false, error: first?.message || "Invalid input" }, { status: 422 })
    }

    const { name, email, phone, subject, message } = parsed.data

    // 1) Store in DB
    const [row] = await db
      .insert(contactMessages)
      .values({
        name: sanitize(name),
        email: sanitize(email),
        phone: phone ? sanitize(phone) : null,
        subject: sanitize(subject),
        message: sanitize(message),
        status: "new",
      })
      .returning()

    // 2) Build mail content
    const html = `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto;">
        <h2>New contact message</h2>
        <p><b>Subject:</b> ${escapeHtml(subject)}</p>
        <p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        ${phone ? `<p><b>Phone:</b> ${escapeHtml(phone)}</p>` : ""}
        <p style="white-space:pre-wrap;margin-top:16px">${escapeHtml(message)}</p>
        <hr />
        <p style="color:#94a3b8">Message ID: ${row.id}</p>
      </div>
    `.trim()

    const text = [
      `New contact message`,
      `Subject: ${subject}`,
      `From: ${name} <${email}>`,
      ...(phone ? [`Phone: ${phone}`] : []),
      ``,
      message,
      ``,
      `Message ID: ${row.id}`,
    ].join("\n")

    // 3) Send email via Resend or SMTP
    if (resend) {
      // Resend path (requires verified domain sender)
      await resend.emails.send({
        from: RESEND_FROM,     // e.g. "Bazario <noreply@yourdomain.com>"
        to: [CONTACT_TO],      // who receives it
        subject: `Contact: ${subject}`,
        html,
        text,
        replyTo: email,
        headers: { "X-Contact-Id": String(row.id) },
      })
    } else if (smtpTransport) {
      // SMTP path (your current env will use this)
      await smtpTransport.sendMail({
        from: SMTP_FROM,       // Gmail from (matches your SMTP account)
        to: CONTACT_TO,
        subject: `Contact: ${subject}`,
        html,
        text,
        replyTo: email,
        headers: { "X-Contact-Id": String(row.id) },
      })
    } else {
      console.warn("[CONTACT] No email provider configured; message saved only.")
    }

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (e: any) {
    console.error("[CONTACT] error", e)
    return NextResponse.json({ ok: false, error: e?.message || "Bad Request" }, { status: 400 })
  }
}
