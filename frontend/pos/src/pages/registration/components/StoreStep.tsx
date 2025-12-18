/**
 * Store selection step component for registration wizard.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Spinner } from '@sofiapos/ui'
import { FaStore, FaArrowLeft, FaCheckCircle, FaInfoCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import apiClient from '@/api/client'
import { getRegistrationCode, getRegistration, getRegistrationProgress } from '@/utils/registration'

interface Store {
  id: number
  name: string
  code: string
  is_active: boolean
}

interface StoreStepProps {
  onNext: (cashRegisterId: number, storeId: number, storeName: string, cashierName: string, registrationToken?: string) => void
  onBack: () => void
  adminToken: string
  stores: Store[]
  initialStoreId?: number | null
  initialCashierName?: string
  cashierNumber?: number
}

export function StoreStep({
  onNext,
  onBack,
  adminToken,
  stores,
  initialStoreId = null,
  initialCashierName = '',
  cashierNumber = 1,
}: StoreStepProps) {
  const { t, currentLanguage } = useTranslation()
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(initialStoreId)
  const [registrationCode, setRegistrationCode] = useState<string>('')
  const [cashierName, setCashierName] = useState<string>(initialCashierName)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(false)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)
  const [validatedCashRegisterId, setValidatedCashRegisterId] = useState<number | null>(null)
  const [validatedStoreId, setValidatedStoreId] = useState<number | null>(null)
  const [validatedStoreName, setValidatedStoreName] = useState<string>('')
  const [validatedCashRegisterName, setValidatedCashRegisterName] = useState<string>('')

  useEffect(() => {
    // Generate default cashier name when language or number changes
    const defaultName = currentLanguage === 'es' 
      ? `CAJA ${cashierNumber.toString().padStart(3, '0')}`
      : `CASHIER ${cashierNumber.toString().padStart(3, '0')}`
    if (!cashierName || cashierName.startsWith('CAJA') || cashierName.startsWith('CASHIER')) {
      setCashierName(defaultName)
    }
  }, [currentLanguage, cashierNumber, cashierName])

  useEffect(() => {
    // Load registration code on mount
    loadRegistrationCode()
  }, [])

  useEffect(() => {
    // Check if cash register is already registered whenever entering this step
    // This runs when stores or adminToken become available, or when navigating to this step
    if (stores.length > 0 && adminToken) {
      checkIfAlreadyRegistered()
    }
  }, [stores, adminToken])

  const checkIfAlreadyRegistered = async () => {
    // Check progress data first (during registration wizard)
    const progressData = getRegistrationProgress()
    // Then check final registration data (after completion)
    const registrationData = getRegistration()
    const localRegistrationCode = await getRegistrationCode()
    
    // During the wizard, cashRegisterId is in progress data
    // After completion, it's in registration data
    const cashRegisterId = progressData?.cashRegisterId || registrationData?.cashRegisterId
    const registrationToken = progressData?.adminToken || registrationData?.registrationToken
    
    // Check if we have a cashRegisterId
    if (cashRegisterId) {
      setIsValidatingToken(true)
      try {
        // Fetch cash register information by ID with admin token - skip default auth token handling
        const response = await apiClient.get(`/api/v1/cash_registers/${cashRegisterId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          metadata: {
            skipAuthToken: true, // Skip default token handling, use custom Authorization header
            skipTokenRefresh: true, // Don't try to refresh token on 401
          },
        } as any)
        
        const cashRegister = response.data
        
        // Use the registration_code field from the API (already has "CR-" prefix removed)
        // Or extract from code if registration_code is not available
        const cashRegisterRegistrationCode = (cashRegister.registration_code || cashRegister.code.replace("CR-", "")).toUpperCase()
        const localCode = localRegistrationCode.toUpperCase()
        
        // Compare registration codes (case-insensitive)
        if (cashRegisterRegistrationCode === localCode) {
          // Cash register is already registered with this registration code
          setIsAlreadyRegistered(true)
          setValidatedCashRegisterId(cashRegister.id)
          setValidatedStoreId(cashRegister.store_id)
          setValidatedCashRegisterName(cashRegister.name)
          
          // Find store name
          const store = stores.find(s => s.id === cashRegister.store_id)
          if (store) {
            setValidatedStoreName(store.name)
            setSelectedStoreId(store.id)
          }
        }
      } catch (error: any) {
        console.error('Error checking cash register:', error)
        // If error (e.g., cash register not found), allow normal registration
        setIsAlreadyRegistered(false)
      } finally {
        setIsValidatingToken(false)
      }
    } else if (registrationToken) {
      // Fallback: Try token validation if no cashRegisterId
      setIsValidatingToken(true)
      try {
        const response = await apiClient.post('/api/v1/cash_registers/validate-token', {
          registration_token: registrationToken,
        })
        
        if (response.data.valid) {
          setIsAlreadyRegistered(true)
          setValidatedCashRegisterId(response.data.cash_register_id || null)
          setValidatedStoreId(response.data.store_id || null)
          // Find store name
          const store = stores.find(s => s.id === response.data.store_id)
          if (store) {
            setValidatedStoreName(store.name)
            setSelectedStoreId(store.id)
          }
        }
      } catch (error: any) {
        console.error('Token validation error:', error)
        // Token is invalid, allow normal registration
      } finally {
        setIsValidatingToken(false)
      }
    }
  }

  const loadRegistrationCode = async () => {
    const code = await getRegistrationCode()
    setRegistrationCode(code)
  }

  const handleRegister = async () => {
    if (!selectedStoreId) {
      toast.error(t('registration.selectStoreError') || 'Please select a store')
      return
    }

    if (!cashierName.trim()) {
      toast.error(t('registration.enterCashierName') || 'Please enter a cashier name')
      return
    }

    setIsLoading(true)
    try {
      const selectedStore = stores.find(s => s.id === selectedStoreId)
      if (!selectedStore) {
        throw new Error('Selected store not found')
      }

      // Register cash register using cashiers endpoint
      const cashierData = {
        registration_code: registrationCode,
        store_id: selectedStoreId,
        name: cashierName.trim(),
      }

      const cashRegisterResponse = await apiClient.post('/api/v1/cash_registers/register', cashierData, {
        headers: { Authorization: `Bearer ${adminToken}` },
        metadata: {
          skipAuthToken: true, // Skip default token handling, use custom Authorization header
          skipTokenRefresh: true, // Don't try to refresh token on 401
        },
      } as any)

      const cashRegister = cashRegisterResponse.data

      toast.success(t('registration.cashRegisterCreated') || 'Cash register created successfully!')
      
      // Move to next step with registration token
      onNext(
        cashRegister.id, 
        selectedStoreId, 
        selectedStore.name, 
        cashierName.trim(),
        cashRegister.registration_token
      )
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.detail || error.message || (t('registration.error') || 'Registration failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-white" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="text-white opacity-90 hover:opacity-100 transition-opacity"
              >
                <FaArrowLeft />
              </button>
              <span className="text-sm text-white opacity-90">
                {t('registration.step') || 'Step'} 3/6
              </span>
            </div>
            <h2 className="text-2xl font-bold">
              {t('registration.completeRegistration') || 'Complete Registration'}
            </h2>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Registration Code */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('registration.registrationCode') || 'Registration Code'}
              </label>
              <code className="block text-lg font-mono bg-white px-3 py-2 rounded border text-center">
                {registrationCode || (t('registration.generating') || 'Generating...')}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                {t('registration.registrationCodeHint') || 'This unique code identifies this cashier terminal'}
              </p>
            </div>

            {/* Store Selection - Only show if not already registered */}
            {!isAlreadyRegistered && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaStore className="inline mr-2" />
                    {t('registration.selectStore') || 'Select Store'} *
                  </label>
                  <select
                    value={selectedStoreId || ''}
                    onChange={(e) => setSelectedStoreId(Number(e.target.value) || null)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    required
                  >
                    <option value="">-- {t('registration.selectStorePlaceholder') || 'Select Store'} --</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cashier Name */}
                <Input
                  type="text"
                  label={t('registration.cashierName') || 'Cashier Name'}
                  value={cashierName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCashierName(e.target.value)}
                  disabled={isLoading}
                  placeholder={currentLanguage === 'es' ? 'CAJA 001' : 'CASHIER 001'}
                  fullWidth
                  required
                />
                <p className="text-xs text-gray-500">
                  {t('registration.cashierNameHint') || 'Default name will be used if left empty'}
                </p>
              </>
            )}

            {/* Already Registered Message */}
            {isAlreadyRegistered && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-500 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-1">
                      {t('registration.alreadyRegistered') || 'Already Registered'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {t('registration.alreadyRegisteredMessage') || 'This cash register is already registered. You can continue to the next step.'}
                    </p>
                    {validatedCashRegisterName && (
                      <p className="text-sm text-blue-600 mt-1">
                        {t('registration.cashRegister') || 'Cash Register'}: <strong>{validatedCashRegisterName}</strong>
                      </p>
                    )}
                    {validatedStoreName && (
                      <p className="text-sm text-blue-600 mt-1">
                        {t('registration.store') || 'Store'}: <strong>{validatedStoreName}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading || isValidatingToken}
              >
                <FaArrowLeft className="mr-2 inline" /> {t('common.back') || 'Back'}
              </Button>
              {isAlreadyRegistered ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (validatedCashRegisterId && validatedStoreId && validatedStoreName) {
                      // Get token from progress or registration data
                      const progressData = getRegistrationProgress()
                      const registrationData = getRegistration()
                      const token = progressData?.adminToken || registrationData?.registrationToken
                      
                      onNext(
                        validatedCashRegisterId,
                        validatedStoreId,
                        validatedStoreName,
                        validatedCashRegisterName || cashierName.trim() || validatedStoreName,
                        token || undefined
                      )
                    }
                  }}
                  className="flex-1"
                >
                  {t('common.continue') || 'Continue'} <FaCheckCircle className="ml-2 inline" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleRegister}
                  disabled={isLoading || isValidatingToken || !selectedStoreId || !cashierName.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {t('registration.registering') || 'Registering...'}
                    </>
                  ) : (
                    <>
                      {t('registration.register') || 'Register'} <FaCheckCircle className="ml-2 inline" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

