"""
Script to create a user interactively.
Allows creating users with roles and store assignment.
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Role, Store
from app.services.auth_service import get_password_hash
import getpass


def list_roles(db: Session):
    """List all available roles."""
    roles = db.query(Role).order_by(Role.name).all()
    if not roles:
        print("No roles found in database. Run init_db.py first.")
        return []
    return roles


def list_stores(db: Session):
    """List all available stores."""
    stores = db.query(Store).order_by(Store.name).all()
    return stores


def create_user_interactive(db: Session) -> tuple[bool, str]:
    """
    Interactively create a user.
    
    Returns:
        tuple: (success: bool, message: str)
    """
    print("\n" + "="*60)
    print("Create User")
    print("="*60 + "\n")
    
    # Get username
    username = input("Username (required): ").strip()
    if not username:
        return False, "Username is required"
    
    # Check if username already exists
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        return False, f"User with username '{username}' already exists"
    
    # Get email
    email = input("Email (required): ").strip()
    if not email:
        return False, "Email is required"
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return False, f"User with email '{email}' already exists"
    
    # Get password
    password = getpass.getpass("Password (required): ").strip()
    if not password:
        return False, "Password is required"
    
    # Validate password length
    if len(password.encode('utf-8')) > 72:
        return False, f"Password is too long (max 72 bytes). Current length: {len(password.encode('utf-8'))} bytes"
    
    # Confirm password
    password_confirm = getpass.getpass("Confirm Password: ").strip()
    if password != password_confirm:
        return False, "Passwords do not match"
    
    # Get optional fields
    full_name = input("Full Name (optional): ").strip() or None
    phone = input("Phone (optional): ").strip() or None
    
    # Get is_superuser
    is_superuser_input = input("Is Superuser? (y/n, default: n): ").strip().lower()
    is_superuser = is_superuser_input in ('y', 'yes')
    
    # Get is_active
    is_active_input = input("Is Active? (y/n, default: y): ").strip().lower()
    is_active = is_active_input not in ('n', 'no')
    
    # Select store (optional)
    stores = list_stores(db)
    store_id = None
    if stores:
        print("\nAvailable Stores:")
        for i, store in enumerate(stores, 1):
            print(f"  {i}. {store.name} (ID: {store.id})")
        print("  0. No store")
        
        store_choice = input("\nSelect store (number, default: 0): ").strip()
        if store_choice and store_choice.isdigit():
            store_index = int(store_choice)
            if 1 <= store_index <= len(stores):
                store_id = stores[store_index - 1].id
                print(f"Selected store: {stores[store_index - 1].name}")
    
    # Select roles
    roles = list_roles(db)
    selected_roles = []
    if roles:
        print("\nAvailable Roles:")
        for i, role in enumerate(roles, 1):
            print(f"  {i}. {role.name} - {role.description or 'No description'}")
        
        role_choices = input("\nSelect roles (comma-separated numbers, e.g., 1,2,3): ").strip()
        if role_choices:
            try:
                role_indices = [int(x.strip()) for x in role_choices.split(',')]
                for idx in role_indices:
                    if 1 <= idx <= len(roles):
                        selected_roles.append(roles[idx - 1])
                    else:
                        print(f"Warning: Invalid role number {idx}, skipping")
            except ValueError:
                print("Warning: Invalid role selection format, no roles will be assigned")
    
    # If superuser, automatically add Super Admin role if it exists
    if is_superuser:
        admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
        if admin_role and admin_role not in selected_roles:
            selected_roles.append(admin_role)
            print(f"Automatically added 'Super Admin' role for superuser")
    
    # Summary
    print("\n" + "-"*60)
    print("User Summary:")
    print("-"*60)
    print(f"Username: {username}")
    print(f"Email: {email}")
    print(f"Full Name: {full_name or 'N/A'}")
    print(f"Phone: {phone or 'N/A'}")
    print(f"Is Superuser: {is_superuser}")
    print(f"Is Active: {is_active}")
    print(f"Store: {store_id or 'None'}")
    print(f"Roles: {', '.join([r.name for r in selected_roles]) if selected_roles else 'None'}")
    print("-"*60)
    
    # Confirm
    confirm = input("\nCreate this user? (y/n): ").strip().lower()
    if confirm not in ('y', 'yes'):
        return False, "User creation cancelled"
    
    # Create user
    try:
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            is_active=is_active,
            is_superuser=is_superuser,
            store_id=store_id,
        )
        
        # Assign roles
        if selected_roles:
            user.roles = selected_roles
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return True, f"User '{username}' created successfully with ID {user.id}"
    except Exception as e:
        db.rollback()
        return False, f"Error creating user: {str(e)}"


def main():
    """Main function to run the script."""
    db = SessionLocal()
    try:
        success, message = create_user_interactive(db)
        if success:
            print(f"\n✓ {message}")
            sys.exit(0)
        else:
            print(f"\n✗ {message}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

