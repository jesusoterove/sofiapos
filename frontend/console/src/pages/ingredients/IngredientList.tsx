/**
 * Ingredients (Materials) management page.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { materialsApi, Material } from '@/api/materials'
import { Button, DataGrid, DataGridColumn, messageBox } from '@sofiapos/ui'

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
      id: 'base_uofm_name',
      headerName: t('inventory.baseUofm') || 'Base Unit',
      field: 'base_uofm_name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      id: 'unit_cost',
      headerName: t('inventory.unitCost') || 'Unit Cost',
      field: 'unit_cost',
      sortable: true,
      type: 'money',
      cellRendererOptions: {
        prefix: t('common.currencySymbol'),
        decPlaces: 2,
        align: 'right',
      },
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
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleEdit(row)}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outline"
            size="xs"
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
    </div>
  )
}


