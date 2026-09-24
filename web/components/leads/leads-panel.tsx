"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowClockwiseIcon } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  countByTier,
  filterByTier,
  tierOf,
  type LeadRecord,
  type Tier,
  type TierFilter,
} from "@/lib/leads"

const TIER_VARIANT: Record<Tier, "default" | "secondary" | "outline"> = {
  quente: "default",
  morno: "secondary",
  frio: "outline",
}

function ScoreCell({ lead }: { lead: LeadRecord }) {
  const tier = tierOf(lead)

  if (tier === null) {
    // Nunca mostrar 0: `score` nulo quer dizer "ainda não pontuado", e um zero
    // na tela é indistinguível de um lead avaliado como péssimo.
    return (
      <Badge variant={lead.status === "failed" ? "destructive" : "ghost"}>
        {lead.status === "failed" ? (lead.error ?? "falhou") : "pendente"}
      </Badge>
    )
  }

  const badge = (
    <Badge variant={TIER_VARIANT[tier]}>
      {lead.score} · {tier}
    </Badge>
  )

  if (!lead.reasoning) return badge

  return (
    <Tooltip>
      <TooltipTrigger render={badge} />
      <TooltipContent className="max-w-xs">{lead.reasoning}</TooltipContent>
    </Tooltip>
  )
}

function DispatchCell({ lead }: { lead: LeadRecord }) {
  if (lead.status !== "done")
    return <span className="text-muted-foreground">—</span>
  if (lead.dispatched) return "sim"
  // Num lead `done`, `error` só pode ser da entrega (o worker não retenta).
  if (lead.error) return <Badge variant="destructive">entrega falhou</Badge>
  return "não"
}

export function LeadsPanel({ leads }: { leads: LeadRecord[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<TierFilter>("all")
  const counts = countByTier(leads)
  // Só `pending` ainda vai mudar; `failed` também não tem pontuação, mas não
  // sai desse estado — contá-lo aqui mantinha o polling ligado para sempre.
  const pendentes = leads.filter((lead) => lead.status === "pending").length

  // O lead chega `pending` e vira `done` num worker, fora desta aba. Sem isto a
  // página mentiria até alguém apertar F5 — e só enquanto há o que esperar.
  useEffect(() => {
    if (pendentes === 0) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [pendentes, router])

  const visiveis = filterByTier(leads, filter)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads recentes</CardTitle>
        <CardDescription>
          {leads.length} recebidos · {counts.quente} quentes
          {pendentes > 0 ? ` · ${pendentes} aguardando pontuação` : ""}
        </CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            aria-label="Atualizar lista"
          >
            <ArrowClockwiseIcon />
            Atualizar
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ToggleGroup
          value={[filter]}
          onValueChange={(value) =>
            setFilter((value[0] as TierFilter) ?? "all")
          }
          aria-label="Filtrar por faixa"
          className="w-fit"
        >
          <ToggleGroupItem value="all">Todos ({leads.length})</ToggleGroupItem>
          <ToggleGroupItem value="quente">
            Quentes ({counts.quente})
          </ToggleGroupItem>
          <ToggleGroupItem value="morno">
            Mornos ({counts.morno})
          </ToggleGroupItem>
          <ToggleGroupItem value="frio">Frios ({counts.frio})</ToggleGroupItem>
          <ToggleGroupItem value="pendente">
            Sem pontuação ({counts.pendente})
          </ToggleGroupItem>
        </ToggleGroup>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Pontuação</TableHead>
              <TableHead>Despachado</TableHead>
              <TableHead>Recebido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.email}
                </TableCell>
                <TableCell>{lead.company ?? "—"}</TableCell>
                <TableCell>
                  <ScoreCell lead={lead} />
                </TableCell>
                <TableCell>
                  <DispatchCell lead={lead} />
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {new Date(lead.created_at).toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
            {visiveis.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum lead nesta faixa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
