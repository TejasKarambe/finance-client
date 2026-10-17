import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import {
  accountsApi,
  transactionsApi,
  dashboardApi,
  insightsApi,
  recurringApi,
  savingsGoalsApi,
  type Transaction,
  type Account,
  type DashboardSummary,
  type CategoryBreakdown,
  type MonthlyTrend,
  type AiInsightResponse
} from '#/lib/api'
import { useCurrency } from '#/lib/currency-context'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PieChart,
  ShieldCheck,
  Zap,
  Download,
  Plus,
  Building2,
  CreditCard,
  Banknote,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Brain,
  Sparkles,
  Repeat,
  Target
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <UnauthenticatedLanding />
  }

  return <AuthenticatedDashboard user={user} />
}

// Category palette mapping
const CATEGORY_COLORS: Record<string, string> = {
  Salary: '#10b981',
  Groceries: '#34d399',
  'Dining & Restaurants': '#f59e0b',
  'Housing & Rent': '#818cf8',
  Utilities: '#38bdf8',
  Entertainment: '#ec4899',
  Transportation: '#a855f7',
  Healthcare: '#ef4444',
  Shopping: '#06b6d4',
  Education: '#3b82f6',
  Investment: '#60d7cf',
  Transfer: '#94a3b8',
  Other: '#64748b',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#4fb8b2'
}

