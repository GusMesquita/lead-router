import { useEffect, useMemo, useState } from "react";
import { LeadTable } from "./components/LeadTable";
import { SkeletonRows } from "./components/SkeletonRows";
import { StatFilterBar } from "./components/StatFilterBar";
import { type LeadRecord, fetchLeads } from "./lib/api";
import { countByTier, filterByTier, type TierFilter } from "./lib/leadStats";

function App() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TierFilter>("all");

  useEffect(() => {
    fetchLeads()
      .then(setLeads)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => countByTier(leads), [leads]);
  const visibleLeads = useMemo(() => filterByTier(leads, filter), [leads, filter]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-1 border-b border-border/60 bg-bg/80 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent">
          lead-router
        </h1>
        <p className="text-sm text-muted">Leads processados, pontuados e roteados por IA.</p>
      </header>

      {error && (
        <p className="rounded-2xl border border-danger/40 bg-surface-raised px-4 py-3 text-sm text-danger">
          Falha ao carregar leads: {error}. Verifique VITE_API_URL em .env.
        </p>
      )}

      {loading ? (
        <SkeletonRows />
      ) : (
        !error && (
          <>
            <StatFilterBar total={leads.length} counts={counts} active={filter} onChange={setFilter} />
            <LeadTable
              leads={visibleLeads}
              emptyMessage={
                filter === "all" ? "Nenhum lead processado ainda." : "Nenhum lead nessa faixa de score."
              }
            />
          </>
        )
      )}
    </main>
  );
}

export default App;
