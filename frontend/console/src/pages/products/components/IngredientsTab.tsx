/**
 * Ingredients Tab component for ProductForm.
 * Manages recipe materials for prepared products.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { materialsApi } from '@/api/materials'
import { recipeMaterialsApi, RecipeMaterial } from '@/api/recipeMaterials'
import { unitOfMeasuresApi } from '@/api/unitOfMeasures'
import { Button, messageBox, AdvancedDataGrid, AdvancedDataGridColumn, NumberCellRenderer } from '@sofiapos/ui'
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

interface IngredientsTabProps {
  productId: string | undefined
  isEditMode: boolean
  productType: string
}

export function IngredientsTab({ productId, isEditMode, productType }: IngredientsTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<RecipeMaterial | null>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const [uofmId, setUofmId] = useState<number | null>(null)

  const { data: recipeMaterials = [], isLoading } = useQuery({
    queryKey: ['recipe-materials', productId],
    queryFn: () => recipeMaterialsApi.list(Number(productId)),
    enabled: isEditMode && !!productId && productType === 'prepared',
  })

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.list(0, 1000),
  })

  const { data: uofms = [] } = useQuery({
    queryKey: ['unit-of-measures'],
    queryFn: () => unitOfMeasuresApi.list(true),
  })

  const createMutation = useMutation({
    mutationFn: (data: { material_id: number; quantity: number; unit_of_measure_id: number | null }) => {
      return recipeMaterialsApi.create(Number(productId), {
        recipe_id: 0, // Will be created by backend
        material_id: data.material_id,
        quantity: data.quantity,
        unit_of_measure_id: data.unit_of_measure_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-materials', productId] })
      setIsModalOpen(false)
      setSelectedMaterialId(null)
      setQuantity('')
      setUofmId(null)
      toast.success(t('inventory.createSuccess') || 'Ingredient added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to add ingredient')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ material_id, data }: { material_id: number; data: { quantity: number; unit_of_measure_id: number | null } }) => {
      return recipeMaterialsApi.update(Number(productId), material_id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-materials', productId] })
      setIsModalOpen(false)
      setEditingMaterial(null)
      setSelectedMaterialId(null)
      setQuantity('')
      setUofmId(null)
      toast.success(t('inventory.updateSuccess') || 'Ingredient updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update ingredient')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (material_id: number) => recipeMaterialsApi.delete(Number(productId), material_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-materials', productId] })
      toast.success(t('inventory.deleteSuccess') || 'Ingredient removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.deleteError') || 'Failed to remove ingredient')
    },
  })

  const handleAdd = () => {
    setEditingMaterial(null)
    setSelectedMaterialId(null)
    setQuantity('')
    setUofmId(null)
    setIsModalOpen(true)
  }

  const handleEdit = (material: RecipeMaterial) => {
    setEditingMaterial(material)
    setSelectedMaterialId(material.material_id)
    setQuantity(String(material.quantity))
    setUofmId(material.unit_of_measure_id)
    setIsModalOpen(true)
  }

  const handleDelete = async (material: RecipeMaterial) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to remove "{{name}}"?').replace('{{name}}', material.material_name || '')
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(material.id)
    }
  }

  const handleSubmit = () => {
    if (!selectedMaterialId || !quantity) {
      toast.error(t('common.required') || 'Please fill all required fields')
      return
    }

    if (editingMaterial) {
      updateMutation.mutate({
        material_id: editingMaterial.id,
        data: {
          quantity: parseFloat(quantity),
          unit_of_measure_id: uofmId,
        },
      })
    } else {
      createMutation.mutate({
        material_id: selectedMaterialId,
        quantity: parseFloat(quantity),
        unit_of_measure_id: uofmId,
      })
    }
  }

  const columns: AdvancedDataGridColumn<RecipeMaterial>[] = [
    { field: 'material_code', headerName: t('inventory.ingredientCode') || 'Code', sortable: true, flex: 1 },
    { field: 'material_name', headerName: t('inventory.ingredientName') || 'Name', sortable: true, flex: 2 },
    {
      field: 'quantity',
      headerName: t('inventory.quantity') || 'Quantity',
      sortable: true,
      valueGetter: (params: any) => params.data.quantity,
      valueFormatter: (params: any) => params.data.quantity.toFixed(0),
      width: 150
    },
    { field: 'unit_of_measure_name', headerName: t('inventory.baseUofm') || 'U of M', sortable: true, width: 100 },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      width: 100,
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={handleAdd} size="sm">
          <FaPlus className="mr-2" />
          {t('inventory.addIngredient') || 'Add Ingredient'}
        </Button>
      </div>
      <AdvancedDataGrid
        rowData={recipeMaterials}
        columnDefs={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noIngredients') || 'No ingredients found'}
        height="400px"
      />
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {editingMaterial ? t('common.edit') : t('inventory.addIngredient')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.ingredientName') || 'Ingredient'} *
                  </label>
                  <select
                    value={selectedMaterialId || ''}
                    onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                    disabled={!!editingMaterial}
                  >
                    <option value="">{t('common.select') || 'Select...'}</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code ? `${m.code} - ` : ''}{m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.quantity') || 'Quantity'} *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.baseUofm') || 'Unit of Measure'}
                  </label>
                  <select
                    value={uofmId || ''}
                    onChange={(e) => setUofmId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  >
                    <option value="">{t('common.none') || 'None'}</option>
                    {uofms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.abbreviation} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMaterial ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


