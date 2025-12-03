# SofiaPOS Backend

FastAPI backend for SofiaPOS restaurant management system.

## Features

- RESTful API using FastAPI
- SQLAlchemy ORM with PostgreSQL/MySQL support
- Alembic for database migrations
- Role-based access control (RBAC)
- Comprehensive database schema for restaurant operations

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL or MySQL database
- pip (Python package manager)

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure database settings:
Create a `.env` file in the backend directory:
```env
DB_TYPE=postgresql  # or mysql
DB_HOST=localhost
DB_PORT=5432  # 3306 for MySQL
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=sofiapos
```

4. Initialize the database:
```bash
python -m app.scripts.init_db
```

This will:
- Create all database tables
- Create default permissions
- Create default roles (Super Admin, Manager, Cashier, Cook)
- Create default payment methods
- Create default unit of measures

5. Run database migrations (if needed):
```bash
alembic upgrade head
```

6. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── database.py          # Database configuration
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── store.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── tax.py
│   │   ├── discount.py
│   │   ├── vendor.py
│   │   ├── customer.py
│   │   ├── inventory.py
│   │   ├── payment.py
│   │   ├── cash_register.py
│   │   ├── shift.py
│   │   ├── table.py
│   │   ├── order.py
│   │   └── setting.py
│   └── scripts/
│       └── init_db.py       # Database initialization script
├── alembic/                 # Database migrations
│   ├── env.py
│   └── script.py.mako
├── alembic.ini              # Alembic configuration
├── requirements.txt         # Python dependencies
├── DATABASE_SCHEMA.md       # Database schema documentation
└── README.md                # This file
```

## Database Models

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed documentation of all database models.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Creating Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Database Reset

To reset the database (WARNING: This will delete all data):

```bash
# Drop all tables
python -c "from app.database import engine, Base; Base.metadata.drop_all(bind=engine)"

# Recreate tables and initialize
python -m app.scripts.init_db
```

## Default Roles and Permissions

The system comes with the following default roles:

1. **Super Admin**: Full system access with all permissions
2. **Manager**: Store management with product, inventory, and order permissions
3. **Cashier**: Point of sale operations - orders and payments
4. **Cook**: Kitchen operations - view orders and manage inventory

See `app/scripts/init_db.py` for the complete list of permissions assigned to each role.

## License

[Your License Here]

