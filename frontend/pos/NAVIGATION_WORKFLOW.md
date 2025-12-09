# SofiaPOS Navigation Workflow Documentation

## Overview

This document describes the navigation workflow in the SofiaPOS application, including how authentication, registration, and route protection are handled.

## Route Structure

```
RootRoute (/) [Always renders]
├── Public Routes (No authentication required)
│   ├── /login (LoginPage)
│   └── /register (RegistrationPage)
│
└── Protected Routes (Authentication required)
    └── ProtectedRoute (Layout wrapper)
        ├── / (POSScreen)
        ├── /check-shift (CheckShiftPage)
        └── /open-shift (OpenShiftPage)
```

## Component Hierarchy

```
App
└── AuthProvider
    └── RouterProvider
        └── RootRoute (Root component)
            ├── LoginPage (/login)
            ├── RegistrationPage (/register)
            └── ProtectedRoute (Layout)
                ├── POSScreen (/)
                ├── CheckShiftPage (/check-shift)
                └── OpenShiftPage (/open-shift)
```

## Navigation Flow Diagram

### Initial App Load

```
App Starts
    ↓
AuthContext Initializes
    ├── Check localStorage for user data
    ├── Restore user if found
    └── Set isLoading = false
    ↓
RootRoute useEffect triggers
    ├── Check circuit breaker
    ├── Wait for authLoading = false
    └── Evaluate navigation logic
```

### Navigation Decision Tree

```
Current Path?
│
├── Protected Route (/, /check-shift, /open-shift)
│   └── RootRoute: Skip navigation logic
│       └── ProtectedRoute: Handle auth check
│           ├── isLoading? → Show spinner
│           ├── !isAuthenticated? → Navigate to /login
│           ├── !isRegistered? → Navigate to /register
│           └── All checks pass → Render <Outlet />
│
└── Public Route (/login, /register)
    └── RootRoute: Handle navigation
        │
        ├── Registration Check
        │   ├── !registered? → Navigate to /register
        │   └── registered? → Continue
        │
        └── Authentication Check
            ├── isAuthenticated?
            │   ├── Yes → Navigate to /
            │   └── No → Stay on /login
```

## Detailed Workflow

### 1. RootRoute Navigation Logic

**Location**: `frontend/pos/src/components/RootRoute.tsx`

**Responsibilities**:
- Handle navigation from public routes to protected routes
- Check registration status
- Check authentication status
- Navigate from `/login` or `/register` to `/` when authenticated
- **DO NOT** interfere with protected routes (let ProtectedRoute handle them)

**Flow**:

```
1. Circuit Breaker Check
   ├── If disabled → Stop (show circuit breaker UI)
   └── If enabled → Continue

2. Wait for Auth Loading
   ├── If authLoading = true → Return (skip navigation)
   └── If authLoading = false → Continue

3. Detect Auth State Change
   ├── If auth changed (false → true) → Reset navigation flags
   └── Continue

4. Route Type Check
   ├── If protected route → Skip (let ProtectedRoute handle)
   └── If public route → Continue

5. Registration Check
   ├── If !registered → Navigate to /register
   └── If registered → Continue

6. Authentication Check
   ├── If authenticated → Navigate from /login|/register to /
   └── If !authenticated → Navigate to /login
```

**Key Guards**:
- `hasNavigatedRef`: Prevents duplicate navigation in same effect run
- `lastAuthStateRef`: Tracks last handled auth state to prevent re-processing
- `hasNavigatedFromLoginRef`: Prevents loop from /login to /
- Navigation cooldown: Prevents rapid navigations
- Circuit breaker: Stops navigation after threshold

### 2. ProtectedRoute Navigation Logic

**Location**: `frontend/pos/src/components/auth/ProtectedRoute.tsx`

**Responsibilities**:
- Verify authentication for protected routes
- Verify registration status
- Redirect to `/login` if not authenticated
- Redirect to `/register` if not registered
- Render protected route content if all checks pass

