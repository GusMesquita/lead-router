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

/** Mesmos cortes do dashboard antigo; 60 é o piso de MIN_SCORE_TO_DISPATCH. */
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
  if (filter === "pendente") return leads.filter((lead) => tierOf(lead) === null)
  return leads.filter((lead) => tierOf(lead) === filter)
}
