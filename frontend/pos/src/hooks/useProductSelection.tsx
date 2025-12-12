/**
 * Hook for product selection and filtering.
 */
import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { openDatabase, getAllProducts } from '../db'
import { getAllCategories } from '../db/queries/categories'

export interface Product {
  id: number
  code: string
  name: string
  description?: string
  selling_price: number
  product_type: string
  category_id?: number
  is_active: boolean
  tax_rate: number
}

export function useProductSelection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch ALL products from IndexedDB (for category determination)
  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const db = await openDatabase()
      return getAllProducts(db) // Always fetch all products
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch filtered products based on selected category
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

  // Fetch categories from IndexedDB (synced from API)
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const db = await openDatabase()
      return getAllCategories(db)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get categories that have products (filter from synced categories)
  // Use allProducts instead of products to ensure all categories are always shown
  const categories = useMemo(() => {
    const productCategoryIds = new Set<number>()
    allProducts.forEach((product) => {
      if (product.category_id) {
        productCategoryIds.add(product.category_id)
      }
    })
    
    // Filter synced categories to only include those that have products
    return allCategories
      .filter((category) => productCategoryIds.has(category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCategories, allProducts])

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

