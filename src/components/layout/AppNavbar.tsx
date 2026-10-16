import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '#/lib/auth-context'
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  WalletCards, 
  PieChart, 
  FileSpreadsheet, 
  LogOut, 
  LogIn, 
  UserPlus,
  TrendingUp
} from 'lucide-react'

export function AppNavbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
    { label: 'Accounts', to: '/accounts', icon: WalletCards },
    { label: 'Budgets', to: '/budgets', icon: PieChart },
    { label: 'Reports', to: '/reports', icon: FileSpreadsheet },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a1418]/85 border-b border-[#8de5db]/15 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#328f97] to-[#4fb8b2] flex items-center justify-center shadow-lg shadow-[#4fb8b2]/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#60d7cf] transition-colors">
              Apex<span className="text-[#4fb8b2]">Finance</span>
            </span>
            <span className="text-[10px] text-[#afcdc8] uppercase tracking-wider font-semibold">
              Wealth & Budget Engine
            </span>
          </div>
        </Link>

        {/* Navigation Links (Desktop) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-[#0f1a1e]/80 p-1.5 rounded-xl border border-[#8de5db]/10">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#328f97]/40 to-[#4fb8b2]/30 text-[#60d7cf] shadow-sm border border-[#4fb8b2]/30'
                      : 'text-[#afcdc8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#4fb8b2]' : 'text-[#afcdc8]'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        )}

        {/* User / Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0f1a1e] border border-[#8de5db]/15">
                <div className="w-7 h-7 rounded-full bg-[#4fb8b2]/20 border border-[#4fb8b2]/40 flex items-center justify-center text-[#60d7cf] text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-[#afcdc8] leading-tight truncate max-w-[120px]">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-950/30 border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40 transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#afcdc8] hover:text-white hover:bg-white/5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-90 shadow-md shadow-[#4fb8b2]/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar */}
      {isAuthenticated && (
        <nav className="flex md:hidden items-center justify-around mt-3 pt-2 border-t border-[#8de5db]/10">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
                  isActive ? 'text-[#60d7cf]' : 'text-[#afcdc8]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
