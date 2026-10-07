import { create } from 'zustand'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'jyoti-theme'

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.localStorage.setItem(STORAGE_KEY, theme)
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

// Light-premium is the default; dark is an explicit, remembered opt-in — matches
// the design brief ("light-premium default, with a dark theme toggle").
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),
  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
}))
