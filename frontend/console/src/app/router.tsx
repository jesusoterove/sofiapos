import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/dashboard'
import { Login } from '@/pages/login'
import { StoreList } from '@/pages/stores'
import { UserList } from '@/pages/users'
import { IngredientList } from '@/pages/ingredients'
import { IngredientForm } from '@/pages/ingredients/IngredientForm'
import { ProductList } from '@/pages/products'
import { ProductForm } from '@/pages/products/ProductForm'
import { Settings } from '@/pages/settings'
import { Sales } from '@/pages/sales'
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
  component: StoreList,
})

// Users route - protected
const usersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users',
  component: UserList,
})

// Ingredients route - protected
const ingredientsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/ingredients',
  component: IngredientList,
})

// Ingredient form route (create) - protected
// Must be defined before the parameterized route
const ingredientNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/ingredients/new',
  component: IngredientForm,
})

// Ingredient form route (edit) - protected
// Must be defined after the 'new' route
const ingredientEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/ingredients/$ingredientId',
  component: IngredientForm,
})

// Products route - protected
const productsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/products',
  component: ProductList,
})

// Product form route (create) - protected
// Must be defined before the parameterized route
const productNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/products/new',
  component: ProductForm,
})

// Product form route (edit) - protected
// Must be defined after the 'new' route
const productEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/inventory/products/$productId',
  component: ProductForm,
})

// Orders route - protected
const ordersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/orders',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Orders</h1></div>,
})

// Sales route - protected
const salesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales',
  component: Sales,
})

// Settings route - protected
const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: Settings,
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
      salesRoute,
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
