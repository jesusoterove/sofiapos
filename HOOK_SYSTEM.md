# Hook System Documentation

## Overview

The SofiaPOS hook system allows businesses to customize the application behavior without modifying core code. Hooks are extension points where custom code can be executed to modify or extend functionality.

## Architecture

### Hook Types

1. **Backend Hooks**: Customize API behavior, validation, business logic
2. **Frontend Hooks**: Customize UI components, forms, workflows

### Hook Execution Model

- **Before Hooks**: Execute before core logic (can modify input, prevent execution)
- **After Hooks**: Execute after core logic (can modify output, perform side effects)
- **Filter Hooks**: Transform data (input/output)
- **Action Hooks**: Perform additional actions (logging, notifications)

## Backend Hook System

### Hook Registration

Hooks are registered in a dedicated hooks directory and loaded at application startup.

### Hook Structure

```python
# backend/app/hooks/product_hooks.py
from app.hooks import register_hook, HookType

@register_hook("product.before_create", HookType.BEFORE)
def validate_product_custom_fields(product_data: dict, context: dict) -> dict:
    """Custom validation for product creation."""
    # Custom validation logic
    if not product_data.get("custom_field"):
        raise ValueError("Custom field is required")
    return product_data

@register_hook("product.after_create", HookType.AFTER)
def send_product_notification(product: Product, context: dict) -> None:
    """Send notification after product creation."""
    # Custom notification logic
    pass

@register_hook("product.filter_price", HookType.FILTER)
def apply_custom_pricing(product: Product, context: dict) -> float:
    """Apply custom pricing logic."""
    base_price = product.selling_price
    # Custom pricing calculation
    return base_price * 1.1  # Add 10% markup
```

### Available Backend Hooks

#### Product Hooks
- `product.before_create` - Before product creation
- `product.after_create` - After product creation
- `product.before_update` - Before product update
- `product.after_update` - After product update
- `product.before_delete` - Before product deletion
- `product.filter_price` - Filter/modify product price
- `product.filter_list` - Filter product list query

#### Order Hooks
- `order.before_create` - Before order creation
- `order.after_create` - After order creation
- `order.before_payment` - Before payment processing
- `order.after_payment` - After payment processing
- `order.filter_total` - Filter/modify order total
- `order.calculate_tax` - Custom tax calculation
- `order.calculate_discount` - Custom discount calculation

#### Customer Hooks
- `customer.before_create` - Before customer creation
- `customer.after_create` - After customer creation
- `customer.validate_tax_id` - Custom tax ID validation
- `customer.filter_credit_limit` - Filter/modify credit limit

#### Inventory Hooks
- `inventory.before_entry` - Before inventory entry
- `inventory.after_entry` - After inventory entry
- `inventory.calculate_cost` - Custom cost calculation
- `inventory.check_stock` - Custom stock checking logic

#### Payment Hooks
- `payment.before_process` - Before payment processing
- `payment.after_process` - After payment processing
- `payment.validate_amount` - Custom amount validation
- `payment.filter_methods` - Filter available payment methods

## Frontend Hook System

### Hook Registration

Hooks are registered in React components and can be used to customize UI behavior.

### Hook Structure

```typescript
// frontend/console/src/hooks-system/hooks/product-hooks.ts
import { registerHook, HookType } from '../index';

// Before hook - modify form data before submission
registerHook('product.beforeSubmit', HookType.BEFORE, (data: ProductFormData) => {
  // Custom validation or transformation
  if (!data.customField) {
    throw new Error('Custom field is required');
  }
  return { ...data, customField: data.customField.toUpperCase() };
});

// After hook - modify response data
registerHook('product.afterLoad', HookType.AFTER, (product: Product) => {
  // Add custom fields or transform data
  return {
    ...product,
    displayName: `${product.name} (${product.code})`
  };
});

// Filter hook - modify list display
registerHook('product.filterList', HookType.FILTER, (products: Product[]) => {
  // Filter or sort products
  return products.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name));
});

// Component hook - customize component rendering
registerHook('product.formFields', HookType.COMPONENT, () => {
  // Return additional form fields
  return <CustomProductField />;
});
```

### Available Frontend Hooks

#### Product Hooks
- `product.beforeSubmit` - Before form submission
- `product.afterLoad` - After product data loaded
- `product.filterList` - Filter product list
- `product.formFields` - Additional form fields
- `product.tableColumns` - Customize table columns
- `product.cardContent` - Customize product card

