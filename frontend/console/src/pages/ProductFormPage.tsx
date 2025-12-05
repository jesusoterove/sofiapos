/**
 * Product create/edit page with tabbed sections.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productsApi, Product, ProductType } from '@/api/products'
import { materialsApi } from '@/api/materials'
import { recipeMaterialsApi, RecipeMaterial } from '@/api/recipeMaterials'
import { kitComponentsApi, KitComponent } from '@/api/kitComponents'
import { storeProductGroupsApi, StoreProductGroup } from '@/api/storeProductGroups'
import { storeProductPricesApi, StoreProductPrice } from '@/api/storeProductPrices'
import { storesApi } from '@/api/stores'
import { unitOfMeasuresApi } from '@/api/unitOfMeasures'
import { Button, messageBox, Tabs, Tab, DataGrid, DataGridColumn } from '@sofiapos/ui'
import { useSettings } from '@/contexts/SettingsContext'
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

export function ProductFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const productId = params.productId
  const queryClient = useQueryClient()
  const isEditMode = !!productId && productId !== 'new'
  const { moneyDecimalPlaces } = useSettings()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      category_id: null as number | null,
      product_type: 'sales_inventory' as ProductType,
      is_active: true,
      selling_price: '',
    },
  })

  const productType = watch('product_type')

  // Fetch product if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => productsApi.get(Number(productId)),
    enabled: isEditMode && !!productId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.createSuccess') || 'Product created successfully')
      navigate({ to: '/inventory/products' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to create product')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.updateSuccess') || 'Product updated successfully')
      navigate({ to: '/inventory/products' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update product')
    },
  })

  // Load product data when editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        code: product.code || '',
        description: product.description || '',
        category_id: product.category_id || null,
        product_type: product.product_type,
        is_active: product.is_active,
        selling_price: product.selling_price !== null && product.selling_price !== undefined ? String(product.selling_price) : '',
      })
    }
  }, [product, reset])

  const onSubmit = (data: any) => {
    if (isEditMode && productId) {
      updateMutation.mutate({ id: Number(productId), data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCancel = async () => {
    if (isDirty) {
      const message = t('common.cancelConfirm') || 'You have unsaved changes. Are you sure you want to cancel?'
      const result = await messageBox.ask(message, undefined, 'YesNo')
      if (result.value === true) {
        navigate({ to: '/inventory/products' })
      }
    } else {
      navigate({ to: '/inventory/products' })
    }
  }

  if (isEditMode && isLoadingProduct) {
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

  // Ingredients Tab Component
  const IngredientsTab = () => {
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

    const columns: DataGridColumn<RecipeMaterial>[] = [
      { id: 'material_code', headerName: t('inventory.ingredientCode') || 'Code', field: 'material_code', sortable: true },
      { id: 'material_name', headerName: t('inventory.ingredientName') || 'Name', field: 'material_name', sortable: true },
      { id: 'quantity', headerName: t('inventory.quantity') || 'Quantity', field: 'quantity', sortable: true, type: 'number' },
      { id: 'unit_of_measure_name', headerName: t('inventory.baseUofm') || 'U of M', field: 'unit_of_measure_name', sortable: true },
      {
        id: 'actions',
        headerName: t('common.actions') || 'Actions',
        cellRenderer: ({ row }) => (
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(row)}
              className="p-1 rounded hover:bg-gray-100"
              title={t('common.edit') || 'Edit'}
              style={{ color: 'var(--color-primary-500)' }}
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(row)}
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
        <DataGrid
          data={recipeMaterials}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('inventory.noIngredients') || 'No ingredients found'}
          compact={true}
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

  // Components Tab Component
  const ComponentsTab = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingComponent, setEditingComponent] = useState<KitComponent | null>(null)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [quantity, setQuantity] = useState<string>('1')

    const { data: components = [], isLoading } = useQuery({
      queryKey: ['kit-components', productId],
      queryFn: () => kitComponentsApi.list(Number(productId)),
      enabled: isEditMode && !!productId && productType === 'kit',
    })

    const { data: products = [] } = useQuery({
      queryKey: ['products'],
      queryFn: () => productsApi.list(0, 1000),
    })

    const createMutation = useMutation({
      mutationFn: (data: { component_id: number; quantity: number }) => {
        return kitComponentsApi.create({
          product_id: Number(productId),
          component_id: data.component_id,
          quantity: data.quantity,
        })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['kit-components', productId] })
        setIsModalOpen(false)
        setSelectedProductId(null)
        setQuantity('1')
        toast.success(t('inventory.createSuccess') || 'Component added successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to add component')
      },
    })

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: number; data: { quantity: number } }) => {
        return kitComponentsApi.update(id, data)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['kit-components', productId] })
        setIsModalOpen(false)
        setEditingComponent(null)
        setSelectedProductId(null)
        setQuantity('1')
        toast.success(t('inventory.updateSuccess') || 'Component updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update component')
      },
    })

    const deleteMutation = useMutation({
      mutationFn: (id: number) => kitComponentsApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['kit-components', productId] })
        toast.success(t('inventory.deleteSuccess') || 'Component removed successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || t('inventory.deleteError') || 'Failed to remove component')
      },
    })

    const handleAdd = () => {
      setEditingComponent(null)
      setSelectedProductId(null)
      setQuantity('1')
      setIsModalOpen(true)
    }

    const handleEdit = (component: KitComponent) => {
      setEditingComponent(component)
      setSelectedProductId(component.component_id)
      setQuantity(String(component.quantity))
      setIsModalOpen(true)
    }

    const handleDelete = async (component: KitComponent) => {
      const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to remove "{{name}}"?').replace('{{name}}', component.component_name || '')
      const result = await messageBox.ask(message, undefined, 'YesNo')
      if (result.value === true) {
        deleteMutation.mutate(component.id)
      }
    }

    const handleSubmit = () => {
      if (!selectedProductId || !quantity) {
        toast.error(t('common.required') || 'Please fill all required fields')
        return
      }

      if (editingComponent) {
        updateMutation.mutate({
          id: editingComponent.id,
          data: { quantity: parseFloat(quantity) },
        })
      } else {
        createMutation.mutate({
          component_id: selectedProductId,
          quantity: parseFloat(quantity),
        })
      }
    }

    const columns: DataGridColumn<KitComponent>[] = [
      { id: 'component_code', headerName: t('inventory.productCode') || 'Code', field: 'component_code', sortable: true },
      { id: 'component_name', headerName: t('inventory.productName') || 'Name', field: 'component_name', sortable: true },
      { id: 'quantity', headerName: t('inventory.quantity') || 'Quantity', field: 'quantity', sortable: true, type: 'number' },
      {
        id: 'actions',
        headerName: t('common.actions') || 'Actions',
        cellRenderer: ({ row }) => (
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(row)}
              className="p-1 rounded hover:bg-gray-100"
              title={t('common.edit') || 'Edit'}
              style={{ color: 'var(--color-primary-500)' }}
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(row)}
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
          <Button onClick={handleAdd} size="sm">
            <FaPlus className="mr-2" />
            {t('inventory.addComponent') || 'Add Component'}
          </Button>
        </div>
        <DataGrid
          data={components}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('inventory.noProducts') || 'No components found'}
          compact={true}
        />
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  {editingComponent ? t('common.edit') : t('inventory.addComponent')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {t('inventory.productName') || 'Product'} *
                    </label>
                    <select
                      value={selectedProductId || ''}
                      onChange={(e) => setSelectedProductId(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border-default)' }}
                      disabled={!!editingComponent}
                    >
                      <option value="">{t('common.select') || 'Select...'}</option>
                      {products.filter(p => p.id !== Number(productId)).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `${p.code} - ` : ''}{p.name}
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
                </div>
                <div className="flex gap-2 mt-6 justify-end">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingComponent ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Groups Tab Component
  const GroupsTab = () => {
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
        {selectedStoreId && (
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

  // Prices Tab Component
  const PricesTab = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPrice, setEditingPrice] = useState<StoreProductPrice | null>(null)
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
    const [price, setPrice] = useState<string>('')

    const { data: storePrices = [], isLoading } = useQuery({
      queryKey: ['store-prices', productId],
      queryFn: () => storeProductPricesApi.list(Number(productId)),
      enabled: isEditMode && !!productId,
    })

    const { data: stores = [] } = useQuery({
      queryKey: ['stores'],
      queryFn: () => storesApi.list(false),
    })

    const createMutation = useMutation({
      mutationFn: (data: { store_id: number; selling_price: number }) => {
        return storeProductPricesApi.create({
          store_id: data.store_id,
          product_id: Number(productId),
          selling_price: data.selling_price,
        })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['store-prices', productId] })
        setIsModalOpen(false)
        setSelectedStoreId(null)
        setPrice('')
        toast.success(t('inventory.createSuccess') || 'Price added successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to add price')
      },
    })

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: number; data: { selling_price: number } }) => {
        return storeProductPricesApi.update(id, data)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['store-prices', productId] })
        setIsModalOpen(false)
        setEditingPrice(null)
        setSelectedStoreId(null)
        setPrice('')
        toast.success(t('inventory.updateSuccess') || 'Price updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update price')
      },
    })

    const deleteMutation = useMutation({
      mutationFn: (id: number) => storeProductPricesApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['store-prices', productId] })
        toast.success(t('inventory.deleteSuccess') || 'Price removed successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || t('inventory.deleteError') || 'Failed to remove price')
      },
    })

    const handleAdd = () => {
      setEditingPrice(null)
      setSelectedStoreId(null)
      setPrice('')
      setIsModalOpen(true)
    }

    const handleEdit = (storePrice: StoreProductPrice) => {
      setEditingPrice(storePrice)
      setSelectedStoreId(storePrice.store_id)
      setPrice(String(storePrice.selling_price))
      setIsModalOpen(true)
    }

    const handleDelete = async (storePrice: StoreProductPrice) => {
      const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete price for "{{name}}"?').replace('{{name}}', storePrice.store_name || '')
      const result = await messageBox.ask(message, undefined, 'YesNo')
      if (result.value === true) {
        deleteMutation.mutate(storePrice.id)
      }
    }

    const handleSubmit = () => {
      if (!selectedStoreId || !price) {
        toast.error(t('common.required') || 'Please fill all required fields')
        return
      }

      if (editingPrice) {
        updateMutation.mutate({
          id: editingPrice.id,
          data: { selling_price: parseFloat(price) },
        })
      } else {
        createMutation.mutate({
          store_id: selectedStoreId,
          selling_price: parseFloat(price),
        })
      }
    }

    const defaultPrice = watch('selling_price')

    const columns: DataGridColumn<StoreProductPrice>[] = [
      { id: 'store_name', headerName: t('stores.store') || 'Store', field: 'store_name', sortable: true },
      {
        id: 'selling_price',
        headerName: t('inventory.sellingPrice') || 'Selling Price',
        field: 'selling_price',
        sortable: true,
        type: 'money',
        cellRendererOptions: {
          prefix: t('common.currencySymbol'),
          decPlaces: moneyDecimalPlaces,
        },
      },
      {
        id: 'actions',
        headerName: t('common.actions') || 'Actions',
        cellRenderer: ({ row }) => (
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(row)}
              className="p-1 rounded hover:bg-gray-100"
              title={t('common.edit') || 'Edit'}
              style={{ color: 'var(--color-primary-500)' }}
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(row)}
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('inventory.defaultPrice') || 'Default Price'}
            </label>
            <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t('common.currencySymbol')}{defaultPrice || '0.00'}
            </div>
          </div>
          <Button type="button" onClick={handleAdd} size="sm">
            <FaPlus className="mr-2" />
            {t('inventory.addPrice') || 'Add Price'}
          </Button>
        </div>
        <DataGrid
          data={storePrices}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('inventory.noProducts') || 'No store prices found'}
          compact={true}
        />
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  {editingPrice ? t('common.edit') : t('inventory.addPrice')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {t('stores.store') || 'Store'} *
                    </label>
                    <select
                      value={selectedStoreId || ''}
                      onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border-default)' }}
                      disabled={!!editingPrice}
                    >
                      <option value="">{t('common.select') || 'Select...'}</option>
                      {stores.filter(s => !storePrices.some(sp => sp.store_id === s.id && sp.id !== editingPrice?.id)).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {t('inventory.sellingPrice') || 'Selling Price'} *
                    </label>
                    <input
                      type="number"
                      step={1 / Math.pow(10, moneyDecimalPlaces)}
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border-default)' }}
                      placeholder={`0.${'0'.repeat(moneyDecimalPlaces)}`}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingPrice ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const tabs: Tab[] = [
    {
      id: 'general',
      label: t('inventory.general') || 'General',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.productCode') || 'Code'}
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
                {t('inventory.productType') || 'Product Type'} *
              </label>
              <select
                {...register('product_type', { required: true })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                <option value="sales_inventory">{t('inventory.productTypeSalesInventory') || 'Sales Inventory'}</option>
                <option value="prepared">{t('inventory.productTypePrepared') || 'Prepared'}</option>
                <option value="kit">{t('inventory.productTypeKit') || 'Kit'}</option>
                <option value="service">{t('inventory.productTypeService') || 'Service'}</option>
                <option value="misc_charges">{t('inventory.productTypeMiscCharges') || 'Misc Charges'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.sellingPrice') || 'Selling Price'} *
              </label>
              <input
                type="number"
                step={1 / Math.pow(10, moneyDecimalPlaces)}
                min="0"
                {...register('selling_price', {
                  required: true,
                  setValueAs: (v) => v === '' ? null : v
                })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
                placeholder={`0.${'0'.repeat(moneyDecimalPlaces)}`}
              />
              {errors.selling_price && (
                <p className="text-red-500 text-xs mt-1">{t('common.required') || 'Required'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.isActive') || 'Active'}
              </span>
            </label>
          </div>
        </div>
      ),
    },
  ]

  // Add ingredients tab only for prepared products in edit mode
  if (isEditMode && productType === 'prepared') {
    tabs.push({
      id: 'ingredients',
      label: t('inventory.ingredients') || 'Ingredients',
      content: <IngredientsTab />,
    })
  }

  // Add components tab only for kit products in edit mode
  if (isEditMode && productType === 'kit') {
    tabs.push({
      id: 'components',
      label: t('inventory.components') || 'Components',
      content: <ComponentsTab />,
    })
  }

  // Add groups tab only in edit mode
  if (isEditMode) {
    tabs.push({
      id: 'groups',
      label: t('inventory.groups') || 'Groups',
      content: <GroupsTab />,
    })
  }

  // Add prices tab only in edit mode
  if (isEditMode) {
    tabs.push({
      id: 'prices',
      label: t('inventory.prices') || 'Prices',
      content: <PricesTab />,
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <input
            type="text"
            {...register('name', { required: true })}
            className="text-2xl font-bold w-full px-2 py-1 border-b-2 bg-transparent"
            style={{ 
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border-default)'
            }}
            placeholder={t('inventory.productName') || 'Product Name'}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{t('common.nameRequired')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="product-form"
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

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
          <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs tabs={tabs} defaultTab="general" />
          </form>
        </div>
      </div>
    </div>
  )
}
