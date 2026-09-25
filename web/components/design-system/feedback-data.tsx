"use client"

import {
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"

import { Preview, Specimen } from "@/components/design-system/catalog"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ContactChannels } from "@/components/ui/contact-channels"
import { DottedWorldMap } from "@/components/ui/dotted-world-map"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  WorkflowStatusBadge,
  workflowStatuses,
} from "@/components/ui/workflow-status"

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const

// Dados de exemplo do catálogo; o produto nunca importa este arquivo.
const SAMPLE_ROWS = [
  { name: "Ana Souza", company: "Exemplo Ltda.", score: 86, status: "done" },
  { name: "Bruno Lima", company: "—", score: 52, status: "done" },
  { name: "Carla Dias", company: "Acme", score: null, status: "pending" },
]

const WEEK = [
  { day: "seg", recebidos: 12, despachados: 5 },
  { day: "ter", recebidos: 18, despachados: 9 },
  { day: "qua", recebidos: 9, despachados: 3 },
  { day: "qui", recebidos: 22, despachados: 12 },
  { day: "sex", recebidos: 15, despachados: 7 },
]

const chartConfig = {
  recebidos: { label: "Recebidos", color: "var(--chart-2)" },
  despachados: { label: "Despachados", color: "var(--chart-4)" },
} satisfies ChartConfig

export function Feedback() {
  return (
    <>
      <Preview name="Badge" source="components/ui/badge" baseUi>
        {BADGE_VARIANTS.map((variant) => (
          <Specimen key={variant} label={variant}>
            <Badge variant={variant}>82 · quente</Badge>
          </Specimen>
        ))}
      </Preview>
      <Preview
        name="WorkflowStatusBadge"
        source="components/ui/workflow-status"
        description="Todos os estados de workflowStatuses; size=sm e iconOnly."
      >
        {workflowStatuses.map((status) => (
          <WorkflowStatusBadge key={status} status={status} />
        ))}
        <WorkflowStatusBadge status="success" size="sm" />
        <WorkflowStatusBadge status="failed" iconOnly />
      </Preview>
      <Preview
        name="Progress"
        source="components/ui/progress"
        baseUi
        className="flex-col flex-nowrap items-stretch"
      >
        {[0, 35, 70, 100].map((value) => (
          <Progress key={value} value={value}>
            <ProgressLabel>value={value}</ProgressLabel>
            <ProgressValue />
          </Progress>
        ))}
      </Preview>
      <Preview
        name="Skeleton"
        source="components/ui/skeleton"
        description="Carregando uma linha de lead."
        className="flex-col flex-nowrap items-stretch"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </Preview>
      <Preview
        name="Toaster (sonner)"
        source="components/ui/sonner"
        description="O Toaster fica montado nesta seção; os botões chamam toast()."
      >
        <Toaster />
        <Button variant="outline" onClick={() => toast("Lead recebido")}>
          default
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Lead despachado")}
        >
          success
        </Button>
        <Button variant="outline" onClick={() => toast.error("Entrega falhou")}>
          error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast("Lead pontuado", {
              description: "82 · quente",
              action: { label: "Ver", onClick: () => {} },
            })
          }
        >
          com ação
        </Button>
      </Preview>
    </>
  )
}

