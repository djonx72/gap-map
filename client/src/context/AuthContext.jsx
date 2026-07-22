/**
 * AuthContext.jsx — application-wide authentication state.
 *
 * Provides:
 *  - user:    Supabase auth user object, or null if not signed in.
 *  - profile: Row from the `profiles` table for the current user, or null.
 *  - loading: true while the initial session check and profile fetch are in flight.
 *  - logout(): Signs out via Supabase; consuming pages redirect to /login afterward.
 *
 * One Supabase client instance is imported from lib/supabaseClient.js.
 * No JWT or access token is stored in localStorage/sessionStorage by this file —
 * session persistence is handled entirely by the Supabase client's built-in storage.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch the profile row for a given user id.
   * Returns the profile object or null (never throws — errors are silently swallowed
   * so a missing profiles row doesn't break the session entirely).
   */
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Row not found (PGRST116) is expected immediately after signUp before the
      // backend has created the profile. Any other error is unexpected but non-fatal.
      return null
    }
    return data
  }

  /**
   * Forces the context to re-fetch the current user's profile from the database.
   * Crucial for the signup flow where the auth session is created before the 
   * backend creates the profile row.
   */
  async function reloadProfile() {
    if (user?.id) {
      const prof = await fetchProfile(user.id)
      setProfile(prof)
    }
  }

  useEffect(() => {
    // 1. Check for an existing session on mount (handles page refresh while logged in).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.id)
        setProfile(prof)
      }
      setLoading(false)
    })

    // 2. Subscribe to auth state changes (login, logout, token refresh, signup).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.id)
          setProfile(prof)
        } else {
          setUser(null)
          setProfile(null)
        }
        // After the first getSession() resolves, loading is already false.
        // Subsequent onAuthStateChange events should not re-enable loading to avoid
        // flashing the loading state on every token refresh.
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Sign the current user out. The consuming page is responsible for
   * redirecting to /login after calling this.
   */
  async function logout() {
    await supabase.auth.signOut()
    // onAuthStateChange fires after signOut and clears user/profile state.
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth — hook to consume AuthContext.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
