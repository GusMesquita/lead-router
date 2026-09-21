import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlashlightIcon, ShieldCheckIcon, GridFourIcon, ChartBarIcon, ChartLineIcon, GearSixIcon } from "@phosphor-icons/react"

/** Props a call site may pass through to an icon. */
type IconProps = { className?: string; size?: number | string }

const features = [
  {
    icon: (p: IconProps) => (
      <FlashlightIcon {...p} />
    ),
    title: "Lightning fast",
    copy: "Ship in milliseconds with an edge-first runtime tuned for speed.",
  },
  {
    icon: (p: IconProps) => (
      <ShieldCheckIcon {...p} />
    ),
    title: "Secure by default",
    copy: "Encryption, audit logs, and granular access baked into every layer.",
  },
  {
    icon: (p: IconProps) => (
      <GridFourIcon {...p} />
    ),
    title: "Composable blocks",
    copy: "Drop in sharp, accessible components and compose them your way.",
  },
  {
    icon: (p: IconProps) => (
      <ChartBarIcon {...p} />
    ),
    title: "Real-time insights",
    copy: "Track usage and performance the moment events happen.",
  },
  {
    icon: (p: IconProps) => (
      <ChartLineIcon {...p} />
    ),
    title: "Scales with you",
    copy: "From first user to millions without re-architecting a thing.",
  },
  {
    icon: (p: IconProps) => (
      <GearSixIcon {...p} />
    ),
    title: "Fully configurable",
    copy: "Tune defaults, theming, and workflows to fit your team.",
  },
]

export default function Features() {
  return (
    <section className="flex w-full items-center justify-center px-6 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4 tracking-widest uppercase">
            Features
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Everything you need to build
          </h2>
          <p className="mt-4 text-muted-foreground">
            A focused toolkit that gets out of your way so you can move fast.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="p-6">
              <CardHeader className="p-0">
                <span className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="mt-4 text-base font-semibold">
                  {title}
                </CardTitle>
                <CardDescription className="mt-2 text-sm">
                  {copy}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
