# Default Admin User

The application automatically creates a default admin user on startup if it doesn't already exist. This is configurable via environment variables.

## Configuration

The default admin user can be configured using the following environment variables (all prefixed with `DEFAULT_ADMIN_`):

- `DEFAULT_ADMIN_USERNAME` - Username for the admin user (default: `admin`)
- `DEFAULT_ADMIN_PASSWORD` - Password for the admin user (default: `admin`)
- `DEFAULT_ADMIN_EMAIL` - Email address for the admin user (default: `admin@sofiapos.local`)
- `DEFAULT_ADMIN_FULL_NAME` - Full name of the admin user (default: `Administrator`)
- `DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS` - Whether to create the user if it doesn't exist (default: `true`)

## Docker Configuration

In `docker-compose.yml`, these can be set as:

```yaml
environment:
  DEFAULT_ADMIN_USERNAME: ${DEFAULT_ADMIN_USERNAME:-admin}
  DEFAULT_ADMIN_PASSWORD: ${DEFAULT_ADMIN_PASSWORD:-admin}
  DEFAULT_ADMIN_EMAIL: ${DEFAULT_ADMIN_EMAIL:-admin@sofiapos.local}
  DEFAULT_ADMIN_FULL_NAME: ${DEFAULT_ADMIN_FULL_NAME:-Administrator}
  DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS: ${DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS:-true}
```

You can override these values by:
1. Setting environment variables in your shell before running `docker-compose up`
2. Creating a `.env` file in the project root
3. Using `docker-compose.override.yml` for local overrides

## How It Works

1. On application startup, the `ensure_default_admin()` function is called
2. It checks if a user with the configured username already exists
3. If the user doesn't exist and `DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS` is `true`, it creates the user with:
   - The configured username, password, email, and full name
   - `is_active = True`
   - `is_superuser = True`
   - Assigned to the "Super Admin" role (with all permissions)

## Security Notes

⚠️ **Important**: The default credentials (`admin/admin`) are for development only. In production:

1. **Always change the default password** by setting `DEFAULT_ADMIN_PASSWORD` to a strong password
2. **Consider disabling automatic creation** in production by setting `DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS=false`
3. **Use environment variables** or secrets management for sensitive credentials
4. **Never commit** production credentials to version control

## Example: Custom Admin User

To create a custom admin user, set environment variables:

```bash
export DEFAULT_ADMIN_USERNAME=myadmin
export DEFAULT_ADMIN_PASSWORD=SecurePassword123!
export DEFAULT_ADMIN_EMAIL=admin@mycompany.com
export DEFAULT_ADMIN_FULL_NAME="My Admin User"

docker-compose up
```

Or in `docker-compose.override.yml`:

```yaml
services:
  api:
    environment:
      DEFAULT_ADMIN_USERNAME: myadmin
      DEFAULT_ADMIN_PASSWORD: SecurePassword123!
      DEFAULT_ADMIN_EMAIL: admin@mycompany.com
      DEFAULT_ADMIN_FULL_NAME: "My Admin User"
```

## Disabling Automatic Creation

To disable automatic admin user creation:

```yaml
environment:
  DEFAULT_ADMIN_CREATE_IF_NOT_EXISTS: "false"
```

Or set it to `false` in your environment variables.

## Force Creation

If you need to recreate the admin user (e.g., if you forgot the password), you can:

### Option 1: Delete and Restart
```bash
# Delete the existing admin user
docker-compose exec db psql -U sofiapos -d sofiapos -c "DELETE FROM users WHERE username = 'admin';"

# Restart the API
docker-compose restart api
```

### Option 2: Use Force Script
```bash
# Run the force creation script
docker-compose exec api python -m app.scripts.force_create_admin
```

⚠️ **Warning**: Force creation will delete the existing admin user!

## Implementation Details

- **Location**: `backend/app/scripts/create_default_admin.py`
- **Force Script**: `backend/app/scripts/force_create_admin.py`
- **Configuration**: `backend/app/config.py`
- **Startup Hook**: `backend/app/main.py` (in `lifespan` function)
- **Role**: Uses "Super Admin" role (created by `init_db.py` if it doesn't exist)
- **Password Hashing**: Uses bcrypt via `auth_service.get_password_hash()`

