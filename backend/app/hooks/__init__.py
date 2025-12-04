"""
Hook system for backend customization.
Allows businesses to customize application behavior without modifying core code.
"""
from typing import Callable, Any, Dict, List
from enum import Enum


class HookType(Enum):
    """Hook execution types."""
    BEFORE = "before"  # Execute before core logic
    AFTER = "after"    # Execute after core logic
    FILTER = "filter"  # Transform data
    ACTION = "action"  # Perform side effects


class HookRegistry:
    """Registry for managing hooks."""
    _hooks: Dict[str, List[Callable]] = {}
    
    @classmethod
    def register(cls, hook_name: str, hook_type: HookType, handler: Callable, priority: int = 100):
        """
        Register a hook handler.
        
        Args:
            hook_name: Name of the hook (e.g., "product.before_create")
            hook_type: Type of hook (BEFORE, AFTER, FILTER, ACTION)
            handler: Function to execute
            priority: Execution priority (lower = earlier execution)
        """
        key = f"{hook_name}.{hook_type.value}"
        if key not in cls._hooks:
            cls._hooks[key] = []
        
        cls._hooks[key].append({
            "handler": handler,
            "priority": priority
        })
        
        # Sort by priority
        cls._hooks[key].sort(key=lambda x: x["priority"])
    
    @classmethod
    def execute(cls, hook_name: str, hook_type: HookType, data: Any = None, context: Dict = None) -> Any:
        """
        Execute hooks for a given hook name and type.
        
        Args:
            hook_name: Name of the hook
            hook_type: Type of hook
            data: Data to pass to hooks
            context: Additional context (request, user, etc.)
        
        Returns:
            Transformed data (for BEFORE/FILTER hooks) or original data
        """
        key = f"{hook_name}.{hook_type.value}"
        handlers = cls._hooks.get(key, [])
        
        if not handlers:
            return data
        
        result = data
        context = context or {}
        
        for hook_info in handlers:
            handler = hook_info["handler"]
            try:
                if hook_type == HookType.BEFORE or hook_type == HookType.FILTER:
                    # BEFORE and FILTER hooks can modify data
                    result = handler(result, context)
                    if result is None:
                        result = data  # Fallback to original if None returned
                elif hook_type == HookType.AFTER or hook_type == HookType.ACTION:
                    # AFTER and ACTION hooks perform side effects
                    handler(result, context)
            except Exception as e:
                # Log error but continue execution
                # In production, use proper logging
                print(f"Error executing hook {hook_name}.{hook_type.value}: {e}")
                # Optionally re-raise for critical hooks
                # raise
        
        return result
    
    @classmethod
    def has_hooks(cls, hook_name: str, hook_type: HookType) -> bool:
        """Check if hooks are registered for a given hook name and type."""
        key = f"{hook_name}.{hook_type.value}"
        return key in cls._hooks and len(cls._hooks[key]) > 0
    
    @classmethod
    def get_hooks(cls, hook_name: str, hook_type: HookType) -> List[Callable]:
        """Get all handlers for a hook."""
        key = f"{hook_name}.{hook_type.value}"
        return [h["handler"] for h in cls._hooks.get(key, [])]
    
    @classmethod
    def clear(cls):
        """Clear all registered hooks (useful for testing)."""
        cls._hooks.clear()


def register_hook(hook_name: str, hook_type: HookType, priority: int = 100):
    """
    Decorator for registering hooks.
    
    Usage:
        @register_hook("product.before_create", HookType.BEFORE)
        def my_hook(product_data: dict, context: dict) -> dict:
            # Custom logic
            return product_data
    """
    def decorator(func: Callable):
        HookRegistry.register(hook_name, hook_type, func, priority)
        return func
    return decorator


# Export for convenience
__all__ = ["HookType", "HookRegistry", "register_hook"]

