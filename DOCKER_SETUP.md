# Docker Setup Guide

This guide explains how to run SofiaPOS using Docker Compose.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Docker Compose v2.0+

## Quick Start

1. **Create environment file** (optional):
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services**:
```bash
docker-compose up
```

Or run in detached mode:
```bash
docker-compose up -d
```

3. **Access applications**:
- **Console**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Services

### Database (`db`)
- **Image**: PostgreSQL 15 Alpine
- **Port**: Not exposed (internal only)
- **Volume**: `postgres_data` (persistent storage)
- **Health Check**: Enabled

### API (`api`)
- **Port**: 8000
- **Hot Reload**: Enabled (--reload flag)
- **Dependencies**: Database
- **Volumes**: 
  - Code mounted for hot reload
  - Virtual environment excluded

### Console (`console`)
- **Port**: 3000
- **Hot Reload**: Enabled (Vite dev server)
- **Dependencies**: API
- **Volumes**:
  - Code mounted for hot reload
  - node_modules excluded

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=sofiapos

# Application
APP_SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
```

## Development Workflow

### Start Services
```bash
docker-compose up
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f console
docker-compose logs -f db
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build api
docker-compose build console
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec api bash

# Run migrations
docker-compose exec api alembic upgrade head

# Initialize database
docker-compose exec api python -m app.scripts.init_db

# Console shell
docker-compose exec console sh
```

## Database Management

### Initialize Database
```bash
docker-compose exec api python -m app.scripts.init_db
```

### Run Migrations
```bash
docker-compose exec api alembic upgrade head
```

### Create Migration
```bash
docker-compose exec api alembic revision --autogenerate -m "description"
```

### Access Database
```bash
docker-compose exec db psql -U postgres -d sofiapos
```

## Hot Reload

Both backend and frontend support hot reload:

- **Backend**: Code changes in `backend/` automatically reload the API
- **Frontend**: Code changes in `frontend/console/` automatically reload the console

## Networking

Services communicate using Docker's internal network:
- `api` connects to `db` using hostname `db`
- `console` connects to `api` using `http://localhost:8000` (from browser)
- Database port is not exposed externally

## Volumes

- `postgres_data`: Persistent database storage
- `./backend:/app`: Backend code (for hot reload)
- `./frontend/console:/app`: Console code (for hot reload)
- `/app/venv`: Excluded from backend volume (uses container's venv)
- `/app/node_modules`: Excluded from console volume (uses container's node_modules)

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port
```

### Database Connection Issues
- Ensure database is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify environment variables match

### Hot Reload Not Working
- Check volume mounts: `docker-compose exec api ls -la /app`
- Verify file permissions
- Restart service: `docker-compose restart api`

### Rebuild After Dependency Changes
```bash
# After changing requirements.txt
docker-compose build api
docker-compose up -d api

# After changing package.json
docker-compose build console
docker-compose up -d console
```

## Production Considerations

This Docker Compose setup is optimized for **development**. For production:

1. Remove `--reload` flag from API
2. Build production frontend: `npm run build`
3. Use production Dockerfiles (multi-stage builds)
4. Set proper environment variables
5. Use secrets management
6. Enable SSL/TLS
7. Configure proper logging
8. Set up health checks
9. Use production database settings
10. Remove volume mounts for code

## Cleanup

### Remove Everything
```bash
docker-compose down -v
docker system prune -a
```

### Remove Only Volumes
```bash
docker-compose down -v
```

