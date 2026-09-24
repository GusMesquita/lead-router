import type { Metadata } from "next"
import Link from "next/link"

import { Auth13, auth13Demo } from "@/components/beste/block/auth13"
import { Actions, Inputs } from "@/components/design-system/actions-inputs"
import {
  FinancialTable,
  LeadsTable,
} from "@/components/design-system/bjork-tables"
import {
  CatalogNav,
  CatalogSection,
  type CatalogSectionInfo,
  Preview,
  RouteCard,
} from "@/components/design-system/catalog"
import {
  DataDisplay,
  DataVisualization,
  Feedback,
} from "@/components/design-system/feedback-data"
import { Foundations } from "@/components/design-system/foundations"
import {
  Navigation,
  Overlays,
} from "@/components/design-system/navigation-overlays"
import { LeadOverview } from "@/components/leads/lead-overview"
import { LeadsPanel } from "@/components/leads/leads-panel"
import { Badge } from "@/components/ui/badge"
import { type LeadRecord, summarize } from "@/lib/leads"
import { ApiErrorCard } from "@/registry/gmui/api-error-card"

export const metadata: Metadata = { title: "Design system · lead-router" }

const SECTIONS = {
  overview: {
    id: "visao-geral",
    title: "Visão geral",
    description: "Como ler este catálogo.",
  },
  foundations: {
    id: "fundamentos",
    title: "Fundamentos",
    description: "Tokens de cor, raio e tipografia de app/globals.css.",
  },
  actions: {
    id: "acoes",
    title: "Ações",
    description: "Botões, toggles e atalhos de teclado.",
  },
  inputs: {
    id: "entradas",
    title: "Entradas",
    description: "Campos, seleção e composição de formulário.",
  },
  navigation: {
    id: "navegacao",
    title: "Navegação",
    description: "Trilha, abas, paleta de comandos e seções recolhíveis.",
  },
  feedback: {
    id: "feedback",
    title: "Feedback e status",
    description: "Badges, progresso, carregamento e notificações.",
  },
  overlays: {
    id: "sobreposicoes",
    title: "Sobreposições",
    description: "Tudo que abre por cima da página. Clique para abrir.",
  },
  data: {
    id: "exibicao-de-dados",
    title: "Exibição de dados",
    description: "Cards, avatares, tabelas e mapas.",
  },
  viz: {
    id: "visualizacao",
    title: "Visualização de dados",
    description: "Gráficos com ChartContainer sobre recharts.",
  },
  product: {
    id: "produto",
    title: "Produto",
    description:
      "Componentes da rota / montados com dados de exemplo — aqui não há chamada à API.",
  },
  registry: {
    id: "registry",
    title: "Registry @gmui",
    description:
      "Itens publicados em public/r/ por pnpm registry:build (fonte em registry/gmui/).",
  },
  templates: {
    id: "templates",
    title: "Templates e blocos",
    description:
      "Blocos de terceiros montados aqui e telas inteiras que vivem em rota própria.",
  },
} satisfies Record<string, CatalogSectionInfo>

// Só done/failed: um lead pending faria o LeadsPanel entrar em polling.
const SAMPLE_LEADS: LeadRecord[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Ana Souza",
    email: "ana@exemplo.com",
    company: "Exemplo Ltda.",
    status: "done",
    score: 86,
    reasoning: "Pediu proposta e tem orçamento definido.",
    dispatched: true,
    error: null,
    created_at: "2026-01-10T12:00:00Z",
    updated_at: "2026-01-10T12:00:05Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Bruno Lima",
    email: "bruno@exemplo.com",
    company: null,
    status: "done",
    score: 74,
    reasoning: "Interesse claro, mas sem prazo.",
    dispatched: false,
    error: "ConnectTimeout",
    created_at: "2026-01-10T11:00:00Z",
    updated_at: "2026-01-10T11:00:04Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Carla Dias",
    email: "carla@exemplo.com",
    company: "Acme",
    status: "done",
    score: 45,
    reasoning: "Só quer entender preços.",
    dispatched: false,
    error: null,
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-01-10T10:00:03Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Davi Rocha",
    email: "davi@exemplo.com",
    company: null,
    status: "failed",
    score: null,
    reasoning: null,
    dispatched: false,
    error: "APIStatusError",
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-10T09:00:09Z",
  },
]

const ROUTES = [
  {
    href: "/",
    name: "Lead Router",
    category: "Produto",
    description: "Dashboard real: métricas e leads recentes vindos da API.",
    components: "components/leads/*",
  },
  {
    href: "/dashboard",
    name: "Dashboard (demo)",
    category: "Demo",
    description:
      "Sidebar, cards de seção, gráfico interativo e tabela arrastável com data.json.",
    components:
      "app-sidebar, section-cards, chart-area-interactive, data-table",
  },
  {
    href: "/dashboard01",
    name: "Dashboard 01 (demo)",
    category: "Demo",
    description:
      "Sidebar, cabeçalho com período, gráficos e tabela de clientes.",
    components: "components/dashboard-01/*",
  },
  {
    href: "/dashboard02",
    name: "Dashboard 02 (demo)",
    category: "Demo",
    description: "App shell com cards, gráficos, tabela e toasts.",
    components: "components/dashboard/*",
  },
  {
    href: "/startup",
    name: "Landing de startup",
    category: "Demo",
    description: "Página de marketing em blocos, com toasts na newsletter.",
    components: "components/startup/*",
  },
  {
    href: "/login",
    name: "Login",
    category: "Demo",
    description: "Formulário de entrada com texto estático de exemplo.",
    components: "login-form",
  },
  {
    href: "/signup",
    name: "Cadastro",
    category: "Demo",
    description: "Formulário de cadastro com texto estático de exemplo.",
    components: "signup-form",
  },
]

