/**
 * Images Tab component for ProductForm.
 * Manages product images with web-friendly restrictions.
 */
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productImagesApi, ProductImage } from '@/api/productImages'
import { Button, messageBox } from '@sofiapos/ui'
import { FaTrash, FaPlus, FaStar, FaImage } from 'react-icons/fa'
import apiClient from '@/api/client'

interface ImagesTabProps {
  productId: string | undefined
  isEditMode: boolean
}

// Web-friendly image restrictions
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ImagesTab({ productId, isEditMode }: ImagesTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => productImagesApi.list(Number(productId)),
    enabled: isEditMode && !!productId,
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnMount: true,
  })

  const createMutation = useMutation({
    mutationFn: (data: { product_id: number; file: File; is_primary?: boolean; display_order?: number }) => {
      return productImagesApi.create(data)
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure the image appears immediately
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      queryClient.refetchQueries({ queryKey: ['product-images', productId] })
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast.success(t('inventory.imageUploadSuccess') || 'Image uploaded successfully')
    },
    onError: (error: any) => {
      setUploading(false)
      const errorMessage = error.response?.data?.detail || error.message || t('inventory.imageUploadError') || 'Failed to upload image'
      toast.error(errorMessage)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { is_primary?: boolean; display_order?: number } }) => {
      return productImagesApi.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast.success(t('inventory.imageUpdateSuccess') || 'Image updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.imageUpdateError') || 'Failed to update image')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productImagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      toast.success(t('inventory.imageDeleteSuccess') || 'Image deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.imageDeleteError') || 'Failed to delete image')
    },
  })

  const validateImage = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return t('inventory.invalidImageType') || `Invalid file type. Allowed types: JPG, PNG, WEBP`
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return t('inventory.imageTooLarge') || `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }

    return null
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate image
    const error = validateImage(file)
    if (error) {
      toast.error(error)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    if (!productId) {
      toast.error(t('inventory.productIdRequired') || 'Product ID is required')
      return
    }

    setUploading(true)
    createMutation.mutate({
      product_id: Number(productId),
      file,
      is_primary: images.length === 0, // Set as primary if it's the first image
      display_order: images.length,
    })
  }

  const handleSetPrimary = (image: ProductImage) => {
    if (image.is_primary) return

    updateMutation.mutate({
      id: image.id,
      data: { is_primary: true },
    })
  }

  const handleDelete = async (image: ProductImage) => {
    const message = t('inventory.deleteImageConfirm') || 'Are you sure you want to delete this image?'
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(image.id)
    }
  }

  const getImageUrl = (image: ProductImage): string => {
    // Use API endpoint instead of static file URL
    // Format: /api/v1/products/{product_id}/images?size={size}
    // No size parameter means original image
    const baseURL = apiClient.defaults.baseURL || ''
    const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    return `${cleanBaseURL}/api/v1/products/${image.product_id}/images`
  }

  if (!isEditMode) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
        {t('inventory.saveProductFirst') || 'Please save the product first to add images'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div>
        <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
          {t('inventory.uploadImage') || 'Upload Image'}
        </label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading || createMutation.isPending}
            className="hidden"
            id="image-upload-input"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || createMutation.isPending}
            className="flex items-center gap-2"
          >
            <FaPlus />
            {uploading || createMutation.isPending
              ? (t('inventory.uploading') || 'Uploading...')
              : (t('inventory.selectImage') || 'Select Image')}
          </Button>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {t('inventory.imageRestrictions') || 'JPG, PNG, WEBP (max 5MB)'}
          </span>
        </div>
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          {t('common.loading') || 'Loading...'}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          {t('inventory.noImages') || 'No images uploaded yet'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative border rounded-lg overflow-hidden group"
              style={{
                borderColor: 'var(--color-border-default)',
                backgroundColor: 'var(--color-bg-paper)',
              }}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {image.image_url ? (
                  <img
                    key={`img-${image.id}-${image.image_url}`}
                    src={getImageUrl(image)}
                    alt={`Product image ${image.id}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      console.log('IMAGE ERROR', e);
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent && !parent.querySelector('.image-error-fallback')) {
                        const fallback = document.createElement('div')
                        fallback.className = 'image-error-fallback flex items-center justify-center h-full w-full'
                        const icon = document.createElement('div')
                        icon.innerHTML = '<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20" style="color: var(--color-text-secondary)"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>'
                        fallback.appendChild(icon)
                        parent.appendChild(fallback)
                      }
                    }}
                  />
                ) : (
                  <FaImage className="text-4xl" style={{ color: 'var(--color-text-secondary)' }} />
                )}
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!image.is_primary && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetPrimary(image)}
                    title={t('inventory.setAsPrimary') || 'Set as Primary'}
                    className="flex items-center gap-1"
                  >
                    <FaStar />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(image)}
                  title={t('common.delete') || 'Delete'}
                  className="flex items-center gap-1"
                >
                  <FaTrash />
                </Button>
              </div>

              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <FaStar />
                  {t('inventory.primary') || 'Primary'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