#### Order Hooks
- `order.beforeSubmit` - Before order submission
- `order.afterLoad` - After order loaded
- `order.filterItems` - Filter order items
- `order.calculateTotal` - Custom total calculation
- `order.paymentFields` - Custom payment fields

#### Customer Hooks
- `customer.beforeSubmit` - Before customer form submission
- `customer.afterLoad` - After customer loaded
- `customer.formFields` - Additional form fields
- `customer.validateTaxId` - Custom tax ID validation

## Implementation Details

### Backend Hook Registry

```python
# backend/app/hooks/__init__.py
from typing import Callable, Any, List, Dict
from enum import Enum

class HookType(Enum):
    BEFORE = "before"
    AFTER = "after"
    FILTER = "filter"
    ACTION = "action"

class HookRegistry:
    _hooks: Dict[str, List[Callable]] = {}
    
    @classmethod
    def register(cls, hook_name: str, hook_type: HookType, handler: Callable):
        """Register a hook handler."""
        key = f"{hook_name}.{hook_type.value}"
        if key not in cls._hooks:
            cls._hooks[key] = []
        cls._hooks[key].append(handler)
    
    @classmethod
    def execute(cls, hook_name: str, hook_type: HookType, data: Any, context: Dict = None) -> Any:
        """Execute hooks for a given hook name and type."""
        key = f"{hook_name}.{hook_type.value}"
        handlers = cls._hooks.get(key, [])
        
        result = data
        for handler in handlers:
            if hook_type == HookType.BEFORE or hook_type == HookType.FILTER:
                result = handler(result, context or {})
            elif hook_type == HookType.AFTER or hook_type == HookType.ACTION:
                handler(result, context or {})
        
        return result

def register_hook(hook_name: str, hook_type: HookType):
    """Decorator for registering hooks."""
    def decorator(func: Callable):
        HookRegistry.register(hook_name, hook_type, func)
        return func
    return decorator
```

### Frontend Hook Registry

```typescript
// frontend/console/src/hooks-system/index.ts
export enum HookType {
  BEFORE = 'before',
  AFTER = 'after',
  FILTER = 'filter',
  COMPONENT = 'component',
}

type HookHandler<T = any> = (data: T, context?: Record<string, any>) => T | void;

class HookRegistry {
  private hooks: Map<string, HookHandler[]> = new Map();

  register<T>(hookName: string, hookType: HookType, handler: HookHandler<T>): void {
    const key = `${hookName}.${hookType}`;
    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }
    this.hooks.get(key)!.push(handler);
  }

  execute<T>(hookName: string, hookType: HookType, data: T, context?: Record<string, any>): T {
    const key = `${hookName}.${hookType}`;
    const handlers = this.hooks.get(key) || [];
    
    let result = data;
    for (const handler of handlers) {
      if (hookType === HookType.BEFORE || hookType === HookType.FILTER) {
        result = handler(result, context) as T || result;
      } else {
        handler(result, context);
      }
    }
    
    return result;
  }

  getComponentHooks(hookName: string): HookHandler[] {
    return this.hooks.get(`${hookName}.${HookType.COMPONENT}`) || [];
  }
}

export const hookRegistry = new HookRegistry();

export function registerHook<T>(
  hookName: string,
  hookType: HookType,
  handler: HookHandler<T>
): void {
  hookRegistry.register(hookName, hookType, handler);
}
```

## Usage Examples

### Backend Example: Custom Product Validation

```python
# backend/app/hooks/custom/product_custom_hooks.py
from app.hooks import register_hook, HookType
from app.models import Product

@register_hook("product.before_create", HookType.BEFORE)
def validate_product_code(product_data: dict, context: dict) -> dict:
    """Ensure product code follows custom format."""
    code = product_data.get("code", "")
    if code and not code.startswith("PROD-"):
        product_data["code"] = f"PROD-{code}"
    return product_data

@register_hook("product.filter_price", HookType.FILTER)
def apply_store_markup(product: Product, context: dict) -> float:
    """Apply store-specific markup."""
    store_id = context.get("store_id")
    base_price = product.selling_price
    
    # Custom markup logic based on store
    if store_id == 1:
        return base_price * 1.15  # 15% markup for store 1
    return base_price
```

### Frontend Example: Custom Product Form Field

