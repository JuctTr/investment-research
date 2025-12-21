import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user) =>
        set(
          { user, isAuthenticated: true, isLoading: false },
          false,
          'login'
        ),

      logout: () =>
        set(
          { user: null, isAuthenticated: false, isLoading: false },
          false,
          'logout'
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),
    }),
    {
      name: 'user-store',
    }
  )
)