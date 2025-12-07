/**
 * Hook for product selection and filtering.
 */
import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { openDatabase, getAllProducts, searchProducts } from '../db'
import apiClient from '../api/client'

export interface Product {
  id: number
  code: string
  name: string
  description?: string
  selling_price: number
  product_type: string
  category_id?: number
  is_active: boolean
}

export function useProductSelection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products from IndexedDB (offline-first)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategoryId],
    queryFn: async () => {
      const db = await openDatabase()
      if (selectedCategoryId) {
        return getAllProducts(db, selectedCategoryId)
      }
      return getAllProducts(db)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  // Get unique categories from products
  const categories = useMemo(() => {
    const categoryMap = new Map<number, { id: number; name: string }>()
    products.forEach((product) => {
      if (product.category_id) {
        // For now, we'll use a placeholder - in real app, categories would come from API
        if (!categoryMap.has(product.category_id)) {
          categoryMap.set(product.category_id, {
            id: product.category_id,
            name: `Category ${product.category_id}`, // TODO: Fetch actual category names
          })
        }
      }
    })
    return Array.from(categoryMap.values())
  }, [products])

  const selectCategory = useCallback((categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId)
  }, [])

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return {
    products: filteredProducts,
    categories,
    selectedCategoryId,
    searchQuery,
    isLoading,
    selectCategory,
    setSearch,
  }
}

