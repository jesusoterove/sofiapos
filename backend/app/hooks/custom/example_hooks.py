"""
Example custom hooks.
This file demonstrates how to create custom hooks.
Remove or rename this file when creating your own hooks.
"""
from app.hooks import register_hook, HookType


@register_hook("product.before_create", HookType.BEFORE, priority=50)
def example_product_validation(product_data: dict, context: dict) -> dict:
    """
    Example: Validate product before creation.
    
    This hook runs before a product is created and can modify
    the product data or raise an exception to prevent creation.
    """
    # Example: Ensure product code has prefix
    if "code" in product_data and product_data["code"]:
        if not product_data["code"].startswith("PROD-"):
            product_data["code"] = f"PROD-{product_data['code']}"
    
    return product_data


@register_hook("product.after_create", HookType.AFTER)
def example_product_notification(product, context: dict) -> None:
    """
    Example: Send notification after product creation.
    
    This hook runs after a product is created and can perform
    side effects like sending notifications or logging.
    """
    # Example: Log product creation
    print(f"Product created: {product.name} (ID: {product.id})")
    # In real implementation, you might send email, webhook, etc.


@register_hook("order.filter_total", HookType.FILTER)
def example_order_discount(order, context: dict) -> float:
    """
    Example: Apply custom discount to order total.
    
    This hook can modify the order total calculation.
    """
    # Example: Apply 5% discount for orders over $100
    if order.subtotal > 100:
        return order.subtotal * 0.95
    return order.subtotal


@register_hook("payment.before_process", HookType.BEFORE, priority=10)
def example_payment_validation(payment_data: dict, context: dict) -> dict:
    """
    Example: Validate payment before processing.
    
    This hook runs before payment is processed and can modify
    payment data or raise an exception to prevent processing.
    """
    # Example: Ensure minimum payment amount
    if payment_data.get("amount", 0) < 0.01:
        raise ValueError("Payment amount must be at least $0.01")
    
    return payment_data

