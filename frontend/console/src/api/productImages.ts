/**
 * API client for product images management.
 */
import apiClient from './client'

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  image_path: string | null
  is_primary: boolean
  display_order: number
  created_at: string
}

export interface ProductImageCreate {
  product_id: number
  file: File
  is_primary?: boolean
  display_order?: number
}

export interface ProductImageUpdate {
  is_primary?: boolean
  display_order?: number
}

export const productImagesApi = {
  list: async (productId: number): Promise<ProductImage[]> => {
    const response = await apiClient.get('/api/v1/product-images', {
      params: { product_id: productId },
    })
    return response.data
  },

  get: async (id: number): Promise<ProductImage> => {
    const response = await apiClient.get(`/api/v1/product-images/${id}`)
    return response.data
  },

  create: async (data: ProductImageCreate): Promise<ProductImage> => {
    const formData = new FormData()
    formData.append('product_id', String(data.product_id))
    formData.append('file', data.file)
    if (data.is_primary !== undefined) {
      formData.append('is_primary', String(data.is_primary))
    }
    if (data.display_order !== undefined) {
      formData.append('display_order', String(data.display_order))
    }
    
    const response = await apiClient.post('/api/v1/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  update: async (id: number, data: ProductImageUpdate): Promise<ProductImage> => {
    const formData = new FormData()
    if (data.is_primary !== undefined) {
      formData.append('is_primary', String(data.is_primary))
    }
    if (data.display_order !== undefined) {
      formData.append('display_order', String(data.display_order))
    }
    
    const response = await apiClient.put(`/api/v1/product-images/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/product-images/${id}`)
  },
}

