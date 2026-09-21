import Link from "next/link"

import { LeadsPanel } from "@/components/leads/leads-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchLeads } from "@/lib/lead-api"
import type { LeadRecord } from "@/lib/leads"

// Server Component: o fetch e a chave ficam no servidor. Nenhum Route Handler
// no meio — ele só existiria para repassar a mesma chamada.
export default async function Page() {
  let leads: LeadRecord[] = []
  let falha: string | null = null

  try {
    leads = await fetchLeads()
  } catch (erro) {
    // API fora do ar é o caso comum em dev; derrubar a página inteira por isso
    // esconde justamente a instrução de como subir a API.
    falha = erro instanceof Error ? erro.message : "erro desconhecido"
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">lead-router</h1>
          <p className="text-muted-foreground text-sm">
            Ingestão, enriquecimento e pontuação de leads.
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/design-system" />}>
          Design system
        </Button>
      </header>

      {falha ? (
        <Card>
          <CardHeader>
            <CardTitle>Sem resposta da API</CardTitle>
            <CardDescription>{falha}</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Suba a pilha com <code>docker compose up</code> na raiz do
            repositório, ou aponte <code>LEAD_ROUTER_URL</code> para uma
            instância existente.
          </CardContent>
        </Card>
      ) : (
        <LeadsPanel leads={leads} />
      )}
    </main>
  )
}
