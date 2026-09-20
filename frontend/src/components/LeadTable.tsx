import type { LeadRecord } from "../lib/api";
import { ScoreBadge } from "./ScoreBadge";

interface LeadTableProps {
  leads: LeadRecord[];
  emptyMessage?: string;
}

export function LeadTable({ leads, emptyMessage }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-muted">
        <span className="text-3xl">🗂️</span>
        <p>{emptyMessage ?? "Nenhum lead processado ainda."}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_24px_-12px_rgba(0,0,0,0.6)]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Motivo</th>
            <th className="px-4 py-3">Despachado</th>
            <th className="px-4 py-3">Recebido em</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr
              key={lead.id}
              className="animate-fade-in-up border-b border-border text-sm last:border-b-0 transition-colors hover:bg-surface-hover"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-text">{lead.name}</div>
                <div className="text-muted">{lead.email}</div>
              </td>
              <td className="px-4 py-3 text-muted">{lead.company ?? "—"}</td>
              <td className="px-4 py-3">
                <ScoreBadge score={lead.score} />
              </td>
              <td className="max-w-xs px-4 py-3 text-muted">{lead.reasoning}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${lead.dispatched ? "text-success" : "text-faint"}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${lead.dispatched ? "bg-success" : "bg-faint"}`}
                    aria-hidden="true"
                  />
                  {lead.dispatched ? "sim" : "não"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(lead.created_at).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
