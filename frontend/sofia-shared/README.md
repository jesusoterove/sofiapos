# @sofiapos/shared

Platform-agnostic design tokens and utilities that power every SofiaPOS client (console, POS, mobile, mobilepos).

## Contents
- **Theme tokens** – color palettes, typography scales, spacing, elevations sourced from the POS/console Tailwind config.
- **Formatting helpers** – locale-aware currency, number, and date utilities shared across apps.
- **Type definitions** – theme contracts and helper types consumed by multiple frontends.

## Scripts
```bash
npm run build      # Generate dist outputs
npm run dev        # Watch mode build (tsc --watch)
npm run clean      # Remove build artifacts
npm test           # Run Vitest unit + snapshot tests
npm run test:watch # Watch mode tests
```

## Usage
This package is published inside the monorepo and referenced via workspace alias:
```ts
import { themeTokens } from '@sofiapos/shared/theme'
import { formatCurrency, formatDateTime } from '@sofiapos/shared/utils'
```

Formatting helpers auto-detect the active locale via `i18next` / browser settings, but every API also accepts an explicit `locale` override for deterministic formatting (handy for tests and server-side rendering).

## Release Process
1. Implement changes + add/update tests.
2. `npm run build && npm test` inside `frontend/sofia-shared`.
3. Commit generated `dist` artifacts (required for local workspace consumption).
4. Update dependants (console, pos, mobilepos) if new exports are introduced.
