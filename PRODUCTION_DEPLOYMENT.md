# Production Deployment Guide

This document outlines the changes needed to deploy SofiaPOS to production using Docker Compose.

## Overview

The main `docker-compose.yml` file is configured for **development**. For production, use `docker-compose.prod.yml` which includes production-ready configurations.

## Key Changes for Production

### 1. **Remove Development Features**

#### Volume Mounts
- ❌ **Remove**: Volume mounts that sync local code into containers
- ✅ **Use**: Code baked into Docker images

#### Hot Reload
- ❌ **Remove**: `--reload` flag from uvicorn
- ✅ **Use**: Production command with workers: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`

#### Development Server
- ❌ **Remove**: `npm run dev` for frontend
- ✅ **Use**: Production build served by nginx

### 2. **Environment Variables**

Create a `.env.prod` file with production secrets:

```bash
# Database
DB_USER=your_db_user
DB_PASSWORD=your_strong_password_here
DB_NAME=sofiapos_prod

# Security (CRITICAL - Generate strong random keys)
APP_SECRET_KEY=your-very-long-random-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-different-from-app-secret

# API Configuration
API_WORKERS=4  # Number of uvicorn workers (recommended: CPU cores * 2)
LOG_LEVEL=INFO

# CORS (adjust for your domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin User (change defaults!)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-password
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_FULL_NAME=Administrator
DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS=false  # Set to false after initial setup

# JWT Settings
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API URL (for frontend)
API_URL=https://api.yourdomain.com
```

**⚠️ SECURITY WARNING**: Never commit `.env.prod` to version control!

### 3. **Dockerfile Updates**

#### Backend Dockerfile (`backend/Dockerfile`)

Update the default command to production mode:

```dockerfile
# Production command (no --reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Or use environment variable:
```dockerfile
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${API_WORKERS:-4}"]
```

#### Frontend Dockerfile (`frontend/console/Dockerfile`)

Already has production stage - ensure it's used:
- `target: production` in docker-compose.prod.yml ✅

### 4. **Security Enhancements**

#### Secrets Management
- Use Docker secrets or environment variables from secure vault
- Never hardcode secrets in docker-compose files
- Rotate secrets regularly

#### Network Isolation
- Internal network for database (no external access)
- Public network only for services that need external access
- Use nginx as reverse proxy instead of exposing ports directly

#### Resource Limits
- Set CPU and memory limits to prevent resource exhaustion
- Monitor resource usage and adjust as needed

### 5. **Health Checks**

All services include health checks:
- Database: `pg_isready`
- API: HTTP endpoint `/api/v1/health` (you may need to add this)
- Console: nginx health check

### 6. **Restart Policies**

- `restart: unless-stopped` - Services restart automatically unless manually stopped

### 7. **Logging**

Configure logging for production:
- Use structured logging (JSON format)
- Send logs to centralized logging system (ELK, CloudWatch, etc.)
- Set appropriate log levels (INFO for production, DEBUG only when troubleshooting)

### 8. **Backup Strategy**

#### Database Backups
```bash
# Add to cron or scheduled task
docker exec sofiapos-db-prod pg_dump -U ${DB_USER} ${DB_NAME} > backup_$(date +%Y%m%d_%H%M%S).sql
```

Or use PostgreSQL backup tools:
- `pg_backrest`
- `pg_dump` with compression
- Cloud provider managed backups

#### Volume Backups
- Backup Docker volumes regularly
- Consider using volume plugins for cloud storage

### 9. **Monitoring**

Add monitoring services:
- **Prometheus** + **Grafana** for metrics
- **ELK Stack** or **Loki** for logs
- **Uptime monitoring** (UptimeRobot, Pingdom, etc.)

### 10. **SSL/TLS**

Use nginx or a load balancer with SSL certificates:
- Let's Encrypt for free SSL
- Cloud provider SSL certificates
- Configure HTTPS redirects

## Deployment Steps

### Initial Setup

1. **Create production environment file**:
   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with production values
   ```

2. **Build production images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```

3. **Start services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Initialize database** (first time only):
   ```bash
   docker-compose -f docker-compose.prod.yml exec api python -m app.scripts.init_db
   ```

5. **Create admin user** (if needed):
   ```bash
   docker-compose -f docker-compose.prod.yml exec api python -m app.scripts.force_create_admin
   ```

### Updates

1. **Pull latest code**:
   ```bash
   git pull origin main
   ```

2. **Rebuild images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Rolling restart**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --no-deps --build api console
   ```

### Rollback

If something goes wrong:
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore from backup
docker-compose -f docker-compose.prod.yml up -d db
# Restore database backup
docker exec -i sofiapos-db-prod psql -U ${DB_USER} ${DB_NAME} < backup.sql

# Start previous version
docker-compose -f docker-compose.prod.yml up -d
```

## Production Checklist

- [ ] Strong passwords and secrets configured
- [ ] Environment variables set in `.env.prod`
- [ ] SSL/TLS certificates configured
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] Resource limits appropriate for your workload
- [ ] Health checks verified
- [ ] CORS origins configured correctly
- [ ] Admin user password changed from default
- [ ] `DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS` set to `false`
- [ ] Firewall rules configured
- [ ] Rate limiting configured (if needed)
- [ ] CDN configured for static assets (optional)
- [ ] Load balancer configured (if multiple instances)

## Additional Considerations

### Scaling

For high-traffic scenarios:
- Use Docker Swarm or Kubernetes instead of docker-compose
- Add multiple API instances behind load balancer
- Use managed database service (RDS, Cloud SQL, etc.)
- Implement Redis for caching and session storage

### High Availability

- Database replication (master-slave)
- Multiple API instances
- Load balancer with health checks
- Geographic distribution (if needed)

### Performance

- Enable database connection pooling
- Use CDN for static assets
- Implement caching (Redis)
- Database query optimization
- Enable gzip compression in nginx

## Troubleshooting

### Check logs
```bash
docker-compose -f docker-compose.prod.yml logs -f [service_name]
```

### Check health
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Access container shell
```bash
docker-compose -f docker-compose.prod.yml exec [service_name] sh
```

## Support

For issues or questions, refer to:
- Main README.md
- DOCKER_SETUP.md
- Backend and Frontend documentation



