// utils/auth.ts
import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../utils/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth init error:', error.message)
      set({ user: null, session: null, isLoading: false, isAuthenticated: false })
      return
    }

    set({ session, user: session?.user ?? null, isLoading: false, isAuthenticated: !!session?.user })

    // Listen to auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isAuthenticated: !!session?.user })
    })
  },

  login: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error.message)
      return { error: error.message }
    }

    set({ session: data.session, user: data.user, isAuthenticated: true })
    return { error: null }
  },

  signup: async (email, password) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('Signup error:', error.message)
      return { error: error.message }
    }

    set({ session: data.session, user: data.user, isAuthenticated: true })
    return { error: null }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, isAuthenticated: false, isLoading: false })
  },
}))

// Auto-init on load
useAuthStore.getState().init()
