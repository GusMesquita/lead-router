/** O que a API devolve em GET /leads e GET /leads/{id} (app/models.py). */
export interface LeadRecord {
  id: string
  name: string
  email: string
  company: string | null
  status: "pending" | "done" | "failed"
  score: number | null
  reasoning: string | null
  dispatched: boolean
  error: string | null
  created_at: string
  updated_at: string
}

export type Tier = "quente" | "morno" | "frio"
export type TierFilter = "all" | Tier | "pendente"

/**
 * Faixas só de apresentação, com os mesmos cortes do dashboard antigo. Não
 * refletem MIN_SCORE_TO_DISPATCH: o web não recebe esse corte da API. Se o lead
 * saiu ou não, quem diz é `dispatched`.
 */
export function tierFor(score: number): Tier {
  if (score >= 70) return "quente"
  if (score >= 40) return "morno"
  return "frio"
}

/** `pending` e `failed` não têm faixa: o lead ainda não foi pontuado. */
export function tierOf(lead: LeadRecord): Tier | null {
  return lead.score === null ? null : tierFor(lead.score)
}

export function countByTier(
  leads: LeadRecord[]
): Record<Tier | "pendente", number> {
  const counts = { quente: 0, morno: 0, frio: 0, pendente: 0 }
  for (const lead of leads) {
    const tier = tierOf(lead)
    if (tier === null) counts.pendente += 1
    else counts[tier] += 1
  }
  return counts
}

export function filterByTier(
  leads: LeadRecord[],
  filter: TierFilter
): LeadRecord[] {
  if (filter === "all") return leads
  if (filter === "pendente")
    return leads.filter((lead) => tierOf(lead) === null)
  return leads.filter((lead) => tierOf(lead) === filter)
}

export interface LeadSummary {
  total: number
  pending: number
  done: number
  failed: number
  tiers: Record<Tier, number>
  /** Média só dos leads pontuados; `null` quando nenhum foi. */
  averageScore: number | null
  /** Webhook respondeu 2xx. */
  dispatched: number
  /** `done` e não despachado com `error`: a entrega falhou (não há retry). */
  deliveryFailed: number
  /** `done` e não despachado sem `error`: sem destino ou abaixo do corte. */
  notDispatched: number
}

/** Números do dashboard, calculados só do que GET /leads devolve. */
export function summarize(leads: LeadRecord[]): LeadSummary {
  const summary: LeadSummary = {
    total: leads.length,
    pending: 0,
    done: 0,
    failed: 0,
    tiers: { quente: 0, morno: 0, frio: 0 },
    averageScore: null,
    dispatched: 0,
    deliveryFailed: 0,
    notDispatched: 0,
  }
  let scoreSum = 0
  let scored = 0
  for (const lead of leads) {
    summary[lead.status] += 1
    const tier = tierOf(lead)
    if (tier !== null) {
      summary.tiers[tier] += 1
      scoreSum += lead.score as number
      scored += 1
    }
    if (lead.status !== "done") continue
    if (lead.dispatched) summary.dispatched += 1
    else if (lead.error) summary.deliveryFailed += 1
    else summary.notDispatched += 1
  }
  if (scored > 0) summary.averageScore = Math.round(scoreSum / scored)
  return summary
}
