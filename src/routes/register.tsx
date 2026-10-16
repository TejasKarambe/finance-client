import React, { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { authApi, getErrorMessage } from '#/lib/api'
import { useAuth } from '#/lib/auth-context'
import { Mail, Lock, User as UserIcon, UserPlus, AlertCircle, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.register({ name, email, password })
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#328f97] to-[#4fb8b2] shadow-xl shadow-[#4fb8b2]/20 mb-4">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create an ApexFinance Account</h1>
          <p className="text-sm text-[#afcdc8] mt-1.5">Track multi-account balances, budgets & cash flow</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f1a1e]/90 border border-[#8de5db]/20 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#afcdc8]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white placeholder-[#afcdc8]/40 text-sm focus:outline-none focus:border-[#4fb8b2] focus:ring-1 focus:ring-[#4fb8b2] transition-all"
                />
              </div>
            </div>

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
                  placeholder="jane@example.com"
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
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white placeholder-[#afcdc8]/40 text-sm focus:outline-none focus:border-[#4fb8b2] focus:ring-1 focus:ring-[#4fb8b2] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d7ece8] uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#afcdc8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070e11] border border-[#8de5db]/20 rounded-xl text-white placeholder-[#afcdc8]/40 text-sm focus:outline-none focus:border-[#4fb8b2] focus:ring-1 focus:ring-[#4fb8b2] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#328f97] to-[#4fb8b2] hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-[#4fb8b2]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#8de5db]/10 text-center">
            <p className="text-xs text-[#afcdc8]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#60d7cf] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
