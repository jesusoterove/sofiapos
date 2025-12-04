/**
 * Form component for creating and editing ingredients (materials).
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@/i18n/hooks'
import { Material } from '@/api/materials'
import { Button } from '@sofiapos/ui'

interface IngredientFormProps {
  ingredient: Material | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function IngredientForm({ ingredient, onSubmit, onCancel }: IngredientFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      requires_inventory: true,
    },
  })

  useEffect(() => {
    if (ingredient) {
      reset({
        name: ingredient.name,
        code: ingredient.code || '',
        description: ingredient.description || '',
        requires_inventory: ingredient.requires_inventory,
      })
    }
  }, [ingredient, reset])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {ingredient
            ? t('inventory.editIngredient') || 'Edit Ingredient'
            : t('inventory.createIngredient') || 'Create Ingredient'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.ingredientName') || 'Name'} *
            </label>
            <input
              type="text"
              {...register('name', { required: true })}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{t('common.nameRequired')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.ingredientCode') || 'Code'}
            </label>
            <input
              type="text"
              {...register('code')}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.description') || 'Description'}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('requires_inventory')}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.requiresInventory') || 'Requires Inventory'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {ingredient ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