export default function DesignSystemPage() {
  const sections = Object.values(SECTIONS)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-4 md:p-8 lg:flex-row">
      <aside className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-2 backdrop-blur lg:top-8 lg:mx-0 lg:h-fit lg:w-48 lg:shrink-0 lg:border-0 lg:p-0">
        <CatalogNav sections={sections} />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              lead-router
            </Link>{" "}
            / catálogo
          </p>
          <h1 className="font-heading text-3xl font-semibold">Design system</h1>
          <p className="max-w-2xl text-muted-foreground">
            Catálogo manual dos componentes do web/: primitivas, peças do
            produto, a registry @gmui e as demos. Tudo aqui usa dados de
            exemplo.
          </p>
        </header>

        <CatalogSection section={SECTIONS.overview}>
          <Preview
            name="Como ler"
            source="components/design-system/catalog"
            wide
            className="flex-col flex-nowrap items-start text-sm"
          >
            <p>
              Cada card mostra o nome, o caminho de import (verificável no
              repositório) e as variantes e estados que o componente realmente
              expõe.
            </p>
            <p className="flex items-center gap-2">
              <Badge variant="outline">Base UI</Badge> envolve uma primitiva de
              @base-ui/react.
            </p>
            <p>
              components/ui, components/bjork-ui e components/beste vieram de
              registries de terceiros e não são editados à mão.
            </p>
          </Preview>
        </CatalogSection>

        <CatalogSection section={SECTIONS.foundations}>
          <Foundations />
        </CatalogSection>
        <CatalogSection section={SECTIONS.actions}>
          <Actions />
        </CatalogSection>
        <CatalogSection section={SECTIONS.inputs}>
          <Inputs />
        </CatalogSection>
        <CatalogSection section={SECTIONS.navigation}>
          <Navigation />
        </CatalogSection>
        <CatalogSection section={SECTIONS.feedback}>
          <Feedback />
        </CatalogSection>
        <CatalogSection section={SECTIONS.overlays}>
          <Overlays />
        </CatalogSection>
        <CatalogSection section={SECTIONS.data}>
          <DataDisplay />
        </CatalogSection>
        <CatalogSection section={SECTIONS.viz}>
          <DataVisualization />
        </CatalogSection>

        <CatalogSection section={SECTIONS.product}>
          <Preview
            name="LeadOverview"
            source="components/leads/lead-overview"
            wide
            className="flex-col flex-nowrap items-stretch gap-6"
          >
            <LeadOverview summary={summarize(SAMPLE_LEADS)} />
          </Preview>
          <Preview
            name="LeadsPanel"
            source="components/leads/leads-panel"
            description="Filtro por faixa, pontuação, motivo e resultado de entrega."
            wide
            className="block"
          >
            <LeadsPanel leads={SAMPLE_LEADS} />
          </Preview>
          <RouteCard {...ROUTES[0]} />
        </CatalogSection>

        <CatalogSection section={SECTIONS.registry}>
          <Preview
            name="ApiErrorCard"
            source="registry/gmui/api-error-card"
            description="npx shadcn add @gmui/api-error-card"
            wide
            className="block"
          >
            <ApiErrorCard detail="connect ECONNREFUSED 127.0.0.1:8000">
              Suba a API com <code>docker compose up</code> ou ajuste{" "}
              <code>LEAD_ROUTER_URL</code>.
            </ApiErrorCard>
          </Preview>
        </CatalogSection>

        <CatalogSection section={SECTIONS.templates}>
          <Preview
            name="LeadsTable"
            source="components/bjork-ui/tables/leads-table"
            description="Dados padrão do próprio componente; renderizado só no cliente."
            wide
            className="block overflow-x-auto"
          >
            {/* A largura para a qual o componente foi desenhado; abaixo dela ele corta colunas. */}
            <div className="min-w-[1180px]">
              <LeadsTable />
            </div>
          </Preview>
          <Preview
            name="FinancialTable"
            source="components/bjork-ui/tables/financial-table"
            description="Dados padrão do próprio componente; renderizado só no cliente."
            wide
            className="block overflow-x-auto"
          >
            {/* A largura para a qual o componente foi desenhado; abaixo dela ele corta colunas. */}
            <div className="min-w-[1040px]">
              <FinancialTable />
            </div>
          </Preview>
          <Preview
            name="Auth13"
            source="components/beste/block/auth13"
            description="Montado com auth13Demo, exportado pelo próprio bloco."
            wide
            className="block"
          >
            <Auth13 {...auth13Demo} />
          </Preview>
          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-3">
            {ROUTES.slice(1).map((route) => (
              <RouteCard key={route.href} {...route} />
            ))}
          </div>
        </CatalogSection>
      </main>
    </div>
  )
}