// ---------------------------------------------------------------------------
// 1. Authenticated Dashboard View
// ---------------------------------------------------------------------------
function AuthenticatedDashboard({ user }: { user: { name: string; email: string } | null }) {
  // Time period filter: null = All Time, or specific month/year
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [period, setPeriod] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL')

  let queryMonth: number | undefined = undefined
  let queryYear: number | undefined = undefined

  if (period === 'THIS_MONTH') {
    queryMonth = currentMonth
    queryYear = currentYear
  } else if (period === 'LAST_MONTH') {
    queryMonth = currentMonth === 1 ? 12 : currentMonth - 1
    queryYear = currentMonth === 1 ? currentYear - 1 : currentYear
  }

  // 1. Fetch Dashboard Summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary', queryMonth, queryYear],
    queryFn: () => dashboardApi.getSummary(queryMonth, queryYear),
  })

  // 2. Fetch Category Breakdown
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', queryMonth, queryYear],
    queryFn: () => dashboardApi.getCategoryBreakdown(queryMonth, queryYear),
  })

  // 3. Fetch Monthly Cash Flow Trend (Last 6 Months)
  const { data: monthlyTrends = [], isLoading: isLoadingTrends } = useQuery<MonthlyTrend[]>({
    queryKey: ['monthly-trend'],
    queryFn: () => dashboardApi.getMonthlyTrend(6),
  })

  // 4. Fetch Tracked Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  // 5. Fetch Recent Transactions
  const { data: transactionsData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionsApi.getAll({ size: 5, sortDir: 'desc' }),
  })

  // 6. Fetch AI Spending Insights & Financial Health Score
  const { data: aiInsights } = useQuery<AiInsightResponse>({
    queryKey: ['ai-insights'],
    queryFn: insightsApi.getSpendingInsights,
  })

  // 7. Fetch Recurring Schedules & Goals
  const { data: recurringItems = [] } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: recurringApi.getAll,
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: savingsGoalsApi.getAll,
  })

  const recentTransactions: Transaction[] = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as { content?: Transaction[] })?.content || []

  const { currency, currencySymbol, formatCurrency, formatRawNumber, baseCurrency, autoConvert } = useCurrency()

  // Account currency lookup map for accurate per-transaction conversion
  const accountCurrencyMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.currency || baseCurrency])),
    [accounts, baseCurrency]
  )

  // Metrics derived from live backend or converted accounts (expressed in active display currency)
  const totalNetWorth = accounts.length > 0
    ? accounts.reduce((acc, a) => acc + formatRawNumber(Number(a.balance) || 0, a.currency || baseCurrency), 0)
    : formatRawNumber(summary?.totalAccountBalance ?? 0, baseCurrency)

  const totalIncome = formatRawNumber(summary?.totalIncome ?? 0, baseCurrency)
  const totalExpenses = formatRawNumber(summary?.totalExpenses ?? 0, baseCurrency)
  const netCashFlow = totalIncome - totalExpenses

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return <Building2 className="w-4 h-4 text-[#4fb8b2]" />
      case 'SAVINGS':
        return <Wallet className="w-4 h-4 text-[#6ec89a]" />
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-amber-400" />
      default:
        return <Banknote className="w-4 h-4 text-teal-300" />
    }
  }

  // Highest value for bar chart scaling
  const maxTrendVal = Math.max(
    ...monthlyTrends.map((t) => Math.max(Number(t.income) || 0, Number(t.expense) || 0)),
    100
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Bar & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0f1a1e] via-[#12242b] to-[#0a1418] border border-[#8de5db]/15 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4fb8b2] bg-[#4fb8b2]/10 px-2.5 py-0.5 rounded-full border border-[#4fb8b2]/20">
              Live Executive Dashboard
            </span>
            <span className="text-xs text-[#afcdc8] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4fb8b2]" />
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Welcome back, {user?.name || 'Investor'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8] mt-0.5">
            Your real-time multi-account ledger, monthly cash flow, and category spending analytics.
          </p>
        </div>

        {/* Time Period Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#070e11] border border-[#8de5db]/20">
            <button
              onClick={() => setPeriod('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === 'ALL'
                  ? 'bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white shadow-sm'
                  : 'text-[#afcdc8] hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriod('THIS_MONTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === 'THIS_MONTH'
                  ? 'bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white shadow-sm'
                  : 'text-[#afcdc8] hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('LAST_MONTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === 'LAST_MONTH'
                  ? 'bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white shadow-sm'
                  : 'text-[#afcdc8] hover:text-white'
              }`}
            >
              Last Month
            </button>
          </div>

          <Link
            to="/transactions"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </Link>
        </div>
      </div>

      {/* AI Financial Health & Strategic Milestones Banner */}
      {aiInsights && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0c1a20] via-[#0f242c] to-[#0a1519] border border-[#8de5db]/25 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#328f97] to-[#4fb8b2] flex items-center justify-center text-white shadow-lg shadow-[#4fb8b2]/20">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4fb8b2]">
                    AI Financial Health Intelligence
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4fb8b2]/20 text-[#60d7cf] border border-[#4fb8b2]/30">
                    Grade {aiInsights.healthGrade}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  Financial Health Score: {aiInsights.financialHealthScore} / 100
                </h2>
              </div>
            </div>

            {/* Quick Links to New Features */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/recurring"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#081216] border border-[#8de5db]/15 hover:border-[#8de5db]/30 text-xs font-semibold text-[#afcdc8] hover:text-white transition-all"
              >
                <Repeat className="w-3.5 h-3.5 text-[#4fb8b2]" />
                <span>{recurringItems.filter((i) => i.active).length} Subscriptions</span>
              </Link>

              <Link
                to="/goals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#081216] border border-[#8de5db]/15 hover:border-[#8de5db]/30 text-xs font-semibold text-[#afcdc8] hover:text-white transition-all"
              >
                <Target className="w-3.5 h-3.5 text-[#4fb8b2]" />
                <span>{goals.length} Savings Goals</span>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#328f97]/20 border border-[#4fb8b2]/30 text-xs font-semibold text-[#60d7cf] hover:bg-[#328f97]/30 transition-all"
              >
                <span>Full AI Report</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <p className="text-xs text-[#afcdc8] leading-relaxed bg-[#081216]/60 p-3 rounded-xl border border-[#8de5db]/10">
            {aiInsights.healthSummary}
          </p>

          {/* Quick Highlight Recommendations */}
          {aiInsights.insights && aiInsights.insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {aiInsights.insights.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#081216] border border-[#8de5db]/15 flex items-start gap-2.5 hover:border-[#8de5db]/30 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#4fb8b2] shrink-0 mt-0.5" />
                  <div className="text-left min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <p className="text-[11px] text-[#afcdc8] leading-relaxed mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md hover:border-[#4fb8b2]/30 transition-all">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Total Net Worth ({currency})</span>
            <div className="p-2 rounded-lg bg-[#4fb8b2]/10 text-[#4fb8b2]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isLoadingSummary ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                formatCurrency(totalNetWorth, currency)
              )}
            </span>
          </div>
          <p className="text-[11px] text-[#afcdc8] mt-2 flex items-center justify-between">
            <span>Portfolio Across {accounts.length} Accounts</span>
            <Link to="/accounts" className="text-[#60d7cf] hover:underline font-semibold">
              View &rarr;
            </Link>
          </p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">
              {period === 'ALL' ? 'Total Income' : 'Period Income'}
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {isLoadingSummary ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `+${formatCurrency(totalIncome, currency)}`
              )}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Inflow &amp; Salary Credits
          </p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">
              {period === 'ALL' ? 'Total Expenses' : 'Period Expenses'}
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight">
              {isLoadingSummary ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `-${formatCurrency(totalExpenses, currency)}`
              )}
            </span>
          </div>
          <p className="text-[11px] text-red-400/80 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Outflow &amp; Tracked Bills
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md hover:border-[#4fb8b2]/30 transition-all">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Net Cash Flow</span>
            <div className="p-2 rounded-lg bg-[#328f97]/15 text-[#60d7cf]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                netCashFlow >= 0 ? 'text-[#60d7cf]' : 'text-amber-400'
              }`}
            >
              {isLoadingSummary ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${netCashFlow >= 0 ? '+' : '-'}${formatCurrency(Math.abs(netCashFlow), currency)}`
              )}
            </span>
          </div>
          <p className="text-[11px] text-[#afcdc8] mt-2 flex items-center justify-between">
            <span>{netCashFlow >= 0 ? 'Surplus Retained' : 'Deficit Alert'}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                netCashFlow >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {netCashFlow >= 0 ? 'POSITIVE' : 'NEGATIVE'}
            </span>
          </p>
        </div>
      </div>

      {/* Row 2: Charts & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Monthly Income vs Expense Dual-Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4fb8b2]" />
                Income vs Expense Monthly Trend
              </h2>
              <p className="text-xs text-[#afcdc8] mt-0.5">
                Past 6-month cash flow trajectory and monthly savings margins.
              </p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                Income
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
                Expense
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          {isLoadingTrends ? (
            <div className="h-56 flex items-center justify-center text-xs text-[#afcdc8] animate-pulse">
              Computing trend analytics...
            </div>
          ) : monthlyTrends.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-[#afcdc8]">
              No trend history recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-52 flex items-end justify-between gap-2 sm:gap-6 pt-6 px-2 border-b border-[#8de5db]/15">
                {monthlyTrends.map((t) => {
                  const incomeH = Math.max(
                    Math.round(((Number(t.income) || 0) / maxTrendVal) * 160),
                    4
                  )
                  const expenseH = Math.max(
                    Math.round(((Number(t.expense) || 0) / maxTrendVal) * 160),
                    4
                  )

                  return (
                    <div
                      key={t.monthKey}
                      className="flex-1 flex flex-col items-center gap-2 group relative"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-3 py-1.5 rounded-lg bg-[#070e11] border border-[#8de5db]/30 text-white text-[11px] shadow-2xl whitespace-nowrap">
                        <span className="font-bold text-[#60d7cf]">{t.monthLabel}</span>
                        <div className="text-emerald-400">Income: {formatCurrency(Number(t.income))}</div>
                        <div className="text-red-400">Expense: {formatCurrency(Number(t.expense))}</div>
                      </div>

                      {/* Bars Container */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                        {/* Income Bar */}
                        <div
                          style={{ height: `${incomeH}px` }}
                          className="w-1/2 max-w-[24px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md group-hover:brightness-110 transition-all duration-300"
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expenseH}px` }}
                          className="w-1/2 max-w-[24px] rounded-t-md bg-gradient-to-t from-red-600 to-red-400 shadow-md group-hover:brightness-110 transition-all duration-300"
                        />
                      </div>

                      {/* Month Label */}
                      <span className="text-[11px] font-semibold text-[#afcdc8] group-hover:text-white transition-colors">
                        {t.monthLabel.split(' ')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#afcdc8] pt-1">
                <span>Displaying past 6 calendar months</span>
                <span>Values scaled dynamically to peak monthly cash flow</span>
              </div>
            </div>
          )}
        </div>

        {/* Right (1 col): Spending by Category Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#4fb8b2]" />
                Spending by Category
              </h2>
              <p className="text-xs text-[#afcdc8] mt-0.5">
                {period === 'ALL' ? 'All-Time Outflow' : 'Period Outflow'}
              </p>
            </div>
            <span className="text-xs font-bold text-[#60d7cf]">
              {formatCurrency(totalExpenses, currency)}
            </span>
          </div>

          {isLoadingCategories ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#afcdc8] animate-pulse">
              Aggregating categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-[#afcdc8]">No expense categories recorded yet.</p>
              <Link
                to="/transactions"
                className="mt-3 text-xs font-semibold text-[#60d7cf] hover:underline inline-flex items-center gap-1"
              >
                Add First Expense &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Segmented Progress Bar */}
              <div className="h-3.5 w-full rounded-full bg-[#070e11] overflow-hidden flex border border-[#8de5db]/20">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${Math.max(cat.percentage || 0, 3)}%`,
                      backgroundColor: getCategoryColor(cat.category),
                    }}
                    title={`${cat.category}: ${formatCurrency(Number(cat.totalAmount))} (${cat.percentage}%)`}
                    className="h-full hover:opacity-85 transition-opacity"
                  />
                ))}
              </div>

              {/* Category List */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {categories.map((cat, idx) => {
                  const color = getCategoryColor(cat.category)
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#070e11]/60 border border-[#8de5db]/10 flex items-center justify-between hover:border-[#8de5db]/25 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold text-white">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">
                          {formatCurrency(Number(cat.totalAmount))}
                        </span>
                        <span className="block text-[10px] text-[#afcdc8]">
                          {cat.percentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Tracked Accounts Portfolio & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tracked Accounts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#4fb8b2]" />
              Tracked Accounts ({accounts.length})
            </h2>
            <Link to="/accounts" className="text-xs font-semibold text-[#60d7cf] hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoadingAccounts ? (
              <div className="p-6 text-center text-xs text-[#afcdc8] animate-pulse">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#0f1a1e] border border-dashed border-[#8de5db]/20 text-center">
                <p className="text-xs text-[#afcdc8]">No accounts tracked yet.</p>
                <Link
                  to="/accounts"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4fb8b2]/20 text-[#60d7cf] text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Account
                </Link>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 rounded-xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 flex items-center justify-between hover:border-[#4fb8b2]/40 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#070e11] border border-[#8de5db]/20 flex items-center justify-center">
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{account.name}</h3>
                      <span className="text-[10px] text-[#afcdc8] uppercase tracking-wider">{account.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(Number(account.balance), account.currency)}
                    </span>
                    <span className="block text-[10px] text-[#afcdc8]">
                      {autoConvert && account.currency && account.currency.toUpperCase() !== currency.toUpperCase()
                        ? `Orig: ${account.currency}`
                        : account.currency || 'USD'}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Quick Inter-Account Transfer Action */}
            <Link
              to="/accounts"
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#070e11] border border-[#8de5db]/20 text-[#d7ece8] text-xs font-semibold hover:bg-white/5 transition-all"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#4fb8b2]" />
              <span>Execute Zero-Sum Transfer</span>
            </Link>
          </div>
        </div>

        {/* Right: Recent Transactions Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#4fb8b2]" />
              Recent Transactions
            </h2>
            <Link to="/transactions" className="text-xs font-semibold text-[#60d7cf] hover:underline flex items-center gap-1">
              View Full Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 overflow-hidden shadow-md">
            {isLoadingTx ? (
              <div className="p-10 text-center text-xs text-[#afcdc8] animate-pulse">
                Loading transactions...
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-[#afcdc8]">No transactions recorded yet.</p>
                <Link
                  to="/transactions"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add First Transaction
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#8de5db]/10">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : tx.type === 'EXPENSE'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-[#4fb8b2]/15 text-[#4fb8b2]'
                        }`}
                      >
                        {tx.type === 'INCOME' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : tx.type === 'EXPENSE' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowLeftRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{tx.category}</span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              tx.type === 'INCOME'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.type === 'EXPENSE'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-[#4fb8b2]/10 text-[#60d7cf] border border-[#4fb8b2]/20'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-xs text-[#afcdc8] truncate max-w-xs sm:max-w-md">
                          {tx.description || 'No description'} • {tx.transactionDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-bold tracking-tight ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-400'
                            : tx.type === 'EXPENSE'
                            ? 'text-red-400'
                            : 'text-[#60d7cf]'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                        {formatCurrency(Number(tx.amount), accountCurrencyMap.get(tx.accountId) || baseCurrency)}
                      </span>
                      {tx.paymentMethod && (
                        <span className="block text-[10px] text-[#afcdc8]/70 uppercase">
                          {tx.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Unauthenticated Marketing Landing Hero
// ---------------------------------------------------------------------------
function UnauthenticatedLanding() {
  const features = [
    {
      icon: Wallet,
      title: 'Multi-Account Balances',
      desc: 'Seamlessly manage checking, cash, savings, and investments in one place with real-time balance calculations.',
    },
    {
      icon: Zap,
      title: 'Zero-Sum Transfers',
      desc: 'Transfer money between accounts without skewing your income and expense cash flow reports.',
    },
    {
      icon: PieChart,
      title: 'Proactive Budget Alerts',
      desc: 'Set category thresholds with visual alerts when spending reaches 80% or exceeds 100%.',
    },
    {
      icon: Download,
      title: 'Instant CSV Export',
      desc: 'Export your categorized financial ledger anytime in clean CSV format for spreadsheets and tax filing.',
    },
    {
      icon: ShieldCheck,
      title: 'Spring Security & JWT',
      desc: 'Stateless JWT authentication with BCrypt encryption ensures complete tenant data isolation.',
    },
    {
      icon: TrendingUp,
      title: 'Rich Visual Analytics',
      desc: 'High-clarity monthly income-vs-expense metrics and category breakdown leaderboards.',
    },
  ]

  return (
    <div className="py-12 lg:py-20 animate-fade-in space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4fb8b2]/10 border border-[#4fb8b2]/30 text-[#60d7cf] text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Production-Ready Personal Finance Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Master Your Wealth, Cash Flow &amp; Budgets.
        </h1>

        <p className="text-base sm:text-lg text-[#afcdc8] leading-relaxed">
          Track balances across bank, cash, and savings accounts. Categorize expenses, set proactive budget limits with 80% alerts, and analyze monthly cash flow with enterprise precision.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white font-semibold text-sm shadow-xl shadow-[#4fb8b2]/25 hover:opacity-95 transition-all"
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0f1a1e] border border-[#8de5db]/25 text-white font-semibold text-sm hover:bg-white/5 transition-all"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0f1a1e]/80 border border-[#8de5db]/15 hover:border-[#4fb8b2]/40 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#328f97]/20 to-[#4fb8b2]/20 border border-[#4fb8b2]/30 flex items-center justify-center text-[#60d7cf] mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#afcdc8] leading-relaxed">{feature.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
