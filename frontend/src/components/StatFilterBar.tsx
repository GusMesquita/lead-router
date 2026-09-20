import type { Tier, TierFilter } from "../lib/leadStats";

interface StatFilterBarProps {
  total: number;
  counts: Record<Tier, number>;
  active: TierFilter;
  onChange: (filter: TierFilter) => void;
}

const TIERS: { key: Tier; label: string; textClass: string; ringClass: string }[] = [
  { key: "quente", label: "Quentes", textClass: "text-success", ringClass: "ring-success/50" },
  { key: "morno", label: "Mornos", textClass: "text-warning", ringClass: "ring-warning/50" },
  { key: "frio", label: "Frios", textClass: "text-danger", ringClass: "ring-danger/50" },
];

const cardBase =
  "flex flex-1 min-w-[7rem] flex-col items-start gap-1 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-all duration-150 hover:border-border-strong hover:bg-surface-hover cursor-pointer";

export function StatFilterBar({ total, counts, active, onChange }: StatFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3" role="tablist" aria-label="Filtrar leads por temperatura">
      <button
        type="button"
        role="tab"
        aria-selected={active === "all"}
        onClick={() => onChange("all")}
        className={`${cardBase} ${active === "all" ? "border-primary ring-1 ring-primary/50" : ""}`}
      >
        <span className="text-2xl font-semibold text-text">{total}</span>
        <span className="text-xs uppercase tracking-wide text-muted">Todos</span>
      </button>
      {TIERS.map((tier) => (
        <button
          key={tier.key}
          type="button"
          role="tab"
          aria-selected={active === tier.key}
          onClick={() => onChange(active === tier.key ? "all" : tier.key)}
          className={`${cardBase} ${active === tier.key ? `border-transparent ring-1 ${tier.ringClass}` : ""}`}
        >
          <span className={`text-2xl font-semibold ${tier.textClass}`}>{counts[tier.key]}</span>
          <span className="text-xs uppercase tracking-wide text-muted">{tier.label}</span>
        </button>
      ))}
    </div>
  );
}
