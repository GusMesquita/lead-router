import { describe, expect, it } from "vitest"

import { countByTier, filterByTier, tierFor, type LeadRecord } from "./leads"

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