```typescript
// frontend/console/src/hooks-system/custom/product-custom-hooks.ts
import { registerHook, HookType } from '../index';
import { CustomField } from '../../components/custom/CustomField';

// Add custom form field
registerHook('product.formFields', HookType.COMPONENT, () => {
  return <CustomField name="warranty" label="Warranty Period" />;
});

// Custom validation
registerHook('product.beforeSubmit', HookType.BEFORE, (data: ProductFormData) => {
  if (data.warranty && data.warranty < 0) {
    throw new Error('Warranty period must be positive');
  }
  return data;
});

// Custom display
registerHook('product.afterLoad', HookType.AFTER, (product: Product) => {
  return {
    ...product,
    displayPrice: `$${product.sellingPrice.toFixed(2)} (incl. tax)`
  };
});
```

### Backend Example: Custom Order Total Calculation

```python
# backend/app/hooks/custom/order_custom_hooks.py
from app.hooks import register_hook, HookType
from app.models import Order

@register_hook("order.calculate_tax", HookType.FILTER)
def custom_tax_calculation(order: Order, context: dict) -> float:
    """Custom tax calculation based on order value."""
    subtotal = order.subtotal
    
    # Progressive tax: higher orders pay more tax
    if subtotal > 1000:
        return subtotal * 0.20  # 20% for large orders
    elif subtotal > 500:
        return subtotal * 0.16  # 16% for medium orders
    else:
        return subtotal * 0.10  # 10% for small orders

@register_hook("order.after_payment", HookType.AFTER)
def send_custom_receipt(order: Order, context: dict) -> None:
    """Send custom receipt format after payment."""
    # Custom receipt generation logic
    generate_custom_receipt(order)
```

### Frontend Example: Custom Order Display

```typescript
// frontend/pos/src/hooks-system/custom/order-custom-hooks.ts
import { registerHook, HookType } from '../index';

// Custom order item display
registerHook('order.itemDisplay', HookType.COMPONENT, (item: OrderItem) => {
  return (
    <div className="custom-order-item">
      <span>{item.productName}</span>
      <span className="custom-badge">{item.quantity}x</span>
      <span className="custom-price">${item.total.toFixed(2)}</span>
    </div>
  );
});

// Custom payment method filter
registerHook('payment.filterMethods', HookType.FILTER, (methods: PaymentMethod[]) => {
  // Hide credit card for certain stores
  const storeId = getCurrentStoreId();
  if (storeId === 1) {
    return methods.filter(m => m.type !== 'credit_card');
  }
  return methods;
});
```

## Hook Loading

### Backend Hook Loading

```python
# backend/app/hooks/loader.py
import os
import importlib
from pathlib import Path

def load_hooks():
    """Load all hook modules."""
    hooks_dir = Path(__file__).parent / "custom"
    
    if hooks_dir.exists():
        for file in hooks_dir.glob("*.py"):
            if file.name != "__init__.py":
                module_name = f"app.hooks.custom.{file.stem}"
                try:
                    importlib.import_module(module_name)
                    print(f"✓ Loaded hooks from {file.name}")
                except Exception as e:
                    print(f"✗ Error loading hooks from {file.name}: {e}")

# Load hooks on application startup
load_hooks()
```

### Frontend Hook Loading

```typescript
// frontend/console/src/hooks-system/loader.ts
import { registerHook } from './index';

// Auto-load custom hooks
const loadCustomHooks = async () => {
  try {
    // Load custom hooks from custom directory
    const customHooks = await import('./custom/index');
    if (customHooks.default) {
      customHooks.default();
    }
  } catch (error) {
    console.warn('No custom hooks found or error loading hooks:', error);
  }
};

// Load on app initialization
loadCustomHooks();
```

## Best Practices

1. **Hook Naming**: Use dot notation: `resource.action` (e.g., `product.before_create`)
2. **Idempotency**: Hooks should be idempotent when possible
3. **Error Handling**: Hooks should handle errors gracefully
4. **Performance**: Keep hooks lightweight; avoid heavy operations
5. **Documentation**: Document what each hook does and when it's called
6. **Testing**: Test hooks independently and in integration
7. **Versioning**: Consider hook versioning for breaking changes

## Hook Priority

Hooks execute in registration order. For critical hooks that need to run first or last, consider:
- Priority system (high, medium, low)
- Explicit ordering
- Hook dependencies

## Security Considerations

1. **Validation**: Always validate hook input/output
2. **Permissions**: Check user permissions in hooks
3. **Sanitization**: Sanitize data before processing
4. **Audit**: Log hook executions for audit trails

## Migration Path

When core functionality needs to become hookable:
1. Identify extension points
2. Add hook calls in core code
3. Document hook signature
4. Create example implementations
5. Update documentation

