"use client"

import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react"

import { Preview, Specimen } from "@/components/design-system/catalog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { NumberInput } from "@/components/ui/number-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const BUTTON_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const
const ICON_SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const

const TIERS = [
  { label: "Quente", value: "quente" },
  { label: "Morno", value: "morno" },
  { label: "Frio", value: "frio" },
]

export function Actions() {
  return (
    <>
      <Preview name="Button" source="components/ui/button" baseUi wide>
        {BUTTON_VARIANTS.map((variant) => (
          <Specimen key={variant} label={variant}>
            <Button variant={variant}>Enviar</Button>
          </Specimen>
        ))}
        {BUTTON_SIZES.map((size) => (
          <Specimen key={size} label={`size=${size}`}>
            <Button size={size}>Enviar</Button>
          </Specimen>
        ))}
        {ICON_SIZES.map((size) => (
          <Specimen key={size} label={`size=${size}`}>
            <Button size={size} variant="outline" aria-label="Adicionar">
              <PlusIcon />
            </Button>
          </Specimen>
        ))}
        <Specimen label="com ícone">
          <Button>
            Continuar <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </Specimen>
        <Specimen label="disabled">
          <Button disabled>Enviar</Button>
        </Specimen>
        <Specimen label="outline disabled">
          <Button variant="outline" disabled>
            Enviar
          </Button>
        </Specimen>
      </Preview>
      <Preview name="Toggle" source="components/ui/toggle" baseUi>
        <Specimen label="default">
          <Toggle aria-label="Negrito">
            <TextBIcon />
          </Toggle>
        </Specimen>
        <Specimen label="outline">
          <Toggle variant="outline" aria-label="Itálico">
            <TextItalicIcon />
          </Toggle>
        </Specimen>
        <Specimen label="pressed">
          <Toggle defaultPressed aria-label="Sublinhado">
            <TextUnderlineIcon />
          </Toggle>
        </Specimen>
        <Specimen label="size=sm / lg">
          <div className="flex gap-2">
            <Toggle size="sm">sm</Toggle>
            <Toggle size="lg">lg</Toggle>
          </div>
        </Specimen>
        <Specimen label="disabled">
          <Toggle disabled>off</Toggle>
        </Specimen>
      </Preview>
      <Preview name="ToggleGroup" source="components/ui/toggle-group" baseUi>
        <Specimen label="seleção única">
          <ToggleGroup defaultValue={["quente"]} aria-label="Faixa">
            {TIERS.map((tier) => (
              <ToggleGroupItem key={tier.value} value={tier.value}>
                {tier.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Specimen>
        <Specimen label="variant=outline">
          <ToggleGroup
            variant="outline"
            defaultValue={["morno"]}
            aria-label="Faixa"
          >
            {TIERS.map((tier) => (
              <ToggleGroupItem key={tier.value} value={tier.value}>
                {tier.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Specimen>
      </Preview>
      <Preview name="Kbd" source="components/ui/kbd">
        <Kbd>Esc</Kbd>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Preview>
    </>
  )
}

export function Inputs() {
  return (
    <>
      <Preview
        name="Input"
        source="components/ui/input"
        baseUi
        className="grid grid-cols-1 sm:grid-cols-2"
      >
        <Specimen label="normal">
          <Input defaultValue="Ana Souza" aria-label="Nome" />
        </Specimen>
        <Specimen label="placeholder">
          <Input placeholder="ana@exemplo.com" aria-label="E-mail" />
        </Specimen>
        <Specimen label="disabled">
          <Input disabled defaultValue="somente leitura" aria-label="Chave" />
        </Specimen>
        <Specimen label="aria-invalid">
          <Input aria-invalid defaultValue="ana@" aria-label="E-mail" />
        </Specimen>
      </Preview>
      <Preview name="Textarea" source="components/ui/textarea">
        <Textarea
          className="w-full"
          placeholder="Mensagem do lead"
          aria-label="Mensagem"
        />
        <Textarea
          className="w-full"
          disabled
          defaultValue="Desabilitado"
          aria-label="Mensagem desabilitada"
        />
      </Preview>
      <Preview
        name="Field"
        source="components/ui/field"
        description="Label, descrição e erro agrupados; usa ui/label."
      >
        <FieldGroup className="w-full">
          <Field>
            <FieldLabel htmlFor="ds-company">Empresa</FieldLabel>
            <Input id="ds-company" placeholder="Exemplo Ltda." />
            <FieldDescription>
              Opcional; vai para o enriquecimento.
            </FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="ds-cnpj">CNPJ</FieldLabel>
            <Input id="ds-cnpj" aria-invalid defaultValue="123" />
            <FieldError>CNPJ precisa de 14 dígitos.</FieldError>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="ds-terms" defaultChecked />
            <FieldLabel htmlFor="ds-terms">orientation=horizontal</FieldLabel>
          </Field>
        </FieldGroup>
      </Preview>
      <Preview name="InputGroup" source="components/ui/input-group">
        <InputGroup>
          <InputGroupAddon>
            <MagnifyingGlassIcon />
          </InputGroupAddon>
          <InputGroupInput placeholder="Buscar lead" aria-label="Buscar lead" />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            placeholder="hooks.exemplo.com"
            aria-label="Destino"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>Testar</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Preview>
      <Preview name="Checkbox" source="components/ui/checkbox" baseUi>
        {[
          ["unchecked", {}],
          ["checked", { defaultChecked: true }],
          ["indeterminate", { indeterminate: true }],
          ["disabled", { disabled: true }],
          ["checked disabled", { disabled: true, defaultChecked: true }],
        ].map(([label, props]) => (
          <Specimen key={label as string} label={label as string}>
            <Checkbox aria-label={label as string} {...(props as object)} />
          </Specimen>
        ))}
      </Preview>
      <Preview name="Label" source="components/ui/label">
        <div className="flex items-center gap-2">
          <Checkbox id="ds-label" />
          <Label htmlFor="ds-label">Receber só leads quentes</Label>
        </div>
      </Preview>
      <Preview name="Select" source="components/ui/select" baseUi>
        <Specimen label="default">
          <Select items={TIERS} defaultValue="quente">
            <SelectTrigger aria-label="Faixa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Specimen>
        <Specimen label="size=sm, placeholder">
          <Select items={TIERS}>
            <SelectTrigger size="sm" aria-label="Faixa">
              <SelectValue placeholder="Escolha a faixa" />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Specimen>
        <Specimen label="disabled">
          <Select items={TIERS} disabled>
            <SelectTrigger aria-label="Faixa">
              <SelectValue placeholder="Indisponível" />
            </SelectTrigger>
          </Select>
        </Specimen>
      </Preview>
      <Preview
        name="NumberInput"
        source="components/ui/number-input"
        description="Arraste sobre o campo para ajustar o valor."
      >
        <NumberInput
          defaultValue={60}
          min={0}
          max={100}
          aria-label="Corte de despacho"
        />
      </Preview>
      <Preview name="ColorPicker" source="components/ui/color-picker" wide>
        <ColorPicker defaultValue="oklch(0.7 0.15 230)" presets="tailwind" />
      </Preview>
    </>
  )
}
