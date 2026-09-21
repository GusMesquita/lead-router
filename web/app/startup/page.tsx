"use client"

import { Toaster } from "@/components/ui/sonner"
import Features from "@/components/startup/features"
import Footer from "@/components/startup/footer"
import Header from "@/components/startup/header"
import Hero from "@/components/startup/hero"
import HowItWorks from "@/components/startup/how-it-works"
import Newsletter from "@/components/startup/newsletter"
import Stats from "@/components/startup/stats"
import Testimonials from "@/components/startup/testimonials"

/**
 * Page wash. A background paints only inside its own box, so the fixed-height
 * band this replaces sliced every pool whose falloff reached past its edge into
 * a straight line mid-page, and left the rest of the scroll flat. `inset-0`
 * removes both problems at once. Each pool also eases through a half-alpha stop
 * on its way to zero: a two-stop fade ramps linearly, which the eye reads as the
 * flat edge of a disc rather than as light.
 *
 * Inline `backgroundImage` rather than `bg-[…]` — Tailwind only sees class
 * names it can read literally, and at this length one string per theme is
 * unreadable anyway. The layers swap on `dark:`.
 */
const pool = (size: string, color: string, mid: string, out: string) =>
  `radial-gradient(${size}, ${color}, ${mid} 38%, ${out} 78%)`

const wash = (base: string, a: number, b: number) => {
  const at = (v: number) => `rgba(${base},${v})`
  return [
    pool("38% 13% at 84% 9%", at(a), at(a / 2), at(0)),
    pool("42% 13% at 12% 28%", at(b), at(b / 2), at(0)),
    pool("40% 12% at 70% 47%", at(a), at(a / 2), at(0)),
    pool("42% 12% at 14% 66%", at(b), at(b / 2), at(0)),
    pool("40% 13% at 74% 87%", at(a), at(a / 2), at(0)),
  ].join(",")
}

const WASH_LIGHT = wash("0,0,0", 0.04, 0.034)
const WASH_DARK = wash("255,255,255", 0.06, 0.051)

export default function StartupTemplate() {
  return (
    <div className="relative isolate flex min-h-svh w-full flex-col bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-180 bg-[radial-gradient(65%_60%_at_50%_-8%,rgba(0,0,0,0.06),transparent_72%)] dark:bg-[radial-gradient(65%_60%_at_50%_-8%,rgba(255,255,255,0.13),transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 dark:hidden"
        style={{ backgroundImage: WASH_LIGHT }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{ backgroundImage: WASH_DARK }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-140 bg-[radial-gradient(55%_50%_at_50%_100%,rgba(0,0,0,0.05),transparent_70%)] dark:bg-[radial-gradient(55%_50%_at_50%_100%,rgba(255,255,255,0.08),transparent_70%)]"
      />
      <Toaster />
      <Header />
      <main className="flex w-full flex-col">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Newsletter />
      </main>
      <div className="border-t border-border/50">
        <Footer />
      </div>
    </div>
  )
}
