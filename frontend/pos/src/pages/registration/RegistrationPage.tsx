/**
 * Cashier registration wizard for first-time setup.
 * Multi-step wizard: Welcome -> Admin Credentials -> Store Selection -> Create User (Optional) -> Success
 */
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Spinner } from '@sofiapos/ui'
import { toast } from 'react-toastify'
import { getRegistrationCode, saveRegistration } from '@/utils/registration'
import apiClient from '@/api/client'
import { FaStore, FaUser, FaLock, FaCheckCircle, FaGlobe, FaArrowRight, FaArrowLeft } from 'react-icons/fa'

interface Store {
  id: number
  name: string
  code: string
  is_active: boolean
}

type RegistrationStep = 'welcome' | 'credentials' | 'store' | 'createUser' | 'success'

export function RegistrationPage() {
  const { t, changeLanguage, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('welcome')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es') // Default Spanish
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [registrationCode, setRegistrationCode] = useState<string>('')
  const [cashierName, setCashierName] = useState<string>('')
  const [cashRegisterId, setCashRegisterId] = useState<number | null>(null)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [cashierNumber] = useState<number>(1) // Start with 1, could be incremented based on existing cashiers
  
  // User creation fields
  const [userUsername, setUserUsername] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userPassword, setUserPassword] = useState<string>('')
  const [userFullName, setUserFullName] = useState<string>('')

  useEffect(() => {
    // Load registration code on mount
    loadRegistrationCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Update language when selection changes (only if different from current)
    if (currentLanguage !== selectedLanguage) {
      changeLanguage(selectedLanguage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]) // Only depend on selectedLanguage, changeLanguage is stable

  useEffect(() => {
    // Generate default cashier name when language or number changes
    const defaultName = selectedLanguage === 'es' 
      ? `CAJA ${cashierNumber.toString().padStart(3, '0')}`
      : `CASHIER ${cashierNumber.toString().padStart(3, '0')}`
    if (!cashierName || cashierName.startsWith('CAJA') || cashierName.startsWith('CASHIER')) {
      setCashierName(defaultName)
    }
  }, [selectedLanguage, cashierNumber])

  const loadStores = async (authToken: string): Promise<Store[]> => {
    try {
      setIsLoadingStores(true)
      const response = await apiClient.get('/api/v1/stores?active_only=true', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const storesList = response.data || []
      setStores(storesList)
      return storesList
    } catch (error: any) {
      console.error('Failed to load stores:', error)
      toast.error(t('registration.loadStoresError') || 'Failed to load stores. Please try again.')
      throw error
    } finally {
      setIsLoadingStores(false)
    }
  }

  const loadRegistrationCode = async () => {
    const code = await getRegistrationCode()
    setRegistrationCode(code)
  }

  const handleWelcomeNext = () => {
    setCurrentStep('credentials')
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adminUsername || !adminPassword) {
      toast.error(t('registration.enterCredentialsError') || 'Please enter admin username and password')
      return
    }

    if (!navigator.onLine) {
      toast.error(t('registration.mustBeOnline') || 'Must be online to register')
      return
    }

    setIsLoading(true)
    try {
      // Validate admin credentials
      const formData = new FormData()
      formData.append('username', adminUsername)
      formData.append('password', adminPassword)

      const authResponse = await apiClient.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const { access_token, user: adminUser } = authResponse.data

      // Check if admin has permission
      if (!adminUser.is_superuser) {
        // Allow any authenticated user for now
      }

      // Store token and load stores
      setAdminToken(access_token)
      await loadStores(access_token)
      
      // Move to store selection step
      setCurrentStep('store')
    } catch (error: any) {
      console.error('Authentication error:', error)
      if (error.response?.status === 401) {
        toast.error(t('registration.invalidCredentials') || 'Invalid admin username or password')
      } else {
        toast.error(error.response?.data?.detail || error.message || (t('registration.error') || 'Authentication failed'))
      }
    } finally {
      setIsLoading(false)
    }
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

    if (!adminToken) {
      toast.error(t('registration.sessionExpired') || 'Session expired. Please start over.')
      setCurrentStep('credentials')
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

      const cashRegisterResponse = await apiClient.post('/api/v1/cashiers/register', cashierData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      const cashRegister = cashRegisterResponse.data
      setCashRegisterId(cashRegister.id)

      // Save registration data (without user for now)
      saveRegistration({
        registrationCode,
        storeId: selectedStoreId,
        storeName: selectedStore.name,
        userId: 0, // Will be set when user is created
        username: '', // Will be set when user is created
        registeredAt: new Date().toISOString(),
      })

      toast.success(t('registration.cashRegisterCreated') || 'Cash register created successfully!')
      
      // Move to user creation step
      setCurrentStep('createUser')
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.detail || error.message || (t('registration.error') || 'Registration failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStart = () => {
    // Logout admin session
    if (adminToken) {
      // Clear admin token
      setAdminToken(null)
      // Clear any stored auth data
      localStorage.removeItem('pos_auth_token')
      localStorage.removeItem('pos_user_data')
    }
    
    // Navigate to login
    navigate({ to: '/login', replace: true })
  }

  const handleCreateUser = async () => {
    if (!cashRegisterId) {
      toast.error(t('registration.cashRegisterNotFound') || 'Cash register not found')
      return
    }

    if (!userUsername.trim() || !userEmail.trim() || !userPassword.trim() || !userFullName.trim()) {
      toast.error(t('registration.fillAllFields') || 'Please fill all fields')
      return
    }

    if (!adminToken) {
      toast.error(t('registration.sessionExpired') || 'Session expired. Please start over.')
      setCurrentStep('credentials')
      return
    }

    setIsLoading(true)
    try {
      const userData = {
        cash_register_id: cashRegisterId,
        username: userUsername.trim(),
        email: userEmail.trim(),
        password: userPassword,
        full_name: userFullName.trim(),
      }

      const userResponse = await apiClient.post(`/api/v1/cashiers/${cashRegisterId}/user`, userData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })

      const cashierUser = userResponse.data

      // Update registration data with user info
      saveRegistration({
        registrationCode,
        storeId: selectedStoreId!,
        storeName: stores.find(s => s.id === selectedStoreId)?.name || '',
        userId: cashierUser.id,
        username: cashierUser.username,
        registeredAt: new Date().toISOString(),
      })

      toast.success(t('registration.userCreated') || 'User created successfully!')
      
      // Move to success step
      setCurrentStep('success')
    } catch (error: any) {
      console.error('User creation error:', error)
      toast.error(error.response?.data?.detail || error.message || (t('registration.userCreationError') || 'User creation failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipUser = () => {
    // Skip user creation and go to success
    toast.info(t('registration.userCreationSkipped') || 'User creation skipped. You can create a user later.')
    setCurrentStep('success')
  }

  const handleBack = () => {
    if (currentStep === 'credentials') {
      setCurrentStep('welcome')
    } else if (currentStep === 'store') {
      setCurrentStep('credentials')
    } else if (currentStep === 'createUser') {
      setCurrentStep('store')
    }
  }

  // Step 1: Welcome
  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-theme-primary px-8 pt-12 pb-8 text-white text-center" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
              <h1 className="text-4xl font-bold mb-4">
                {t('registration.welcomeTitle') || 'Welcome to SofiaPOS'}
              </h1>
              <p className="text-white text-lg opacity-90">
                {t('registration.welcomeDescription') || 'We are registering a new Cashier terminal'}
              </p>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaGlobe className="inline mr-2" />
                  {t('settings.language') || 'Language'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('es')}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedLanguage === 'es'
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Español
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('en')}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedLanguage === 'en'
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleWelcomeNext}
                className="w-full"
              >
                {t('common.next') || 'Next'} <FaArrowRight className="ml-2 inline" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Admin Credentials
  if (currentStep === 'credentials') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 text-white" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBack}
                  className="text-white opacity-90 hover:opacity-100 transition-opacity"
                >
                  <FaArrowLeft />
                </button>
                <span className="text-sm text-white opacity-90">
                  {t('registration.step') || 'Step'} 2/5
                </span>
              </div>
              <h2 className="text-2xl font-bold">
                {t('registration.adminCredentials') || 'Admin Credentials Required'}
              </h2>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="px-8 py-8 space-y-4">
              <Input
                type="text"
                label={t('registration.adminUsername') || 'Admin Username'}
                value={adminUsername}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminUsername(e.target.value)}
                disabled={isLoading}
                leftIcon={<FaUser />}
                fullWidth
                required
              />

              <Input
                type="password"
                label={t('registration.adminPassword') || 'Admin Password'}
                value={adminPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
                disabled={isLoading}
                leftIcon={<FaLock />}
                fullWidth
                required
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <FaArrowLeft className="mr-2 inline" /> {t('common.back') || 'Back'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !adminUsername || !adminPassword || !navigator.onLine}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {t('common.loading') || 'Loading...'}
                    </>
                  ) : (
                    <>
                      {t('common.next') || 'Next'} <FaArrowRight className="ml-2 inline" />
                    </>
                  )}
                </Button>
              </div>

              {!navigator.onLine && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    {t('registration.mustBeOnline') || 'You must be online to register. Please connect to the internet.'}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Store Selection & Registration
  if (currentStep === 'store') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 text-white" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBack}
                  className="text-white opacity-90 hover:opacity-100 transition-opacity"
                >
                  <FaArrowLeft />
                </button>
                <span className="text-sm text-white opacity-90">
                  {t('registration.step') || 'Step'} 3/5
                </span>
              </div>
              <h2 className="text-2xl font-bold">
                {t('registration.completeRegistration') || 'Complete Registration'}
              </h2>
            </div>

            <div className="px-8 py-8 space-y-6">
              {isLoadingStores ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-600">{t('registration.loadingStores') || 'Loading stores...'}</p>
                </div>
              ) : (
                <>
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

                  {/* Store Selection */}
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
                    placeholder={selectedLanguage === 'es' ? 'CAJA 001' : 'CASHIER 001'}
                    fullWidth
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {t('registration.cashierNameHint') || 'Default name will be used if left empty'}
                  </p>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBack}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <FaArrowLeft className="mr-2 inline" /> {t('common.back') || 'Back'}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleRegister}
                      disabled={isLoading || !selectedStoreId || !cashierName.trim()}
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
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Create User (Optional)
  if (currentStep === 'createUser') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] px-8 pt-12 pb-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-white opacity-90 hover:opacity-100 transition-opacity"
                >
                  <FaArrowLeft />
                </button>
                <span className="text-sm text-white opacity-90">
                  {t('registration.step') || 'Step'} 4/5
                </span>
              </div>
              <h2 className="text-2xl font-bold">
                {t('registration.createUser') || 'Create Cashier User'}
              </h2>
              <p className="text-[var(--color-primary-100)] mt-2">
                {t('registration.createUserDescription') || 'Optionally create a user account with Cashier role for this terminal'}
              </p>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {t('registration.createUserHint') || 'You can skip this step and create a user later if needed.'}
                </p>
              </div>

              <Input
                type="text"
                label={`${t('registration.username') || 'Username'} *`}
                value={userUsername}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserUsername(e.target.value)}
                disabled={isLoading}
                placeholder="cashier_user"
                fullWidth
                required
              />

              <Input
                type="email"
                label={`${t('registration.email') || 'Email'} *`}
                value={userEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserEmail(e.target.value)}
                disabled={isLoading}
                placeholder="cashier@example.com"
                fullWidth
                required
              />

              <Input
                type="text"
                label={`${t('registration.fullName') || 'Full Name'} *`}
                value={userFullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserFullName(e.target.value)}
                disabled={isLoading}
                placeholder={cashierName || (t('registration.cashier') || 'Cashier')}
                fullWidth
                required
              />

              <Input
                type="password"
                label={`${t('registration.password') || 'Password'} *`}
                value={userPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                fullWidth
                required
              />
              <p className="text-xs text-gray-500">
                {t('registration.passwordHint') || 'Minimum 6 characters'}
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <FaArrowLeft className="mr-2 inline" /> {t('common.back') || 'Back'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSkipUser}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {t('registration.skip') || 'Skip'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                  disabled={isLoading || !userUsername.trim() || !userEmail.trim() || !userPassword.trim() || !userFullName.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      {t('registration.creating') || 'Creating...'}
                    </>
                  ) : (
                    <>
                      {t('registration.create') || 'Create'} <FaCheckCircle className="ml-2 inline" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 5: Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 pt-12 pb-8 text-white text-center">
            <FaCheckCircle className="text-6xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              {t('registration.successTitle') || 'Registration Successful!'}
            </h1>
            <p className="text-green-100">
              {t('registration.successDescription') || 'Your cashier terminal has been registered successfully'}
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {t('registration.cashierName') || 'Cashier Name'}: <strong>{cashierName}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {t('registration.registrationCode') || 'Registration Code'}: <code className="bg-gray-100 px-2 py-1 rounded">{registrationCode}</code>
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleStart}
              className="w-full"
            >
              {t('registration.start') || 'Start'} <FaArrowRight className="ml-2 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
