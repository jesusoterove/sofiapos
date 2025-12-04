# SofiaPOS

Point of Sale and Restaurant Management System

## Overview

SofiaPOS is a comprehensive restaurant and food business management system consisting of:

1. **Console (Administration App)**: Web-based administration system for managing stores, products, inventory, users, and more.
2. **POS (Point of Sale App)**: Standalone application that works offline and syncs with the administration system.

## Project Structure

```
SofiaPOS/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── hooks/       # Hook system
│   │   └── utils/       # Utilities
│   ├── alembic/         # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── console/         # Administration console (React)
│   └── pos/             # Point of sale app (React)
└── docs/                # Documentation
```

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **PostgreSQL/MySQL**: Database support

### Frontend
- **React**: UI framework
- **TanStack Query**: Data fetching and caching
- **TanStack Router**: Routing
- **TanStack Table**: Table components (Console)
- **Tailwind CSS**: Styling
- **React Hook Form**: Form handling
- **React Toastify**: Notifications
- **React Icons**: Icons

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL or MySQL
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure database:
Create a `.env` file:
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=sofiapos
```

5. Initialize database:
```bash
python -m app.scripts.init_db
```

6. Run migrations:
```bash
alembic upgrade head
```

7. Start development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Console (Administration) Setup

1. Navigate to console directory:
```bash
cd frontend/console
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The console will be available at `http://localhost:3000`

### POS Setup (Electron Application)

1. Navigate to POS directory:
```bash
cd frontend/pos
```

2. Install dependencies:
```bash
npm install
```

3. Start development (Electron app):
```bash
npm run electron:dev
```

This will launch the Electron application window. The POS runs as a desktop application, not a web app.

4. Build for production:
```bash
npm run build:electron
```

This creates installers for Windows, macOS, and Linux in the `release/` directory.

## Features

### Console Features
- Store management
- User and role management
- Product and inventory management
- Order and payment management
- Reports and analytics
- Settings configuration

### POS Features
- Offline-first operation
- Product selection and order management
- Payment processing
- Table management
- Shift and cash register management
- Inventory entry
- Data synchronization

## Documentation

- [Database Schema](./backend/DATABASE_SCHEMA.md)
- [User Stories](./USER_STORIES.md)
- [Hook System](./HOOK_SYSTEM.md)
- [Console Component Hierarchy](./frontend/console/COMPONENT_HIERARCHY.md)
- [POS Component Hierarchy](./frontend/pos/COMPONENT_HIERARCHY.md)

## Development

### Backend Development

```bash
# Run tests
pytest

# Format code
black .

# Lint code
flake8

# Type checking
mypy .
```

### Frontend Development

```bash
# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## License

[Your License Here]

