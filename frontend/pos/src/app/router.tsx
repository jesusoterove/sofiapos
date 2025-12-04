import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'

// Root route
const rootRoute = createRootRoute({
  component: () => <div>POS Root</div>,
})

// Index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>POS Screen</div>,
})

// Create the route tree
const routeTree = rootRoute.addChildren([indexRoute])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

