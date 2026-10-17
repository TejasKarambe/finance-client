import { useState, useRef, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import { useTheme } from '#/lib/theme-context'
import { notificationsApi, type NotificationItem } from '#/lib/api'
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  WalletCards, 
  PieChart, 
  FileSpreadsheet, 
  Repeat, 
  Target, 
  LogOut, 
  LogIn, 
  UserPlus,
  TrendingUp,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

export function AppNavbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  // Query notifications if logged in
  const { data: rawNotifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    enabled: isAuthenticated,
    refetchInterval: 30000, // refresh every 30s
  })

  const notifications = rawNotifications.filter(
    (n) => !dismissedNotificationIds.includes(n.id)
  )

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dismissAll = () => {
    setDismissedNotificationIds(rawNotifications.map((n) => n.id))
    setNotificationsOpen(false)
  }

  const dismissOne = (id: string) => {
    setDismissedNotificationIds((prev) => [...prev, id])
  }

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
    { label: 'Accounts', to: '/accounts', icon: WalletCards },
    { label: 'Budgets', to: '/budgets', icon: PieChart },
    { label: 'Recurring', to: '/recurring', icon: Repeat },
    { label: 'Goals', to: '/goals', icon: Target },
    { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      default:
        return <Info className="w-4 h-4 text-teal-400 shrink-0" />
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a1418]/90 dark:bg-[#0a1418]/90 border-b border-[#8de5db]/15 px-3 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#328f97] to-[#4fb8b2] flex items-center justify-center shadow-lg shadow-[#4fb8b2]/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg lg:text-xl font-bold tracking-tight text-white group-hover:text-[#60d7cf] transition-colors leading-tight">
                Apex<span className="text-[#4fb8b2]">Finance</span>
              </span>
              <span className="hidden sm:inline text-[9px] text-[#afcdc8] uppercase tracking-wider font-semibold">
                Enterprise Wealth Engine
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links (Desktop) */}
        {isAuthenticated && (
          <nav className="hidden lg:flex items-center gap-1 bg-[#0f1a1e]/80 p-1.5 rounded-xl border border-[#8de5db]/10">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#328f97]/40 to-[#4fb8b2]/30 text-[#60d7cf] shadow-sm border border-[#4fb8b2]/30'
                      : 'text-[#afcdc8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#4fb8b2]' : 'text-[#afcdc8]'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        )}

        {/* User / Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-teal-400" />}
          </button>

          {/* Notification Center */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0a1418]">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c181d] border border-[#8de5db]/25 shadow-2xl p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#8de5db]/15">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#4fb8b2]" />
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4fb8b2]/20 text-[#60d7cf]">
                          {notifications.length} new
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={dismissAll}
                        className="text-xs text-[#afcdc8] hover:text-white transition-colors"
                      >
                        Dismiss all
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#afcdc8]/60 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400/40" />
                        <span>All clear! No pending warnings or upcoming bills.</span>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 rounded-xl bg-[#132228] border border-[#8de5db]/10 hover:border-[#8de5db]/30 transition-all flex items-start gap-2.5 relative group"
                        >
                          <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                              <button
                                onClick={() => dismissOne(notif.id)}
                                className="text-[#afcdc8]/40 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Dismiss"
                              >
                                &times;
                              </button>
                            </div>
                            <p className="text-[11px] text-[#afcdc8] mt-0.5 leading-relaxed">{notif.message}</p>
                            {notif.actionUrl && (
                              <Link
                                to={notif.actionUrl}
                                onClick={() => setNotificationsOpen(false)}
                                className="inline-flex items-center gap-1 text-[10px] text-[#60d7cf] hover:underline mt-1.5 font-medium"
                              >
                                <span>Take Action</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0f1a1e] border border-[#8de5db]/15">
                <div className="w-6 h-6 rounded-full bg-[#4fb8b2]/20 border border-[#4fb8b2]/40 flex items-center justify-center text-[#60d7cf] text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight max-w-[100px] truncate">{user?.name}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-950/30 border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40 transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-md shadow-[#4fb8b2]/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-[#8de5db]/15 space-y-1 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-[#328f97]/40 text-[#60d7cf] border border-[#4fb8b2]/30'
                      : 'text-[#afcdc8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Bar (Sticky for thumb access) */}
      {isAuthenticated && (
        <nav className="flex lg:hidden items-center justify-around mt-2 pt-2 border-t border-[#8de5db]/10">
          {[
            { label: 'Dash', to: '/', icon: LayoutDashboard },
            { label: 'Ledger', to: '/transactions', icon: ArrowLeftRight },
            { label: 'Recurring', to: '/recurring', icon: Repeat },
            { label: 'Goals', to: '/goals', icon: Target },
            { label: 'Budgets', to: '/budgets', icon: PieChart },
          ].map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#60d7cf]' : 'text-[#afcdc8]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
