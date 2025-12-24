/**
 * Sales types.
 */
export interface SalesFilterRequest {
  store_id?: number | null
  cash_register_id?: number | null
  filter_mode: 'today' | 'yesterday' | 'current_shift' | 'last_shift' | 'last_week' | 'last_month' | 'date_range'
  start_date?: string | null
  end_date?: string | null
}

export interface SalesDetailsRequest extends SalesFilterRequest {
  page: number
  page_size: number
}

export interface PaymentMethodSummary {
  payment_method_name: string
  payment_method_type: string
  total_amount: number
}

export interface SalesSummary {
  beginning_balance?: number | null
  total_sales: number
  payment_methods: PaymentMethodSummary[]
}

export interface SalesDetail {
  order_id: number
  order_number: string
  table_number?: string | null
  customer_name?: string | null
  cash_paid: number
  other_paid: number
  total_paid: number
  date: string
}

export interface SalesResponse {
  summary: SalesSummary
  details: SalesDetail[]
  start_date?: string | null
  end_date?: string | null
  cash_register_user?: string | null
}

export interface SalesSummaryResponse {
  summary: SalesSummary
  start_date?: string | null
  end_date?: string | null
  cash_register_user?: string | null
}

export interface SalesDetailsResponse {
  details: SalesDetail[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

