# Mobile POS App Plan (Updated Feb 16, 2026)

> **Status – Feb 18:** Expo Router scaffold is live with nativewind/tailwind, TanStack Query, Zustand, and i18n providers wired to `@sofiapos/shared`. Next up: finalize Metro/Tailwind configs, theme providers, and shared UI primitives before handing work to Cursor for deeper feature tasks.

## 1. Mission & Constraints
- **Goal**: Deliver a touch-optimized mobile POS app (phones + tablets) that connects to the existing FastAPI backend and mirrors the visual system defined for `frontend/pos`, achieving **feature parity** with the current POS experience (including offline behavior) on iOS and Android.
- **Scope**: Work lives entirely under `frontend/mobilepos`. Backend, `frontend/console`, and `frontend/pos` remain untouched except for consuming shared resources.
- **Platforms**: iOS + Android (tablets first, phones adaptive). Desktop POS remains `frontend/pos`.
- **UX Guardrails**: Reuse typography, color tokens, button styles, and layout patterns defined for the POS React app. Tablets should feel almost identical to POS; phones apply responsive adjustments (stacked panels, bottom sheets).
- **Offline-first**: Must operate when disconnected, queueing orders/inventory updates/etc. until sync, mirroring the POS offline surface.

## 2. Target Workflows (MVP = Full POS Parity)
1. **Authentication + Device Registration**
2. **Shift & Cash Drawer Management** (opening, closing, cash counts, handoffs)
3. **Selling Flow** (catalog browsing, search, modifiers, tabs/orders, discounts, customer linking)
4. **Tables & Service Modes** (dine-in, takeout, delivery toggles)
5. **Payments** (cash, card, mixed, change calc, offline receipts)
6. **Order History & Reprint** (sync awareness, status badges)
7. **Inventory Actions** (receiving, adjustments, wastage logging)
8. **Customer + Loyalty Touchpoints** (basic profile lookup, points sync if available in POS)
9. **Settings + Diagnostics** (language, theme, sync health, device info)
10. **Hook/Extension Points** (mirroring POS hook contracts where feasible)

## 3. Architecture & Technology Stack
| Layer | Choice | Rationale |
| --- | --- | --- |
| Framework | React Native + Expo Router (TypeScript) | Consistent with React expertise; Expo accelerates builds.
| Styling | `nativewind` + **new shared package `frontend/sofia-shared`** exporting tokens, typography scales, spacing, elevations, and platform-agnostic utilities | Maintains visual parity across web + mobile; avoids DOM-specific leakage.
| State/Data | TanStack Query for server cache, Zustand for UI/ephemeral state | Aligns with existing POS architecture.
| Offline Storage | SQLite (Expo SQLite + WatermelonDB or Drizzle RN) reflecting backend models required offline | Robust local persistence + sync metadata.
| Sync Engine | Background task queue inspired by POS sync (client reference IDs, retries, conflict resolution) | Guarantees parity with existing behavior.
| Forms & Validation | React Hook Form + Zod schemas generated from backend OpenAPI | Ensures DTO parity and reduces drift.
| Testing | Jest + React Native Testing Library (unit/component), Detox (E2E), plus backend contract tests via generated clients.
| Distribution | Expo EAS (dev/preview/prod). |

## 4. Integration Points
- **API contract**: Generate API client from backend OpenAPI spec; align endpoints/DTOs 1:1 with POS usage.
- **Auth**: Same token issuance/refresh cycle; SecureStore for secrets; device fingerprint for remote wipe.
- **Sync hooks**: Mirror POS's offline queue semantics (orders, inventory, shifts, etc.).
- **Shared logic**: `frontend/sofia-shared` hosts tokens, formatting helpers, number/currency utilities, date/time formatting, and any non-UI logic usable by both POS + mobile.

## 5. Layout & Component Strategy
- **Tablets (≥768px)**: Three-panel layout identical to POS (Products | Order | Actions) with collapsible panels.
- **Phones (<768px)**: Bottom tab navigation (Sell, Tables, Orders, Inventory, Settings). Order/cart + payment appear as modal stack/bottom sheet overlays. Maintain 48px min touch targets.
- **Component Library**: Build `Surface`, `Button`, `Input`, `Tag`, `ListRow`, `Stepper`, `Keypad`, etc., referencing shared tokens. Hooks (`useTheme`, `useLocale`, `useCurrency`, `useSyncStatus`) import logic from `sofia-shared` wherever possible.
- **Accessibility**: Dynamic type, screen-reader labels, high-contrast toggle, haptic confirmations.

