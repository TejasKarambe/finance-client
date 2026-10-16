import { createFileRoute } from '@tanstack/react-router'
import { FileSpreadsheet } from 'lucide-react'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#4fb8b2]" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-[#afcdc8]">
            Monthly/yearly cash flow analysis and CSV export.
          </p>
        </div>
      </div>
      <div className="p-8 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 text-center text-[#afcdc8]">
        Reports analytics will display monthly and yearly summaries.
      </div>
    </div>
  )
}
