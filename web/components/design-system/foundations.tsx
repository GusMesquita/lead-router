import { Preview } from "@/components/design-system/catalog"

// Tokens definidos em app/globals.css (`:root` e `.dark`).
const COLORS = [
  "background",
  "foreground",
  "card",
  "primary",
  "primary-foreground",
  "secondary",
  "muted",
  "muted-foreground",
  "accent",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-primary",
]

const BJORK = [
  "bjork-bg",
  "bjork-surface",
  "bjork-text",
  "bjork-accent",
  "bjork-border",
]

const RADII = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex w-24 flex-col gap-1.5">
      <div
        className="h-12 rounded-md border"
        style={{ background: `var(--${token})` }}
      />
      <code className="text-[11px] text-muted-foreground">--{token}</code>
    </div>
  )
}

export function Foundations() {
  return (
    <>
      <Preview
        name="Cores"
        source="app/globals.css"
        description="Tokens neutros do tema; o modo escuro troca os valores, não os nomes."
        wide
      >
        {COLORS.map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </Preview>
      <Preview
        name="Tokens bjork"
        source="app/globals.css"
        description="Paleta usada pelas tabelas de components/bjork-ui."
      >
        {BJORK.map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </Preview>
      <Preview
        name="Raio"
        source="app/globals.css"
        description="Escala derivada de --radius (0.625rem)."
      >
        {RADII.map((radius) => (
          <div key={radius} className="flex flex-col items-center gap-1.5">
            <div
              className="size-12 bg-primary"
              style={{ borderRadius: `var(--radius-${radius})` }}
            />
            <code className="text-[11px] text-muted-foreground">{radius}</code>
          </div>
        ))}
      </Preview>
      <Preview
        name="Tipografia"
        source="app/layout.tsx"
        description="next/font carrega Noto Sans (--font-heading), Inter (--font-sans) e Geist Mono (--font-mono)."
        wide
        className="flex-col flex-nowrap items-start"
      >
        <p className="font-heading text-3xl font-semibold">
          Título em Noto Sans
        </p>
        <p className="font-heading text-xl font-semibold">Subtítulo</p>
        <p className="text-base">
          Corpo em Inter: leads chegam, são enriquecidos e pontuados.
        </p>
        <p className="text-sm text-muted-foreground">Texto de apoio, muted.</p>
        <p className="font-mono text-sm">
          font-mono · POST /leads/ingest → 202
        </p>
      </Preview>
    </>
  )
}
