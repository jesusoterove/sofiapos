/**
 * Product search bar component.
 */
import React from 'react'
import { Input } from '@sofiapos/ui'
import { FaSearch, FaTimes } from 'react-icons/fa'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="flex-1 pb-1">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<FaSearch />}
        rightIcon={
          value ? (
            <button
              onClick={() => onChange('')}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          ) : undefined
        }
        fullWidth
      />
    </div>
  )
}

