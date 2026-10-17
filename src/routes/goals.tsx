import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import { 
  savingsGoalsApi, 
  accountsApi, 
  type SavingsGoal, 
  type CreateSavingsGoalPayload, 
  type GoalContributionPayload,
  getErrorMessage 
} from '#/lib/api'
import { 
  Target, 
  Plus, 
  Coins, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  PiggyBank,
  RefreshCw,
  Wallet
} from 'lucide-react'

export const Route = createFileRoute('/goals')({
  component: GoalsPage,
})

const COLOR_PALETTES = [
  { name: 'Teal', hex: '#4fb8b2' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
]

function GoalsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Goal Form State
  const [goalFormData, setGoalFormData] = useState<CreateSavingsGoalPayload>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    category: 'Wealth',
    color: '#4fb8b2',
    icon: 'target',
    notes: '',
  })

  // Contribution Form State
  const [contributionData, setContributionData] = useState<GoalContributionPayload>({
    accountId: 0,
    amount: 0,
    notes: '',
  })

  // Queries
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: savingsGoalsApi.getAll,
    enabled: isAuthenticated,
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
    enabled: isAuthenticated,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateSavingsGoalPayload) => savingsGoalsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setIsGoalModalOpen(false)
      resetGoalForm()
      setSuccessMsg('Savings goal established!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateSavingsGoalPayload> }) =>
      savingsGoalsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setIsGoalModalOpen(false)
      setEditingGoal(null)
      resetGoalForm()
      setSuccessMsg('Savings goal updated!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => savingsGoalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setSuccessMsg('Savings goal removed.')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  const contributeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GoalContributionPayload }) =>
      savingsGoalsApi.contribute(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setIsContributeModalOpen(false)
      setContributionData({ accountId: accounts[0]?.id || 0, amount: 0, notes: '' })
      setSuccessMsg('Funds successfully allocated to your goal!')
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  })

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  const resetGoalForm = () => {
    setGoalFormData({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      category: 'Wealth',
      color: '#4fb8b2',
      icon: 'target',
      notes: '',
    })
    setErrorMsg(null)
  }

  const handleOpenCreate = () => {
    setEditingGoal(null)
    resetGoalForm()
    setIsGoalModalOpen(true)
  }

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setGoalFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate || '',
      category: goal.category || 'Wealth',
      color: goal.color || '#4fb8b2',
      icon: goal.icon || 'target',
      notes: goal.notes || '',
    })
    setIsGoalModalOpen(true)
  }

  const handleOpenContribute = (goal: SavingsGoal) => {
    setSelectedGoal(goal)
    setContributionData({
      accountId: accounts[0]?.id || 0,
      amount: 0,
      notes: '',
    })
    setIsContributeModalOpen(true)
  }

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalFormData.name.trim()) {
      setErrorMsg('Please specify a goal name')
      return
    }
    if (goalFormData.targetAmount <= 0) {
      setErrorMsg('Target amount must be greater than zero')
      return
    }

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, payload: goalFormData })
    } else {
      createMutation.mutate(goalFormData)
    }
  }

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGoal) return
    if (!contributionData.accountId) {
      setErrorMsg('Please select a funding account')
      return
    }
    if (contributionData.amount <= 0) {
      setErrorMsg('Contribution amount must be greater than zero')
      return
    }

    const fundingAccount = accounts.find((a) => a.id === contributionData.accountId)
    if (fundingAccount && fundingAccount.balance < contributionData.amount) {
      setErrorMsg(`Insufficient funds in ${fundingAccount.name}. Balance: $${fundingAccount.balance.toFixed(2)}`)
      return
    }

    contributeMutation.mutate({ id: selectedGoal.id, payload: contributionData })
  }

  // Aggregate Metrics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalCompleted = goals.filter((g) => g.completed).length
  const aggregatePercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-[#4fb8b2]" />
            Savings Goals & Wealth Milestones
          </h1>
          <p className="text-xs sm:text-sm text-[#afcdc8] mt-1">
            Set target reserves, monitor compound progress, and allocate deposits directly from accounts.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-lg shadow-[#4fb8b2]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
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

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Total Target Wealth
          </span>
          <div className="text-2xl font-bold text-white mt-1">
            ${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#afcdc8]/70 mt-1 block">Cumulative target across {goals.length} goals</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Accumulated Savings
          </span>
          <div className="text-2xl font-bold text-[#60d7cf] mt-1">
            ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#afcdc8]/70 mt-1 block">
            ${(totalTarget - totalSaved > 0 ? totalTarget - totalSaved : 0).toFixed(2)} remaining
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Portfolio Progress
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {aggregatePercentage.toFixed(1)}%
          </div>
          <div className="w-full bg-[#132228] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#328f97] to-[#4fb8b2] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(aggregatePercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1b20] border border-[#8de5db]/15 shadow-sm">
          <span className="text-[11px] font-medium text-[#afcdc8] uppercase tracking-wider">
            Goals Achieved
          </span>
          <div className="text-2xl font-bold text-white mt-1">
            {totalCompleted} / {goals.length}
          </div>
          <span className="text-[10px] text-[#afcdc8]/70 mt-1 block">
            {goals.length - totalCompleted} in active accumulation
          </span>
        </div>
      </div>

      {/* Goal Cards Grid */}
      {isLoadingGoals ? (
        <div className="py-16 text-center text-xs text-[#afcdc8] flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#4fb8b2]" />
          <span>Loading savings goals...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d1b20]/60 border border-[#8de5db]/10 flex flex-col items-center gap-3">
          <PiggyBank className="w-10 h-10 text-[#4fb8b2]/40" />
          <h3 className="text-sm font-semibold text-white">No Savings Goals Set Up Yet</h3>
          <p className="text-xs text-[#afcdc8] max-w-sm">
            Define target savings for your emergency fund, dream vacation, or home down payment.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct = Math.min(goal.progressPercentage || 0, 100)
            const isCompleted = goal.completed || pct >= 100

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-2xl bg-[#0d1b20] border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'border-[#8de5db]/15 hover:border-[#8de5db]/30'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                        style={{ backgroundColor: goal.color || '#4fb8b2' }}
                      >
                        {isCompleted ? <Sparkles className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{goal.name}</h3>
                        <span className="text-[10px] text-[#afcdc8]">{goal.category || 'Savings Target'}</span>
                      </div>
                    </div>

                    {isCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Achieved!</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4fb8b2]/20 text-[#60d7cf] border border-[#4fb8b2]/30">
                        {pct.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-[#afcdc8]">Current Saved</span>
                      <div className="text-xl font-bold text-white">
                        ${goal.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#afcdc8]">Target</span>
                      <div className="text-sm font-semibold text-[#afcdc8]">
                        ${goal.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-[#132228] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#8de5db]/10">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: goal.color || '#4fb8b2',
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="mt-3.5 pt-3 border-t border-[#8de5db]/10 flex items-center justify-between text-xs text-[#afcdc8]">
                    <span>
                      {isCompleted
                        ? 'Target fully funded!'
                        : `$${goal.remainingAmount.toFixed(2)} remaining`}
                    </span>

                    {goal.targetDate && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#4fb8b2]" />
                        {goal.daysRemaining !== null && goal.daysRemaining !== undefined
                          ? goal.daysRemaining > 0
                            ? `${goal.daysRemaining} days left`
                            : 'Target date passed'
                          : goal.targetDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#8de5db]/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenContribute(goal)}
                    disabled={isCompleted}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Deposit Funds</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1.5 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Edit goal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete savings goal "${goal.name}"?`)) {
                        deleteMutation.mutate(goal.id)
                      }
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0c181d] border border-[#8de5db]/30 shadow-2xl p-6 text-left my-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4fb8b2]" />
              {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
            </h2>

            <form onSubmit={handleGoalSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#afcdc8] mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6-Month Emergency Fund, Japan Trip 2027"
                  value={goalFormData.name}
                  onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Target Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={goalFormData.targetAmount || ''}
                    onChange={(e) => setGoalFormData({ ...goalFormData, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Current Saved ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={goalFormData.currentAmount || ''}
                    onChange={(e) => setGoalFormData({ ...goalFormData, currentAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={goalFormData.targetDate || ''}
                    onChange={(e) => setGoalFormData({ ...goalFormData, targetDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#afcdc8] mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Travel, Emergency, Vehicle"
                    value={goalFormData.category || ''}
                    onChange={(e) => setGoalFormData({ ...goalFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                  />
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-medium text-[#afcdc8] mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTES.map((color) => (
                    <button
                      type="button"
                      key={color.hex}
                      onClick={() => setGoalFormData({ ...goalFormData, color: color.hex })}
                      className={`w-7 h-7 rounded-lg transition-all ${
                        goalFormData.color === color.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#afcdc8] mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Motivation, rules, or details about this milestone..."
                  value={goalFormData.notes || ''}
                  onChange={(e) => setGoalFormData({ ...goalFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#8de5db]/15">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {editingGoal ? 'Save Changes' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Funds Modal */}
      {isContributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c181d] border border-[#8de5db]/30 shadow-2xl p-6 text-left">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#4fb8b2]" />
              Deposit to "{selectedGoal.name}"
            </h2>
            <p className="text-xs text-[#afcdc8] mt-1">
              Select an account to allocate money toward this savings goal. A ledger record will be created automatically.
            </p>

            <form onSubmit={handleContributeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#afcdc8] mb-1">Source Account *</label>
                <select
                  required
                  value={contributionData.accountId}
                  onChange={(e) => setContributionData({ ...contributionData, accountId: parseInt(e.target.value, 10) })}
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
                <label className="block text-xs font-medium text-[#afcdc8] mb-1">Deposit Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={contributionData.amount || ''}
                  onChange={(e) => setContributionData({ ...contributionData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#afcdc8] mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. End of month surplus deposit"
                  value={contributionData.notes || ''}
                  onChange={(e) => setContributionData({ ...contributionData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#132228] border border-[#8de5db]/20 text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#8de5db]/15">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contributeMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
