# Docker Setup for Sofia-UI Library

## Overview

The console app depends on the local `sofia-ui` package. The Dockerfile has been updated to build `sofia-ui` before building the console app.

## Dockerfile Structure

The `frontend/console/Dockerfile` uses a multi-stage build:

1. **Builder stage**: Builds both sofia-ui and console app
2. **Development stage**: For hot-reload development with volumes
3. **Production stage**: Serves static files with nginx

## Build Context

The build context is set to `./frontend` (not `./frontend/console`) so that both `console` and `sofia-ui` directories are available during the build.

## Development Mode

In development mode (default in docker-compose.yml):
- `sofia-ui` is built first
- Console app is set up with hot-reload
- Source files are mounted as volumes for live updates

## Production Build

For production builds:
```bash
docker build -t sofiapos-console:prod --target production -f frontend/console/Dockerfile frontend/
```

## Troubleshooting

### Issue: "Cannot find module '@sofiapos/ui'"

**Solution:**
1. Make sure the build context includes both `console` and `sofia-ui` directories
2. Check that `sofia-ui` is built before the console app tries to use it
3. Verify the package.json has the correct dependency: `"@sofiapos/ui": "file:../sofia-ui"`

### Issue: Changes to sofia-ui not reflected

**Solution:**
In development mode, the `sofia-ui/src` directory is mounted as a volume. However, you may need to rebuild sofia-ui inside the container:
```bash
docker-compose exec console sh -c "cd /app/sofia-ui && npm run build"
```

Or restart the container after making changes to sofia-ui.

### Issue: Build fails with "npm ci" errors

**Solution:**
The Dockerfile uses `npm ci || npm install` as a fallback. If you don't have a `package-lock.json`, it will use `npm install` instead.

## Manual Build Steps

If you need to build manually:

1. Build sofia-ui:
```bash
cd frontend/sofia-ui
docker build -t sofia-ui:latest -f Dockerfile .
```

2. Build console (which will also build sofia-ui):
```bash
cd frontend
docker build -t sofiapos-console:latest -f console/Dockerfile .
```

