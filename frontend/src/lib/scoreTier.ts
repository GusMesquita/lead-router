export interface ScoreTier {
  label: "quente" | "morno" | "frio";
  dotClass: string;
  textClass: string;
  bgClass: string;
}

export function tierFor(score: number): ScoreTier {
  if (score >= 70) {
    return { label: "quente", dotClass: "bg-success", textClass: "text-success", bgClass: "bg-success/15" };
  }
  if (score >= 40) {
    return { label: "morno", dotClass: "bg-warning", textClass: "text-warning", bgClass: "bg-warning/15" };
  }
  return { label: "frio", dotClass: "bg-danger", textClass: "text-danger", bgClass: "bg-danger/15" };
}
