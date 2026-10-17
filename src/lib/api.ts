import axios, { type AxiosError } from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('finance_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string> }>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthRequest = error.config?.url?.includes('/auth/')
      if (!isAuthRequest) {
        localStorage.removeItem('finance_token')
        localStorage.removeItem('finance_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper to extract clean error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string; errors?: Record<string, string> }
    if (data?.errors) {
      return Object.values(data.errors).join(', ')
    }
    return data?.message || data?.error || error.message || 'An unexpected error occurred'
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface User {
  id: number
  name: string
  email: string
  role?: string
  createdAt?: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  userId: number
  name: string
  email: string
  role: string
}

export type AccountType = 'BANK' | 'CASH' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT'

export interface Account {
  id: number
  name: string
  type: AccountType
  balance: number
  openingBalance?: number
  currency?: string
  userId?: number
}

export interface CreateAccountPayload {
  name: string
  type: AccountType
  balance?: number
  openingBalance?: number
  currency?: string
  userId?: number
}

export interface TransferPayload {
  sourceAccountId: number
  destinationAccountId: number
  amount: number
  destinationAmount?: number
  description?: string
  transferDate: string
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface Transaction {
  id: number
  amount: number
  type: TransactionType
  category: string
  description?: string
  paymentMethod?: string
  transactionDate: string
  createdAt?: string
  accountId: number
  accountName?: string
}

export interface CreateTransactionPayload {
  accountId: number
  amount: number
  type: TransactionType
  category: string
  description?: string
  paymentMethod?: string
  transactionDate: string
}

export interface TransactionFilters {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  search?: string
  type?: TransactionType
  category?: string
  accountId?: number
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
}

export interface PaginatedResponse<T> {
  content: T[]
  pageNumber?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
  last?: boolean
  number?: number
  size?: number
}

export interface Budget {
  id: number
  category: string
  limitAmount: number
  month: number
  year: number
  userId: number
  createdAt: string
  updatedAt: string
}

export interface BudgetStatus {
  budgetId?: number
  category: string
  limitAmount: number
  spentAmount: number
  remainingAmount: number
  percentageSpent: number
  status: 'NORMAL' | 'WARNING' | 'EXCEEDED'
  alertMessage?: string
}

export interface CreateBudgetPayload {
  category: string
  limitAmount: number
  month: number
  year: number
}

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  totalAccountBalance: number
  accountsCount: number
  periodMonth: number
  periodYear: number
}

export interface CategoryBreakdown {
  category: string
  totalAmount: number
  percentage?: number
}

export interface MonthlyTrend {
  monthKey: string
  monthLabel: string
  income: number
  expense: number
  netFlow: number
}

export interface MonthlyReportCategory {
  category: string
  totalAmount: number
  percentage?: number
}

export interface MonthlyReport {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  netAmount: number
  savingsRate?: number
  categories?: MonthlyReportCategory[]
}

export interface MonthlyFlowItem {
  month: number
  monthName: string
  income: number
  expense: number
  netFlow: number
}

export interface YearlyReport {
  year: number
  totalIncome: number
  totalExpense: number
  netAmount: number
  savingsRate?: number
  monthlyBreakdown?: MonthlyFlowItem[]
  topCategories?: MonthlyReportCategory[]
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export const authApi = {
  register: async (payload: { name: string; email: string; password: string }) => {
    const res = await api.post<AuthResponse>('/auth/register', payload)
    return res.data
  },
  login: async (payload: { email: string; password: string }) => {
    const res = await api.post<AuthResponse>('/auth/login', payload)
    return res.data
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me')
    return res.data
  },
}

export const accountsApi = {
  getAll: async () => {
    const res = await api.get<Account[]>('/accounts')
    return res.data
  },
  getById: async (id: number) => {
    const res = await api.get<Account>(`/accounts/${id}`)
    return res.data
  },
  create: async (payload: CreateAccountPayload) => {
    const res = await api.post<Account>('/accounts', payload)
    return res.data
  },
  update: async (id: number, payload: Partial<CreateAccountPayload>) => {
    const res = await api.put<Account>(`/accounts/${id}`, payload)
    return res.data
  },
  delete: async (id: number) => {
    await api.delete(`/accounts/${id}`)
  },
  transfer: async (payload: TransferPayload) => {
    const res = await api.post('/accounts/transfer', payload)
    return res.data
  },
}

export const transactionsApi = {
  getAll: async (filters: TransactionFilters = {}) => {
    const res = await api.get<PaginatedResponse<Transaction> | Transaction[]>('/transactions', {
      params: filters,
    })
    return res.data
  },
  getById: async (id: number) => {
    const res = await api.get<Transaction>(`/transactions/${id}`)
    return res.data
  },
  create: async (payload: CreateTransactionPayload) => {
    const res = await api.post<Transaction>('/transactions', payload)
    return res.data
  },
  update: async (id: number, payload: Partial<CreateTransactionPayload>) => {
    const res = await api.put<Transaction>(`/transactions/${id}`, payload)
    return res.data
  },
  delete: async (id: number) => {
    await api.delete(`/transactions/${id}`)
  },
}

export const dashboardApi = {
  getSummary: async (month?: number, year?: number) => {
    const res = await api.get<DashboardSummary>('/dashboard/summary', {
      params: { month, year },
    })
    return res.data
  },
  getCategoryBreakdown: async (month?: number, year?: number) => {
    const res = await api.get<CategoryBreakdown[]>('/dashboard/category-breakdown', {
      params: { month, year },
    })
    return res.data
  },
  getMonthlyTrend: async (months: number = 6) => {
    const res = await api.get<MonthlyTrend[]>('/dashboard/monthly-trend', {
      params: { months },
    })
    return res.data
  },
}

export const budgetsApi = {
  getStatus: async (month: number, year: number) => {
    const res = await api.get<BudgetStatus[]>('/budgets/status', {
      params: { month, year },
    })
    return res.data
  },
  getAll: async (month?: number, year?: number) => {
    const res = await api.get<Budget[]>('/budgets', {
      params: { month, year },
    })
    return res.data
  },
  createOrUpdate: async (payload: CreateBudgetPayload) => {
    const res = await api.post<Budget>('/budgets', payload)
    return res.data
  },
  delete: async (id: number) => {
    await api.delete(`/budgets/${id}`)
  },
}

export const reportsApi = {
  getMonthlyReport: async (year: number, month: number) => {
    const res = await api.get<MonthlyReport>('/reports/monthly', { params: { year, month } })
    return res.data
  },
  getYearlyReport: async (year: number) => {
    const res = await api.get<YearlyReport>('/reports/yearly', { params: { year } })
    return res.data
  },
  getCategoryExpenses: async (year: number, month: number) => {
    const res = await api.get<MonthlyReportCategory[]>('/reports/monthly/category', { params: { year, month } })
    return res.data
  },
  exportCsv: async () => {
    const response = await api.get('/reports/export/csv', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },
  exportJson: async () => {
    const res = await api.get('/reports/export/json')
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `apex_finance_backup_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },
}

// ---------------------------------------------------------------------------
// Advanced Features Types & APIs
// ---------------------------------------------------------------------------

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface RecurringTransaction {
  id: number
  accountId: number
  accountName: string
  title: string
  amount: number
  type: TransactionType
  category: string
  frequency: RecurrenceFrequency
  startDate: string
  nextDueDate: string
  endDate?: string
  paymentMethod?: string
  description?: string
  active: boolean
  autoProcess: boolean
  lastProcessedDate?: string
  daysUntilDue: number
  isDue: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRecurringTransactionPayload {
  accountId: number
  title: string
  amount: number
  type: TransactionType
  category: string
  frequency: RecurrenceFrequency
  startDate: string
  nextDueDate?: string
  endDate?: string
  paymentMethod?: string
  description?: string
  active?: boolean
  autoProcess?: boolean
}

export interface SavingsGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  progressPercentage: number
  targetDate?: string
  daysRemaining?: number
  category?: string
  color?: string
  icon?: string
  completed: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSavingsGoalPayload {
  name: string
  targetAmount: number
  currentAmount?: number
  targetDate?: string
  category?: string
  color?: string
  icon?: string
  notes?: string
}

export interface GoalContributionPayload {
  accountId: number
  amount: number
  notes?: string
}

export interface CsvImportResult {
  totalRows: number
  importedCount: number
  skippedCount: number
  errors: string[]
  message: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'WARNING' | 'ALERT' | 'INFO' | 'SUCCESS'
  category: 'BUDGET' | 'RECURRING' | 'ACCOUNT' | 'GOAL' | 'SYSTEM'
  timestamp: string
  actionUrl?: string
  read: boolean
}

export interface SpendingInsightItem {
  id: string
  type: 'SAVINGS_OPPORTUNITY' | 'ANOMALY_ALERT' | 'SUBSCRIPTION_LOAD' | 'POSITIVE_TREND'
  title: string
  description: string
  potentialMonthlySavings: number
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  recommendedAction: string
}

export interface AiInsightResponse {
  financialHealthScore: number
  healthGrade: string
  healthSummary: string
  monthlySavingsRate: number
  topSpendingCategory: string
  totalMonthlyBurn: number
  recurringExpensesTotal: number
  recurringExpenseRatio: number
  insights: SpendingInsightItem[]
}

export const recurringApi = {
  getAll: async () => {
    const res = await api.get<RecurringTransaction[]>('/recurring-transactions')
    return res.data
  },
  getById: async (id: number) => {
    const res = await api.get<RecurringTransaction>(`/recurring-transactions/${id}`)
    return res.data
  },
  create: async (payload: CreateRecurringTransactionPayload) => {
    const res = await api.post<RecurringTransaction>('/recurring-transactions', payload)
    return res.data
  },
  update: async (id: number, payload: Partial<CreateRecurringTransactionPayload>) => {
    const res = await api.put<RecurringTransaction>(`/recurring-transactions/${id}`, payload)
    return res.data
  },
  delete: async (id: number) => {
    await api.delete(`/recurring-transactions/${id}`)
  },
  process: async (id: number) => {
    const res = await api.post<Transaction>(`/recurring-transactions/${id}/process`)
    return res.data
  },
  processAllDue: async () => {
    const res = await api.post<Transaction[]>('/recurring-transactions/process-due')
    return res.data
  },
}

export const savingsGoalsApi = {
  getAll: async () => {
    const res = await api.get<SavingsGoal[]>('/savings-goals')
    return res.data
  },
  getById: async (id: number) => {
    const res = await api.get<SavingsGoal>(`/savings-goals/${id}`)
    return res.data
  },
  create: async (payload: CreateSavingsGoalPayload) => {
    const res = await api.post<SavingsGoal>('/savings-goals', payload)
    return res.data
  },
  update: async (id: number, payload: Partial<CreateSavingsGoalPayload>) => {
    const res = await api.put<SavingsGoal>(`/savings-goals/${id}`, payload)
    return res.data
  },
  delete: async (id: number) => {
    await api.delete(`/savings-goals/${id}`)
  },
  contribute: async (id: number, payload: GoalContributionPayload) => {
    const res = await api.post<SavingsGoal>(`/savings-goals/${id}/contribute`, payload)
    return res.data
  },
}

export const notificationsApi = {
  getAll: async () => {
    const res = await api.get<NotificationItem[]>('/notifications')
    return res.data
  },
}

export const insightsApi = {
  getSpendingInsights: async () => {
    const res = await api.get<AiInsightResponse>('/insights/spending')
    return res.data
  },
}

// Extend transactionsApi with CSV Import and Export
export const transactionsExtendedApi = {
  ...transactionsApi,
  importCsv: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<CsvImportResult>('/transactions/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },
  exportCsv: async (filters: TransactionFilters = {}) => {
    const response = await api.get('/transactions/export/csv', {
      params: filters,
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },
}

