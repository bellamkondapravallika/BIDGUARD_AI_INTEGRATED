import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout, setToken, removeToken, getToken } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        removeToken()
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const loginUser = async (email, password) => {
    const data = await apiLogin(email, password)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const signupUser = async (name, organization, email, password, confirmPassword) => {
    const data = await apiSignup(name, organization, email, password, confirmPassword)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const logoutUser = async () => {
    try {
      await apiLogout()
    } finally {
      removeToken()
      setUser(null)
      window.location.href = '/login'
    }
  }

  const refreshUser = async () => {
    try {
      const updated = await getMe()
      setUser(updated)
      return updated
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, signupUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
