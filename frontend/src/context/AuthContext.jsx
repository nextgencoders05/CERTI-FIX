import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('certifix_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('certifix_token')
    if (!token) {
      setLoading(false)
      return
    }
    authAPI
      .me()
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('certifix_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('certifix_token')
        localStorage.removeItem('certifix_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const loginSuccess = (token, userData) => {
    localStorage.setItem('certifix_token', token)
    localStorage.setItem('certifix_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('certifix_token')
    localStorage.removeItem('certifix_user')
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await authAPI.me()
    setUser(res.data)
    localStorage.setItem('certifix_user', JSON.stringify(res.data))
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
