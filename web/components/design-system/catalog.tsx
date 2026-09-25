import type { ReactNode } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Peças de layout do /design-system. Nada aqui é componente de produto.

export interface CatalogSectionInfo {
  id: string
  title: string
  description: string
}

export function CatalogNav({ sections }: { sections: CatalogSectionInfo[] }) {
  return (
    <nav aria-label="Seções do catálogo">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-md px-2 py-1 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function CatalogSection({
  section,
  children,
}: {
  section: CatalogSectionInfo
  children: ReactNode
}) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="flex scroll-mt-6 flex-col gap-4 border-t pt-8 first:border-t-0 first:pt-0"
    >
      <header>
        <h2
          id={`${section.id}-title`}
          className="font-heading text-xl font-semibold"
        >
          {section.title}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {section.description}
        </p>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">{children}</div>
    </section>
  )
}

/**
 * Um componente no catálogo. `source` é o caminho do import (fato verificável
 * no repositório); `baseUi` marca os que envolvem uma primitiva @base-ui/react.
 */
export function Preview({
  name,
  source,
  description,
  baseUi = false,
  wide = false,
  className,
  children,
}: {
  name: string
  source: string
  description?: string
  baseUi?: boolean
  wide?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card",
        wide && "xl:col-span-2"
      )}
    >
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <h3 className="font-medium">{name}</h3>
        <code className="text-xs text-muted-foreground">{source}</code>
        {baseUi && <Badge variant="outline">Base UI</Badge>}
        {description && (
          <p className="w-full text-xs text-muted-foreground">{description}</p>
        )}
      </header>
      <div
        className={cn(
          "flex flex-1 flex-wrap items-center gap-3 bg-muted/30 p-6",
          className
        )}
      >
        {children}
      </div>
    </article>
  )
}

/** Variante/estado rotulado dentro de um preview. */
export function Specimen({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {children}
      <span className="font-mono text-[11px] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

/** Card para o que vive numa rota própria em vez de ser montado aqui. */
export function RouteCard({
  href,
  name,
  category,
  description,
  components,
}: {
  href: string
  name: string
  category: string
  description: string
  components: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{name}</span>
        <Badge variant="secondary">{category}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <code className="text-xs text-muted-foreground">{components}</code>
      <span className="text-sm font-medium">Abrir {href} →</span>
    </Link>
  )
}
