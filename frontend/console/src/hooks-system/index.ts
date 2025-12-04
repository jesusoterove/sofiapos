/**
 * Hook system for frontend customization.
 * Allows businesses to customize UI behavior without modifying core code.
 */

export enum HookType {
  BEFORE = 'before',      // Execute before core logic
  AFTER = 'after',        // Execute after core logic
  FILTER = 'filter',      // Transform data
  COMPONENT = 'component', // Return React components
}

type HookHandler<T = any> = (data: T, context?: Record<string, any>) => T | void | React.ReactNode;

interface HookInfo {
  handler: HookHandler;
  priority: number;
}

class HookRegistry {
  private hooks: Map<string, HookInfo[]> = new Map();

  /**
   * Register a hook handler.
   * @param hookName - Name of the hook (e.g., "product.beforeSubmit")
   * @param hookType - Type of hook
   * @param handler - Function to execute
   * @param priority - Execution priority (lower = earlier execution, default: 100)
   */
  register<T>(
    hookName: string,
    hookType: HookType,
    handler: HookHandler<T>,
    priority: number = 100
  ): void {
    const key = `${hookName}.${hookType}`;
    
    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }
    
    const hookInfo: HookInfo = { handler, priority };
    this.hooks.get(key)!.push(hookInfo);
    
    // Sort by priority
    this.hooks.get(key)!.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute hooks for a given hook name and type.
   * @param hookName - Name of the hook
   * @param hookType - Type of hook
   * @param data - Data to pass to hooks
   * @param context - Additional context
   * @returns Transformed data (for BEFORE/FILTER hooks) or original data
   */
  execute<T>(
    hookName: string,
    hookType: HookType,
    data: T,
    context?: Record<string, any>
  ): T {
    const key = `${hookName}.${hookType}`;
    const handlers = this.hooks.get(key) || [];
    
    if (handlers.length === 0) {
      return data;
    }
    
    let result = data;
    const ctx = context || {};
    
    for (const hookInfo of handlers) {
      try {
        if (hookType === HookType.BEFORE || hookType === HookType.FILTER) {
          // BEFORE and FILTER hooks can modify data
          const hookResult = hookInfo.handler(result, ctx);
          if (hookResult !== undefined && hookResult !== null) {
            result = hookResult as T;
          }
        } else if (hookType === HookType.AFTER || hookType === HookType.ACTION) {
          // AFTER and ACTION hooks perform side effects
          hookInfo.handler(result, ctx);
        }
      } catch (error) {
        // Log error but continue execution
        console.error(`Error executing hook ${hookName}.${hookType}:`, error);
        // Optionally re-raise for critical hooks
      }
    }
    
    return result;
  }

  /**
   * Get component hooks (returns React components).
   * @param hookName - Name of the hook
   * @returns Array of React components
   */
  getComponents(hookName: string): React.ReactNode[] {
    const key = `${hookName}.${HookType.COMPONENT}`;
    const handlers = this.hooks.get(key) || [];
    
    return handlers
      .map(hookInfo => {
        try {
          return hookInfo.handler(null, {});
        } catch (error) {
          console.error(`Error executing component hook ${hookName}:`, error);
          return null;
        }
      })
      .filter(component => component !== null) as React.ReactNode[];
  }

  /**
   * Check if hooks are registered for a given hook name and type.
   */
  hasHooks(hookName: string, hookType: HookType): boolean {
    const key = `${hookName}.${hookType}`;
    return this.hooks.has(key) && this.hooks.get(key)!.length > 0;
  }

  /**
   * Clear all registered hooks (useful for testing).
   */
  clear(): void {
    this.hooks.clear();
  }
}

export const hookRegistry = new HookRegistry();

/**
 * Register a hook handler.
 * 
 * @example
 * ```typescript
 * registerHook('product.beforeSubmit', HookType.BEFORE, (data) => {
 *   // Custom validation
 *   return data;
 * });
 * ```
 */
export function registerHook<T>(
  hookName: string,
  hookType: HookType,
  handler: HookHandler<T>,
  priority?: number
): void {
  hookRegistry.register(hookName, hookType, handler, priority);
}

/**
 * Execute hooks.
 * 
 * @example
 * ```typescript
 * const processedData = executeHook('product.beforeSubmit', HookType.BEFORE, formData);
 * ```
 */
export function executeHook<T>(
  hookName: string,
  hookType: HookType,
  data: T,
  context?: Record<string, any>
): T {
  return hookRegistry.execute(hookName, hookType, data, context);
}

/**
 * Get component hooks.
 * 
 * @example
 * ```typescript
 * const additionalFields = getComponentHooks('product.formFields');
 * return (
 *   <>
 *     <BaseFormFields />
 *     {additionalFields}
 *   </>
 * );
 * ```
 */
export function getComponentHooks(hookName: string): React.ReactNode[] {
  return hookRegistry.getComponents(hookName);
}

