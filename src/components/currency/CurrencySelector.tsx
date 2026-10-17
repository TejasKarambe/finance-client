import { useState, useRef, useEffect } from 'react'
import { useCurrency, SUPPORTED_CURRENCIES } from '#/lib/currency-context'
import { 
  ArrowLeftRight, 
  RotateCw, 
  Check, 
  Coins, 
  Zap, 
  ChevronDown, 
  HelpCircle 
} from 'lucide-react'

export function CurrencySelector() {
  const {
    currency,
    currencyInfo,
    currencySymbol,
    baseCurrency,
    baseCurrencyInfo,
    autoConvert,
    rates,
    isRatesLive,
    lastRateUpdate,
    setCurrency,
    setBaseCurrency,
    setAutoConvert,
    convert,
    refreshRates,
  } = useCurrency()

  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  const [calcAmount, setCalcAmount] = useState<number>(100)
  const [calcFrom, setCalcFrom] = useState<string>('USD')
  const [calcTo, setCalcTo] = useState<string>('INR')

  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshRates()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleSwapCalc = () => {
    const temp = calcFrom
    setCalcFrom(calcTo)
    setCalcTo(temp)
  }

  const calculatedResult = convert(calcAmount || 0, calcFrom, calcTo)

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0f1a1e] hover:bg-white/5 border border-[#8de5db]/20 hover:border-[#8de5db]/40 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm group"
        title="Currency Settings & Real-Time Auto-Convert"
        aria-label="Change currency"
      >
        <span className="text-base leading-none">{currencyInfo.flag}</span>
        <span className="text-[#60d7cf] font-bold">{currencySymbol}</span>
        <span className="tracking-wide">{currency}</span>
        {autoConvert && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" title="Auto-convert active" />
        )}
        <ChevronDown className={`w-3 h-3 text-[#afcdc8] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-[#0c181d] border border-[#8de5db]/25 shadow-2xl p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#8de5db]/15">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#4fb8b2]" />
              <span className="text-sm font-bold text-white">Currency &amp; Conversion</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-[11px] text-[#afcdc8] hover:text-[#60d7cf] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live exchange rates"
            >
              <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#4fb8b2]' : ''}`} />
              <span>{isRatesLive ? 'Live Rates' : 'Sync Rates'}</span>
            </button>
          </div>

          {/* Auto Convert Switch */}
          <div className="mt-3 p-3 rounded-xl bg-[#132228] border border-[#8de5db]/15 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#4fb8b2]/20 text-[#60d7cf] mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">Auto-Convert Currency</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    Smart FX
                  </span>
                </div>
                <p className="text-[11px] text-[#afcdc8] leading-tight mt-0.5">
                  Automatically convert all accounts &amp; ledgers into {currencyInfo.name} ({currencySymbol})
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(e) => setAutoConvert(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#070e11] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#328f97] peer-checked:to-[#4fb8b2]"></div>
            </label>
          </div>

          {/* Quick Currency Selector Grid */}
          <div className="mt-3">
            <label className="block text-[11px] font-semibold text-[#afcdc8] uppercase tracking-wider mb-2">
              Select Display Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(SUPPORTED_CURRENCIES).map((c) => {
                const isSelected = currency === c.code
                return (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#328f97]/40 to-[#4fb8b2]/30 border-[#4fb8b2] text-white shadow-sm ring-1 ring-[#4fb8b2]/50'
                        : 'bg-[#0f1a1e] border-[#8de5db]/10 hover:border-[#8de5db]/30 text-[#afcdc8] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{c.flag}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#60d7cf]" />
                      ) : (
                        <span className="text-[11px] font-mono text-[#60d7cf]">{c.symbol}</span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-xs font-bold block">{c.code}</span>
                      <span className="text-[9px] opacity-75 truncate block">{c.name}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Base Ledger Currency Configuration */}
          <div className="mt-3 p-2.5 rounded-xl bg-[#081216] border border-[#8de5db]/15 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">Base Ledger Currency</span>
                <span className="text-[10px] text-[#4fb8b2] font-mono font-bold">({baseCurrencyInfo.symbol} {baseCurrency})</span>
              </div>
              <p className="text-[10px] text-[#afcdc8]/80 leading-tight mt-0.5">
                Original denomination of your records &amp; accounts
              </p>
            </div>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="px-2.5 py-1 bg-[#0c181d] border border-[#8de5db]/30 rounded-lg text-xs font-bold text-[#60d7cf] focus:outline-none focus:border-[#4fb8b2] cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Exchange Rate Info Ticker */}
          <div className="mt-3 py-2 px-3 rounded-xl bg-[#091418] border border-[#8de5db]/10 flex items-center justify-between text-[11px] text-[#afcdc8]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                1 USD = <strong className="text-white">₹{(rates['INR'] || 86.85).toFixed(2)} INR</strong>
                {currency !== 'USD' && currency !== 'INR' && (
                  <span className="text-[#afcdc8]/80 ml-2">
                    | 1 USD = {currencyInfo.symbol}{(rates[currency] || 1).toFixed(2)} {currency}
                  </span>
                )}
              </span>
            </div>
            {lastRateUpdate && (
              <span className="text-[10px] text-[#afcdc8]/70">Updated {lastRateUpdate}</span>
            )}
          </div>

          {/* Expandable Live Currency Converter Widget */}
          <div className="mt-3 pt-2 border-t border-[#8de5db]/10">
            <button
              onClick={() => setShowConverter(!showConverter)}
              className="w-full flex items-center justify-between py-1 text-xs text-[#60d7cf] hover:text-white transition-colors cursor-pointer font-medium"
            >
              <span className="flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Live Currency Calculator
              </span>
              <span className="text-[10px] text-[#afcdc8]">{showConverter ? 'Hide' : 'Open'}</span>
            </button>

            {showConverter && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#070e11] border border-[#8de5db]/20 space-y-2.5 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#afcdc8] mb-1">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#0c181d] border border-[#8de5db]/20 rounded-lg text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#afcdc8] mb-1">From Currency</label>
                    <select
                      value={calcFrom}
                      onChange={(e) => setCalcFrom(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#0c181d] border border-[#8de5db]/20 rounded-lg text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                    >
                      {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSwapCalc}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#afcdc8] hover:text-white transition-colors"
                    title="Swap Currencies"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 ml-2">
                    <select
                      value={calcTo}
                      onChange={(e) => setCalcTo(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#0c181d] border border-[#8de5db]/20 rounded-lg text-white text-xs focus:outline-none focus:border-[#4fb8b2]"
                    >
                      {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#132228] border border-[#4fb8b2]/30 text-center">
                  <span className="text-[10px] text-[#afcdc8] block">Converted Total</span>
                  <span className="text-base font-bold text-[#60d7cf]">
                    {SUPPORTED_CURRENCIES[calcTo]?.symbol || ''}
                    {calculatedResult.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs text-white/80">{calcTo}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
