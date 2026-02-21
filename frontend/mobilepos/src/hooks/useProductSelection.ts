import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { openDatabase, getAllProducts, getProductsByCategory, getAllCategories } from '@/db'
import type { DBProduct } from '@/db'

export interface Product {
  id: number
  code: string
  name: string
  description?: string | null
  selling_price: number
  product_type: string
  category_id?: number | null
  is_active: number
  tax_rate: number
}

export function useProductSelection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const db = await openDatabase()
      return getAllProducts(db)
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategoryId],
    queryFn: async () => {
      const db = await openDatabase()
      if (selectedCategoryId) {
        return getProductsByCategory(db, selectedCategoryId)
      }
      return getAllProducts(db)
    },
    staleTime: 5 * 60 * 1000,
  })

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const db = await openDatabase()
      return getAllCategories(db)
    },
    staleTime: 5 * 60 * 1000,
  })

  const categories = useMemo(() => {
    const productCategoryIds = new Set<number>()
    allProducts.forEach((p) => {
      if (p.category_id) productCategoryIds.add(p.category_id)
    })
    return allCategories
      .filter((c) => productCategoryIds.has(c.id))
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCategories, allProducts])

  const selectCategory = useCallback((categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId)
  }, [])

  const setSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return {
    products: filteredProducts,
    categories,
    selectedCategoryId,
    searchQuery,
    isLoading,
    selectCategory,
    setSearch,
    clearSearch,
  }
}
