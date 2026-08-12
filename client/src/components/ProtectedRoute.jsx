import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess } from '../utils/permissions'

function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <span className="spinner" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && typeof canAccess === 'function' && !canAccess(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
