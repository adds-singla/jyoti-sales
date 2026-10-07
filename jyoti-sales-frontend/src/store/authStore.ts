import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: number | null
  fullName: string | null
  role: 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | null
  setAuth: (data: { accessToken: string; refreshToken: string; userId: number; fullName: string; role: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      fullName: null,
      role: null,
      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          userId: data.userId,
          fullName: data.fullName,
          role: data.role as 'ROLE_CUSTOMER' | 'ROLE_ADMIN',
        }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, userId: null, fullName: null, role: null }),
    }),
    { name: 'jyoti-auth' },
  ),
)
