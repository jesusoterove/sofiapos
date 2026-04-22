/**
 * Settings Dialog component for configuring application settings.
 * Initially supports Cash Drawer configuration.
 */
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import {
  getCashDrawerConfig,
  saveCashDrawerConfig,
  testPrint,
  listSerialPorts,
  listPrinters,
  type CashDrawerConfig,
  type CashDrawerConnectionType,
} from '@/services/cashDrawer'
import { useUpdate } from '@/contexts/UpdateContext'
import { useShiftContext } from '@/contexts/ShiftContext'
import apiClient from '@/api/client'
import { getRegistration, saveRegistration } from '@/utils/registration'
import { toast } from 'react-toastify'
import { FaSync, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface StoreOption {
  id: number
  name: string
  code: string
  is_active: boolean
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const { status, updateInfo, downloadProgress, error, checkForUpdates, currentVersion, isElectron } = useUpdate()
  const { hasOpenShift, isLoading: isShiftLoading } = useShiftContext()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isLoadingPorts, setIsLoadingPorts] = useState(false)
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [availablePorts, setAvailablePorts] = useState<
    Array<{ path: string; manufacturer?: string; vendorId?: string; productId?: string; serialNumber?: string }>
  >([])
  const [availablePrinters, setAvailablePrinters] = useState<
    Array<{ name: string; displayName: string; description: string; status: number }>
  >([])
  const [availableStores, setAvailableStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('')
  const [currentStoreName, setCurrentStoreName] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false)
  const [useCustomPort, setUseCustomPort] = useState(false)
  const [config, setConfig] = useState<CashDrawerConfig>({
    device_name: '',
    connection_type: 'printer',
    printer_name: '',
    port_path: '',
    baud_rate: 9600,
    is_active: true,
    print_receipt_enabled: false,
  })
  const [initialConfig, setInitialConfig] = useState<CashDrawerConfig | null>(null)
  const [activeTab, setActiveTab] = useState<'cashDrawer' | 'targetStore' | 'updates'>('cashDrawer')

  // Load existing config and available devices when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadConfig()
      loadAvailablePrinters()
      loadAvailablePorts()
      loadTargetStoreConfig()
      loadAvailableStores()
    }
  }, [isOpen])

  // When loaded config has a port not in the list (e.g. virtual printer), switch to custom mode
  useEffect(() => {
    if (isOpen && config.port_path && availablePorts.length > 0 && !availablePorts.some((p) => p.path === config.port_path)) {
      setUseCustomPort(true)
    }
  }, [isOpen, config.port_path, availablePorts])

  const loadConfig = async () => {
    try {
      const existingConfig = await getCashDrawerConfig()
      if (existingConfig) {
        // Migrate legacy configs: port_path without connection_type -> serial
        const migrated: CashDrawerConfig = {
          ...existingConfig,
          connection_type:
            existingConfig.connection_type ??
            (existingConfig.port_path ? ('serial' as CashDrawerConnectionType) : ('printer' as CashDrawerConnectionType)),
        }
        setConfig(migrated)
        setInitialConfig(migrated)
        setUseCustomPort(false)
      } else {
        const defaults = {
          device_name: '',
          connection_type: 'printer' as CashDrawerConnectionType,
          printer_name: '',
          port_path: '',
          baud_rate: 9600,
          is_active: true,
          print_receipt_enabled: false,
        }
        setConfig(defaults)
        setInitialConfig(null)
      }
    } catch (error) {
      console.error('Failed to load cash drawer config:', error)
      toast.error(t('settings.loadConfigError') || 'Failed to load configuration')
    }
  }

  const loadAvailablePrinters = async () => {
    if (!isElectron) return
    setIsLoadingPrinters(true)
    try {
      const printers = await listPrinters()
      setAvailablePrinters(printers)
    } catch (error) {
      console.error('Failed to list printers:', error)
      toast.error(t('settings.loadPrintersError') || 'Failed to load available printers')
    } finally {
      setIsLoadingPrinters(false)
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

  const loadTargetStoreConfig = () => {
    const registration = getRegistration()
    if (!registration) {
      setSelectedStoreId('')
      setCurrentStoreName('')
      return
    }

    setSelectedStoreId(registration.storeId)
    setCurrentStoreName(registration.storeName || `Store #${registration.storeId}`)
    setAdminUsername('')
    setAdminPassword('')
  }

  const loadAvailableStores = async () => {
    setIsLoadingStores(true)
    try {
      const response = await apiClient.get('/api/v1/stores?active_only=true')
      setAvailableStores(response.data || [])
    } catch (error) {
      console.error('Failed to load stores:', error)
      toast.error(t('settings.targetStore.loadError') || 'Failed to load available stores')
    } finally {
      setIsLoadingStores(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (config.connection_type === 'printer') {
        if (!config.printer_name?.trim()) {
          toast.error(t('settings.cashDrawer.printerRequired') || 'Please select a printer.')
          setIsLoading(false)
          return
        }
        await saveCashDrawerConfig({
          ...config,
          device_name: config.device_name || config.printer_name || 'Cash Drawer',
          printer_name: config.printer_name.trim(),
          port_path: undefined,
          print_receipt_enabled: config.print_receipt_enabled ?? false,
        })
      } else {
        const portPath = (config.port_path ?? '').trim()
        if (!portPath) {
          toast.error(t('settings.portPathRequired') || 'Port path is required')
          setIsLoading(false)
          return
        }
        if (!config.baud_rate || config.baud_rate <= 0) {
          toast.error(t('settings.baudRateRequired') || 'Baud rate must be greater than 0')
          setIsLoading(false)
          return
        }
        await saveCashDrawerConfig({
          ...config,
          device_name: config.device_name || config.port_path || 'Cash Drawer',
          port_path: portPath,
          printer_name: undefined,
          print_receipt_enabled: false,
        })
      }

      toast.success(t('settings.saveSuccess') || 'Settings saved successfully')
      onClose()
    } catch (error) {
      console.error('Failed to save cash drawer config:', error)
      toast.error(t('settings.saveError') || 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const isConfigValid = !!(
    config.connection_type === 'printer' ? config.printer_name?.trim() : (config.port_path ?? '').trim()
  )

  const hasChanges =
    !initialConfig ||
    config.connection_type !== initialConfig.connection_type ||
    config.printer_name !== (initialConfig.printer_name ?? '') ||
    config.port_path !== (initialConfig.port_path ?? '') ||
    config.baud_rate !== initialConfig.baud_rate ||
    config.is_active !== initialConfig.is_active ||
    (config.print_receipt_enabled ?? false) !== (initialConfig.print_receipt_enabled ?? false)

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleCheckForUpdates = async () => {
    await checkForUpdates()
  }

  const handlePrintTest = async () => {
    if (!isConfigValid) return
    setIsTesting(true)
    try {
      const testConfig: CashDrawerConfig = {
        ...config,
        device_name: config.device_name || 'Cash Drawer',
        port_path: config.connection_type === 'serial' ? (config.port_path ?? '').trim() : undefined,
        printer_name: config.connection_type === 'printer' ? config.printer_name?.trim() : undefined,
      }
      await testPrint(testConfig)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveTargetStore = async () => {
    if (isShiftLoading || isVerifyingAdmin) return

    if (hasOpenShift) {
      toast.error(t('settings.targetStore.openShiftError') || 'Cannot change target store while a shift is open')
      return
    }

    if (selectedStoreId === '') {
      toast.error(t('settings.targetStore.required') || 'Please select a target store')
      return
    }

    const registration = getRegistration()
    if (!registration) {
      toast.error(t('settings.targetStore.registrationRequired') || 'Registration data not found')
      return
    }

    const selectedStore = availableStores.find((store) => store.id === selectedStoreId)
    if (!selectedStore) {
      toast.error(t('settings.targetStore.invalidSelection') || 'Selected store is not available')
      return
    }

    if (registration.storeId === selectedStore.id) {
      toast.info(t('settings.targetStore.noChanges') || 'Target store is already selected')
      return
    }

    if (!adminUsername.trim() || !adminPassword.trim()) {
      toast.error(t('settings.targetStore.adminCredentialsRequired') || 'Admin username and password are required')
      return
    }

    setIsVerifyingAdmin(true)
    try {
      const formData = new FormData()
      formData.append('username', adminUsername.trim())
      formData.append('password', adminPassword)

      const response = await apiClient.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        metadata: {
          skipAuthToken: true,
          skipTokenRefresh: true,
        },
      } as any)

      const adminUser = response?.data?.user
      if (!adminUser?.is_superuser) {
        toast.error(t('settings.targetStore.adminRequired') || 'Only an admin can change the store')
        return
      }

      saveRegistration({
        ...registration,
        storeId: selectedStore.id,
        storeName: selectedStore.name,
      })
      setCurrentStoreName(selectedStore.name)
      setAdminPassword('')
      toast.success(t('settings.targetStore.saveSuccess') || 'Target store updated successfully')
    } catch (error: any) {
      console.error('Failed to verify admin credentials:', error)
      toast.error(t('settings.targetStore.invalidAdminCredentials') || 'Invalid admin username or password')
    } finally {
      setIsVerifyingAdmin(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('settings.title') || 'Settings'}
      size="lg"
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
          <button
            onClick={() => setActiveTab('targetStore')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'targetStore'
                ? 'border-b-2'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'targetStore' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              borderBottomColor: activeTab === 'targetStore' ? 'var(--color-primary-600)' : 'transparent',
            }}
          >
            {t('settings.targetStore.title') || 'Target Store'}
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
            {/* Connection type */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {t('settings.cashDrawer.connectionType') || 'Connection Type'}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="connection_type"
                    checked={config.connection_type === 'printer'}
                    onChange={() => setConfig({ ...config, connection_type: 'printer' })}
                    disabled={!isElectron}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {t('settings.cashDrawer.connectionTypePrinter') || 'POS Printer'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="connection_type"
                    checked={config.connection_type === 'serial'}
                    onChange={() => setConfig({ ...config, connection_type: 'serial' })}
                    disabled={!isElectron}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {t('settings.cashDrawer.connectionTypeSerial') || 'Serial Port'}
                  </span>
                </label>
              </div>
            </div>

            {/* Printer selection */}
            {config.connection_type === 'printer' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.cashDrawer.printer') || 'Printer'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={config.printer_name ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setConfig({ ...config, printer_name: e.target.value })
                    }
                    disabled={isLoading || isLoadingPrinters}
                    required
                    className="flex-1 px-3 py-2 border rounded"
                    style={{
                      borderColor: 'var(--color-border-default)',
                      backgroundColor: 'var(--color-bg-default)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="">{t('settings.cashDrawer.selectPrinter') || 'Select a printer...'}</option>
                    {availablePrinters.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.displayName || p.name}
                        {p.description ? ` — ${p.description}` : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={loadAvailablePrinters}
                    disabled={isLoading || isLoadingPrinters}
                  >
                    {isLoadingPrinters ? (t('common.loading') || 'Loading...') : (t('settings.cashDrawer.refreshPorts') || 'Refresh')}
                  </Button>
                </div>
                {availablePrinters.length === 0 && !isLoadingPrinters && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {!isElectron
                      ? (t('settings.cashDrawer.requiresDesktopApp') || 'Cash drawer requires the desktop application.')
                      : (t('settings.cashDrawer.noPrintersAvailable') || 'No printers found. Install a POS printer or ESC/POS Virtual Printer.')}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="print_receipt_enabled"
                    checked={config.print_receipt_enabled ?? false}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setConfig({ ...config, print_receipt_enabled: e.target.checked })
                    }
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <label htmlFor="print_receipt_enabled" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {t('settings.cashDrawer.printReceipt') || 'Print Receipt'}
                  </label>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('settings.cashDrawer.printReceiptHelp') || 'Default state of "Print Receipt" in the payment confirmation dialog after payment.'}
                </p>
              </div>
            )}

            {/* Serial port selection */}
            {config.connection_type === 'serial' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {t('settings.cashDrawer.portPath') || 'Port Path'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={useCustomPort ? '__custom__' : (config.port_path ?? '')}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const val = e.target.value
                        if (val === '__custom__') {
                          setUseCustomPort(true)
                          setConfig({ ...config, port_path: '' })
                        } else {
                          setUseCustomPort(false)
                          setConfig({ ...config, port_path: val })
                        }
                      }}
                      disabled={isLoading || isLoadingPorts}
                      required={!useCustomPort}
                      className="flex-1 px-3 py-2 border rounded"
                      style={{
                        borderColor: 'var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="">{t('settings.cashDrawer.selectPort') || 'Select a port...'}</option>
                      {availablePorts.map((port) => {
                        const parts = [port.path]
                        if (port.manufacturer) parts.push(port.manufacturer)
                        if (port.vendorId && port.productId) parts.push(`VID:${port.vendorId} PID:${port.productId}`)
                        return (
                          <option key={port.path} value={port.path}>
                            {parts.join(' — ')}
                          </option>
                        )
                      })}
                      <option value="__custom__">{t('settings.cashDrawer.enterPortManually') || 'Enter port manually...'}</option>
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={loadAvailablePorts}
                      disabled={isLoading || isLoadingPorts}
                    >
                      {isLoadingPorts ? (t('common.loading') || 'Loading...') : (t('settings.cashDrawer.refreshPorts') || 'Refresh')}
                    </Button>
                  </div>
                  {useCustomPort && (
                    <Input
                      type="text"
                      value={config.port_path ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, port_path: e.target.value })}
                      placeholder="COM1, COM3, /dev/ttyUSB0..."
                      disabled={isLoading}
                      className="mt-2"
                    />
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('settings.cashDrawer.portHelp') ||
                      'Virtual printers often appear as COM ports. Check Device Manager → Ports (COM & LPT) to identify which port is your printer.'}
                  </p>
                  {availablePorts.length === 0 && !isLoadingPorts && !useCustomPort && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {!isElectron
                        ? (t('settings.cashDrawer.requiresDesktopApp') || 'Cash drawer requires the desktop application.')
                        : (t('settings.cashDrawer.noPortsAvailable') || 'No serial ports available. Make sure your device is connected.')}
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
              </>
            )}

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
              {isElectron && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrintTest}
                  disabled={isLoading || isTesting || !isConfigValid}
                >
                  {isTesting ? (t('common.loading') || 'Loading...') : (t('settings.cashDrawer.printTest') || 'Print test')}
                </Button>
              )}
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
                disabled={isLoading || !isConfigValid || !hasChanges}
              >
                {isLoading ? (t('common.loading') || 'Loading...') : (t('common.save') || 'Save')}
              </Button>
            </div>
          </form>
        </div>
        )}

        {/* Target Store Tab */}
        {activeTab === 'targetStore' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {t('settings.targetStore.title') || 'Target Store'}
            </h3>

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {t('settings.targetStore.current') || 'Current target store'}:
              </p>
              <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {currentStoreName || (t('settings.targetStore.notConfigured') || 'Not configured')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {t('settings.targetStore.select') || 'Select target store'}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedStoreId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value
                    setSelectedStoreId(value ? Number(value) : '')
                  }}
                  disabled={isLoadingStores || hasOpenShift || isShiftLoading}
                  className="flex-1 px-3 py-2 border rounded"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-default)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="">{t('settings.targetStore.selectPlaceholder') || 'Select a store...'}</option>
                  {availableStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadAvailableStores}
                  disabled={isLoadingStores}
                >
                  {isLoadingStores ? (t('common.loading') || 'Loading...') : (t('settings.targetStore.refresh') || 'Refresh')}
                </Button>
              </div>
            </div>
            <Input
              type="text"
              label={t('registration.adminUsername') || 'Admin Username'}
              value={adminUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminUsername(e.target.value)}
              fullWidth
              disabled={isLoadingStores || hasOpenShift || isShiftLoading || isVerifyingAdmin}
            />
            <Input
              type="password"
              label={t('registration.adminPassword') || 'Admin Password'}
              value={adminPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
              fullWidth
              disabled={isLoadingStores || hasOpenShift || isShiftLoading || isVerifyingAdmin}
            />

            {hasOpenShift && !isShiftLoading && (
              <p className="text-sm" style={{ color: 'var(--color-warning-600, #D97706)' }}>
                {t('settings.targetStore.openShiftHint') || 'Close the current shift before changing the target store.'}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoadingStores || isVerifyingAdmin}
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveTargetStore}
                disabled={isLoadingStores || isShiftLoading || hasOpenShift || selectedStoreId === '' || isVerifyingAdmin}
              >
                {isVerifyingAdmin
                  ? (t('settings.targetStore.verifyingAdmin') || 'Verifying admin...')
                  : (t('common.save') || 'Save')}
              </Button>
            </div>
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

