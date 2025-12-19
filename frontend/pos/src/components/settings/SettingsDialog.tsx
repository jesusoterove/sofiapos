/**
 * Settings Dialog component for configuring application settings.
 * Initially supports Cash Drawer configuration.
 */
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { getCashDrawerConfig, saveCashDrawerConfig, listSerialPorts, type CashDrawerConfig } from '@/services/cashDrawer'
import { toast } from 'react-toastify'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPorts, setIsLoadingPorts] = useState(false)
  const [availablePorts, setAvailablePorts] = useState<Array<{ path: string; manufacturer?: string }>>([])
  const [config, setConfig] = useState<CashDrawerConfig>({
    device_name: '',
    port_path: '',
    baud_rate: 9600,
    is_active: true,
  })

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('settings.title') || 'Settings'}
      size="md"
    >
      <div className="space-y-4">
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
      </div>
    </Modal>
  )
}

