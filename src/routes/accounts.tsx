import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import { 
  accountsApi, 
  type Account, 
  type AccountType, 
  type CreateAccountPayload, 
  type TransferPayload, 
  getErrorMessage 
} from '#/lib/api'
import { useCurrency, SUPPORTED_CURRENCIES } from '#/lib/currency-context'
import {
  WalletCards,
  Building2,
  CreditCard,
  Banknote,
  PiggyBank,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react'

export const Route = createFileRoute('/accounts')({
  component: AccountsPage,
})

function AccountsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currency, currencySymbol, formatCurrency, formatRawNumber, convert, autoConvert } = useCurrency()

  // Redirect if not logged in
  if (!isAuthenticated && typeof window !== 'undefined') {
    navigate({ to: '/login' })
  }

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Accounts
  const { data: accounts = [], isLoading, error: queryError } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateAccountPayload) => accountsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      setIsCreateOpen(false)
      setFeedback({ type: 'success', message: 'Account created successfully!' })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateAccountPayload> }) =>
      accountsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setEditingAccount(null)
      setFeedback({ type: 'success', message: 'Account updated successfully!' })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      setDeleteConfirmId(null)
      setFeedback({ type: 'success', message: 'Account removed successfully.' })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: (payload: TransferPayload) => accountsApi.transfer(payload),
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      setIsTransferOpen(false)
      setFeedback({
        type: 'success',
        message: data?.message || 'Inter-account transfer completed successfully!',
      })
      setTimeout(() => setFeedback(null), 5000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const totalBalance = accounts.reduce(
    (acc, a) => acc + formatRawNumber(Number(a.balance) || 0, a.currency),
    0
  )

  const getAccountStyle = (type: AccountType) => {
    switch (type) {
      case 'BANK':
        return {
          icon: Building2,
          color: 'text-[#4fb8b2]',
          bg: 'bg-[#4fb8b2]/15',
          border: 'border-[#4fb8b2]/30',
        }
      case 'SAVINGS':
        return {
          icon: PiggyBank,
          color: 'text-[#6ec89a]',
          bg: 'bg-[#6ec89a]/15',
          border: 'border-[#6ec89a]/30',
        }
      case 'CREDIT_CARD':
        return {
          icon: CreditCard,
          color: 'text-amber-400',
          bg: 'bg-amber-400/15',
          border: 'border-amber-400/30',
        }
      case 'INVESTMENT':
        return {
          icon: TrendingUp,
          color: 'text-purple-400',
          bg: 'bg-purple-400/15',
          border: 'border-purple-400/30',
        }
      default:
        return {
          icon: Banknote,
          color: 'text-teal-300',
          bg: 'bg-teal-300/15',
          border: 'border-teal-300/30',
        }
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Overview Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0f1a1e] to-[#12242b] border border-[#8de5db]/15 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4fb8b2] bg-[#4fb8b2]/10 px-2.5 py-0.5 rounded-full border border-[#4fb8b2]/20">
              Account Portfolio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <WalletCards className="w-7 h-7 text-[#4fb8b2]" />
            Accounts &amp; Transfers
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8]">
            Manage balances across bank, cash, and savings with zero-sum inter-account transfers.
          </p>
        </div>

        {/* Global Net Worth & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-[#070e11] border border-[#8de5db]/20 flex flex-col justify-center text-left">
            <span className="text-[10px] text-[#afcdc8] uppercase font-semibold">Total Aggregate Balance ({currency})</span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
            <button
              onClick={() => setIsTransferOpen(true)}
              disabled={accounts.length < 2}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f1a1e] border border-[#8de5db]/20 text-[#60d7cf] text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={accounts.length < 2 ? 'Need at least 2 accounts to transfer' : 'Transfer funds'}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-white/60 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-sm text-[#afcdc8] animate-pulse">
          Loading accounts and real-time balances...
        </div>
      ) : queryError ? (
        <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-center text-red-300">
          Failed to load accounts: {getErrorMessage(queryError)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#0f1a1e]/80 border border-dashed border-[#8de5db]/20 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4fb8b2]/10 border border-[#4fb8b2]/30 flex items-center justify-center text-[#60d7cf]">
            <WalletCards className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Accounts Connected</h3>
            <p className="text-xs text-[#afcdc8] max-w-sm mx-auto mt-1">
              Add your primary checking, cash wallet, or savings account to track real-time balances.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((account) => {
            const style = getAccountStyle(account.type)
            const Icon = style.icon
            return (
              <div
                key={account.id}
                className="group p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 hover:border-[#4fb8b2]/40 transition-all shadow-lg hover:shadow-xl relative flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center ${style.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-[#60d7cf] transition-colors">
                          {account.name}
                        </h3>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#afcdc8]">
                          {account.type}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingAccount(account)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[#afcdc8] hover:text-white transition-colors"
                        title="Edit Account"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(account.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#afcdc8] hover:text-red-400 transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-6">
                    <span className="text-xs font-semibold text-[#afcdc8] uppercase tracking-wider">
                      Current Balance
                    </span>
                    <div className="text-3xl font-black text-white mt-0.5 tracking-tight">
                      {formatCurrency(Number(account.balance), account.currency)}
                    </div>
                    {autoConvert && account.currency && account.currency.toUpperCase() !== currency.toUpperCase() && (
                      <span className="text-[10px] text-[#60d7cf]/80 mt-1 font-mono block">
                        Original: {account.currency} {Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="mt-6 pt-4 border-t border-[#8de5db]/10 flex items-center justify-between text-[11px] text-[#afcdc8]">
                  <span>
                    Opening:{' '}
                    <span className="font-semibold text-[#d7ece8]">
                      {formatCurrency(Number(account.openingBalance ?? account.balance), account.currency)}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#070e11] border border-[#8de5db]/15 text-[10px] font-mono text-[#60d7cf]">
                    {account.currency || 'USD'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 1: Create Account Dialog                                         */}
      {/* ---------------------------------------------------------------------- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/25 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-[#4fb8b2]" />
              New Financial Account
            </h2>
            <p className="text-xs text-[#afcdc8] mb-5">
              Configure a bank, cash, savings, or investment ledger.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const name = formData.get('name') as string
                const type = formData.get('type') as AccountType
                const balance = parseFloat(formData.get('balance') as string) || 0
                const currency = (formData.get('currency') as string) || 'USD'

                createMutation.mutate({
                  name,
                  type,
                  balance,
                  openingBalance: balance,
                  currency,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Chase Total Checking"
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <select
                  name="type"
                  defaultValue="BANK"
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                >
                  <option value="BANK">Bank Account (Checking)</option>
                  <option value="SAVINGS">High Yield Savings</option>
                  <option value="CASH">Cash &amp; Physical Wallet</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="INVESTMENT">Investment &amp; Stocks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Opening Balance
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#60d7cf] text-sm font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      name="balance"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="0.00"
                      required
                      className="w-full pl-8 pr-3 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Account Currency
                  </label>
                  <select
                    name="currency"
                    defaultValue={currency}
                    className="w-full px-3 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-md shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 2: Transfer Funds Dialog                                         */}
      {/* ---------------------------------------------------------------------- */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <TransferFundsDialog
            accounts={accounts}
            onClose={() => setIsTransferOpen(false)}
            onSubmit={(payload) => transferMutation.mutate(payload)}
            isLoading={transferMutation.isPending}
          />
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 3: Edit Account Dialog                                           */}
      {/* ---------------------------------------------------------------------- */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/25 shadow-2xl relative">
            <button
              onClick={() => setEditingAccount(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Edit2 className="w-5 h-5 text-[#4fb8b2]" />
              Edit Account
            </h2>
            <p className="text-xs text-[#afcdc8] mb-5">
              Update account details for {editingAccount.name}.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const name = formData.get('name') as string
                const type = formData.get('type') as AccountType
                const accountCurrency = (formData.get('currency') as string) || 'USD'

                updateMutation.mutate({
                  id: editingAccount.id,
                  payload: { name, type, currency: accountCurrency },
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingAccount.name}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Account Type
                </label>
                <select
                  name="type"
                  defaultValue={editingAccount.type}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                >
                  <option value="BANK">Bank Account (Checking)</option>
                  <option value="SAVINGS">High Yield Savings</option>
                  <option value="CASH">Cash &amp; Physical Wallet</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="INVESTMENT">Investment &amp; Stocks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Currency
                </label>
                <select
                  name="currency"
                  defaultValue={editingAccount.currency || currency}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-md shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 4: Delete Confirmation Dialog                                    */}
      {/* ---------------------------------------------------------------------- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#0f1a1e] border border-red-500/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Account?</h3>
              <p className="text-xs text-[#afcdc8] mt-1 leading-relaxed">
                Are you sure you want to remove this account? All associated transactions will also be purged.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-Component: Transfer Funds Form with Live Balance Preview
// ---------------------------------------------------------------------------
interface TransferDialogProps {
  accounts: Account[]
  onClose: () => void
  onSubmit: (payload: TransferPayload) => void
  isLoading: boolean
}

function TransferFundsDialog({ accounts, onClose, onSubmit, isLoading }: TransferDialogProps) {
  const { formatCurrency, convert } = useCurrency()
  const [sourceId, setSourceId] = useState<number>(accounts[0]?.id || 0)
  const [destId, setDestId] = useState<number>(
    accounts.find((a) => a.id !== accounts[0]?.id)?.id || 0
  )
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))

  const sourceAccount = accounts.find((a) => a.id === sourceId)
  const destAccount = accounts.find((a) => a.id === destId)

  const sourceCurrency = (sourceAccount?.currency || 'USD').toUpperCase()
  const destCurrency = (destAccount?.currency || 'USD').toUpperCase()
  const isDifferentCurrency = sourceCurrency !== destCurrency

  const numAmount = parseFloat(amount) || 0
  const sourceBalance = Number(sourceAccount?.balance) || 0
  const isInsufficient = numAmount > sourceBalance

  const convertedDestAmount = isDifferentCurrency
    ? convert(numAmount, sourceCurrency, destCurrency)
    : numAmount

  const conversionRate = isDifferentCurrency
    ? convert(1, sourceCurrency, destCurrency)
    : 1

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isInsufficient || numAmount <= 0) return

    onSubmit({
      sourceAccountId: sourceId,
      destinationAccountId: destId,
      amount: numAmount,
      destinationAmount: isDifferentCurrency ? convertedDestAmount : undefined,
      description,
      transferDate: date,
    })
  }

  const sourceSymbol = SUPPORTED_CURRENCIES[sourceCurrency]?.symbol || '$'

  return (
    <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/25 shadow-2xl relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 rounded-lg bg-[#4fb8b2]/15 text-[#4fb8b2]">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white">Inter-Account Transfer</h2>
      </div>
      <p className="text-xs text-[#afcdc8] mb-6">
        Move funds between your accounts with optional real-time currency auto-conversion.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source & Destination Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
              From (Source)
            </label>
            <select
              value={sourceId}
              onChange={(e) => {
                const newSource = Number(e.target.value)
                setSourceId(newSource)
                if (newSource === destId) {
                  const alt = accounts.find((a) => a.id !== newSource)
                  if (alt) setDestId(alt.id)
                }
              }}
              className="w-full px-3 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#4fb8b2]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(Number(a.balance), a.currency)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
              To (Destination)
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#4fb8b2]"
            >
              {accounts
                .filter((a) => a.id !== sourceId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(Number(a.balance), a.currency)})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
              Amount ({sourceCurrency})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#60d7cf] text-sm font-bold">
                {sourceSymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-3 py-2.5 bg-[#070e11] border rounded-xl text-white text-sm focus:outline-none ${
                  isInsufficient
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#8de5db]/20 focus:border-[#4fb8b2]'
                }`}
              />
            </div>
            {isInsufficient && (
              <span className="text-[11px] text-red-400 mt-1 block">
                Exceeds available balance ({formatCurrency(sourceBalance, sourceCurrency)})
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
              Transfer Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#4fb8b2]"
            />
          </div>
        </div>

        {/* Multi-Currency Auto Conversion Preview Pill */}
        {isDifferentCurrency && numAmount > 0 && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#328f97]/20 to-[#4fb8b2]/10 border border-[#4fb8b2]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#4fb8b2]/20 text-[#60d7cf]">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-white block">Auto FX Conversion</span>
                <span className="text-[11px] text-[#afcdc8]">
                  1 {sourceCurrency} &asymp; {conversionRate.toFixed(4)} {destCurrency}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#afcdc8] block uppercase">Destination Credits</span>
              <span className="font-bold text-[#60d7cf]">
                {formatCurrency(convertedDestAmount, destCurrency)}
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
            Note / Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly allocation to savings"
            className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
          />
        </div>

        {/* Real-time Balance Preview */}
        {numAmount > 0 && sourceAccount && destAccount && (
          <div className="p-3.5 rounded-xl bg-[#070e11] border border-[#8de5db]/15 text-xs space-y-1.5">
            <span className="text-[10px] text-[#afcdc8] uppercase font-semibold">Post-Transfer Preview</span>
            <div className="flex justify-between text-white">
              <span>{sourceAccount.name}:</span>
              <span className={isInsufficient ? 'text-red-400 font-bold' : 'text-emerald-400 font-mono'}>
                {formatCurrency(sourceBalance - numAmount, sourceCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-white">
              <span>{destAccount.name}:</span>
              <span className="text-emerald-400 font-mono">
                {formatCurrency(Number(destAccount.balance) + convertedDestAmount, destCurrency)}
              </span>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isInsufficient || numAmount <= 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Executing...' : 'Complete Transfer'}
          </button>
        </div>
      </form>
    </div>
  )
}
