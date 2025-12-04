"""
Script to force create default admin user (deletes existing if exists).
Use with caution - this will delete the existing admin user!
"""
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Role
from app.services.auth_service import get_password_hash
from app.config import default_admin_settings


def force_create_admin_user(db: Session) -> tuple[bool, str]:
    """
    Force create default admin user by deleting existing one if it exists.
    
    WARNING: This will delete the existing admin user!
    
    Returns:
        tuple: (created: bool, message: str)
    """
    if not default_admin_settings.create_if_not_exists:
        return False, "Default admin creation is disabled"
    
    # Delete existing admin user if it exists
    existing_user = db.query(User).filter(
        User.username == default_admin_settings.username
    ).first()
    
    if existing_user:
        db.delete(existing_user)
        db.commit()
        print(f"⚠ Deleted existing admin user '{default_admin_settings.username}'")
    
    # Get or create Super Admin role
    admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    if not admin_role:
        from app.models import Permission
        all_permissions = db.query(Permission).all()
        
        admin_role = Role(
            name="Super Admin",
            description="Full system access with all permissions",
            is_system_role=True
        )
        db.add(admin_role)
        db.flush()
        
        if all_permissions:
            admin_role.permissions = all_permissions
    
    # Validate password length before hashing
    password = default_admin_settings.password
    if len(password.encode('utf-8')) > 72:
        return False, f"Password is too long (max 72 bytes). Current length: {len(password.encode('utf-8'))} bytes"
    
    # Create new admin user
    admin_user = User(
        username=default_admin_settings.username,
        email=default_admin_settings.email,
        hashed_password=get_password_hash(password),
        full_name=default_admin_settings.full_name,
        is_active=True,
        is_superuser=True,
    )
    
    admin_user.roles.append(admin_role)
    db.add(admin_user)
    
    try:
        db.commit()
        return True, f"Admin user '{default_admin_settings.username}' force-created successfully"
    except Exception as e:
        db.rollback()
        return False, f"Error creating admin user: {str(e)}"


if __name__ == "__main__":
    """Run this script directly to force create admin user."""
    import sys
    print("⚠ WARNING: This will delete the existing admin user if it exists!")
    response = input("Continue? (yes/no): ")
    
    if response.lower() != "yes":
        print("Cancelled.")
        sys.exit(0)
    
    db = next(get_db())
    try:
        created, message = force_create_admin_user(db)
        if created:
            print(f"✓ {message}")
        else:
            print(f"✗ {message}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

