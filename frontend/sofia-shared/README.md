# @sofiapos/shared

Platform-agnostic design tokens and utilities that power every SofiaPOS client (console, POS, mobile).

## Contents
- **Theme tokens** – color palettes, typography scales, spacing, elevations.
- **Formatting helpers** – currency, number, and date utilities shared across apps.
- **Type definitions** – common DTOs and theme types consumed by multiple frontends.

## Scripts
```bash
npm run build   # Generate dist outputs
npm run dev     # Watch mode build (tsc --watch)
npm run clean   # Remove build artifacts
```

## Usage
This package is published inside the monorepo and referenced via workspace alias:
```ts
import { themeTokens } from '@sofiapos/shared/theme'
```

## TODO
- Extract existing tokens/utilities from `@sofiapos/ui` and POS.
- Add automated tests for helpers.
- Document versioning + release process.
```
