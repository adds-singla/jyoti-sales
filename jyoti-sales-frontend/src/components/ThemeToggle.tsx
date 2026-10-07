import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`relative h-8 w-14 rounded-pill border border-hairline/15 bg-panel flex items-center px-1 transition-theme ${className}`}
    >
      <motion.span
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="h-6 w-6 rounded-full bg-coral flex items-center justify-center text-onaccent"
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </motion.span>
    </button>
  )
}
