import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeftRight } from 'lucide-react'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
})

function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#4fb8b2]" />
            Transaction Ledger
          </h1>
          <p className="text-sm text-[#afcdc8]">
            Filter, search, and manage your income, expenses, and transfers.
          </p>
        </div>
      </div>
      <div className="p-8 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 text-center text-[#afcdc8]">
        Transactions ledger will load your historical transactions.
      </div>
    </div>
  )
}
