/**
 * Example custom hooks.
 * This file demonstrates how to create custom hooks.
 * Remove or rename this file when creating your own hooks.
 */

import { registerHook, HookType } from '../index';
import { ProductFormData, OrderFormData } from '../types';

// Example: Product form validation
registerHook('product.beforeSubmit', HookType.BEFORE, (data: ProductFormData) => {
  // Ensure product code has prefix
  if (data.code && !data.code.startsWith('PROD-')) {
    data.code = `PROD-${data.code}`;
  }
  
  return data;
}, 50);

// Example: Product display customization
registerHook('product.afterLoad', HookType.AFTER, (product: any) => {
  // Add custom display name
  return {
    ...product,
    displayName: `${product.name} (${product.code || 'N/A'})`
  };
});

// Example: Filter product list
registerHook('product.filterList', HookType.FILTER, (products: any[]) => {
  // Filter and sort products
  return products
    .filter(p => p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Example: Additional form fields
registerHook('product.formFields', HookType.COMPONENT, () => {
  // Return additional form field component
  // In real implementation, import and return your custom component
  return null; // Placeholder
});

// Example: Order total calculation
registerHook('order.calculateTotal', HookType.FILTER, (order: OrderFormData) => {
  // Apply custom discount for orders over $100
  const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  if (subtotal > 100) {
    // Apply 5% discount
    return subtotal * 0.95;
  }
  return subtotal;
});

