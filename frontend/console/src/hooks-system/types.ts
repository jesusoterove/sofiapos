/**
 * Type definitions for hook system.
 */

export interface HookContext {
  user?: {
    id: number;
    username: string;
    roles: string[];
  };
  store?: {
    id: number;
    name: string;
  };
  request?: {
    method: string;
    path: string;
    headers: Record<string, string>;
  };
  [key: string]: any;
}

export interface ProductFormData {
  name: string;
  code?: string;
  description?: string;
  categoryId?: number;
  sellingPrice: number;
  requiresInventory: boolean;
  isActive: boolean;
  [key: string]: any;
}

export interface OrderFormData {
  customerId?: number;
  tableId?: number;
  items: OrderItemFormData[];
  notes?: string;
  [key: string]: any;
}

export interface OrderItemFormData {
  productId: number;
  quantity: number;
  unitPrice: number;
  [key: string]: any;
}

export interface CustomerFormData {
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  taxIdType?: string;
  creditLimit?: number;
  [key: string]: any;
}

export interface PaymentFormData {
  orderId: number;
  paymentMethodId: number;
  amount: number;
  referenceNumber?: string;
  [key: string]: any;
}

