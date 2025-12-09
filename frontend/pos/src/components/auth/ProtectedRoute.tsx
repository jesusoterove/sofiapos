/**
 * Protected route component that requires authentication.
 * Authentication and registration checks are handled in the route's beforeLoad guard.
 * Sync and shift checks are handled in POSScreen.
 */
import { Outlet } from '@tanstack/react-router'

export function ProtectedRoute() {
  // All authentication and registration checks are handled in beforeLoad
  // This component just renders the child routes
  return <Outlet />
}