## 6. Offline & Sync Design
- **Local DB schema**: Products, categories, modifiers, taxes, tables, tabs/orders, customers, loyalty balances, inventory events, payments, shifts, employee permissions.
- **Sync cycles**: bootstrap on login; foreground invalidations via Query; background task (Expo Task Manager) for push/pull; manual "sync now" control.
- **Conflict policies**: server wins for catalog; queued mutations tagged with `client_reference_id`; duplicates resolved server-side; user prompts if conflict on order/table states.
- **Diagnostics**: Settings shows queue depth, last sync, error list with retry option.

## 7. Infrastructure & Tooling Needs
- **Packages**:
  - `frontend/sofia-ui` (existing, web-specific components) – remains intact.
  - **`frontend/sofia-shared` (new)** – design tokens, constants, formatting helpers, data mappers, TypeScript types that can be shared by console, POS, and mobilepos.
- **Monorepo setup**: Update workspace tooling (pnpm/Yarn) so console, POS, mobilepos, and shared packages resolve properly.
- **CI/CD**: GitHub Actions pipeline for lint/tests; EAS builds triggered per PR to mobile branch; artifact distribution to TestFlight/Internal Testing.
- **Branching**: Create long-lived feature branch `feature/mobilepos-app`; every chunk of work happens in short-lived task branches (e.g., `task/mobilepos-auth`).

## 8. Delivery Roadmap (Realistic 8-Week MVP)
1. **Week 1 – Foundations**
   - Create `feature/mobilepos-app` branch + Expo RN skeleton.
   - Stand up `frontend/sofia-shared` with existing POS tokens + utilities.
   - Integrate navigation, theme provider, localization scaffolding.
2. **Week 2 – Auth & Bootstrap**
   - API client generation, auth screens, SecureStore, initial sync bootstrap (store config, catalog download), offline DB schema.
3. **Week 3 – Catalog & Cart**
   - Product grid/list, search, modifiers, cart context, discounts, dine-in/takeout toggles.
4. **Week 4 – Shifts & Payments**
   - Shift/cash drawer flows, numeric keypad, payment methods (cash/card/mixed), change handling, receipt preview.
5. **Week 5 – Tables, Orders, History**
   - Table management UI, order history list, order detail/reprint, unsynced indicators, manual sync controls.
6. **Week 6 – Inventory & Customers**
   - Inventory adjustments/receiving, customer lookup forms, loyalty data, barcode scanning (camera-based).
7. **Week 7 – Settings, Diagnostics, Polish**
   - Settings views, sync diagnostics, localization polish, accessibility, performance tuning, bug triage.
8. **Week 8 – QA & Release Prep**
   - Automated test coverage, Detox e2e flows, regression passes, App Store/Play Store packaging, beta rollout docs.

## 9. Risks & Mitigations
- **Scope breadth**: Full parity means high workload; mitigate via strict task decomposition + parallel Cursor agent execution.
- **Token drift**: Without `sofia-shared`, styles diverge. Mitigate by publishing tokens early + gating merges on visual review.
- **Offline complexity**: Sync bugs can be costly. Invest early in integration tests + simulated offline scenarios.
- **Performance**: RN lists can stutter with large catalogs. Use FlashList/RecyclerListView and prefetching strategies.

## 10. Next Actions
1. Finish B1 bootstrap polish: Metro + tailwind config, global theme/i18n/query providers, sample dashboards/screens that exercise `@sofiapos/shared` tokens.
2. Capture navigation + provider decisions in `TASKS.md` so Cursor can run targeted subtasks (Tabs, modals, deep links).
3. Kick off C1 once the scaffold is stable: OpenAPI generator script + shared DTO types for RN clients.
4. Prep native build plumbing (prebuild config, EAS profiles) ahead of device testing.
5. Define QA/test expectations (unit + smoke flows) and bake them into the future B-tasks before opening Cursor work items.
