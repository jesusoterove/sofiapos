import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Stores } from '@/pages/Stores'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Root route
const rootRoute = createRootRoute()

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

// Protected layout wrapper
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: ProtectedRoute,
  id: 'layout',
})

// App Layout route (inside protected wrapper)
const appLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  component: AppLayout,
  id: 'app',
})

// Index route (Dashboard) - protected
const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: Dashboard,
})

// Stores route - protected
const storesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/stores',
  component: Stores,
})

// Users route - protected
const usersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Users</h1></div>,
})

// Products route - protected
const productsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/products',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Products</h1></div>,
})

// Orders route - protected
const ordersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/orders',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Orders</h1></div>,
})

// Inventory route - protected
const inventoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Inventory</h1></div>,
})

// Settings route - protected
const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1></div>,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayoutRoute.addChildren([
    appLayoutRoute.addChildren([
      indexRoute,
      storesRoute,
      usersRoute,
      productsRoute,
      ordersRoute,
      inventoryRoute,
      settingsRoute,
    ]),
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
