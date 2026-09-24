import type { ReactNode } from "react"
import Link from "next/link"
import { SquaresFourIcon, SwatchesIcon } from "@phosphor-icons/react/ssr"

import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Navegação do produto, separada da `app-sidebar` das demos do catálogo. Só
// entra aqui o que existe: Leads, Roteamento, Integrações etc. dependem de
// backend que ainda não há.
export function ProductShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/" />}>
                <span className="flex size-8 items-center justify-center rounded-md bg-primary font-heading text-sm font-semibold text-primary-foreground">
                  lr
                </span>
                <span className="font-heading font-semibold">lead-router</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Produto</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    tooltip="Visão geral"
                    render={<Link href="/" />}
                  >
                    <SquaresFourIcon />
                    <span>Visão geral</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {/* Ferramenta de quem desenvolve, não destino do produto. */}
          <SidebarGroupLabel>Desenvolvimento</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                tooltip="Design system"
                render={<Link href="/design-system" />}
              >
                <SwatchesIcon />
                <span>Design system</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="font-heading text-base font-semibold">{title}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
