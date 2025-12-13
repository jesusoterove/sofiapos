import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router'
import { POSScreen } from '@/features/pos-screen/POSScreen'
import { LoginPage } from '@/pages/login/LoginPage'
import { RegistrationPage } from '@/pages/registration/RegistrationPage'
import { CheckShiftPage } from '@/pages/shift/CheckShiftPage'
import { OpenShiftPage } from '@/pages/shift/OpenShiftPage'
import { CloseShiftPage } from '@/pages/shift/CloseShiftPage'
import { SalesInvoicesPage } from '@/pages/sales/SalesInvoicesPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RootRoute } from '@/components/RootRoute'
import { isRegistered } from '@/utils/registration'
import { waitForAuthInitialization } from '@/contexts/AuthContext'

// Constants for localStorage keys
const USER_DATA_KEY = 'pos_user_data'

// Helper function to check authentication status
function isAuthenticated(): boolean {
  const storedUserData = localStorage.getItem(USER_DATA_KEY)
  return !!storedUserData
}

// ============================================================================
// ROOT ROUTE
// ============================================================================
// Root route handles initial navigation decisions based on registration and authentication status
const rootRoute = createRootRoute({
  component: RootRoute,
  beforeLoad: async ({ location }) => {
    const currentPath = location.pathname
    
    // CRITICAL: Skip navigation logic for protected routes FIRST - before any async operations
    // This prevents conflicts with protected route's beforeLoad
    if (currentPath.startsWith('/app')) {
      return
    }
    
    // CRITICAL: Skip navigation logic for public routes FIRST - they have their own guards
    // This prevents conflicts with their own beforeLoad hooks
    if (currentPath === '/login' || currentPath === '/register') {
      return
    }
    
    // Now wait for AuthContext to finish initializing (only for root path '/')
    await waitForAuthInitialization(1000)
    
    // Only handle root path '/' navigation logic
    if (currentPath !== '/') {
      return
    }
    
    // Check registration status
    const registered = isRegistered()
    // If not registered, redirect to registration
    if (!registered) {
      console.log('[rootRoute beforeLoad] Not registered, redirecting to /register')
      throw redirect({
        to: '/register',
      })
    }
    
    // Check authentication status (after waiting for auth initialization)
    if (!isAuthenticated()) {
      console.log('[rootRoute beforeLoad] Not authenticated, redirecting to /login')
      throw redirect({
        to: '/login',
      })
    }
    
    // Both registered and authenticated - redirect to /app
    console.log('[rootRoute beforeLoad] Registered and authenticated, redirecting to /app')
    throw redirect({
      to: '/app',
    })
  },
})

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: async () => {
    // Wait for AuthContext to finish initializing
    await waitForAuthInitialization(1000)
    
    // If already authenticated, redirect to /app
    if (isAuthenticated()) {
      console.log('[loginRoute beforeLoad] Already authenticated, redirecting to /app')
      throw redirect({
        to: '/app',
      })
    }
  },
})

// Registration route (public, for first-time setup)
const registrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegistrationPage,
  beforeLoad: async () => {
    // Wait for AuthContext to finish initializing
    await waitForAuthInitialization(1000)
    
    // If already registered, redirect to /app (or /login if not authenticated)
    if (isRegistered()) {
      if (isAuthenticated()) {
        console.log('[registrationRoute beforeLoad] Already registered and authenticated, redirecting to /app')
        throw redirect({
          to: '/app',
        })
      } else {
        console.log('[registrationRoute beforeLoad] Already registered but not authenticated, redirecting to /login')
        throw redirect({
          to: '/login',
        })
      }
    }
  },
})

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

// Protected layout wrapper for /app routes
// All child routes inherit the authentication and registration guards
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: ProtectedRoute,
  beforeLoad: async () => {
    console.log('[protectedLayoutRoute beforeLoad] STARTING - path:', window.location.pathname)
    
    // Wait for AuthContext to finish initializing
    await waitForAuthInitialization(1000)
    
    // Check registration status
    const registered = isRegistered()
    if (!registered) {
      console.log('[protectedLayoutRoute beforeLoad] Not registered, redirecting to /register')
      throw redirect({
        to: '/register',
      })
    }

    // Check authentication status
    const authCheck = isAuthenticated()
    if (!authCheck) {
      console.log('[protectedLayoutRoute beforeLoad] Not authenticated, redirecting to /login')
      throw redirect({
        to: '/login',
      })
    }

    // Both checks passed, allow route to load
    console.log('[protectedLayoutRoute beforeLoad] Registration and authentication checks passed')
  },
})

// Index route - Main POS Screen (protected, default for /app)
const appIndexRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/',
  component: POSScreen,
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
  validateSearch: (search: Record<string, unknown>): { initialCash?: string } => {
    return {
      initialCash: search.initialCash ? String(search.initialCash) : undefined,
    }
  },
  component: OpenShiftPage,
})

// Sales invoices route (protected)
const salesInvoicesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/sales-invoices',
  component: SalesInvoicesPage,
})

// Close shift route (protected)
const closeShiftRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/close-shift',
  validateSearch: (search: Record<string, unknown>): { finalCash?: string } => {
    return {
      finalCash: search.finalCash ? String(search.finalCash) : undefined,
    }
  },
  component: CloseShiftPage,
})

// ============================================================================
// ROUTE TREE
// ============================================================================
// Build the route tree with proper nesting
const routeTree = rootRoute.addChildren([
  // Public routes
  loginRoute,
  registrationRoute,
  // Protected routes (all under /app)
  protectedLayoutRoute.addChildren([
    appIndexRoute,
    checkShiftRoute,
    openShiftRoute,
    closeShiftRoute,
    salesInvoicesRoute,
  ]),
])

// ============================================================================
// ROUTER INSTANCE
// ============================================================================
// Create the router with the route tree
export const router = createRouter({ routeTree, context: { auth: undefined! } })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

