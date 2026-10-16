import { createFileRoute } from '@tanstack/react-router'
import { PieChart } from 'lucide-react'

export const Route = createFileRoute('/budgets')({
  component: BudgetsPage,
})

function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#4fb8b2]" />
            Budget Management
          </h1>
          <p className="text-sm text-[#afcdc8]">
            Set category limits and monitor 80% and 100% threshold alerts.
          </p>
        </div>
      </div>
      <div className="p-8 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 text-center text-[#afcdc8]">
        Budget status will display spending limits and warning alerts.
      </div>
    </div>
  )
}
