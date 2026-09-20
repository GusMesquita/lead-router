import type { LeadRecord } from "./api";
import { tierFor } from "./scoreTier";

export type Tier = "quente" | "morno" | "frio";
export type TierFilter = "all" | Tier;

export function countByTier(leads: LeadRecord[]): Record<Tier, number> {
  const counts: Record<Tier, number> = { quente: 0, morno: 0, frio: 0 };
  for (const lead of leads) {
    counts[tierFor(lead.score).label as Tier] += 1;
  }
  return counts;
}

export function filterByTier(leads: LeadRecord[], filter: TierFilter): LeadRecord[] {
  if (filter === "all") return leads;
  return leads.filter((lead) => tierFor(lead.score).label === filter);
}
