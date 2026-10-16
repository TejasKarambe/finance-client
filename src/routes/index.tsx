import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import { accountsApi, transactionsApi, type Transaction, type Account } from '#/lib/api'
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
  DollarSign
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

// ---------------------------------------------------------------------------
// 1. Authenticated Dashboard View
// ---------------------------------------------------------------------------
function AuthenticatedDashboard({ user }: { user: { name: string; email: string } | null }) {

  // Fetch Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
  })

  // Fetch Recent Transactions
  const { data: transactionsData, isLoading: isLoadingTx } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionsApi.getAll({ size: 6, sortDir: 'desc' }),
  })

  const recentTransactions: Transaction[] = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as { content?: Transaction[] })?.content || []

  // Compute stats client-side or from API
  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0)

  const incomeTx = recentTransactions.filter((t) => t.type === 'INCOME')
  const expenseTx = recentTransactions.filter((t) => t.type === 'EXPENSE')

  const sampleIncome = incomeTx.reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
  const sampleExpenses = expenseTx.reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
  const netCashFlow = sampleIncome - sampleExpenses

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return <Building2 className="w-5 h-5 text-[#4fb8b2]" />
      case 'SAVINGS':
        return <Wallet className="w-5 h-5 text-[#6ec89a]" />
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5 text-amber-400" />
      default:
        return <Banknote className="w-5 h-5 text-teal-300" />
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0f1a1e] to-[#12242b] border border-[#8de5db]/15 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4fb8b2] bg-[#4fb8b2]/10 px-2.5 py-0.5 rounded-full border border-[#4fb8b2]/20">
              Overview
            </span>
            <span className="text-xs text-[#afcdc8]">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Hello, {user?.name || 'Investor'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8] mt-0.5">
            Here is your live multi-account balance and cash flow ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/transactions"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] text-white text-xs font-semibold shadow-lg shadow-[#4fb8b2]/20 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </Link>
          <Link
            to="/accounts"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#070e11] border border-[#8de5db]/20 text-[#d7ece8] text-xs font-semibold hover:bg-white/5 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#4fb8b2]" />
            <span>Transfer Funds</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Total Net Worth</span>
            <div className="p-2 rounded-lg bg-[#4fb8b2]/10 text-[#4fb8b2]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-[#afcdc8] mt-2 flex items-center gap-1">
            Across <span className="font-semibold text-white">{accounts.length}</span> active accounts
          </p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Recent Income</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
              +${sampleIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Direct deposits & earnings
          </p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Recent Expenses</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-red-400 tracking-tight">
              -${sampleExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-red-400/80 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Outflow & categorized bills
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="p-5 rounded-2xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 shadow-md">
          <div className="flex items-center justify-between text-[#afcdc8]">
            <span className="text-xs font-medium uppercase tracking-wider">Net Cash Flow</span>
            <div className="p-2 rounded-lg bg-[#328f97]/15 text-[#60d7cf]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                netCashFlow >= 0 ? 'text-[#60d7cf]' : 'text-amber-400'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}$
              {netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-[#afcdc8] mt-2">Income minus Outflow balance</p>
        </div>
      </div>

      {/* Grid: Tracked Accounts & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tracked Accounts List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#4fb8b2]" />
              Tracked Accounts
            </h2>
            <Link to="/accounts" className="text-xs font-semibold text-[#60d7cf] hover:underline">
              Manage All &rarr;
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
                  className="p-4 rounded-xl bg-[#0f1a1e]/90 border border-[#8de5db]/15 flex items-center justify-between hover:border-[#4fb8b2]/40 transition-all"
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
                      ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[10px] text-[#afcdc8]">{account.currency || 'USD'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Shortcuts Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12242b] to-[#0a1418] border border-[#8de5db]/20 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <PieChart className="w-4 h-4 text-[#4fb8b2]" />
              <span>Budget Health Indicator</span>
            </div>
            <p className="text-xs text-[#afcdc8] leading-relaxed">
              Track category limits and get alerts at 80% and 100% spending thresholds.
            </p>
            <Link
              to="/budgets"
              className="inline-block text-xs font-semibold text-[#60d7cf] hover:underline"
            >
              Configure Budgets &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Recent Transactions Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#4fb8b2]" />
              Recent Transactions
            </h2>
            <Link to="/transactions" className="text-xs font-semibold text-[#60d7cf] hover:underline">
              View Full Ledger &rarr;
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
                        {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}$
                        {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
