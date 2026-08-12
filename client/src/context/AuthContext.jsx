/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi } from '../api'
import { setUnauthorizedHandler } from '../services/api'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'erp_token'
const USER_KEY = 'erp_user'

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token') || null
  } catch {
    return null
  }
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken)
  const [user, setUser] = useState(getStoredUser)
  const [isInitializing] = useState(false)

  const setSession = useCallback((accessToken, nextUser) => {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem('token', accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      localStorage.setItem('user', JSON.stringify(nextUser))
    } catch {
      /* localStorage unavailable */
    }
    setToken(accessToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('token')
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('user')
    } catch {
      /* localStorage unavailable */
    }
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (typeof setUnauthorizedHandler === 'function') {
      setUnauthorizedHandler(logout)
      return () => setUnauthorizedHandler(null)
    }
  }, [logout])

  const login = useCallback(
    async (email, password) => {
      const res = await loginApi({ email, password })
      const data = res.data
      const accessToken = data.accessToken || data.token
      const userData = data.data || { role: data.role || 'Admin', email }
      setSession(accessToken, userData)
      return data
    },
    [setSession]
  )

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      logout,
      setSession,
    }),
    [token, user, isInitializing, login, logout, setSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthProvider
