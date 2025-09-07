import type { Metadata } from "next"
import { Ubuntu_Sans } from "next/font/google"
import "./globals.css"
import Navbar from "./_components/Navbar"
import Footer from "./_components/Footer"
import { ThemeProvider } from "@/components/theme-provider"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react" // 👈 add this

const ubuntu = Ubuntu_Sans({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Bazario — Shop smarter",
  description: "Modern e-commerce built with Next.js, Drizzle & Neon.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "" // public identifier is safe to serialize

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${ubuntu.className} bg-background text-foreground antialiased`}
      >
        <GoogleOAuthProvider clientId={clientId}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {/* Page shell */}
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main id="main" className="flex-1">
                {/* 👇 Global Suspense boundary */}
                <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
                  {children}
                </Suspense>
              </main>
              <Footer />
            </div>

            {/* App-wide toasts */}
            <Toaster />
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
