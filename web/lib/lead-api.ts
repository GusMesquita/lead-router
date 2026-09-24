// `server-only` quebra o build se este módulo for importado de um Client
// Component. É a única garantia que não depende de disciplina: a chave sai de
// process.env, e process.env sem prefixo NEXT_PUBLIC_ não existe no browser —
// mas um import distraído num arquivo "use client" é o que transforma isso em
// vazamento. Aqui vira erro de build, não achado de pentest.
import "server-only"

import type { LeadRecord } from "./leads"

const BASE_URL = process.env.LEAD_ROUTER_URL ?? "http://localhost:8000"

/** O máximo que GET /leads aceita por página (app/main.py). */
export const LEADS_WINDOW = 200

export class LeadApiError extends Error {
  constructor(readonly status: number) {
    super(`a API respondeu ${status}`)
  }
}

export async function fetchLeads(
  limit = 50,
  offset = 0
): Promise<LeadRecord[]> {
  const key = process.env.LEAD_ROUTER_API_KEY

  const response = await fetch(
    `${BASE_URL}/leads?limit=${limit}&offset=${offset}`,
    {
      headers: key ? { "X-API-Key": key } : {},
      // Leads mudam de `pending` para `done` fora do nosso controle: cachear
      // esta resposta mostraria um lead eternamente pendente.
      cache: "no-store",
      // Uma API pendurada vira o card de erro, não uma página que nunca carrega.
      signal: AbortSignal.timeout(5000),
    }
  )

  if (!response.ok) throw new LeadApiError(response.status)
  return (await response.json()) as LeadRecord[]
}
