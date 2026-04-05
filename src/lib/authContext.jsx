// src/lib/authContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from './firebase'
import {
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
      } else {
        // Auto sign in anonymously
        const { user: anon } = await signInAnonymously(auth)
        setUser(anon)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  /** Let the user pick a display name */
  async function setDisplayName(name) {
    if (!auth.currentUser) return
    await updateProfile(auth.currentUser, { displayName: name })
    setUser({ ...auth.currentUser })
  }

  return (
    <AuthContext.Provider value={{ user, loading, setDisplayName }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}