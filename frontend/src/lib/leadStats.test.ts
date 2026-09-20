import { describe, expect, it } from "vitest";
import type { LeadRecord } from "./api";
import { countByTier, filterByTier } from "./leadStats";

function lead(score: number, id: string): LeadRecord {
  return {
    id,
    name: `Lead ${id}`,
    email: `${id}@example.com`,
    company: null,
    score,
    reasoning: "",
    dispatched: false,
    created_at: new Date().toISOString(),
  };
}

const leads = [lead(90, "a"), lead(50, "b"), lead(10, "c"), lead(75, "d")];

describe("countByTier", () => {
  it("buckets leads by score tier", () => {
    expect(countByTier(leads)).toEqual({ quente: 2, morno: 1, frio: 1 });
  });
});

describe("filterByTier", () => {
  it("returns everything for 'all'", () => {
    expect(filterByTier(leads, "all")).toHaveLength(4);
  });

  it("returns only leads matching the tier", () => {
    const quentes = filterByTier(leads, "quente");
    expect(quentes.map((lead) => lead.id)).toEqual(["a", "d"]);
  });
});