export function DataDisplay() {
  return (
    <>
      <Preview name="Card" source="components/ui/card" className="items-start">
        <Card className="w-72">
          <CardHeader>
            <CardTitle>Leads quentes</CardTitle>
            <CardDescription>Pontuação 70 ou mais</CardDescription>
            <CardAction>
              <Badge>12</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Card com header, action, content e footer.
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline">
              Ver todos
            </Button>
          </CardFooter>
        </Card>
        <Card size="sm" className="w-48">
          <CardHeader>
            <CardDescription>size=sm</CardDescription>
            <CardTitle className="text-2xl tabular-nums">48</CardTitle>
          </CardHeader>
        </Card>
      </Preview>
      <Preview name="Avatar" source="components/ui/avatar" baseUi>
        {(["sm", "default", "lg"] as const).map((size) => (
          <Specimen key={size} label={`size=${size}`}>
            <Avatar size={size}>
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
          </Specimen>
        ))}
        <Specimen label="AvatarBadge">
          <Avatar>
            <AvatarFallback>BL</AvatarFallback>
            <AvatarBadge>
              <PlusIcon />
            </AvatarBadge>
          </Avatar>
        </Specimen>
        <Specimen label="AvatarGroup + Count">
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>BL</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </Specimen>
      </Preview>
      <Preview name="Table" source="components/ui/table" wide>
        <Table>
          <TableCaption>Amostra estática, não vem da API.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Pontuação</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SAMPLE_ROWS.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.company}</TableCell>
                <TableCell className="tabular-nums">
                  {row.score ?? "—"}
                </TableCell>
                <TableCell>
                  <WorkflowStatusBadge
                    status={row.status === "done" ? "success" : "pending"}
                    size="sm"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Preview>
      <Preview name="Separator" source="components/ui/separator" baseUi>
        <div className="flex h-5 items-center gap-3 text-sm">
          <span>Recebidos</span>
          <Separator orientation="vertical" />
          <span>Pontuados</span>
          <Separator orientation="vertical" />
          <span>Despachados</span>
        </div>
        <Separator />
      </Preview>
      <Preview name="ScrollArea" source="components/ui/scroll-area" baseUi>
        <ScrollArea className="h-40 w-full rounded-md border">
          <ul className="p-4 text-sm">
            {Array.from({ length: 20 }, (_, i) => (
              <li key={i} className="border-b py-1.5 last:border-0">
                Lead #{i + 1}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Preview>
      <Preview
        name="ContactChannels"
        source="components/ui/contact-channels"
        description="Copiar (tecla de atalho) ou abrir link externo."
      >
        <ContactChannels
          className="w-full"
          columns={2}
          items={[
            {
              id: "email",
              platform: "E-mail",
              handle: "contato@exemplo.com",
              action: "copy",
              copyValue: "contato@exemplo.com",
              shortcutKey: "e",
              icon: <EnvelopeSimpleIcon />,
            },
            {
              id: "github",
              platform: "GitHub",
              handle: "lead-router",
              href: "https://github.com",
              action: "external",
              icon: <GithubLogoIcon />,
            },
          ]}
        />
      </Preview>
      <Preview
        name="DottedWorldMap"
        source="components/ui/dotted-world-map"
        wide
      >
        <DottedWorldMap
          className="w-full"
          showMarkers
          showLegend
          points={[
            { name: "São Paulo", lat: -23.55, lng: -46.63, value: 0.9 },
            { name: "Lisboa", lat: 38.72, lng: -9.14, value: 0.5 },
            { name: "Nova York", lat: 40.71, lng: -74.0, value: 0.3 },
          ]}
        />
      </Preview>
    </>
  )
}

export function DataVisualization() {
  return (
    <>
      <Preview
        name="Chart · área"
        source="components/ui/chart"
        description="ChartContainer + recharts, com tooltip e legenda."
        className="block"
      >
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <AreaChart data={WEEK} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="recebidos"
              type="monotone"
              fill="var(--color-recebidos)"
              fillOpacity={0.2}
              stroke="var(--color-recebidos)"
            />
            <Area
              dataKey="despachados"
              type="monotone"
              fill="var(--color-despachados)"
              fillOpacity={0.4}
              stroke="var(--color-despachados)"
            />
          </AreaChart>
        </ChartContainer>
      </Preview>
      <Preview
        name="Chart · barras"
        source="components/ui/chart"
        className="block"
      >
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart data={WEEK} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="recebidos" fill="var(--color-recebidos)" radius={4} />
            <Bar
              dataKey="despachados"
              fill="var(--color-despachados)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </Preview>
    </>
  )
}
