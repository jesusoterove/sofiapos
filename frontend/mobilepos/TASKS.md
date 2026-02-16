# Mobile POS Task Board

_All work PRs into `feature/mobilepos-app`. Short-lived branches follow `task/mobilepos-<slug>` naming, forked from the feature branch._

## Epic A – Shared Foundations
1. **A1 – Create `frontend/sofia-shared` package**
   - Deliverables: package scaffolding, tsconfig, build config, Storybook placeholder, README.
   - Tests: lint + typecheck pass in CI.
2. **A2 – Extract design tokens & utilities**
   - Deliverables: color palette, typography scale, spacing, elevation, border radii, icon sizes, plus formatting helpers (currency, dates) sourced from existing POS.
   - Tests: snapshot tests for tokens; unit tests for formatting helpers.
3. **A3 – Wire shared package into console/POS**
   - Deliverables: update imports to consume `sofia-shared`; ensure POS builds unchanged.
   - Tests: existing POS unit tests + manual smoke.

## Epic B – Mobile App Skeleton
4. **B1 – Initialize Expo RN project (`frontend/mobilepos`)**
   - Deliverables: Expo Router setup, TypeScript config, nativewind, TanStack Query, Zustand, localization scaffolding, theme provider wired to `sofia-shared` tokens.
   - Tests: `npm run lint`, `npm run test` (base), app launches on simulator.
5. **B2 – Navigation + shell**
   - Deliverables: bottom tabs (phones) + adaptive layout for tablets; placeholder screens for Sell/Tables/Orders/Inventory/Settings.
   - Tests: screenshot diff or visual QA + routing unit tests.

## Epic C – Auth & Bootstrap
6. **C1 – OpenAPI client generation**
   - Deliverables: script to pull backend OpenAPI spec, generate TypeScript client shared by mobilepos.
   - Tests: CI check ensuring generated code up-to-date (`npm run api:check`).
7. **C2 – Auth flows**
   - Deliverables: login, token storage (SecureStore), refresh handling, device registration screen.
   - Tests: unit tests for auth hooks, integration test simulating token expiry.
8. **C3 – Initial sync bootstrap**
   - Deliverables: SQLite schema, bootstrap job fetching store config/products/taxes/users, progress UI.
   - Tests: Jest tests for DB helpers, manual offline bootstrap scenario.

## Epic D – Selling Experience
9. **D1 – Catalog browsing & search**
   - Deliverables: product grid/list, categories, search bar, barcode scanning (camera).
   - Tests: component tests for filters, integration test mocking search.
10. **D2 – Cart, modifiers, discounts**
    - Deliverables: cart store, modifier selection UI, price calculations, discount application.
    - Tests: unit tests for cart math, snapshot tests for modifier UI.
11. **D3 – Table/customer assignment**
    - Deliverables: table map/list, assign/unassign UI, customer search.
    - Tests: integration tests verifying state persistence offline.

## Epic E – Payments & Shifts
12. **E1 – Shift + cash drawer management**
    - Deliverables: open/close shift, cash counts, handoff reports, offline queue.
    - Tests: unit tests for cash math; integration test covering offline open/close.
13. **E2 – Payment keypad + tender flow**
    - Deliverables: numeric keypad, tender selection (cash/card/custom), split payments, change calculation, receipt preview.
    - Tests: Jest tests for payment calculations; Detox flow covering sale completion.

## Epic F – Orders, Inventory, Settings
14. **F1 – Order history + reprint**
    - Deliverables: order list with status badges, detail view, reprint/share capability, unsynced indicator + retry.
    - Tests: integration test simulating offline order then sync.
15. **F2 – Inventory adjustments & receiving**
    - Deliverables: quick adjustment forms, reason codes, offline queue, confirmation receipts.
    - Tests: unit tests for adjustment calculations, integration test verifying sync conflict resolution.
16. **F3 – Settings & diagnostics**
    - Deliverables: language toggle, theme preview, sync diagnostics pane, manual sync button, device info.
    - Tests: component tests + manual QA of sync display.

## Epic G – QA & Release
17. **G1 – Accessibility & localization pass**
    - Deliverables: screen-reader labels, dynamic type support, translation coverage (ES/EN parity).
    - Tests: automated i18n key check, accessibility linting.
18. **G2 – Automated testing & CI pipelines**
    - Deliverables: GitHub Actions workflow covering lint/test/e2e smoke; EAS build triggers.
    - Tests: ensure CI green across PRs.
19. **G3 – Beta packaging + release playbook**
    - Deliverables: TestFlight/Play Store internal builds, release checklist, rollback plan.
    - Tests: install + smoke test on physical devices.

## Testing Strategy Summary
- **Unit/component**: Jest + RN Testing Library per task (cart math, auth hooks, formatting helpers).
- **Integration**: Simulated offline scenarios using Detox or Jest with SQLite mocks.
- **E2E**: Detox scripts for critical flows (login → sale → payment → sync; inventory adjustment; shift open/close).
- **Contract**: CI job verifying OpenAPI client matches backend spec every PR.

## Branching Workflow
1. `git checkout -b feature/mobilepos-app` from `main` (once; lives until merge).
2. For each task: `git checkout feature/mobilepos-app && git checkout -b task/mobilepos-<slug>`.
3. Implement task, run tests, open PR targeting `feature/mobilepos-app`.
4. After review/CI pass, merge task branch → feature branch.
5. Once all tasks complete, final PR from `feature/mobilepos-app` → `main`.

Cursor CLI agents can be pointed at each numbered task with the corresponding acceptance criteria + testing requirements above.
