import { createFileRoute } from '@tanstack/react-router'
import { WalletCards } from 'lucide-react'

export const Route = createFileRoute('/accounts')({
  component: AccountsPage,
})

function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-[#4fb8b2]" />
            Account Management
          </h1>
          <p className="text-sm text-[#afcdc8]">
            Manage checking, savings, cash, and investment accounts.
          </p>
        </div>
      </div>
      <div className="p-8 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 text-center text-[#afcdc8]">
        Account management will load your real-time balances.
      </div>
    </div>
  )
}
