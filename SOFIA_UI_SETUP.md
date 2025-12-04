# Sofia-UI Setup Guide

## Installation Steps

### 1. Build the sofia-ui library first

```bash
cd frontend/sofia-ui
npm install
npm run build
```

This will create the `dist` folder with the compiled library.

### 2. Install console app dependencies

```bash
cd frontend/console
npm install
```

The console app will now link to the local sofia-ui package using `file:../sofia-ui`.

### 3. Development Workflow

#### Option A: Watch mode (recommended for development)

In one terminal:
```bash
cd frontend/sofia-ui
npm run dev
```

This will watch for changes and rebuild automatically.

In another terminal:
```bash
cd frontend/console
npm run dev
```

#### Option B: Manual rebuild

When you make changes to sofia-ui:
```bash
cd frontend/sofia-ui
npm run build
```

Then restart the console app if needed.

## Troubleshooting

### Issue: "Cannot find module '@sofiapos/ui'"

**Solution:**
1. Make sure sofia-ui is built: `cd frontend/sofia-ui && npm run build`
2. Make sure console has the dependency: `cd frontend/console && npm install`
3. Check that `frontend/console/package.json` has: `"@sofiapos/ui": "file:../sofia-ui"`

### Issue: "Unsupported URL Type workspace:*"

**Solution:**
This has been fixed. The package.json now uses `file:../sofia-ui` instead of `workspace:*`.

### Issue: Styles not loading

**Solution:**
Make sure you import the styles in your app:
```tsx
import '@sofiapos/ui/styles'
```

## Using npm workspaces (alternative)

If you want to use npm workspaces properly, you can install from the root:

```bash
cd frontend
npm install
```

This will install all workspace dependencies. However, you still need to build sofia-ui first.

