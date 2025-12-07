import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { POSScreen } from '@/features/pos-screen/POSScreen'
import { LoginPage } from '@/pages/login/LoginPage'
import { RegistrationPage } from '@/pages/registration/RegistrationPage'
import { CheckShiftPage } from '@/pages/shift/CheckShiftPage'
import { OpenShiftPage } from '@/pages/shift/OpenShiftPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Root route
const rootRoute = createRootRoute()

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// Registration route (public, for first-time setup)
const registrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegistrationPage,
})

// Protected layout wrapper
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: ProtectedRoute,
  id: 'layout',
})

// Check shift route (protected) - checks if shift is open
const checkShiftRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/check-shift',
  component: CheckShiftPage,
})

// Open shift route (protected)
const openShiftRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/open-shift',
  component: OpenShiftPage,
})

// Index route - Main POS Screen (protected)
const indexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/',
  component: POSScreen,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  registrationRoute,
  protectedLayoutRoute.addChildren([
    checkShiftRoute,
    openShiftRoute,
    indexRoute,
  ]),
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

