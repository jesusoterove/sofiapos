/**
 * Ingredients (Materials) management page.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { materialsApi, Material } from '@/api/materials'
import { Button, DataGrid, DataGridColumn } from '@sofiapos/ui'
import { IngredientForm } from '@/components/ingredients/IngredientForm'

export function Ingredients() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Material | null>(null)

  // Fetch ingredients
  const { data: ingredients = [], isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.list(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: materialsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success(t('inventory.createSuccess') || 'Ingredient created successfully')
      setIsFormOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to create ingredient')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => materialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success(t('inventory.updateSuccess') || 'Ingredient updated successfully')
      setIsFormOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update ingredient')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: materialsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success(t('inventory.deleteSuccess') || 'Ingredient deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.deleteError') || 'Failed to delete ingredient')
    },
  })

  const handleCreate = () => {
    setEditingIngredient(null)
    setIsFormOpen(true)
  }

  const handleEdit = (ingredient: Material) => {
    setEditingIngredient(ingredient)
    setIsFormOpen(true)
  }

  const handleDelete = (ingredient: Material) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete "{{name}}"?').
      replace('{{name}}', ingredient.name)
    if (window.confirm(message)) {
      deleteMutation.mutate(ingredient.id)
    }
  }

  const handleSubmit = (data: any) => {
    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const columns: DataGridColumn<Material>[] = [
    {
      id: 'name',
      headerName: t('inventory.ingredientName') || 'Name',
      field: 'name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      id: 'code',
      headerName: t('inventory.ingredientCode') || 'Code',
      field: 'code',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      id: 'requires_inventory',
      headerName: t('inventory.requiresInventory') || 'Requires Inventory',
      field: 'requires_inventory',
      sortable: true,
      type: 'yesno',
    },
    {
      id: 'actions',
      headerName: t('common.actions') || 'Actions',
      cellRenderer: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row)}
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">
          {t('common.error')}: {error instanceof Error ? error.message : t('common.unknownError')}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('inventory.ingredients') || 'Ingredients'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {t('inventory.description') || 'Manage ingredients and materials'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          {t('inventory.createIngredient') || 'Create Ingredient'}
        </Button>
      </div>

      <DataGrid
        data={ingredients}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noIngredients') || 'No ingredients found'}
        compact={true}
      />

      {isFormOpen && (
        <IngredientForm
          ingredient={editingIngredient}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  )
}

