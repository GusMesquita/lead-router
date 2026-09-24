import { describe, expect, it } from "vitest"

import {
  countByTier,
  filterByTier,
  summarize,
  tierFor,
  type LeadRecord,
} from "./leads"

function lead(id: string, score: number | null): LeadRecord {
  return {
    id,
    name: `Lead ${id}`,
    email: `${id}@exemplo.com`,
    company: null,
    status: score === null ? "pending" : "done",
    score,
    reasoning: null,
    dispatched: false,
    error: null,
    created_at: "2026-09-21T00:00:00",
    updated_at: "2026-09-21T00:00:00",
  }
}

describe("tierFor", () => {
  it.each([
    [100, "quente"],
    [70, "quente"],
    [69, "morno"],
    [40, "morno"],
    [39, "frio"],
    [0, "frio"],
  ])("pontuação %i é %s", (score, esperado) => {
    expect(tierFor(score as number)).toBe(esperado)
  })
})

describe("lead sem pontuação", () => {
  const leads = [lead("a", 80), lead("b", 50), lead("c", null), lead("d", null)]

  it("não entra em nenhuma faixa — o worker ainda não pontuou", () => {
    // Antes da Fatia 4 todo lead chegava pontuado. Tratar `null` como 0 poria
    // um lead pendente na faixa "frio", que é uma afirmação que ninguém fez.
    expect(countByTier(leads)).toEqual({
      quente: 1,
      morno: 1,
      frio: 0,
      pendente: 2,
    })
  })

  it("é filtrável à parte", () => {
    expect(filterByTier(leads, "pendente").map((l) => l.id)).toEqual(["c", "d"])
    expect(filterByTier(leads, "frio")).toEqual([])
    expect(filterByTier(leads, "all")).toHaveLength(4)
  })
})

describe("summarize", () => {
  it("lista vazia não inventa média", () => {
    const resumo = summarize([])
    expect(resumo.total).toBe(0)
    expect(resumo.averageScore).toBeNull()
  })

  it("separa status, faixas e resultado da entrega", () => {
    const falhou: LeadRecord = {
      ...lead("f", null),
      status: "failed",
      error: "ScoringError",
    }
    const entregue: LeadRecord = { ...lead("e", 90), dispatched: true }
    const entregaFalhou: LeadRecord = {
      ...lead("x", 75),
      error: "HTTPStatusError",
    }
    const resumo = summarize([
      lead("a", 50),
      lead("p", null),
      falhou,
      entregue,
      entregaFalhou,
    ])

    expect(resumo).toMatchObject({ total: 5, pending: 1, done: 3, failed: 1 })
    expect(resumo.tiers).toEqual({ quente: 2, morno: 1, frio: 0 })
    // Pendente e falho ficam fora da média: (50 + 90 + 75) / 3.
    expect(resumo.averageScore).toBe(72)
    expect(resumo).toMatchObject({
      dispatched: 1,
      deliveryFailed: 1,
      notDispatched: 1,
    })
  })
})
