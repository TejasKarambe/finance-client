import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import {
  budgetsApi,
  type BudgetStatus,
  type CreateBudgetPayload,
  getErrorMessage
} from '#/lib/api'
import { useCurrency } from '#/lib/currency-context'
import {
  PieChart,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Calendar,
  X,
  Sparkles,
  TrendingUp,
  ShieldAlert
} from 'lucide-react'

export const Route = createFileRoute('/budgets')({
  component: BudgetsPage,
})

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining & Restaurants',
  'Housing & Rent',
  'Utilities',
  'Entertainment',
  'Transportation',
  'Healthcare',
  'Shopping',
  'Education',
  'Other',
]

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function BudgetsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currency, currencySymbol, formatCurrency } = useCurrency()

  // Selected Period
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear())

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<BudgetStatus | null>(null)

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setErrorMessage(null)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  // Fetch Budget Statuses for the active month/year
  const {
    data: budgetStatuses = [],
    isLoading,
    isRefetching,
  } = useQuery<BudgetStatus[]>({
    queryKey: ['budget-status', selectedMonth, selectedYear],
    queryFn: () => budgetsApi.getStatus(selectedMonth, selectedYear),
    enabled: isAuthenticated,
  })

  // Create / Update Budget Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: CreateBudgetPayload) => budgetsApi.createOrUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-status'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      showSuccess(
        editingBudget ? 'Budget limit updated successfully!' : 'Category budget created successfully!'
      )
      setIsModalOpen(false)
      setEditingBudget(null)
    },
    onError: (err) => {
      showError(getErrorMessage(err))
    },
  })

  // Delete Budget Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-status'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      showSuccess('Category budget removed.')
      setDeletingBudget(null)
    },
    onError: (err) => {
      showError(getErrorMessage(err))
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-[#afcdc8]">
          Please sign in to manage your category spending budgets and live threshold alerts.
        </p>
        <button
          onClick={() => navigate({ to: '/login' })}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20"
        >
          Sign In
        </button>
      </div>
    )
  }

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  const handleResetToCurrent = () => {
    setSelectedMonth(today.getMonth() + 1)
    setSelectedYear(today.getFullYear())
  }

  // Calculations for Overview Banner
  const totalBudget = budgetStatuses.reduce((acc, b) => acc + (Number(b.limitAmount) || 0), 0)
  const totalSpent = budgetStatuses.reduce((acc, b) => acc + (Number(b.spentAmount) || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const exceededCount = budgetStatuses.filter((b) => b.status === 'EXCEEDED').length
  const warningCount = budgetStatuses.filter((b) => b.status === 'WARNING').length

  const handleOpenAdd = () => {
    setEditingBudget(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (budget: BudgetStatus) => {
    setEditingBudget(budget)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const category = formData.get('category') as string
    const limitAmount = Number(formData.get('limitAmount'))

    if (!category || isNaN(limitAmount) || limitAmount <= 0) {
      showError('Please provide a valid category and a positive budget limit.')
      return
    }

    saveMutation.mutate({
      category,
      limitAmount,
      month: selectedMonth,
      year: selectedYear,
    })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header & Month Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0f1a1e] via-[#12242b] to-[#0a1418] border border-[#8de5db]/15 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4fb8b2] bg-[#4fb8b2]/10 px-2.5 py-0.5 rounded-full border border-[#4fb8b2]/20">
              Proactive Financial Controls
            </span>
            <span className="text-xs text-[#afcdc8] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4fb8b2]" />
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight flex items-center gap-2.5">
            <PieChart className="w-7 h-7 text-[#4fb8b2]" />
            Monthly Budget Management
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8] mt-0.5">
            Set proactive spending caps per category and receive automated visual alerts at 80% and 100% thresholds.
          </p>
        </div>

        {/* Month Selector & Add Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Stepper */}
          <div className="flex items-center bg-[#070e11] border border-[#8de5db]/20 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white min-w-[110px] text-center">
              {MONTH_NAMES[selectedMonth - 1].slice(0, 3)} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {(selectedMonth !== today.getMonth() + 1 || selectedYear !== today.getFullYear()) && (
            <button
              onClick={handleResetToCurrent}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#070e11] border border-[#8de5db]/20 text-[#60d7cf] hover:bg-white/5 transition-all"
            >
              Current Month
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Budget</span>
          </button>
        </div>
      </div>

      {/* Threshold Alert Banners (if any budget exceeded or at warning) */}
      {exceededCount > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-400">
                Overspend Alert: {exceededCount} {exceededCount === 1 ? 'category has' : 'categories have'} exceeded budget limit!
              </h3>
              <p className="text-xs text-red-300/80">
                Review your recent transactions or increase your monthly allowance to rebalance your cash flow.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            ACTION REQUIRED
          </span>
        </div>
      )}

      {warningCount > 0 && exceededCount === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-400">
                Threshold Warning: {warningCount} {warningCount === 1 ? 'category is' : 'categories are'} above 80% of limit!
              </h3>
              <p className="text-xs text-amber-300/80">
                Spending has reached critical levels for this month. Pace remaining expenses carefully.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            80% THRESHOLD
          </span>
        </div>
      )}

      {/* Aggregate Overview Card */}
      <div className="p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4fb8b2]" />
              Portfolio Budget Consumption ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
            </h2>
            <p className="text-xs text-[#afcdc8] mt-0.5">
              Aggregated spending pace against allocated monthly limits across {budgetStatuses.length} budgeted categories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                overallPercentage >= 100
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : overallPercentage >= 80
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {overallPercentage >= 100
                ? 'OVERALL EXCEEDED'
                : overallPercentage >= 80
                ? 'APPROACHING LIMIT'
                : 'HEALTHY PACE'}
            </span>
          </div>
        </div>

        {/* 3 Metric Summary Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#070e11]/80 border border-[#8de5db]/10">
            <span className="text-[11px] font-semibold text-[#afcdc8] uppercase tracking-wider block">
              Total Budgeted ({currency})
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {formatCurrency(totalBudget)}
            </span>
            <span className="text-[10px] text-[#afcdc8]">Allocated spending ceiling</span>
          </div>

          <div className="p-4 rounded-xl bg-[#070e11]/80 border border-[#8de5db]/10">
            <span className="text-[11px] font-semibold text-[#afcdc8] uppercase tracking-wider block">
              Total Consumed
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {formatCurrency(totalSpent)}
            </span>
            <span className="text-[10px] text-[#afcdc8]">Actual recorded expenses</span>
          </div>

          <div className="p-4 rounded-xl bg-[#070e11]/80 border border-[#8de5db]/10">
            <span className="text-[11px] font-semibold text-[#afcdc8] uppercase tracking-wider block">
              Remaining Buffer
            </span>
            <span
              className={`text-2xl font-extrabold mt-1 block ${
                totalRemaining >= 0 ? 'text-[#60d7cf]' : 'text-red-400'
              }`}
            >
              {totalRemaining >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalRemaining))}
            </span>
            <span className="text-[10px] text-[#afcdc8]">
              {totalRemaining >= 0 ? 'Safe unspent allowance' : 'Total deficit excess'}
            </span>
          </div>
        </div>

        {/* Overall Progress Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#afcdc8]">Overall Spending Rate</span>
            <span
              className={
                overallPercentage >= 100
                  ? 'text-red-400 font-bold'
                  : overallPercentage >= 80
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
              }
            >
              {overallPercentage.toFixed(1)}% of total allowance consumed
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-[#070e11] border border-[#8de5db]/20 overflow-hidden">
            <div
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              className={`h-full rounded-full transition-all duration-500 shadow-lg ${
                overallPercentage >= 100
                  ? 'bg-gradient-to-r from-red-600 to-red-400'
                  : overallPercentage >= 80
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-[#328f97] to-[#4fb8b2]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#4fb8b2]" />
            Category Budgets ({budgetStatuses.length})
          </h2>
          {isRefetching && (
            <span className="text-xs text-[#afcdc8] animate-pulse">Syncing balances...</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-16 rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/15 text-center text-xs text-[#afcdc8] animate-pulse">
            Loading category budgets...
          </div>
        ) : budgetStatuses.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0f1a1e]/90 border border-dashed border-[#8de5db]/25 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4fb8b2]/10 border border-[#4fb8b2]/20 flex items-center justify-center text-[#60d7cf]">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">No Budgets Set for {MONTH_NAMES[selectedMonth - 1]}</h3>
              <p className="text-xs text-[#afcdc8] mt-1">
                Allocate spending caps for Groceries, Utilities, Housing, or Dining to take control of your financial habits.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all"
              >
                + Create First Budget
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgetStatuses.map((budget) => {
              const spent = Number(budget.spentAmount) || 0
              const limit = Number(budget.limitAmount) || 0
              const remaining = Number(budget.remainingAmount) || 0
              const percentage = Number(budget.percentageSpent) || 0
              const isExceeded = budget.status === 'EXCEEDED'
              const isWarning = budget.status === 'WARNING'

              return (
                <div
                  key={budget.budgetId || budget.category}
                  className={`p-5 rounded-2xl bg-[#0f1a1e]/90 border transition-all shadow-lg flex flex-col justify-between space-y-5 ${
                    isExceeded
                      ? 'border-red-500/40 bg-gradient-to-b from-[#0f1a1e] to-red-950/20'
                      : isWarning
                      ? 'border-amber-500/40 bg-gradient-to-b from-[#0f1a1e] to-amber-950/20'
                      : 'border-[#8de5db]/15 hover:border-[#4fb8b2]/40'
                  }`}
                >
                  {/* Top Bar: Category & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {budget.category}
                      </h3>
                      <span className="text-[11px] text-[#afcdc8]">
                        Limit: {formatCurrency(limit)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                          isExceeded
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {budget.status}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#afcdc8]">
                        {formatCurrency(spent)} spent
                      </span>
                      <span
                        className={
                          isExceeded
                            ? 'text-red-400 font-bold'
                            : isWarning
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-[#070e11] border border-[#8de5db]/15 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-gradient-to-r from-red-600 to-red-400'
                            : isWarning
                            ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Financial Stats Breakdown */}
                  <div className="p-3 rounded-xl bg-[#070e11]/80 border border-[#8de5db]/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-[#afcdc8] block">Remaining</span>
                      <span
                        className={`font-bold ${
                          remaining >= 0 ? 'text-[#60d7cf]' : 'text-red-400'
                        }`}
                      >
                        {remaining >= 0 ? '+' : '-'}{formatCurrency(Math.abs(remaining))}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-[#afcdc8] block">Threshold</span>
                      <span className="font-semibold text-white">
                        {isExceeded ? '100% Exceeded' : isWarning ? '80% Warning' : 'Healthy'}
                      </span>
                    </div>
                  </div>

                  {/* Alert Callout Message */}
                  {budget.alertMessage && (
                    <div
                      className={`p-2.5 rounded-lg text-[11px] font-medium flex items-center gap-2 ${
                        isExceeded
                          ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {isExceeded ? (
                        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      )}
                      <span className="truncate">{budget.alertMessage}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#8de5db]/10">
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#070e11] border border-[#8de5db]/20 text-[#afcdc8] hover:text-white hover:border-[#4fb8b2] text-xs font-semibold transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#4fb8b2]" />
                      <span>Adjust Cap</span>
                    </button>
                    {budget.budgetId && (
                      <button
                        onClick={() => setDeletingBudget(budget)}
                        className="p-1.5 rounded-lg bg-[#070e11] border border-[#8de5db]/20 text-[#afcdc8] hover:text-red-400 hover:border-red-500/40 text-xs transition-all"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1a1e] border border-[#8de5db]/25 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#8de5db]/15 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#4fb8b2]" />
                  {editingBudget ? 'Adjust Budget Limit' : 'Configure Category Budget'}
                </h3>
                <p className="text-xs text-[#afcdc8] mt-0.5">
                  Set target cap for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Expense Category
                </label>
                <select
                  name="category"
                  required
                  defaultValue={editingBudget?.category || DEFAULT_CATEGORIES[0]}
                  className="w-full px-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Limit Amount */}
              <div>
                <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-1.5">
                  Monthly Limit Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-[#60d7cf] text-sm font-bold">{currencySymbol}</span>
                  <input
                    name="limitAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    defaultValue={editingBudget?.limitAmount || ''}
                    placeholder="e.g. 500.00"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>
                <p className="text-[11px] text-[#afcdc8] mt-1">
                  Threshold alerts trigger automatically at 80% and 100% of this limit.
                </p>
              </div>

              {/* Active Period Display */}
              <div className="p-3 rounded-xl bg-[#070e11]/80 border border-[#8de5db]/10 flex items-center justify-between text-xs">
                <span className="text-[#afcdc8]">Target Period:</span>
                <span className="font-bold text-[#60d7cf]">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#8de5db]/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editingBudget ? 'Update Limit' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f1a1e] border border-red-500/30 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Remove Budget Cap?</h3>
              <p className="text-xs text-[#afcdc8] mt-1 leading-relaxed">
                Are you sure you want to remove the <span className="font-bold text-white">{deletingBudget.category}</span> budget limit of {formatCurrency(Number(deletingBudget.limitAmount))}? Your transaction records will remain unaffected.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingBudget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
              >
                Keep Budget
              </button>
              <button
                onClick={() => deletingBudget.budgetId && deleteMutation.mutate(deletingBudget.budgetId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Removing...' : 'Delete Limit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
