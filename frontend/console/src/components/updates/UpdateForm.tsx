/**
 * Update version form component.
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@/i18n/hooks'
import { Modal, Button, Input } from '@sofiapos/ui'
import type { ApplicationVersion, ApplicationVersionCreate, ApplicationVersionUpdate } from '@/api/updates'

interface UpdateFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ApplicationVersionCreate | ApplicationVersionUpdate) => void
  editingVersion: ApplicationVersion | null
  isSubmitting: boolean
}

export function UpdateForm({
  isOpen,
  onClose,
  onSubmit,
  editingVersion,
  isSubmitting,
}: UpdateFormProps) {
  const { t } = useTranslation()
  const isEditMode = !!editingVersion

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationVersionCreate>({
    defaultValues: {
      version: '',
      platform: 'win32',
      is_mandatory: false,
      release_notes: '',
      download_url: '',
      file_size: undefined,
      checksum: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (editingVersion) {
      reset({
        version: editingVersion.version,
        platform: editingVersion.platform,
        is_mandatory: editingVersion.is_mandatory,
        release_notes: editingVersion.release_notes || '',
        download_url: editingVersion.download_url,
        file_size: editingVersion.file_size,
        checksum: editingVersion.checksum || '',
        is_active: editingVersion.is_active,
      })
    } else {
      reset({
        version: '',
        platform: 'win32',
        is_mandatory: false,
        release_notes: '',
        download_url: '',
        file_size: undefined,
        checksum: '',
        is_active: true,
      })
    }
  }, [editingVersion, reset])

  const onSubmitForm = (data: ApplicationVersionCreate) => {
    // Convert file_size to number if provided
    const submitData = {
      ...data,
      file_size: data.file_size ? Number(data.file_size) : undefined,
    }
    onSubmit(submitData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? (t('updates.editVersion') || 'Edit Version') : (t('updates.createVersion') || 'Create Version')}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('updates.version') || 'Version'}
            {...register('version', {
              required: t('updates.versionRequired') || 'Version is required',
              pattern: {
                value: /^\d+\.\d+\.\d+$/,
                message: t('updates.versionFormat') || 'Version must be in format X.Y.Z (e.g., 1.0.0)',
              },
            })}
            error={errors.version?.message}
            disabled={isEditMode}
            placeholder="1.0.0"
          />

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('updates.platform') || 'Platform'}
            </label>
            <select
              {...register('platform', { required: true })}
              disabled={isEditMode}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
                color: 'var(--color-text-primary, #111827)',
                borderColor: errors.platform ? 'var(--color-error-500)' : 'var(--color-border-default, #E5E7EB)',
              }}
            >
              <option value="win32">Windows</option>
              <option value="darwin">macOS</option>
              <option value="linux">Linux</option>
            </select>
          </div>
        </div>

        <Input
          label={t('updates.downloadUrl') || 'Download URL'}
          {...register('download_url', {
            required: t('updates.downloadUrlRequired') || 'Download URL is required',
            pattern: {
              value: /^https?:\/\/.+/,
              message: t('updates.downloadUrlFormat') || 'Must be a valid HTTP/HTTPS URL',
            },
          })}
          error={errors.download_url?.message}
          placeholder="https://updates.sofiapos.com/win32/SofiaPOS-1.0.0-x64.exe"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('updates.fileSize') || 'File Size (bytes)'}
            type="number"
            {...register('file_size', {
              min: { value: 0, message: t('updates.fileSizeMin') || 'File size must be positive' },
            })}
            error={errors.file_size?.message}
            placeholder="12345678"
          />

          <Input
            label={t('updates.checksum') || 'Checksum (SHA-256)'}
            {...register('checksum')}
            error={errors.checksum?.message}
            placeholder="abc123..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {t('updates.releaseNotes') || 'Release Notes'}
          </label>
          <textarea
            {...register('release_notes')}
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
              color: 'var(--color-text-primary, #111827)',
              borderColor: 'var(--color-border-default, #E5E7EB)',
            }}
            placeholder={t('updates.releaseNotesPlaceholder') || 'Enter release notes...'}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_mandatory')}
              className="w-4 h-4"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {t('updates.mandatory') || 'Mandatory Update'}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_active')}
              className="w-4 h-4"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {t('updates.active') || 'Active'}
            </span>
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? t('common.loading') || 'Loading...'
              : isEditMode
              ? t('common.update') || 'Update'
              : t('common.create') || 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

