import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { Stores } from '@/pages/Stores'
import { Users } from '@/pages/Users'
import { Ingredients } from '@/pages/Ingredients'
import { IngredientFormPage } from '@/pages/IngredientFormPage'
import { Products } from '@/pages/Products'
import { ProductFormPage } from '@/pages/ProductFormPage'
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
  component: Users,
})

// Ingredients route - protected
const ingredientsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/ingredients',
  component: Ingredients,
})

// Ingredient form route (create) - protected
// Must be defined before the parameterized route
const ingredientNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/ingredients/new',
  component: IngredientFormPage,
})

// Ingredient form route (edit) - protected
// Must be defined after the 'new' route
const ingredientEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/ingredients/$ingredientId',
  component: IngredientFormPage,
})

// Products route - protected
const productsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/products',
  component: Products,
})

// Product form route (create) - protected
// Must be defined before the parameterized route
const productNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/products/new',
  component: ProductFormPage,
})

// Product form route (edit) - protected
// Must be defined after the 'new' route
const productEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/products/$productId',
  component: ProductFormPage,
})

// Orders route - protected
const ordersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/orders',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Orders</h1></div>,
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
      ingredientsRoute,
      ingredientNewRoute,
      ingredientEditRoute,
      productsRoute,
      productNewRoute,
      productEditRoute,
      ordersRoute,
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
