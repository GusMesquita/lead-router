import { Suspense } from "react"

import {
  LeadOverview,
  LeadOverviewSkeleton,
} from "@/components/leads/lead-overview"
import { LeadsPanel } from "@/components/leads/leads-panel"
import { ProductShell } from "@/components/leads/product-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchLeads, LeadApiError, LEADS_WINDOW } from "@/lib/lead-api"
import { summarize, type LeadRecord } from "@/lib/leads"
// Importado da registry, não de uma cópia: assim um item quebrado derruba o
// build deste app antes de chegar a quem faz `shadcn add @gmui/api-error-card`.
import { ApiErrorCard } from "@/registry/gmui/api-error-card"

// Server Component: o fetch e a chave ficam no servidor. Nenhum Route Handler
// no meio — ele só existiria para repassar a mesma chamada. O shell sai na
// hora; os números chegam por streaming quando a API responde.
export default function Page() {
  return (
    <ProductShell title="Visão geral">
      <Suspense fallback={<LeadOverviewSkeleton />}>
        <Dashboard />
      </Suspense>
    </ProductShell>
  )
}

async function Dashboard() {
  let leads: LeadRecord[]
  try {
    leads = await fetchLeads(LEADS_WINDOW)
  } catch (erro) {
    // API fora do ar é o caso comum em dev; derrubar a página inteira por isso
    // esconde justamente a instrução de como subir a API.
    return (
      <ApiErrorCard
        detail={erro instanceof Error ? erro.message : "erro desconhecido"}
      >
        {erro instanceof LeadApiError && erro.status === 401 ? (
          <>
            A API recusou a chave: confira se <code>LEAD_ROUTER_API_KEY</code> é
            uma das <code>API_KEYS</code> do backend.
          </>
        ) : (
          <>
            Suba a pilha com <code>docker compose up</code> na raiz do
            repositório, ou aponte <code>LEAD_ROUTER_URL</code> para uma
            instância existente.
          </>
        )}
      </ApiErrorCard>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum lead recebido ainda</CardTitle>
          <CardDescription>
            A API está no ar, mas nenhum lead chegou. Cada lead enviado para{" "}
            <code>POST /leads/ingest</code> aparece aqui como pendente e muda
            para concluído quando o worker o pontua.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
            {`curl -X POST http://localhost:8000/leads/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $API_KEY" \\
  -d '{"name": "Ana", "email": "ana@exemplo.com", "company": "Exemplo"}'`}
          </pre>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {leads.length === LEADS_WINDOW && (
        <p className="text-sm text-muted-foreground">
          Mostrando os {LEADS_WINDOW} leads mais recentes.
        </p>
      )}
      <LeadOverview summary={summarize(leads)} />
      <LeadsPanel leads={leads} />
    </>
  )
}
