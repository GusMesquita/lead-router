import { Toaster } from "@/components/ui/sonner"
import AppShell from "@/components/dashboard/app-shell"
import Charts from "@/components/dashboard/charts"
import Dashboard from "@/components/dashboard/dashboard"
import DataTable from "@/components/dashboard/table"

export default function DashboardTemplate() {
  return (
    <AppShell>
      <Toaster />
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Dashboard />
        <Charts />
        <DataTable />
      </div>
    </AppShell>
  )
}