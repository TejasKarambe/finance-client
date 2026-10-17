import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import { 
  recurringApi, 
  accountsApi, 
  type RecurringTransaction, 
  type CreateRecurringTransactionPayload,
  type RecurrenceFrequency,
  type TransactionType,
  getErrorMessage 
} from '#/lib/api'
import { 
  Repeat, 
  Plus, 
  Play, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Filter, 
  DollarSign, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  CreditCard
} from 'lucide-react'

export const Route = createFileRoute('/recurring')({
  component: RecurringPage,
})

const CATEGORIES = [
  'Housing & Rent',
  'Utilities',
  'Subscriptions & SaaS',
  'Insurance',
  'Salary & Wages',
  'Internet & Phone',
  'Loan Repayment',
  'Gym & Fitness',
  'Education',
  'Other',
]

const FREQUENCIES: RecurrenceFrequency[] = [
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]

function RecurringPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'DUE'>('ALL')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<CreateRecurringTransactionPayload>({
    accountId: 0,
    title: '',
    amount: 0,
    type: 'EXPENSE',
    category: 'Subscriptions & SaaS',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().slice(0, 10),
    nextDueDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'CREDIT_CARD',
    description: '',
    active: true,
    autoProcess: false,
  })

  // Queries
  const { data: recurringItems = [], isLoading: isLoadingRecurring } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: recurringApi.getAll,
    enabled: isAuthenticated,
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
    enabled: isAuthenticated,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateRecurringTransactionPayload) => recurringApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setIsModalOpen(false)
      resetForm()
      setSuccessMsg('Recurring schedule created successfully!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateRecurringTransactionPayload> }) =>
      recurringApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setIsModalOpen(false)
      setEditingItem(null)
      resetForm()
      setSuccessMsg('Recurring schedule updated!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recurringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setSuccessMsg('Recurring schedule deleted.')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const processMutation = useMutation({
    mutationFn: (id: number) => recurringApi.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setSuccessMsg('Transaction successfully posted to your ledger!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const processAllDueMutation = useMutation({
    mutationFn: recurringApi.processAllDue,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setSuccessMsg(`Successfully processed ${data.length} due recurring items!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  const resetForm = () => {
    setFormData({
      accountId: accounts[0]?.id || 0,
      title: '',
      amount: 0,
      type: 'EXPENSE',
      category: 'Subscriptions & SaaS',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().slice(0, 10),
      nextDueDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CREDIT_CARD',
      description: '',
      active: true,
      autoProcess: false,
    })
    setErrorMsg(null)
  }

  const handleOpenCreate = () => {
    setEditingItem(null)
    resetForm()
    if (accounts.length > 0) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }))
    }
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: RecurringTransaction) => {
    setEditingItem(item)
    setFormData({
      accountId: item.accountId,
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      startDate: item.startDate,
      nextDueDate: item.nextDueDate,
      endDate: item.endDate || '',
      paymentMethod: item.paymentMethod || 'OTHER',
      description: item.description || '',
      active: item.active,
      autoProcess: item.autoProcess,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.accountId) {
      setErrorMsg('Please select an account')
      return
    }
    if (!formData.title.trim()) {
      setErrorMsg('Please enter a schedule title')
      return
    }
    if (formData.amount <= 0) {
      setErrorMsg('Amount must be greater than zero')
      return
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  // Summary Metrics
  const activeSchedules = recurringItems.filter((i) => i.active)
  const monthlyExpenseBurn = activeSchedules
    .filter((i) => i.type === 'EXPENSE')
    .reduce((sum, item) => {
      let monthlyVal = item.amount
      if (item.frequency === 'DAILY') monthlyVal = item.amount * 30
      if (item.frequency === 'WEEKLY') monthlyVal = item.amount * 4.33
      if (item.frequency === 'BIWEEKLY') monthlyVal = item.amount * 2.16
      if (item.frequency === 'QUARTERLY') monthlyVal = item.amount / 3
      if (item.frequency === 'YEARLY') monthlyVal = item.amount / 12
      return sum + monthlyVal
    }, 0)

  const dueItems = recurringItems.filter((i) => i.isDue && i.active)

  const filteredItems = recurringItems.filter((item) => {
    if (filterType === 'INCOME') return item.type === 'INCOME'
    if (filterType === 'EXPENSE') return item.type === 'EXPENSE'
    if (filterType === 'DUE') return item.isDue && item.active
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-[#4fb8b2]" />
            Recurring Transactions & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8] mt-1">
            Automate recurring rent, SaaS subscriptions, bills, and payroll entries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {dueItems.length > 0 && (
            <button
              onClick={() => processAllDueMutation.mutate()}
              disabled={processAllDueMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>Process All Due ({dueItems.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-lg shadow-[#4fb8b2]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Recurring Schedule</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Monthly Recurring Burn
          </span>
          <div className="text-2xl font-bold text-white mt-1">
            ${monthlyExpenseBurn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#afcdc8]/70 mt-1 block">
            Across {activeSchedules.filter((s) => s.type === 'EXPENSE').length} active expense commitments
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Active Schedules
          </span>
          <div className="text-2xl font-bold text-[#60d7cf] mt-1">
            {activeSchedules.length}
          </div>
          <span className="text-[10px] text-[#afcdc8]/70 mt-1 block">
            {recurringItems.length - activeSchedules.length} paused schedules
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Due For Processing
          </span>
          <div className={`text-2xl font-bold mt-1 ${dueItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {dueItems.length}
          </div>
          <span className="text-[10px] text-[#afcdc8]/70 mt-1 block">
            {dueItems.length > 0 ? 'Ready to post to transactions ledger' : 'All recurring items up to date'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#8de5db]/15 pb-2">
        {(['ALL', 'EXPENSE', 'INCOME', 'DUE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === tab
                ? 'bg-[#4fb8b2]/20 text-[#60d7cf] border border-[#4fb8b2]/40 shadow-sm'
                : 'text-[#afcdc8] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'DUE' ? `Due Now (${dueItems.length})` : tab}
          </button>
        ))}
      </div>

      {/* Schedule Items List */}
      {isLoadingRecurring ? (
        <div className="py-16 text-center text-xs text-[#afcdc8] flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#4fb8b2]" />
          <span>Loading recurring schedules...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d1b20]/60 border border-[#8de5db]/10 flex flex-col items-center gap-3">
          <Repeat className="w-10 h-10 text-[#4fb8b2]/40" />
          <h3 className="text-sm font-semibold text-white">No Recurring Schedules Found</h3>
          <p className="text-xs text-[#afcdc8] max-w-sm">
            Set up automatic reminders and ledger postings for your subscriptions, rent, insurance, or salary.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90"
          >
            Create First Schedule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-[#0d1b20] border transition-all flex flex-col justify-between ${
                item.isDue && item.active
                  ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'border-[#8de5db]/15 hover:border-[#8de5db]/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        item.type === 'INCOME'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.type === 'INCOME' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-tight">{item.title}</h3>
                      <span className="text-[10px] text-[#afcdc8]">{item.category}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.active
                        ? 'bg-[#4fb8b2]/20 text-[#60d7cf] border border-[#4fb8b2]/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.frequency}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-white">
                    {item.type === 'INCOME' ? '+' : '-'}$
                    {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-[#afcdc8] flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-[#4fb8b2]" />
                    {item.accountName}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#8de5db]/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#afcdc8] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#4fb8b2]" />
                    Next: {item.nextDueDate}
                  </span>

                  {item.isDue ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Due Now
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#afcdc8]/70">
                      in {item.daysUntilDue} day{item.daysUntilDue !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="mt-4 pt-3 border-t border-[#8de5db]/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => processMutation.mutate(item.id)}
                  disabled={processMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-sm transition-all cursor-pointer"
                  title="Execute and post this transaction to your ledger now"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Now</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Edit schedule"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete recurring schedule for "${item.title}"?`)) {
                      deleteMutation.mutate(item.id)
                    }
                  }}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Delete schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0c181d] border border-[#8de5db]/30 shadow-2xl p-6 text-left my-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-[#4fb8b2]" />
              {editingItem ? 'Edit Recurring Schedule' : 'Create Recurring Schedule'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#afcdc8] mb-1">Schedule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix Subscription, Apartment Rent"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Recurrence Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurrenceFrequency })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Target Account *</label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (${acc.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Next Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#afcdc8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-[#8de5db]/30 text-[#4fb8b2] focus:ring-0"
                  />
                  <span>Active Schedule</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#afcdc8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoProcess}
                    onChange={(e) => setFormData({ ...formData, autoProcess: e.target.checked })}
                    className="rounded border-[#8de5db]/30 text-[#4fb8b2] focus:ring-0"
                  />
                  <span>Auto-post to ledger</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#8de5db]/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {editingItem ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
