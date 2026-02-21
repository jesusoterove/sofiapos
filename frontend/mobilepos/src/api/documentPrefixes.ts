import apiClient from './client'

export async function listDocumentPrefixes(storeId?: number): Promise<any[]> {
  const response = await apiClient.get('/api/v1/document-prefixes', {
    params: { store_id: storeId },
  })
  return response.data
}
