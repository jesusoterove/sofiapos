/**
 * Groups Tab component for ProductForm.
 * Manages product group assignments for stores.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { storesApi } from '@/api/stores'
import { storeProductGroupsApi, StoreProductGroup } from '@/api/storeProductGroups'
import { DataGrid, DataGridColumn } from '@sofiapos/ui'

interface GroupsTabProps {
  productId: string | undefined
  isEditMode: boolean
}

export function GroupsTab({ productId, isEditMode }: GroupsTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(false),
  })

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['store-product-groups', selectedStoreId],
    queryFn: () => storeProductGroupsApi.list(selectedStoreId || undefined),
    enabled: !!selectedStoreId,
  })

  const { data: productGroups = [] } = useQuery({
    queryKey: ['product-groups', productId],
    queryFn: () => storeProductGroupsApi.getProductGroups(Number(productId)),
    enabled: isEditMode && !!productId,
  })

  const assignMutation = useMutation({
    mutationFn: ({ groupId, assigned }: { groupId: number; assigned: boolean }) => {
      return storeProductGroupsApi.assignProduct(Number(productId), groupId, assigned)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-groups', productId] })
      toast.success(t('inventory.updateSuccess') || 'Group assignment updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update group assignment')
    },
  })

  const handleCheckboxChange = (groupId: number, checked: boolean) => {
    assignMutation.mutate({ groupId, assigned: checked })
  }

  const columns: DataGridColumn<StoreProductGroup>[] = [
    { id: 'group_name', headerName: t('inventory.storeGroup') || 'Group Name', field: 'group_name', sortable: true },
    {
      id: 'belongs',
      headerName: t('inventory.belongsToGroup') || 'Belongs to Group',
      cellRenderer: ({ row }) => {
        const isAssigned = productGroups.some((pg: any) => pg.id === row.id)
        return (
          <input
            type="checkbox"
            checked={isAssigned}
            onChange={(e) => handleCheckboxChange(row.id, e.target.checked)}
            className="rounded"
          />
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {t('stores.store') || 'Store'} *
        </label>
        <select
          value={selectedStoreId || ''}
          onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-4 py-2 border rounded-lg max-w-md"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <option value="">{t('common.select') || 'Select...'}</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>
      {true && (
        <DataGrid
          data={groups}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('inventory.noProducts') || 'No groups found'}
          compact={true}
        />
      )}
    </div>
  )
}


