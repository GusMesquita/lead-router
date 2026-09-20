import { tierFor } from "../lib/scoreTier";

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const tier = tierFor(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tier.bgClass} ${tier.textClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tier.dotClass}`} aria-hidden="true" />
      {score} · {tier.label}
    </span>
  );
}
