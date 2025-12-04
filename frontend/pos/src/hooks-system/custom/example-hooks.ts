/**
 * Example custom hooks for POS.
 * This file demonstrates how to create custom hooks.
 * Remove or rename this file when creating your own hooks.
 */

import { registerHook, HookType } from '../index';

// Example: Custom order validation
registerHook('order.beforeSubmit', HookType.BEFORE, (orderData: any) => {
  // Custom validation logic
  return orderData;
}, 50);

