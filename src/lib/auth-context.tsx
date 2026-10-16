import React, { createContext, useContext, useEffect, useState } from 'react'
import { type User, authApi } from './api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage on client mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('finance_token')
      const storedUser = localStorage.getItem('finance_user')

      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } catch {
          localStorage.removeItem('finance_token')
          localStorage.removeItem('finance_user')
        }
      }
      setIsLoading(false)
    }
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_token', newToken)
      localStorage.setItem('finance_user', JSON.stringify(newUser))
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finance_token')
      localStorage.removeItem('finance_user')
      window.location.href = '/login'
    }
  }

  const refreshUser = async () => {
    if (!token) return
    try {
      const freshUser = await authApi.getMe()
      setUser(freshUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('finance_user', JSON.stringify(freshUser))
      }
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
