/**
 * Application updates management page.
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import {
  listApplicationVersions,
  createApplicationVersion,
  updateApplicationVersion,
  notifyUpdate,
  type ApplicationVersion,
  type ApplicationVersionCreate,
  type ApplicationVersionUpdate,
} from '@/api/updates'
import { UpdateForm } from '@/components/updates/UpdateForm'
import { UpdateNotificationDialog } from '@/components/updates/UpdateNotificationDialog'
import { Button, AdvancedDataGrid, AdvancedDataGridColumn } from '@sofiapos/ui'
import { FaPlus, FaBell, FaEdit } from 'react-icons/fa'
import { formatDateTime } from '@sofiapos/shared/utils'

export function UpdateList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<ApplicationVersion | null>(null)
  const [notifyVersion, setNotifyVersion] = useState<ApplicationVersion | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [activeOnly, setActiveOnly] = useState(true)

  // Fetch application versions
  const { data: versions = [], isLoading, error } = useQuery({
    queryKey: ['application-versions', platformFilter, activeOnly],
    queryFn: () => listApplicationVersions(),
  })

  // Filter versions
  const filteredVersions = useMemo(() => {
    let filtered = versions

    if (platformFilter) {
      filtered = filtered.filter((v) => v.platform === platformFilter)
    }

    if (activeOnly) {
      filtered = filtered.filter((v) => v.is_active)
    }

    return filtered.sort((a, b) => {
      // Sort by release date descending (newest first)
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    })
  }, [versions, platformFilter, activeOnly])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ApplicationVersionCreate) => createApplicationVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-versions'] })
      toast.success(t('updates.createSuccess') || 'Version created successfully')
      setIsFormOpen(false)
      setEditingVersion(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('updates.createError') || 'Failed to create version')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationVersionUpdate }) =>
      updateApplicationVersion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-versions'] })
      toast.success(t('updates.updateSuccess') || 'Version updated successfully')
      setIsFormOpen(false)
      setEditingVersion(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('updates.updateError') || 'Failed to update version')
    },
  })

  // Notify mutation
  const notifyMutation = useMutation({
    mutationFn: (data: { version_id: number; notify_all: boolean; cash_register_ids?: number[] }) =>
      notifyUpdate(data),
    onSuccess: () => {
      toast.success(t('updates.notifySuccess') || 'Update notification sent successfully')
      setNotifyVersion(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('updates.notifyError') || 'Failed to send notification')
    },
  })

  const handleCreate = () => {
    setEditingVersion(null)
    setIsFormOpen(true)
  }

  const handleEdit = (version: ApplicationVersion) => {
    setEditingVersion(version)
    setIsFormOpen(true)
  }

  const handleNotify = (version: ApplicationVersion) => {
    setNotifyVersion(version)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingVersion(null)
  }

  const handleFormSubmit = (data: ApplicationVersionCreate | ApplicationVersionUpdate) => {
    if (editingVersion) {
      updateMutation.mutate({ id: editingVersion.id, data: data as ApplicationVersionUpdate })
    } else {
      createMutation.mutate(data as ApplicationVersionCreate)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getPlatformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
      win32: 'Windows',
      darwin: 'macOS',
      linux: 'Linux',
    }
    return labels[platform] || platform
  }

  // Define columns for AdvancedDataGrid
  const columns: AdvancedDataGridColumn[] = [
    {
      field: 'version',
      headerName: t('updates.version') || 'Version',
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {params.value}
          </span>
          {params.data.is_mandatory && (
            <span
              className="px-2 py-0.5 text-xs rounded font-medium"
              style={{
                backgroundColor: 'var(--color-error-100, #FEE2E2)',
                color: 'var(--color-error-800, #991B1B)',
              }}
            >
              {t('updates.mandatory') || 'Mandatory'}
            </span>
          )}
        </div>
      ),
    },
    {
      field: 'platform',
      headerName: t('updates.platform') || 'Platform',
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>{getPlatformLabel(params.value)}</span>
      ),
    },
    {
      field: 'release_date',
      headerName: t('updates.releaseDate') || 'Release Date',
      sortable: true,
      cellRenderer: (params: any) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {formatDateTime(params.value, {
            locale: 'en-US',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      field: 'file_size',
      headerName: t('updates.fileSize') || 'File Size',
      sortable: true,
      cellRenderer: (params: any) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>{formatFileSize(params.value)}</span>
      ),
    },
    {
      field: 'is_active',
      headerName: t('updates.status') || 'Status',
      sortable: true,
      cellRenderer: (params: any) => (
        <span
          className={`px-2 py-0.5 text-xs rounded ${
            params.value
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {params.value ? (t('updates.active') || 'Active') : (t('updates.inactive') || 'Inactive')}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(params.data)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={t('common.edit') || 'Edit'}
            style={{ color: 'var(--color-primary-600)' }}
          >
            <FaEdit />
          </button>
          {params.data.is_active && (
            <button
              onClick={() => handleNotify(params.data)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title={t('updates.notify') || 'Notify Clients'}
              style={{ color: 'var(--color-primary-600)' }}
            >
              <FaBell />
            </button>
          )}
        </div>
      ),
    },
  ]

  console.log('UPDATE LIST COLUMNS', columns)

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {t('updates.loadError') || 'Failed to load application versions'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 pb-0">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('updates.title') || 'Application Updates'}
        </h1>
        <Button onClick={handleCreate} variant="primary">
          <FaPlus className="mr-2" />
          {t('updates.create') || 'Create Version'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {t('updates.platform') || 'Platform'}
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
                color: 'var(--color-text-primary, #111827)',
                borderColor: 'var(--color-border-default, #E5E7EB)',
              }}
            >
              <option value="">{t('common.all') || 'All'}</option>
              <option value="win32">Windows</option>
              <option value="darwin">macOS</option>
              <option value="linux">Linux</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {t('updates.activeOnly') || 'Active only'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg shadow">
        <AdvancedDataGrid
          rowData={filteredVersions}
          columnDefs={columns}
          loading={isLoading}
          paginationPageSize={20}
        />
      </div>

      {/* Form Dialog */}
      {isFormOpen && (
        <UpdateForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          editingVersion={editingVersion}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Notification Dialog */}
      {notifyVersion && (
        <UpdateNotificationDialog
          isOpen={!!notifyVersion}
          onClose={() => setNotifyVersion(null)}
          version={notifyVersion}
          onNotify={(notifyAll, cashRegisterIds) => {
            notifyMutation.mutate({
              version_id: notifyVersion.id,
              notify_all: notifyAll,
              cash_register_ids: cashRegisterIds,
            })
          }}
          isSubmitting={notifyMutation.isPending}
        />
      )}
    </div>
  )
}

