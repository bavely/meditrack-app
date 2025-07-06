// utils/auth.ts
import { LocalUser } from '@/types/user'
import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../utils/supabase'
interface AuthState {
  supaUser: User | null
  user: LocalUser | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error: string | null, supaUser: User | null }>
  signup: (email: string, password: string) => Promise<{ error: string | null, supaUser: User | null }>
  logout: () => Promise<void>
  setUser: (user: LocalUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  supaUser: null,
  setUser: (user) => set({ user }),

  init: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    console.log('Auth init session:', session)

    if (error) {
      console.error('Auth init error:', error.message)
      set({supaUser: null, user: null, session: null, isLoading: false, isAuthenticated: false })
      return
    }

    set({ session, isLoading: false, isAuthenticated: !!session, supaUser: session?.user })

    // Listen to auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isAuthenticated: !!session, supaUser: session?.user })
    })
  },

  login: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error.message)
      return { error: error.message, supaUser: null}
    }

    set({ session: data.session, isAuthenticated: true, supaUser: data.user })
    return { error: null, supaUser: data.user}
  },

  signup: async (email, password) => {
    const { error, data } = await supabase.auth.signUp({

      email,
      password,
      
    })

    if (error) {
      console.error('Signup error:', error.message)
      return { error: error.message , supaUser: null}
    }

    set({ session: data.session, isAuthenticated: false, supaUser: data.user })
    return { error: null, supaUser: data.user }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, isAuthenticated: false, isLoading: false, supaUser: null })
  },
}))

// Auto-init on load
useAuthStore.getState().init()
