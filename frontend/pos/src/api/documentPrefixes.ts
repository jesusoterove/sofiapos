/**
 * Document prefix API client functions.
 */
import apiClient from './client'

export interface DocumentPrefix {
  id: number
  store_id?: number | null
  doc_type: 'shift' | 'invoice' | 'inventory' | 'payment'
  prefix: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * List document prefixes.
 */
export async function listDocumentPrefixes(storeId?: number): Promise<DocumentPrefix[]> {
  const params = storeId ? { store_id: storeId } : {}
  const response = await apiClient.get<DocumentPrefix[]>('/api/v1/document_prefixes', { params })
  return response.data
}

