/**
 * Hook system for POS customization.
 * Similar to console hooks but optimized for POS operations.
 */

export enum HookType {
  BEFORE = 'before',
  AFTER = 'after',
  FILTER = 'filter',
  COMPONENT = 'component',
}

type HookHandler<T = any> = (data: T, context?: Record<string, any>) => T | void | React.ReactNode;

interface HookInfo {
  handler: HookHandler;
  priority: number;
}

class HookRegistry {
  private hooks: Map<string, HookInfo[]> = new Map();

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
    this.hooks.get(key)!.sort((a, b) => a.priority - b.priority);
  }

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
          const hookResult = hookInfo.handler(result, ctx);
          if (hookResult !== undefined && hookResult !== null) {
            result = hookResult as T;
          }
        } else {
          hookInfo.handler(result, ctx);
        }
      } catch (error) {
        console.error(`Error executing hook ${hookName}.${hookType}:`, error);
      }
    }
    
    return result;
  }

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

  hasHooks(hookName: string, hookType: HookType): boolean {
    const key = `${hookName}.${hookType}`;
    return this.hooks.has(key) && this.hooks.get(key)!.length > 0;
  }

  clear(): void {
    this.hooks.clear();
  }
}

export const hookRegistry = new HookRegistry();

export function registerHook<T>(
  hookName: string,
  hookType: HookType,
  handler: HookHandler<T>,
  priority?: number
): void {
  hookRegistry.register(hookName, hookType, handler, priority);
}

export function executeHook<T>(
  hookName: string,
  hookType: HookType,
  data: T,
  context?: Record<string, any>
): T {
  return hookRegistry.execute(hookName, hookType, data, context);
}

export function getComponentHooks(hookName: string): React.ReactNode[] {
  return hookRegistry.getComponents(hookName);
}

