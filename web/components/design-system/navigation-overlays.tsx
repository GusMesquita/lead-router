"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CaretDownIcon,
  GearIcon,
  MagnifyingGlassIcon,
  SignOutIcon,
  UserIcon,
} from "@phosphor-icons/react"

import { Preview } from "@/components/design-system/catalog"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDES = ["top", "right", "bottom", "left"] as const

function CommandItems() {
  return (
    <>
      <CommandInput placeholder="Buscar comando..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Leads">
          <CommandItem>
            <MagnifyingGlassIcon />
            Buscar lead
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
          <CommandItem>Ver pendentes</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Conta">
          <CommandItem>
            <GearIcon />
            Configurações
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  )
}

export function Navigation() {
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <>
      <Preview name="Breadcrumb" source="components/ui/breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button size="icon-sm" variant="ghost">
                      <BreadcrumbEllipsis />
                      <span className="sr-only">Mais níveis</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Leads</DropdownMenuItem>
                  <DropdownMenuItem>Integrações</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Design system</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Preview>
      <Preview
        name="Tabs"
        source="components/ui/tabs"
        baseUi
        className="flex-col flex-nowrap items-stretch"
      >
        {(["default", "line"] as const).map((variant) => (
          <Tabs key={variant} defaultValue="resumo">
            <TabsList variant={variant}>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="pontuacao">Pontuação</TabsTrigger>
              <TabsTrigger value="entrega" disabled>
                Entrega
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="resumo"
              className="text-sm text-muted-foreground"
            >
              variant={variant} · a terceira aba está disabled.
            </TabsContent>
            <TabsContent
              value="pontuacao"
              className="text-sm text-muted-foreground"
            >
              Pontuação 82, quente.
            </TabsContent>
          </Tabs>
        ))}
      </Preview>
      <Preview
        name="Command"
        source="components/ui/command"
        description="cmdk; inline e dentro de CommandDialog."
        className="flex-col flex-nowrap items-stretch"
      >
        <Command className="rounded-lg border">
          <CommandItems />
        </Command>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setCommandOpen(true)}
        >
          Abrir CommandDialog
        </Button>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <Command>
            <CommandItems />
          </Command>
        </CommandDialog>
      </Preview>
      <Preview
        name="Collapsible"
        source="components/ui/collapsible"
        baseUi
        className="flex-col flex-nowrap items-stretch"
      >
        <Collapsible className="flex flex-col gap-2">
          <CollapsibleTrigger
            render={<Button variant="ghost" className="self-start" />}
          >
            Por que este lead é quente? <CaretDownIcon />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-sm text-muted-foreground">
            O motivo da pontuação vem do modelo, junto com o score.
          </CollapsibleContent>
        </Collapsible>
      </Preview>
    </>
  )
}

export function Overlays() {
  return (
    <>
      <Preview name="Dialog" source="components/ui/dialog" baseUi>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Abrir dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reenviar lead?</DialogTitle>
              <DialogDescription>
                Exemplo de confirmação. Nada é enviado daqui.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <DialogClose render={<Button />}>Confirmar</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Preview>
      <Preview
        name="Sheet"
        source="components/ui/sheet"
        baseUi
        description="Dialog lateral; um gatilho por `side`."
      >
        {SIDES.map((side) => (
          <Sheet key={side}>
            <SheetTrigger render={<Button variant="outline" />}>
              {side}
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Sheet {side}</SheetTitle>
                <SheetDescription>side=&quot;{side}&quot;</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        ))}
      </Preview>
      <Preview name="Drawer" source="components/ui/drawer" baseUi>
        <Drawer>
          <DrawerTrigger render={<Button variant="outline" />}>
            Abrir drawer
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Detalhe do lead</DrawerTitle>
              <DrawerDescription>
                Arraste para baixo para fechar.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>
                Fechar
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Preview>
      <Preview name="Popover" source="components/ui/popover" baseUi>
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            Abrir popover
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Corte de despacho</PopoverTitle>
              <PopoverDescription>
                Leads abaixo de MIN_SCORE_TO_DISPATCH não são enviados.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Preview>
      <Preview name="DropdownMenu" source="components/ui/dropdown-menu" baseUi>
        <DropdownMenuExample />
      </Preview>
      <Preview name="Tooltip" source="components/ui/tooltip" baseUi>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Passe o mouse
          </TooltipTrigger>
          <TooltipContent>Motivo da pontuação aparece assim.</TooltipContent>
        </Tooltip>
      </Preview>
    </>
  )
}

function DropdownMenuExample() {
  const [onlyHot, setOnlyHot] = useState(true)
  const [order, setOrder] = useState("recentes")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Abrir menu <CaretDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
          <DropdownMenuItem>
            <UserIcon /> Perfil <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Mais opções</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Exportar</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={onlyHot}
          onCheckedChange={setOnlyHot}
        >
          Só quentes
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={order} onValueChange={setOrder}>
          <DropdownMenuRadioItem value="recentes">
            Recentes
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="pontuacao">
            Maior pontuação
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <SignOutIcon /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