**Flow**:

```
1. Check Auth Loading
   ├── If isLoading = true → Show spinner
   └── If isLoading = false → Continue

2. Check Authentication
   ├── If !isAuthenticated → Navigate to /login (with guard)
   └── If isAuthenticated → Continue

3. Check Registration
   ├── If !isRegistered → Navigate to /register (with guard)
   └── If isRegistered → Continue

4. Render Protected Content
   └── Return <Outlet /> (render child route)
```

**Key Guards**:
- `hasNavigatedRef`: Prevents multiple navigations (resets on pathname change)
- Shows loading spinner instead of navigating again if already navigating

### 3. Authentication Context

**Location**: `frontend/pos/src/contexts/AuthContext.tsx`

**Initialization**:
```
1. Component mounts
2. Check isInitializedRef
   ├── If already initialized → Skip
   └── If not initialized → Continue
3. Set isInitializedRef = true
4. Check localStorage for user data
5. Restore user if found
6. Set isLoading = false
```

**State Management**:
- `user`: User object or null
- `isAuthenticated`: Computed as `!!user`
- `isLoading`: Initial loading state
- All functions memoized with `useCallback`
- Context value memoized with `useMemo`

## Navigation Scenarios

### Scenario 1: First Time User (Not Registered)

```
1. App loads → RootRoute checks registration
2. !registered → Navigate to /register
3. User completes registration
4. Registration saved → Navigate to /login (or continue to sync step)
```

### Scenario 2: User Not Authenticated

```
1. User on /login
2. RootRoute checks: !isAuthenticated
3. Stay on /login (already there)
4. User enters credentials
5. Login successful → isAuthenticated = true
6. RootRoute detects auth state change
7. Reset navigation flags
8. Navigate from /login to /
9. ProtectedRoute checks: isAuthenticated = true ✓
10. Render POSScreen
```

### Scenario 3: User Authenticated, Accessing Protected Route

```
1. User navigates to / (or any protected route)
2. RootRoute detects protected route → Skip navigation logic
3. ProtectedRoute checks:
   ├── isLoading? → Show spinner
   ├── !isAuthenticated? → Navigate to /login
   ├── !isRegistered? → Navigate to /register
   └── All pass → Render <Outlet />
```

### Scenario 4: User Logs Out

```
1. User clicks logout
2. AuthContext.logout() called
3. Clear tokens and user data
4. setUser(null) → isAuthenticated = false
5. RootRoute detects: !isAuthenticated
6. Navigate to /login
```

### Scenario 5: User Already Authenticated (Page Refresh)

```
1. App loads
2. AuthContext restores user from localStorage
3. isAuthenticated = true
4. RootRoute checks:
   ├── If on /login → Navigate to /
   └── If on / → ProtectedRoute handles
5. ProtectedRoute checks: isAuthenticated = true ✓
6. Render protected content
```

## Circuit Breaker Mechanism

**Purpose**: Prevent infinite navigation loops

**Implementation**:
- Global navigation counter (stored in localStorage)
- Per-path navigation counter (in-memory Map)
- Navigation cooldown (1 second between navigations)
- Maximum navigations per path (3)
- Maximum global navigations (15)

**When Triggered**:
- If navigation count exceeds threshold → Disable navigation
- Show circuit breaker UI with navigation log
- User can re-enable navigation manually

**Recovery**:
- Call `window.enableNavigation()` in console
- Or click "Re-enable Navigation & Reload" button

## Key Design Decisions

### 1. Separation of Concerns

- **RootRoute**: Handles navigation FROM public routes TO protected routes
- **ProtectedRoute**: Handles authentication checks FOR protected routes
- **No overlap**: RootRoute skips protected routes, ProtectedRoute handles them

### 2. Auth State Change Detection

- Detects when `isAuthenticated` changes from `false` to `true`
- Resets navigation flags to allow fresh navigation after login
- Bypasses cooldown and duplicate checks when auth state changes

