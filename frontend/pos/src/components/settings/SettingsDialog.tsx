/**
 * Settings Dialog component for configuring application settings.
 * Initially supports Cash Drawer configuration.
 */
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { getCashDrawerConfig, saveCashDrawerConfig, listSerialPorts, type CashDrawerConfig } from '@/services/cashDrawer'
import { useUpdate } from '@/contexts/UpdateContext'
import { toast } from 'react-toastify'
import { FaSync, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const { status, updateInfo, downloadProgress, error, checkForUpdates, currentVersion, isElectron } = useUpdate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPorts, setIsLoadingPorts] = useState(false)
  const [availablePorts, setAvailablePorts] = useState<Array<{ path: string; manufacturer?: string }>>([])
  const [config, setConfig] = useState<CashDrawerConfig>({
    device_name: '',
    port_path: '',
    baud_rate: 9600,
    is_active: true,
  })
  const [activeTab, setActiveTab] = useState<'cashDrawer' | 'updates'>('cashDrawer')

  // Load existing config and available ports when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadConfig()
      loadAvailablePorts()
    }
  }, [isOpen])

  const loadConfig = async () => {
    try {
      const existingConfig = await getCashDrawerConfig()
      if (existingConfig) {
        setConfig(existingConfig)
      } else {
        // Reset to defaults if no config exists
        setConfig({
          device_name: '',
          port_path: '',
          baud_rate: 9600,
          is_active: true,
        })
      }
    } catch (error) {
      console.error('Failed to load cash drawer config:', error)
      toast.error(t('settings.loadConfigError') || 'Failed to load configuration')
    }
  }

  const loadAvailablePorts = async () => {
    setIsLoadingPorts(true)
    try {
      const ports = await listSerialPorts()
      setAvailablePorts(ports)
    } catch (error) {
      console.error('Failed to list serial ports:', error)
      toast.error(t('settings.loadPortsError') || 'Failed to load available ports')
    } finally {
      setIsLoadingPorts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!config.device_name.trim()) {
        toast.error(t('settings.deviceNameRequired') || 'Device name is required')
        setIsLoading(false)
        return
      }

      if (!config.port_path.trim()) {
        toast.error(t('settings.portPathRequired') || 'Port path is required')
        setIsLoading(false)
        return
      }

      if (!config.baud_rate || config.baud_rate <= 0) {
        toast.error(t('settings.baudRateRequired') || 'Baud rate must be greater than 0')
        setIsLoading(false)
        return
      }

      await saveCashDrawerConfig(config)
      toast.success(t('settings.saveSuccess') || 'Settings saved successfully')
      onClose()
    } catch (error) {
      console.error('Failed to save cash drawer config:', error)
      toast.error(t('settings.saveError') || 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleCheckForUpdates = async () => {
    await checkForUpdates()
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('settings.title') || 'Settings'}
      size="md"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <button
            onClick={() => setActiveTab('cashDrawer')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'cashDrawer'
                ? 'border-b-2'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'cashDrawer' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              borderBottomColor: activeTab === 'cashDrawer' ? 'var(--color-primary-600)' : 'transparent',
            }}
          >
            {t('settings.cashDrawer.title') || 'Cash Drawer'}
          </button>
          {isElectron && (
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'updates'
                  ? 'border-b-2'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                color: activeTab === 'updates' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
                borderBottomColor: activeTab === 'updates' ? 'var(--color-primary-600)' : 'transparent',
              }}
            >
              {t('settings.updates.title') || 'Updates'}
            </button>
          )}
        </div>

        {/* Cash Drawer Tab */}
        {activeTab === 'cashDrawer' && (
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {t('settings.cashDrawer.title') || 'Cash Drawer Configuration'}
            </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('settings.cashDrawer.deviceName') || 'Device Name'}
              type="text"
              value={config.device_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, device_name: e.target.value })}
              required
              disabled={isLoading}
              placeholder={t('settings.cashDrawer.deviceNamePlaceholder') || 'e.g., Epson TM-T20'}
            />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {t('settings.cashDrawer.portPath') || 'Port Path'}
              </label>
              <div className="flex gap-2">
                <select
                  value={config.port_path}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConfig({ ...config, port_path: e.target.value })}
                  disabled={isLoading || isLoadingPorts}
                  required
                  className="flex-1 px-3 py-2 border rounded"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-default)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">{t('settings.cashDrawer.selectPort') || 'Select a port...'}</option>
                  {availablePorts.map((port) => (
                    <option key={port.path} value={port.path}>
                      {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadAvailablePorts}
                  disabled={isLoading || isLoadingPorts}
                  size="sm"
                >
                  {isLoadingPorts ? (t('common.loading') || 'Loading...') : (t('settings.cashDrawer.refreshPorts') || 'Refresh')}
                </Button>
              </div>
              {availablePorts.length === 0 && !isLoadingPorts && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('settings.cashDrawer.noPortsAvailable') || 'No serial ports available. Make sure your device is connected.'}
                </p>
              )}
            </div>

            <Input
              label={t('settings.cashDrawer.baudRate') || 'Baud Rate'}
              type="number"
              value={config.baud_rate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, baud_rate: parseInt(e.target.value) || 9600 })}
              required
              disabled={isLoading}
              min="1"
              placeholder="9600"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={config.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, is_active: e.target.checked })}
                disabled={isLoading}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {t('settings.cashDrawer.isActive') || 'Active'}
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !config.device_name.trim() || !config.port_path.trim()}
              >
                {isLoading ? (t('common.loading') || 'Loading...') : (t('common.save') || 'Save')}
              </Button>
            </div>
          </form>
        </div>
        )}

        {/* Updates Tab */}
        {activeTab === 'updates' && isElectron && (
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {t('settings.updates.title') || 'Application Updates'}
            </h3>

            <div className="space-y-4">
              {/* Current Version */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('settings.updates.currentVersion') || 'Current Version'}:
                </p>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {currentVersion || 'Unknown'}
                </p>
              </div>

              {/* Update Status */}
              {status === 'checking' && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-info-50, #EFF6FF)' }}>
                  <FaSync className="animate-spin" style={{ color: 'var(--color-info-600)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-info-800)' }}>
                    {t('settings.updates.checking') || 'Checking for updates...'}
                  </p>
                </div>
              )}

              {status === 'available' && updateInfo && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-50, #F0FDF4)', border: '1px solid var(--color-success-200, #BBF7D0)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaCheckCircle style={{ color: 'var(--color-success-600)' }} />
                    <p className="font-medium" style={{ color: 'var(--color-success-800)' }}>
                      {t('settings.updates.updateAvailable') || 'Update Available'}
                    </p>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-success-800)' }}>
                    {t('settings.updates.version') || 'Version'} {updateInfo.version}
                  </p>
                  {updateInfo.releaseNotes && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer" style={{ color: 'var(--color-success-800)' }}>
                        {t('settings.updates.releaseNotes') || 'Release Notes'}
                      </summary>
                      <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: 'var(--color-success-700)' }}>
                        {updateInfo.releaseNotes}
                      </p>
                    </details>
                  )}
                </div>
              )}

              {status === 'not-available' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('settings.updates.upToDate') || 'You are running the latest version.'}
                  </p>
                </div>
              )}

              {status === 'downloading' && downloadProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {t('settings.updates.downloading') || 'Downloading'}...
                    </span>
                    <span style={{ color: 'var(--color-text-primary)' }}>
                      {downloadProgress.percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${downloadProgress.percent}%`,
                        backgroundColor: 'var(--color-primary-600, #2563EB)',
                      }}
                    />
                  </div>
                </div>
              )}

              {status === 'downloaded' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-success-50, #F0FDF4)', border: '1px solid var(--color-success-200, #BBF7D0)' }}>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle style={{ color: 'var(--color-success-600)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-success-800)' }}>
                      {t('settings.updates.downloaded') || 'Update downloaded. Ready to install.'}
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && error && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-error-50, #FEF2F2)', border: '1px solid var(--color-error-200, #FECACA)' }}>
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle style={{ color: 'var(--color-error-600)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-error-800)' }}>
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Check for Updates Button */}
              <Button
                variant="primary"
                onClick={handleCheckForUpdates}
                disabled={status === 'checking' || status === 'downloading'}
                className="w-full"
              >
                <FaSync className={status === 'checking' ? 'animate-spin mr-2' : 'mr-2'} />
                {status === 'checking'
                  ? t('settings.updates.checking') || 'Checking...'
                  : t('settings.updates.checkForUpdates') || 'Check for Updates'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

