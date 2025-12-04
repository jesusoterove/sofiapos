"""
Hook loader - loads custom hooks from hooks/custom directory.
"""
import os
import importlib
from pathlib import Path


def load_hooks():
    """
    Load all hook modules from the custom hooks directory.
    
    Looks for Python files in app/hooks/custom/ and imports them.
    """
    hooks_dir = Path(__file__).parent / "custom"
    
    if not hooks_dir.exists():
        # Create directory if it doesn't exist
        hooks_dir.mkdir(parents=True, exist_ok=True)
        # Create __init__.py
        (hooks_dir / "__init__.py").touch()
        print("✓ Created hooks/custom directory")
        return
    
    loaded_count = 0
    error_count = 0
    
    for file in hooks_dir.glob("*.py"):
        if file.name == "__init__.py":
            continue
        
        module_name = f"app.hooks.custom.{file.stem}"
        try:
            importlib.import_module(module_name)
            loaded_count += 1
            print(f"✓ Loaded hooks from {file.name}")
        except Exception as e:
            error_count += 1
            print(f"✗ Error loading hooks from {file.name}: {e}")
    
    if loaded_count > 0:
        print(f"✓ Loaded {loaded_count} hook module(s)")
    if error_count > 0:
        print(f"⚠ {error_count} hook module(s) failed to load")


# Load hooks when module is imported
load_hooks()