### 3. Navigation Guards

- Multiple layers of guards prevent loops:
  - `hasNavigatedRef`: Per-effect-run guard
  - `lastAuthStateRef`: State-based guard
  - `hasNavigatedFromLoginRef`: Persistent flag guard
  - Navigation cooldown: Time-based guard
  - Circuit breaker: Global threshold guard

### 4. Memoization

- All context functions memoized with `useCallback`
- Context value memoized with `useMemo`
- Prevents unnecessary re-renders of consumers

## Debugging

### Console Logs

All navigation decisions are logged with prefixes:
- `[RootRoute]`: RootRoute navigation logic
- `[ProtectedRoute]`: ProtectedRoute auth checks
- `[AuthContext]`: Authentication context operations

### Navigation Log

Stored in `localStorage` under key `pos_navigation_log`:
- View: `window.viewNavigationLog()`
- Clear: `window.clearNavigationLog()`

### Circuit Breaker Controls

- Enable: `window.enableNavigation()`
- Disable: `window.disableNavigation()`
- View log: `window.viewNavigationLog()`

## Common Issues and Solutions

### Issue: Infinite Loop Between /login and /

**Cause**: Both RootRoute and ProtectedRoute trying to navigate

**Solution**: 
- RootRoute skips protected routes (lets ProtectedRoute handle)
- ProtectedRoute has navigation guard to prevent multiple navigations

### Issue: Navigation Not Happening After Login

**Cause**: Navigation flags not reset when auth state changes

**Solution**:
- Detect auth state change (false → true)
- Reset all navigation flags
- Bypass cooldown and duplicate checks

### Issue: Multiple Initializations

**Cause**: React Strict Mode double-mounting in development

**Solution**:
- Use `isInitializedRef` in AuthContext
- Check before initializing
- Only initialize once

## Flow Summary

```
App Start
    ↓
AuthContext: Initialize (once)
    ↓
RootRoute: Check route type
    ├── Protected? → Skip (let ProtectedRoute handle)
    └── Public? → Check registration & auth
        ├── !registered → /register
        ├── !authenticated → /login
        └── authenticated → / (if on /login or /register)
            ↓
        ProtectedRoute: Check auth
            ├── !authenticated → /login
            ├── !registered → /register
            └── All pass → Render content
```

## Route Protection Matrix

| Route | Public/Protected | RootRoute Handles | ProtectedRoute Handles |
|-------|------------------|-------------------|------------------------|
| `/login` | Public | ✓ | ✗ |
| `/register` | Public | ✓ | ✗ |
| `/` | Protected | ✗ | ✓ |
| `/check-shift` | Protected | ✗ | ✓ |
| `/open-shift` | Protected | ✗ | ✓ |

## State Dependencies

```
AuthContext State
    ├── user: User | null
    ├── isAuthenticated: boolean (computed: !!user)
    └── isLoading: boolean

Registration State
    ├── isRegistered(): boolean
    └── getRegistrationProgress(): RegistrationProgress | null

Navigation State
    ├── hasNavigatedRef: boolean (per effect run)
    ├── lastAuthStateRef: { isAuthenticated, pathname } | null
    ├── hasNavigatedFromLoginRef: boolean (persistent)
    └── navigationHistory: Map<path, { count, lastNavigation }>
```

## Best Practices

1. **Never navigate from ProtectedRoute to another protected route** - Let RootRoute handle public→protected navigation
2. **Always check isLoading before checking isAuthenticated** - Prevents race conditions
3. **Use navigation guards** - Prevent duplicate navigations
4. **Log navigation decisions** - Helps with debugging
5. **Reset flags on pathname change** - Prevents stale state

## Future Improvements

1. Consider using TanStack Router's built-in route guards
2. Move circuit breaker to a separate hook
3. Add unit tests for navigation logic
4. Consider using a state machine (XState) for complex navigation flows

