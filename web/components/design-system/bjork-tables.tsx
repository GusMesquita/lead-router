"use client"

import dynamic from "next/dynamic"

// As tabelas bjork escolhem a paleta com useTheme() durante o render; no
// servidor o tema é desconhecido e o HTML nunca bate com o do cliente. Montar
// só no cliente evita o erro de hidratação sem editar código de terceiro.
export const LeadsTable = dynamic(
  () =>
    import("@/components/bjork-ui/tables/leads-table").then(
      (m) => m.LeadsTable
    ),
  { ssr: false }
)

export const FinancialTable = dynamic(
  () =>
    import("@/components/bjork-ui/tables/financial-table").then(
      (m) => m.FinancialTable
    ),
  { ssr: false }
)
