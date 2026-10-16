import React, { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { authApi, getErrorMessage } from '#/lib/api'
import { useAuth } from '#/lib/auth-context'
import { Mail, Lock, LogIn, AlertCircle, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await authApi.login({ email, password })
      login(response.token, {
        id: response.userId,
        name: response.name,
        email: response.email,
        role: response.role,
      })
      navigate({ to: '/' })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#328f97] to-[#4fb8b2] shadow-xl shadow-[#4fb8b2]/20 mb-4">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back to ApexFinance</h1>
          <p className="text-sm text-[#afcdc8] mt-1.5">Sign in to manage your cash flow and accounts</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f1a1e]/90 border border-[#8de5db]/20 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#afcdc8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white placeholder-[#afcdc8]/40 text-sm focus:outline-none focus:border-[#4fb8b2] focus:ring-1 focus:ring-[#4fb8b2] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#afcdc8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white placeholder-[#afcdc8]/40 text-sm focus:outline-none focus:border-[#4fb8b2] focus:ring-1 focus:ring-[#4fb8b2] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-[#4fb8b2]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#8de5db]/10 text-center">
            <p className="text-xs text-[#afcdc8]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[#60d7cf] font-semibold hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
