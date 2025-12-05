/**
 * Ingredient (Material) create/edit page.
 */
import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { materialsApi, Material } from '@/api/materials'
import { unitOfMeasuresApi } from '@/api/unitOfMeasures'
import { Button, messageBox } from '@sofiapos/ui'
import { FaArrowLeft } from 'react-icons/fa'
import { useSettings } from '@/contexts/SettingsContext'

export function IngredientFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const ingredientId = params.ingredientId
  const queryClient = useQueryClient()
  const isEditMode = !!ingredientId && ingredientId !== 'new'
  const { moneyDecimalPlaces } = useSettings()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      requires_inventory: false,
      base_uofm_id: null as number | null,
      unit_cost: '',
    },
  })

  // Fetch unit of measures
  const { data: unitOfMeasures = [] } = useQuery({
    queryKey: ['unit-of-measures'],
    queryFn: () => unitOfMeasuresApi.list(true),
  })

  // Fetch ingredient if editing
  const { data: ingredient, isLoading: isLoadingIngredient } = useQuery({
    queryKey: ['materials', ingredientId],
    queryFn: () => materialsApi.get(Number(ingredientId)),
    enabled: isEditMode && !!ingredientId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: materialsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast.success(t('inventory.createSuccess') || 'Ingredient created successfully')
      navigate({ to: '/inventory/ingredients' })
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
      navigate({ to: '/inventory/ingredients' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update ingredient')
    },
  })

  // Load ingredient data when editing
  useEffect(() => {
    if (ingredient) {
      reset({
        name: ingredient.name,
        code: ingredient.code || '',
        description: ingredient.description || '',
        requires_inventory: false, // Always default to false
        base_uofm_id: ingredient.base_uofm_id || null,
        unit_cost: ingredient.unit_cost !== null && ingredient.unit_cost !== undefined ? String(ingredient.unit_cost) : '',
      })
    }
  }, [ingredient, reset])

  const onSubmit = (data: any) => {
    // Always set requires_inventory to false
    const submitData = {
      ...data,
      requires_inventory: false,
    }
    if (isEditMode && ingredientId) {
      updateMutation.mutate({ id: Number(ingredientId), data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleCancel = async () => {
    // Check if form has unsaved changes
    if (isDirty) {
      const message = t('common.cancelConfirm') || 'You have unsaved changes. Are you sure you want to cancel?'
      
      const result = await messageBox.ask(message, undefined, 'YesNo')
      if (result.value === true) {
        navigate({ to: '/inventory/ingredients' })
      }
    } else {
      // No changes, navigate directly
      navigate({ to: '/inventory/ingredients' })
    }
  }

  if (isEditMode && isLoadingIngredient) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-500)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('common.loading')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEditMode
              ? t('inventory.editIngredient') || 'Edit Ingredient'
              : t('inventory.createIngredient') || 'Create Ingredient'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {isEditMode
              ? t('inventory.editIngredient') || 'Edit ingredient details'
              : t('inventory.createIngredient') || 'Add a new ingredient to the system'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="ingredient-form"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? t('common.loading')
              : isEditMode
              ? t('common.update')
              : t('common.create')}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
          <form id="ingredient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.ingredientCode') || 'Code'}
              </label>
              <input
                type="text"
                {...register('code')}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.ingredientName') || 'Name'} *
              </label>
              <input
                type="text"
                {...register('name', { required: true })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{t('common.nameRequired')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.description') || 'Description'}
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                  {t('inventory.baseUofm') || 'Base Unit of Measure'}
                </label>
                <select
                  {...register('base_uofm_id', {
                    setValueAs: (v) => v === '' ? null : Number(v)
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border-default)' }}
                >
                  <option value="">{t('common.none') || 'None'}</option>
                  {unitOfMeasures.map((uom) => (
                    <option key={uom.id} value={uom.id}>
                      {uom.abbreviation} - {uom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                  {t('inventory.unitCost') || 'Unit Cost'}
                </label>
                <input
                  type="number"
                  step={1 / Math.pow(10, moneyDecimalPlaces)}
                  min="0"
                  {...register('unit_cost', {
                    setValueAs: (v) => v === '' ? null : v
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border-default)' }}
                  placeholder={`0.${'0'.repeat(moneyDecimalPlaces)}`}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

