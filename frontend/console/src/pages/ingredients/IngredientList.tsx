/**
 * Ingredients (Materials) management page.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { materialsApi, Material } from '@/api/materials'
import { Button, AdvancedDataGrid, AdvancedDataGridColumn, messageBox, NumberCellRenderer, YesNoCellRenderer } from '@sofiapos/ui'
import { FaEdit, FaTrash } from 'react-icons/fa'

export function IngredientList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch ingredients
  const { data: ingredients = [], isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.list(),
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
    navigate({ to: '/inventory/ingredients/new' })
  }

  const handleEdit = (ingredient: Material) => {
    navigate({ to: `/inventory/ingredients/${ingredient.id}` })
  }

  const handleDelete = async (ingredient: Material) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete "{{name}}"??').
      replace('{{name}}', ingredient.name)
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(ingredient.id)
    }
  }


  const columns: AdvancedDataGridColumn<Material>[] = [
    {
      field: 'code',
      headerName: t('inventory.ingredientCode') || 'Code',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      field: 'name',
      headerName: t('inventory.ingredientName') || 'Name',
      sortable: true,
      filter: true,
      flex: 4,
    },
    {
      field: 'base_uofm_name',
      headerName: t('inventory.baseUofm') || 'Base Unit',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      field: 'unit_cost',
      headerName: t('inventory.unitCost') || 'Unit Cost',
      sortable: true,
      flex: 2,
      cellRenderer: (params: any) => (
        <NumberCellRenderer
          value={params.value}
          prefix={t('common.currencySymbol')}
          decPlaces={2}
          align="right"
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleEdit(params.data)}
            className="p-1 rounded hover:bg-gray-100"
            title={t('common.edit') || 'Edit'}
            style={{ color: 'var(--color-primary-500)' }}
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(params.data)}
            className="p-1 rounded hover:bg-gray-100"
            title={t('common.delete') || 'Delete'}
            style={{ color: 'var(--color-danger-500)' }}
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="p-3">
        <div className="text-red-600">
          {t('common.error')}: {error instanceof Error ? error.message : t('common.unknownError')}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3">
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

      <AdvancedDataGrid
        rowData={ingredients}
        columnDefs={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noIngredients') || 'No ingredients found'}
        height="600px"
      />
    </div>
  )
}


