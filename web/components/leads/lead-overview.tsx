import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { LeadSummary, Tier } from "@/lib/leads"

const TIERS: { tier: Tier; label: string; hint: string }[] = [
  { tier: "quente", label: "Quentes", hint: "70 ou mais" },
  { tier: "morno", label: "Mornos", hint: "40 a 69" },
  { tier: "frio", label: "Frios", hint: "abaixo de 40" },
]

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-3xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {hint}
      </CardContent>
    </Card>
  )
}

// Números da janela carregada (os leads mais recentes), não do banco inteiro:
// GET /leads não devolve total nem agrega por status.
export function LeadOverview({ summary }: { summary: LeadSummary }) {
  const scored = summary.tiers.quente + summary.tiers.morno + summary.tiers.frio

  return (
    <>
      <section
        aria-label="Estado do processamento"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <Stat label="Leads" value={summary.total} hint="recebidos na janela" />
        <Stat
          label="Aguardando"
          value={summary.pending}
          hint="na fila do worker, sem pontuação"
        />
        <Stat
          label="Concluídos"
          value={summary.done}
          hint="pontuados pelo modelo"
        />
        <Stat
          label="Falharam"
          value={summary.failed}
          hint="sem pontuação; sem reprocessamento"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Qualificação</CardTitle>
            <CardDescription>
              {summary.averageScore === null
                ? "Nenhum lead pontuado ainda."
                : `Pontuação média ${summary.averageScore} entre ${scored} pontuados.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {TIERS.map(({ tier, label, hint }) => (
              <Progress
                key={tier}
                value={scored === 0 ? 0 : (summary.tiers[tier] / scored) * 100}
              >
                <ProgressLabel>
                  {label}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({hint})
                  </span>
                </ProgressLabel>
                {/* Contagem, não o percentual que o ProgressValue formataria. */}
                <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                  {summary.tiers[tier]}
                </span>
              </Progress>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrega</CardTitle>
            <CardDescription>
              Webhook de saída dos {summary.done} leads concluídos. Entrega
              falha não é retentada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-4">
              {[
                ["Despachados", summary.dispatched, "o destino respondeu 2xx"],
                [
                  "Não despachados",
                  summary.notDispatched,
                  "sem destino ou abaixo do corte",
                ],
                ["Entrega falhou", summary.deliveryFailed, "reenvio é manual"],
              ].map(([label, value, hint]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-heading text-2xl font-semibold tabular-nums">
                    {value}
                  </dd>
                  <dd className="text-xs text-muted-foreground">{hint}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function LeadOverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando leads" className="contents">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
