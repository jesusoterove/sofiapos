# Project Setup Guide

This guide provides step-by-step instructions for setting up the SofiaPOS development environment.

## Prerequisites

- **Python 3.9+**: For backend development
- **Node.js 18+**: For frontend development
- **PostgreSQL 12+** or **MySQL 8+**: Database
- **Git**: Version control

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd SofiaPOS
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
python -m app.scripts.init_db

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### 3. Console (Administration) Setup

```bash
# Navigate to console
cd frontend/console

# Install dependencies
npm install

# Start development server
npm run dev
```

Console will be available at `http://localhost:3000`

### 4. POS Setup (Electron Application)

```bash
# Navigate to POS
cd frontend/pos

# Install dependencies
npm install

# Start development (Electron + Vite dev server)
npm run electron:dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron application window
- Enable hot reload for development

**Note**: POS is an Electron application, not a web app. It runs as a desktop application.

## Development Workflow

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run server with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black .

# Type checking
mypy .
```

### Frontend Development

```bash
# Console
cd frontend/console
npm run dev

# POS
cd frontend/pos
npm run dev
```

## Environment Variables

### Backend (.env)

```env
# Database
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=sofiapos

# Application
APP_ENV=development
APP_DEBUG=True
APP_SECRET_KEY=your-secret-key

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)

```env
# API URL
VITE_API_URL=http://localhost:8000
```

## Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── api/              # API routes
│   │   └── v1/           # API version 1
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── hooks/            # Hook system
│   │   └── custom/       # Custom hooks
│   ├── utils/            # Utilities
│   ├── database.py       # Database config
│   └── main.py           # Application entry
├── alembic/              # Migrations
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

### Frontend Structure

```
frontend/
├── console/              # Administration app
│   ├── src/
│   │   ├── app/          # App config (router, queryClient)
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── features/     # Feature modules
│   │   ├── hooks/        # Custom hooks
│   │   ├── hooks-system/ # Hook system
│   │   ├── i18n/         # Internationalization
│   │   └── utils/        # Utilities
│   ├── package.json
│   └── vite.config.ts
└── pos/                  # POS app
    ├── src/
    │   ├── app/          # App config
    │   ├── api/          # API client
    │   ├── components/   # React components
    │   ├── features/     # Feature modules
    │   ├── db/           # IndexedDB
    │   ├── hooks-system/ # Hook system
    │   └── utils/        # Utilities
    ├── package.json
    └── vite.config.ts
```

## Database Setup

### PostgreSQL

```bash
# Create database
createdb sofiapos

# Or using psql
psql -U postgres
CREATE DATABASE sofiapos;
```

### MySQL

```sql
CREATE DATABASE sofiapos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Common Issues

### Backend Issues

**Database connection error:**
- Check database credentials in `.env`
- Ensure database server is running
- Verify database exists

**Import errors:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### Frontend Issues

**Module not found:**
- Run `npm install` in the frontend directory
- Clear `node_modules` and reinstall if needed

**Port already in use:**
- Change port in `vite.config.ts`
- Or kill the process using the port

## Next Steps

1. **Set up database** and run migrations
2. **Configure environment variables**
3. **Start development servers**
4. **Begin implementing features** based on user stories

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

