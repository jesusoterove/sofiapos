"""
Custom hooks directory.
Place your custom hook implementations here.

Example:
    # custom/product_hooks.py
    from app.hooks import register_hook, HookType
    
    @register_hook("product.before_create", HookType.BEFORE)
    def validate_product(product_data: dict, context: dict) -> dict:
        # Your custom logic
        return product_data
"""

