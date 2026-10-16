import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import {
  transactionsApi,
  accountsApi,
  type Transaction,
  type TransactionType,
  type CreateTransactionPayload,
  type Account,
  type PaginatedResponse,
  getErrorMessage
} from '#/lib/api'
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
})

const CATEGORIES = [
  'Salary',
  'Groceries',
  'Dining & Restaurants',
  'Housing & Rent',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Investment',
  'Education',
  'Personal Care',
  'Transfer',
  'Other',
]

const PAYMENT_METHODS = [
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
]

function TransactionsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (!isAuthenticated && typeof window !== 'undefined') {
    navigate({ to: '/login' })
  }

  // Filter & Pagination States
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<number | ''>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [size, setSize] = useState<number>(10)
  const [sortBy, setSortBy] = useState<string>('transactionDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Accounts for dropdown
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  // Fetch Transactions with filter params
  const { data: transactionsData, isLoading, error: queryError } = useQuery({
    queryKey: [
      'transactions',
      page,
      size,
      sortBy,
      sortDir,
      search,
      selectedType,
      selectedCategory,
      selectedAccount,
      startDate,
      endDate,
    ],
    queryFn: () =>
      transactionsApi.getAll({
        page,
        size,
        sortBy,
        sortDir,
        search: search || undefined,
        type: (selectedType as TransactionType) || undefined,
        category: selectedCategory || undefined,
        accountId: selectedAccount ? Number(selectedAccount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  })

  // Parse Paginated Response
  const isPage = transactionsData && typeof transactionsData === 'object' && 'content' in transactionsData
  const transactions: Transaction[] = isPage
    ? (transactionsData as PaginatedResponse<Transaction>).content
    : Array.isArray(transactionsData)
    ? transactionsData
    : []

  const totalPages = isPage ? (transactionsData as PaginatedResponse<Transaction>).totalPages || 1 : 1
  const totalElements = isPage ? (transactionsData as PaginatedResponse<Transaction>).totalElements || transactions.length : transactions.length

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      setIsAddOpen(false)
      setFeedback({ type: 'success', message: 'Transaction recorded successfully!' })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateTransactionPayload> }) =>
      transactionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setEditingTx(null)
      setFeedback({ type: 'success', message: 'Transaction updated successfully!' })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setDeleteConfirmId(null)
      setFeedback({ type: 'success', message: 'Transaction deleted and balance restored.' })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (err) => {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const handleResetFilters = () => {
    setSearch('')
    setSelectedType('')
    setSelectedCategory('')
    setSelectedAccount('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
    setPage(0)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0f1a1e] to-[#12242b] border border-[#8de5db]/15 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4fb8b2] bg-[#4fb8b2]/10 px-2.5 py-0.5 rounded-full border border-[#4fb8b2]/20">
              Ledger
            </span>
            <span className="text-xs text-[#afcdc8]">
              {totalElements} total entries
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <ArrowLeftRight className="w-7 h-7 text-[#4fb8b2]" />
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8]">
            Filter, search, record, and reconcile your income and expense cash flow.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsAddOpen(true)}
            disabled={accounts.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={accounts.length === 0 ? 'Create an account first' : 'Add Transaction'}
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
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
          <button onClick={() => setFeedback(null)} className="p-1 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-[#afcdc8]">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-white">
            <Filter className="w-4 h-4 text-[#4fb8b2]" /> Filter &amp; Search Ledger
          </span>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[#60d7cf] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Description Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#afcdc8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Search description..."
              className="w-full pl-9 pr-3 py-2 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs placeholder-[#afcdc8]/50 focus:outline-none focus:border-[#4fb8b2]"
            />
          </div>

          {/* Type Selector */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as TransactionType | '')
                setPage(0)
              }}
              className="w-full px-3 py-2 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
            >
              <option value="">All Types (Income / Expense / Transfer)</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expense Only</option>
              <option value="TRANSFER">Transfers Only</option>
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Account Selector */}
          <div>
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value ? Number(e.target.value) : '')
                setPage(0)
              }}
              className="w-full px-3 py-2 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (${Number(acc.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#8de5db]/10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#afcdc8] shrink-0 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-1.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#afcdc8] shrink-0 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-1.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-sm text-[#afcdc8] animate-pulse">
            Loading transaction ledger...
          </div>
        ) : queryError ? (
          <div className="p-8 text-center text-red-400 text-sm">
            Failed to load transactions: {getErrorMessage(queryError)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <p className="text-sm text-[#afcdc8]">No transactions match your search or filter criteria.</p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#4fb8b2]/20 text-[#60d7cf] text-xs font-semibold hover:bg-[#4fb8b2]/30 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070e11]/80 text-[#afcdc8] uppercase tracking-wider text-[10px] border-b border-[#8de5db]/15 font-semibold">
                <tr>
                  <th
                    onClick={() => handleSortToggle('transactionDate')}
                    className="p-4 cursor-pointer hover:text-white"
                  >
                    Date {sortBy === 'transactionDate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4">Type</th>
                  <th
                    onClick={() => handleSortToggle('category')}
                    className="p-4 cursor-pointer hover:text-white"
                  >
                    Category {sortBy === 'category' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Method</th>
                  <th
                    onClick={() => handleSortToggle('amount')}
                    className="p-4 text-right cursor-pointer hover:text-white"
                  >
                    Amount {sortBy === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8de5db]/10">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Date */}
                    <td className="p-4 text-white font-mono whitespace-nowrap">
                      {tx.transactionDate}
                    </td>

                    {/* Type Badge */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'EXPENSE'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-[#4fb8b2]/10 text-[#60d7cf] border border-[#4fb8b2]/20'
                        }`}
                      >
                        {tx.type === 'INCOME' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : tx.type === 'EXPENSE' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowLeftRight className="w-3 h-3" />
                        )}
                        {tx.type}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-4 whitespace-nowrap font-semibold text-white">
                      {tx.category}
                    </td>

                    {/* Description */}
                    <td className="p-4 text-[#afcdc8] max-w-xs truncate">
                      {tx.description || '—'}
                    </td>

                    {/* Account */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[#d7ece8] font-medium">
                        <Building2 className="w-3 h-3 text-[#4fb8b2]" />
                        {tx.accountName || `Acc #${tx.accountId}`}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#070e11] border border-[#8de5db]/15 text-[10px] text-[#afcdc8] font-mono uppercase">
                        {tx.paymentMethod || 'OTHER'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td
                      className={`p-4 text-right font-bold text-sm tracking-tight whitespace-nowrap ${
                        tx.type === 'INCOME'
                          ? 'text-emerald-400'
                          : tx.type === 'EXPENSE'
                          ? 'text-red-400'
                          : 'text-[#60d7cf]'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}$
                      {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[#afcdc8] hover:text-white transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#afcdc8] hover:text-red-400 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalElements > 0 && (
          <div className="p-4 border-t border-[#8de5db]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#afcdc8]">
            <div className="flex items-center gap-3">
              <span>
                Showing Page <span className="font-semibold text-white">{page + 1}</span> of{' '}
                <span className="font-semibold text-white">{totalPages}</span> ({totalElements} total items)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Rows:</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value))
                    setPage(0)
                  }}
                  className="px-2 py-1 bg-[#070e11] border border-[#8de5db]/20 rounded-lg text-white text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#070e11] border border-[#8de5db]/20 text-[#d7ece8] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#070e11] border border-[#8de5db]/20 text-[#d7ece8] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 1: Add Transaction Dialog                                        */}
      {/* ---------------------------------------------------------------------- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/25 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-[#4fb8b2]" />
              Record New Transaction
            </h2>
            <p className="text-xs text-[#afcdc8] mb-5">
              Enter details to update your account balance and categorized ledger.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const accountId = Number(formData.get('accountId'))
                const type = formData.get('type') as TransactionType
                const amount = parseFloat(formData.get('amount') as string)
                const category = formData.get('category') as string
                const paymentMethod = formData.get('paymentMethod') as string
                const transactionDate = formData.get('transactionDate') as string
                const description = formData.get('description') as string

                createMutation.mutate({
                  accountId,
                  type,
                  amount,
                  category,
                  paymentMethod,
                  transactionDate,
                  description,
                })
              }}
              className="space-y-4"
            >
              {/* Account Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Account
                </label>
                <select
                  name="accountId"
                  required
                  defaultValue={accounts[0]?.id}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${Number(a.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type and Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue="EXPENSE"
                    className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    <option value="EXPENSE">Expense (Debit)</option>
                    <option value="INCOME">Income (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#afcdc8] text-sm">
                      $
                    </span>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                    />
                  </div>
                </div>
              </div>

              {/* Category and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue="Groceries"
                    className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {CATEGORIES.filter((c) => c !== 'Transfer').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    defaultValue="DEBIT_CARD"
                    className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Transaction Date
                </label>
                <input
                  name="transactionDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Description / Payee Note
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="e.g. Supermarket grocery haul"
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-md shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 2: Edit Transaction Dialog                                       */}
      {/* ---------------------------------------------------------------------- */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/25 shadow-2xl relative">
            <button
              onClick={() => setEditingTx(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Edit2 className="w-5 h-5 text-[#4fb8b2]" />
              Edit Transaction
            </h2>
            <p className="text-xs text-[#afcdc8] mb-5">
              Account balances will automatically reconcile with the new amount.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                const type = formData.get('type') as TransactionType
                const amount = parseFloat(formData.get('amount') as string)
                const category = formData.get('category') as string
                const paymentMethod = formData.get('paymentMethod') as string
                const transactionDate = formData.get('transactionDate') as string
                const description = formData.get('description') as string

                updateMutation.mutate({
                  id: editingTx.id,
                  payload: {
                    type,
                    amount,
                    category,
                    paymentMethod,
                    transactionDate,
                    description,
                  },
                })
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    name="type"
                    defaultValue={editingTx.type}
                    className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    <option value="EXPENSE">Expense (Debit)</option>
                    <option value="INCOME">Income (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#afcdc8] text-sm">
                      $
                    </span>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      defaultValue={editingTx.amount}
                      className="w-full pl-7 pr-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingTx.category}
                    className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    defaultValue={editingTx.paymentMethod || 'DEBIT_CARD'}
                    className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  name="transactionDate"
                  type="date"
                  required
                  defaultValue={editingTx.transactionDate}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  name="description"
                  type="text"
                  defaultValue={editingTx.description || ''}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-md shadow-[#4fb8b2]/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Modal 3: Delete Confirmation Dialog                                    */}
      {/* ---------------------------------------------------------------------- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#0f1a1e] border border-red-500/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Transaction?</h3>
              <p className="text-xs text-[#afcdc8] mt-1 leading-relaxed">
                This transaction will be removed from your ledger and the account balance will be atomically reversed.
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
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
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
