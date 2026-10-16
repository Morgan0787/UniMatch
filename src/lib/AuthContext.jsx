import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [appPublicSettings, setAppPublicSettings] = useState({ auth_required: false })

  const ensureUserProfile = async (authUser) => {
    if (!authUser?.id) return

    try {
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      if (existingProfile) {
        return
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: authUser.id,
        email: authUser.email ?? null,
        full_name: authUser.user_metadata?.full_name || authUser.full_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.warn('Unable to create profile', insertError)
      }
    } catch (err) {
      console.warn('Unable to create profile', err)
    }
  }

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      setIsLoadingAuth(true)
      setAuthError(null)

      try {
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          setSession(null)
          setUser(null)
          setIsAuthenticated(false)
          setAuthError(null)
          setIsLoadingAuth(false)
          return
        }

        const nextSession = data?.session ?? null
        const nextUser = nextSession?.user ?? null

        setSession(nextSession)
        setUser(
          nextUser
            ? {
                id: nextUser.id,
                email: nextUser.email,
                full_name: nextUser.user_metadata?.full_name,
                role: nextUser.user_metadata?.role,
                ...nextUser.user_metadata,
              }
            : null
        )
        setIsAuthenticated(Boolean(nextUser))

      } catch (err) {
        console.warn('Unable to restore session', err)
      } finally {
        if (mounted) {
          setIsLoadingAuth(false)
        }
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null

      setSession(nextSession ?? null)
      setUser(
        nextUser
          ? {
              id: nextUser.id,
              email: nextUser.email,
              full_name: nextUser.user_metadata?.full_name,
              role: nextUser.user_metadata?.role,
              ...nextUser.user_metadata,
            }
          : null
      )
      setIsAuthenticated(Boolean(nextUser))
      setAuthError(null)
      setIsLoadingAuth(false)

    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Auth callbacks hold Supabase's session lock. Database calls belong outside
  // that callback so restoring a session cannot deadlock the profile request.
  useEffect(() => {
    if (session?.user) void ensureUserProfile(session.user)
  }, [session?.user])

  const logout = async (redirectTo = '/') => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Unable to sign out', err)
    }

    if (typeof window !== 'undefined') {
      window.location.assign(redirectTo)
    }
  }

  const navigateToLogin = (returnTo) => {
    const next = returnTo || window.location.href
    window.location.assign(`/Login?redirect_to=${encodeURIComponent(next)}`)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
    }),
    [user, session, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings]
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
