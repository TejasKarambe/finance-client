import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import {
  reportsApi,
  insightsApi,
  type MonthlyReport,
  type YearlyReport,
  type AiInsightResponse,
  getErrorMessage
} from '#/lib/api'
import {
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Percent,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Brain,
  ShieldCheck,
  FileCode,
  Zap
} from 'lucide-react'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

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

function ReportsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const today = new Date()
  const [reportType, setReportType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1)

  const [isExporting, setIsExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  // 1. Fetch Monthly Report
  const {
    data: monthlyReport,
    isLoading: isLoadingMonthly,
    isRefetching: isRefetchingMonthly,
  } = useQuery<MonthlyReport>({
    queryKey: ['report-monthly', selectedYear, selectedMonth],
    queryFn: () => reportsApi.getMonthlyReport(selectedYear, selectedMonth),
    enabled: isAuthenticated && reportType === 'MONTHLY',
  })

  // 2. Fetch Yearly Report
  const {
    data: yearlyReport,
    isLoading: isLoadingYearly,
    isRefetching: isRefetchingYearly,
  } = useQuery<YearlyReport>({
    queryKey: ['report-yearly', selectedYear],
    queryFn: () => reportsApi.getYearlyReport(selectedYear),
    enabled: isAuthenticated && reportType === 'YEARLY',
  })

  // 3. Fetch AI Spending Insights & Financial Health Score
  const { data: aiInsights } = useQuery<AiInsightResponse>({
    queryKey: ['ai-insights'],
    queryFn: insightsApi.getSpendingInsights,
    enabled: isAuthenticated,
  })

  // CSV Export Handler
  const handleExportCsv = async () => {
    try {
      setIsExporting(true)
      setExportError(null)
      await reportsApi.exportCsv()
      setExportNotice('Full ledger CSV exported successfully!')
      setTimeout(() => setExportNotice(null), 4000)
    } catch (err) {
      setExportError(getErrorMessage(err))
      setTimeout(() => setExportError(null), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  // JSON Export Handler
  const [isExportingJson, setIsExportingJson] = useState(false)
  const handleExportJson = async () => {
    try {
      setIsExportingJson(true)
      setExportError(null)
      await reportsApi.exportJson()
      setExportNotice('Complete financial JSON backup exported successfully!')
      setTimeout(() => setExportNotice(null), 4000)
    } catch (err) {
      setExportError(getErrorMessage(err))
      setTimeout(() => setExportError(null), 5000)
    } finally {
      setIsExportingJson(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-[#afcdc8]">
          Please sign in to generate monthly and annual financial statements and export CSV ledger data.
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

  // Active Report Metrics
  const activeIncome = reportType === 'MONTHLY' ? monthlyReport?.totalIncome ?? 0 : yearlyReport?.totalIncome ?? 0
  const activeExpense = reportType === 'MONTHLY' ? monthlyReport?.totalExpense ?? 0 : yearlyReport?.totalExpense ?? 0
  const activeNet = reportType === 'MONTHLY' ? monthlyReport?.netAmount ?? 0 : yearlyReport?.netAmount ?? 0
  const activeSavingsRate = reportType === 'MONTHLY' ? monthlyReport?.savingsRate ?? 0 : yearlyReport?.savingsRate ?? 0

  const categories = reportType === 'MONTHLY' ? monthlyReport?.categories || [] : yearlyReport?.topCategories || []

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

  const isLoading = reportType === 'MONTHLY' ? isLoadingMonthly : isLoadingYearly
  const isRefetching = reportType === 'MONTHLY' ? isRefetchingMonthly : isRefetchingYearly

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Feedback */}
      {exportNotice && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {exportError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Top Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0f1a1e] via-[#12242b] to-[#0a1418] border border-[#8de5db]/15 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4fb8b2] bg-[#4fb8b2]/10 px-2.5 py-0.5 rounded-full border border-[#4fb8b2]/20">
              Executive Financial Statement
            </span>
            <span className="text-xs text-[#afcdc8] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4fb8b2]" />
              {reportType === 'MONTHLY' ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}` : `Annual ${selectedYear}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-[#4fb8b2]" />
            Reports &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8] mt-0.5">
            In-depth monthly cash flows, annual financial statements, and one-click UTF-8 CSV ledger exports.
          </p>
        </div>

        {/* Mode Selector & CSV Download Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Monthly vs Annual Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#070e11] border border-[#8de5db]/20">
            <button
              onClick={() => setReportType('MONTHLY')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportType === 'MONTHLY'
                  ? 'bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white shadow-sm'
                  : 'text-[#afcdc8] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setReportType('YEARLY')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                reportType === 'YEARLY'
                  ? 'bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white shadow-sm'
                  : 'text-[#afcdc8] hover:text-white'
              }`}
            >
              Annual
            </button>
          </div>

          {/* Period Selector */}
          {reportType === 'MONTHLY' ? (
            <div className="flex items-center bg-[#070e11] border border-[#8de5db]/20 rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-bold text-white min-w-[95px] text-center">
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
          ) : (
            <div className="flex items-center bg-[#070e11] border border-[#8de5db]/20 rounded-xl p-1">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                title="Previous Year"
                className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-white min-w-[70px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                title="Next Year"
                className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Complete JSON Backup Button */}
          <button
            onClick={handleExportJson}
            disabled={isExportingJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#070e11] border border-[#8de5db]/20 text-[#afcdc8] hover:text-white hover:bg-white/5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Download complete structured database backup in JSON format"
          >
            <FileCode className="w-4 h-4 text-[#4fb8b2]" />
            <span>{isExportingJson ? 'Backing up...' : 'Backup JSON'}</span>
          </button>

          {/* One-Click CSV Export Button */}
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {/* AI Financial Health & Spending Insights Banner */}
      {aiInsights && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1a20] via-[#0f242c] to-[#0a1519] border border-[#8de5db]/20 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#328f97] to-[#4fb8b2] flex items-center justify-center text-white shadow-lg shadow-[#4fb8b2]/20">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4fb8b2]">
                    AI Financial Health Intelligence
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4fb8b2]/20 text-[#60d7cf] border border-[#4fb8b2]/30">
                    Grade {aiInsights.healthGrade}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight mt-0.5">
                  Financial Health Score: {aiInsights.financialHealthScore} / 100
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#081216] border border-[#8de5db]/15">
                <span className="text-[10px] text-[#afcdc8] block">Savings Rate</span>
                <span className="text-sm font-bold text-emerald-400">
                  {aiInsights.monthlySavingsRate > 0 ? `+${aiInsights.monthlySavingsRate.toFixed(1)}%` : `${aiInsights.monthlySavingsRate.toFixed(1)}%`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#081216] border border-[#8de5db]/15">
                <span className="text-[10px] text-[#afcdc8] block">Fixed Recurring</span>
                <span className="text-sm font-bold text-[#60d7cf]">
                  {aiInsights.recurringExpenseRatio.toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#081216] border border-[#8de5db]/15">
                <span className="text-[10px] text-[#afcdc8] block">Top Outlay</span>
                <span className="text-sm font-bold text-white">
                  {aiInsights.topSpendingCategory}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#afcdc8] leading-relaxed bg-[#081216]/60 p-3 rounded-xl border border-[#8de5db]/10">
            {aiInsights.healthSummary}
          </p>

          {/* Actionable Insights Badges */}
          {aiInsights.insights && aiInsights.insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {aiInsights.insights.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#081216] border border-[#8de5db]/15 flex flex-col justify-between space-y-2 hover:border-[#8de5db]/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#4fb8b2] shrink-0" />
                      <h4 className="text-xs font-semibold text-white leading-tight">{item.title}</h4>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.impactLevel === 'HIGH'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-[#4fb8b2]/20 text-[#60d7cf] border border-[#4fb8b2]/30'
                      }`}
                    >
                      {item.impactLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#afcdc8] leading-relaxed">{item.description}</p>
                  <div className="pt-2 border-t border-[#8de5db]/10 text-[10px] text-[#60d7cf] flex items-center justify-between">
                    <span>{item.recommendedAction}</span>
                    {item.potentialMonthlySavings > 0 && (
                      <span className="font-bold text-emerald-400 shrink-0 ml-1">
                        +${item.potentialMonthlySavings}/mo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">
              {reportType === 'MONTHLY' ? 'Monthly Inflow' : 'Annual Inflow'}
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `+$${Number(activeIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              )}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Gross earnings & deposits
          </p>
        </div>

        {/* Total Outflow */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">
              {reportType === 'MONTHLY' ? 'Monthly Outflow' : 'Annual Outflow'}
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `-$${Number(activeExpense).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              )}
            </span>
          </div>
          <p className="text-[11px] text-red-400/80 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Total categorized expenses
          </p>
        </div>

        {/* Net Surplus / Deficit */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Net Cash Flow</span>
            <div className="p-2 rounded-lg bg-[#328f97]/15 text-[#60d7cf]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                activeNet >= 0 ? 'text-[#60d7cf]' : 'text-amber-400'
              }`}
            >
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${activeNet >= 0 ? '+' : ''}$${Number(activeNet).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              )}
            </span>
          </div>
          <p className="text-[11px] text-[#afcdc8] mt-2">
            {activeNet >= 0 ? 'Retained cash surplus' : 'Net liquidity deficit'}
          </p>
        </div>

        {/* Savings Margin */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Savings Rate</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                activeSavingsRate >= 20
                  ? 'text-emerald-400'
                  : activeSavingsRate > 0
                  ? 'text-[#60d7cf]'
                  : 'text-amber-400'
              }`}
            >
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${Number(activeSavingsRate).toFixed(1)}%`
              )}
            </span>
          </div>
          <p className="text-[11px] text-[#afcdc8] mt-2">
            {activeSavingsRate >= 20 ? 'Optimal target (>=20%)' : 'Portion of earnings retained'}
          </p>
        </div>
      </div>

      {/* Main Analysis Section */}
      {reportType === 'YEARLY' ? (
        /* Annual Month-by-Month Statement */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#4fb8b2]" />
                  Annual Cash Flow Statement ({selectedYear})
                </h2>
                <p className="text-xs text-[#afcdc8] mt-0.5">
                  Month-by-month trajectory of inflows, outflows, and net liquidity reserves.
                </p>
              </div>
              {isRefetching && (
                <span className="text-xs text-[#afcdc8] animate-pulse">Syncing annual data...</span>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#8de5db]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070e11] text-[#afcdc8] uppercase font-semibold text-[10px] tracking-wider border-b border-[#8de5db]/10">
                  <tr>
                    <th className="py-3 px-4">Calendar Month</th>
                    <th className="py-3 px-4 text-right">Inflow ($)</th>
                    <th className="py-3 px-4 text-right">Outflow ($)</th>
                    <th className="py-3 px-4 text-right">Net Flow ($)</th>
                    <th className="py-3 px-4 text-right">Savings Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8de5db]/5 text-white font-medium">
                  {yearlyReport?.monthlyBreakdown?.map((item) => {
                    const inc = Number(item.income) || 0
                    const exp = Number(item.expense) || 0
                    const net = Number(item.netFlow) || 0
                    const rate = inc > 0 ? (net / inc) * 100 : 0

                    return (
                      <tr key={item.month} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#60d7cf]">
                          {MONTH_NAMES[item.month - 1]}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400">
                          {inc > 0 ? `+$${inc.toFixed(2)}` : '$0.00'}
                        </td>
                        <td className="py-3 px-4 text-right text-red-400">
                          {exp > 0 ? `-$${exp.toFixed(2)}` : '$0.00'}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            net >= 0 ? 'text-[#60d7cf]' : 'text-amber-400'
                          }`}
                        >
                          {net >= 0 ? '+' : ''}${net.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              rate >= 20
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : rate > 0
                                ? 'bg-[#328f97]/15 text-[#60d7cf]'
                                : 'bg-white/5 text-[#afcdc8]'
                            }`}
                          >
                            {inc > 0 ? `${rate.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Monthly Category Outflow Distribution */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Table (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#4fb8b2]" />
                  Categorized Spending Ledger ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
                </h2>
                <p className="text-xs text-[#afcdc8] mt-0.5">
                  Detailed distribution of expenses by transaction category.
                </p>
              </div>
              {isRefetching && (
                <span className="text-xs text-[#afcdc8] animate-pulse">Syncing...</span>
              )}
            </div>

            {categories.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#afcdc8]">
                No expenses recorded for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#8de5db]/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070e11] text-[#afcdc8] uppercase font-semibold text-[10px] tracking-wider border-b border-[#8de5db]/10">
                    <tr>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Total Outflow ($)</th>
                      <th className="py-3 px-4 text-right">Percentage Share</th>
                      <th className="py-3 px-4 w-44">Distribution Meter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8de5db]/5 text-white font-medium">
                    {categories.map((c) => {
                      const color = getCategoryColor(c.category)
                      const pct = Number(c.percentage) || 0
                      return (
                        <tr key={c.category} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-bold text-white">{c.category}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">
                            ${Number(c.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right text-[#60d7cf] font-semibold">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="h-2 w-full rounded-full bg-[#070e11] overflow-hidden">
                              <div
                                style={{ width: `${pct}%`, backgroundColor: color }}
                                className="h-full rounded-full transition-all duration-300"
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Pillar: Summary & Category Leaderboard */}
          <div className="p-6 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Top Outflow Categories
            </h3>

            {categories.length === 0 ? (
              <p className="text-xs text-[#afcdc8] py-8 text-center">No categories to rank.</p>
            ) : (
              <div className="space-y-3">
                {categories.slice(0, 5).map((c, idx) => (
                  <div
                    key={c.category}
                    className="p-3 rounded-xl bg-[#070e11]/80 border border-[#8de5db]/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#4fb8b2]/20 text-[#60d7cf] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{c.category}</h4>
                        <span className="text-[10px] text-[#afcdc8]">{c.percentage?.toFixed(1)}% of total</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">
                      ${Number(c.totalAmount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CSV Export Callout */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#12242b] to-[#070e11] border border-[#8de5db]/20 space-y-2 mt-4">
              <span className="text-xs font-bold text-white block">Complete Data Portability</span>
              <p className="text-[11px] text-[#afcdc8] leading-relaxed">
                Export all historical transaction rows, balances, and payment methods in clean UTF-8 CSV format.
              </p>
              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#4fb8b2]/20 text-[#60d7cf] hover:bg-[#4fb8b2]/30 text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Generating CSV...' : 'Download Full Ledger'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
