import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  flag: string
  rateAgainstUsd: number
  locale: string
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    rateAgainstUsd: 86.85,
    locale: 'en-IN',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rateAgainstUsd: 1.0,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rateAgainstUsd: 0.92,
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rateAgainstUsd: 0.78,
    locale: 'en-GB',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    rateAgainstUsd: 1.38,
    locale: 'en-CA',
  },
  AUD: {
    code: 'AUD',
    symbol: 'AU$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rateAgainstUsd: 1.54,
    locale: 'en-AU',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    rateAgainstUsd: 153.5,
    locale: 'ja-JP',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    rateAgainstUsd: 3.67,
    locale: 'ar-AE',
  },
  SGD: {
    code: 'SGD',
    symbol: 'SG$',
    name: 'Singapore Dollar',
    flag: '🇸🇬',
    rateAgainstUsd: 1.34,
    locale: 'en-SG',
  },
}

interface CurrencyContextType {
  currency: string
  currencyInfo: CurrencyInfo
  currencySymbol: string
  baseCurrency: string
  baseCurrencyInfo: CurrencyInfo
  baseCurrencySymbol: string
  autoConvert: boolean
  rates: Record<string, number>
  isRatesLive: boolean
  lastRateUpdate: string | null
  setCurrency: (code: string) => void
  setBaseCurrency: (code: string) => void
  setAutoConvert: (enabled: boolean) => void
  convert: (amount: number, fromCurrency?: string, toCurrency?: string) => number
  formatCurrency: (
    amount: number,
    fromCurrency?: string,
    options?: {
      showCode?: boolean
      maximumFractionDigits?: number
      signDisplay?: 'auto' | 'always' | 'never'
    }
  ) => string
  formatRawNumber: (amount: number, fromCurrency?: string) => number
  refreshRates: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const STORAGE_KEY_CURRENCY = 'apex_preferred_currency'
const STORAGE_KEY_BASE_CURRENCY = 'apex_base_currency'
const STORAGE_KEY_AUTO_CONVERT = 'apex_auto_convert'

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Default display currency to INR
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY)
      if (saved && SUPPORTED_CURRENCIES[saved]) return saved
    }
    return 'INR'
  })

  // Base ledger currency in which financial transactions & records are entered (defaults to INR)
  const [baseCurrency, setBaseCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_BASE_CURRENCY)
      if (saved && SUPPORTED_CURRENCIES[saved]) return saved
    }
    return 'INR'
  })

  const [autoConvert, setAutoConvertState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_AUTO_CONVERT)
      if (saved !== null) return saved === 'true'
    }
    return true
  })

  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    Object.keys(SUPPORTED_CURRENCIES).forEach((code) => {
      initial[code] = SUPPORTED_CURRENCIES[code].rateAgainstUsd
    })
    return initial
  })

  const [isRatesLive, setIsRatesLive] = useState(false)
  const [lastRateUpdate, setLastRateUpdate] = useState<string | null>(null)

  // Fetch real-time exchange rates (USD base) from open public API
  const refreshRates = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data && data.rates) {
          setRates((prev) => {
            const updated = { ...prev }
            Object.keys(SUPPORTED_CURRENCIES).forEach((code) => {
              if (data.rates[code]) {
                updated[code] = data.rates[code]
              }
            })
            return updated
          })
          setIsRatesLive(true)
          setLastRateUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
      }
    } catch {
      // Gracefully fall back to pre-configured accurate default rates
      setIsRatesLive(false)
    }
  }

  useEffect(() => {
    refreshRates()
  }, [])

  const setCurrency = (code: string) => {
    const normalized = code.toUpperCase()
    if (SUPPORTED_CURRENCIES[normalized]) {
      setCurrencyState(normalized)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CURRENCY, normalized)
      }
    }
  }

  const setBaseCurrency = (code: string) => {
    const normalized = code.toUpperCase()
    if (SUPPORTED_CURRENCIES[normalized]) {
      setBaseCurrencyState(normalized)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_BASE_CURRENCY, normalized)
      }
    }
  }

  const setAutoConvert = (enabled: boolean) => {
    setAutoConvertState(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUTO_CONVERT, String(enabled))
    }
  }

  const currentInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR
  const baseCurrencyInfo = SUPPORTED_CURRENCIES[baseCurrency] || SUPPORTED_CURRENCIES.INR

  /**
   * Convert an amount between currencies using active exchange rates.
   * If fromCurrency is omitted, defaults to baseCurrency.
   * If toCurrency is omitted, defaults to active display currency.
   */
  const convert = (amount: number, fromCurrency?: string, toCurrency?: string): number => {
    const from = (fromCurrency || baseCurrency).toUpperCase()
    const to = (toCurrency || currency).toUpperCase()

    if (from === to) return amount

    const fromRate = rates[from] || SUPPORTED_CURRENCIES[from]?.rateAgainstUsd || 1.0
    const toRate = rates[to] || SUPPORTED_CURRENCIES[to]?.rateAgainstUsd || 1.0

    // Amount in USD = amount / fromRate
    // Amount in target = (amount / fromRate) * toRate
    const converted = (amount / fromRate) * toRate
    return Number(converted.toFixed(4))
  }

  /**
   * Returns converted numeric value into user's active display currency if autoConvert is on.
   * If fromCurrency is omitted, defaults to baseCurrency.
   * If fromCurrency matches currency, returns as-is.
   */
  const formatRawNumber = (amount: number, fromCurrency?: string): number => {
    const from = (fromCurrency || baseCurrency).toUpperCase()
    if (!autoConvert || from === currency.toUpperCase()) {
      return amount
    }
    return convert(amount, from, currency)
  }

  /**
   * Formats any amount into user's active currency with proper locale & symbol.
   * If fromCurrency is omitted, defaults to baseCurrency.
   * If fromCurrency === currency, it assumes the amount is already converted to the active currency.
   */
  const formatCurrency = (
    amount: number,
    fromCurrency?: string,
    options?: {
      showCode?: boolean
      maximumFractionDigits?: number
      signDisplay?: 'auto' | 'always' | 'never'
    }
  ): string => {
    const num = Number(amount) || 0
    let targetNum = num
    let targetInfo = currentInfo

    const from = (fromCurrency || baseCurrency).toUpperCase()

    if (autoConvert) {
      if (from !== currency.toUpperCase()) {
        targetNum = convert(num, from, currency)
      }
    } else if (SUPPORTED_CURRENCIES[from]) {
      // If auto-convert is turned off, retain original currency formatting if provided
      targetInfo = SUPPORTED_CURRENCIES[from]
    }

    const maxFraction = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2
    const minFraction = Math.min(2, maxFraction)

    try {
      const formatted = new Intl.NumberFormat(targetInfo.locale, {
        style: 'currency',
        currency: targetInfo.code,
        minimumFractionDigits: minFraction,
        maximumFractionDigits: maxFraction,
        signDisplay: options?.signDisplay || 'auto',
      }).format(targetNum)

      if (options?.showCode) {
        return `${formatted} ${targetInfo.code}`
      }
      return formatted
    } catch {
      // Fallback
      const symbol = targetInfo.symbol
      const formattedNum = Math.abs(targetNum).toLocaleString('en-US', {
        minimumFractionDigits: minFraction,
        maximumFractionDigits: maxFraction,
      })
      const sign = targetNum < 0 ? '-' : options?.signDisplay === 'always' && targetNum > 0 ? '+' : ''
      return `${sign}${symbol}${formattedNum}`
    }
  }

  const value = useMemo(
    () => ({
      currency,
      currencyInfo: currentInfo,
      currencySymbol: currentInfo.symbol,
      baseCurrency,
      baseCurrencyInfo,
      baseCurrencySymbol: baseCurrencyInfo.symbol,
      autoConvert,
      rates,
      isRatesLive,
      lastRateUpdate,
      setCurrency,
      setBaseCurrency,
      setAutoConvert,
      convert,
      formatCurrency,
      formatRawNumber,
      refreshRates,
    }),
    [currency, currentInfo, baseCurrency, baseCurrencyInfo, autoConvert, rates, isRatesLive, lastRateUpdate]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
