"""
Script to create default admin user if it doesn't exist.
"""
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Role
from app.services.auth_service import get_password_hash
from app.config import default_admin_settings


def create_default_admin_user(db: Session) -> tuple[bool, str]:
    """
    Create default admin user if it doesn't exist.
    
    Returns:
        tuple: (created: bool, message: str)
    """
    if not default_admin_settings.create_if_not_exists:
        return False, "Default admin creation is disabled"
    
    # Check if admin user already exists
    existing_user = db.query(User).filter(
        User.username == default_admin_settings.username
    ).first()
    
    if existing_user:
        return False, f"Admin user '{default_admin_settings.username}' already exists"
    
    # Get or create Super Admin role (matches init_db.py)
    admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    if not admin_role:
        # If Super Admin role doesn't exist, try to create it
        # First ensure permissions exist
        from app.models import Permission
        all_permissions = db.query(Permission).all()
        
        admin_role = Role(
            name="Super Admin",
            description="Full system access with all permissions",
            is_system_role=True
        )
        db.add(admin_role)
        db.flush()  # Flush to get the ID
        
        # Assign all permissions to admin role
        if all_permissions:
            admin_role.permissions = all_permissions
    
    # Validate password length before hashing
    password = default_admin_settings.password
    if len(password.encode('utf-8')) > 72:
        return False, f"Password is too long (max 72 bytes). Current length: {len(password.encode('utf-8'))} bytes"
    
    # Create admin user
    admin_user = User(
        username=default_admin_settings.username,
        email=default_admin_settings.email,
        hashed_password=get_password_hash(password),
        full_name=default_admin_settings.full_name,
        is_active=True,
        is_superuser=True,
    )
    
    # Add admin role to user
    admin_user.roles.append(admin_role)
    
    db.add(admin_user)
    
    try:
        db.commit()
        return True, f"Default admin user '{default_admin_settings.username}' created successfully"
    except Exception as e:
        db.rollback()
        return False, f"Error creating admin user: {str(e)}"


def ensure_default_admin():
    """Ensure default admin user exists. Called on application startup."""
    try:
        # Get database session
        db_gen = get_db()
        db = next(db_gen)
        try:
            created, message = create_default_admin_user(db)
            if created:
                print(f"✓ {message}")
            else:
                print(f"ℹ {message}")
        except Exception as e:
            print(f"✗ Error creating default admin user: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    except Exception as e:
        print(f"✗ Error ensuring default admin user: {str(e)}")
        import traceback
        traceback.print_exc()

