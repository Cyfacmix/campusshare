import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner className="py-24" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner className="py-24" />
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
