/**
 * Category tabs component for product filtering.
 */
import React from 'react'
import { Button } from '@sofiapos/ui'

interface Category {
  id: number
  name: string
}

interface CategoryTabsProps {
  categories: Category[]
  selectedCategoryId?: number
  onSelectCategory: (categoryId: number | undefined) => void
}

export function CategoryTabs({ categories, selectedCategoryId, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2" style={{ height: '48px' }}>
      <Button
        variant={selectedCategoryId === undefined ? 'primary' : 'secondary'}
        onClick={() => onSelectCategory(undefined)}
        className="h-10 px-4 whitespace-nowrap flex-shrink-0"
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategoryId === category.id ? 'primary' : 'secondary'}
          onClick={() => onSelectCategory(category.id)}
          className="h-10 px-4 whitespace-nowrap flex-shrink-0"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}

