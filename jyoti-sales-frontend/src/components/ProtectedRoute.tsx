import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

/**
 * Wraps any route that requires the user to be logged in.
 * If not authenticated, redirects to /login and preserves
 * the attempted URL in `?redirect=` so the user lands back
 * after signing in.
 */
export default function ProtectedRoute({ children }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const location = useLocation()

  if (!accessToken) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  return <>{children}</>
}
