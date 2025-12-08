/**
 * Cashier registration wizard for first-time setup.
 * Multi-step wizard: Welcome -> Admin Credentials -> Store Selection -> Sync -> Create User (Optional) -> Success
 */
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { WelcomeStep } from './components/WelcomeStep'
import { CredentialsStep } from './components/CredentialsStep'
import { StoreStep } from './components/StoreStep'
import { SyncStep } from './components/SyncStep'
import { CreateUserStep } from './components/CreateUserStep'
import { SuccessStep } from './components/SuccessStep'
import { 
  getRegistrationProgress, 
  saveRegistrationProgress, 
  clearRegistrationProgress,
  saveRegistration,
  getRegistrationCode,
  isRegistered,
  getRegistration,
  type RegistrationStep 
} from '@/utils/registration'

interface Store {
  id: number
  name: string
  code: string
  is_active: boolean
}

export function RegistrationPage() {
  const navigate = useNavigate()
  
  // Load saved progress on mount
  const savedProgress = getRegistrationProgress()
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(savedProgress?.currentStep || 'welcome')
  const [selectedLanguage, setSelectedLanguage] = useState<string>(savedProgress?.selectedLanguage || 'es')
  
  // State from progress
  const [adminToken, setAdminToken] = useState<string | null>(savedProgress?.adminToken || null)
  const [adminUsername] = useState<string>(savedProgress?.adminUsername || '')
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(savedProgress?.selectedStoreId || null)
  const [cashRegisterId, setCashRegisterId] = useState<number | null>(savedProgress?.cashRegisterId || null)
  const [cashierName, setCashierName] = useState<string>(savedProgress?.cashierName || '')
  const [storeName, setStoreName] = useState<string>(savedProgress?.storeName || '')
  const [registrationCode, setRegistrationCode] = useState<string>('')
  const [syncCompleted, setSyncCompleted] = useState<boolean>(savedProgress?.syncCompleted || false)

  useEffect(() => {
    // Check if already registered - if so, redirect to login
    if (isRegistered()) {
      const registrationData = getRegistration()
      if (registrationData) {
        // Registration is complete, redirect to login
        navigate({ to: '/login', replace: true })
        return
      }
    }
    
    // Load registration code
    loadRegistrationCode()
  }, [navigate])

  const loadRegistrationCode = async () => {
    const code = await getRegistrationCode()
    setRegistrationCode(code)
  }

  const saveProgress = (step: RegistrationStep) => {
    saveRegistrationProgress({
      currentStep: step,
      adminToken: adminToken, // Will be cleared after user creation
      adminUsername: adminUsername,
      selectedStoreId: selectedStoreId,
      cashRegisterId: cashRegisterId,
      cashierName: cashierName,
      storeName: storeName,
      syncCompleted: syncCompleted,
      selectedLanguage: selectedLanguage,
    })
  }

  const handleWelcomeNext = () => {
    const nextStep: RegistrationStep = 'credentials'
    setCurrentStep(nextStep)
    saveProgress(nextStep)
  }

  const handleCredentialsNext = (token: string, storesList: Store[]) => {
    setAdminToken(token)
    setStores(storesList)
    const nextStep: RegistrationStep = 'store'
    setCurrentStep(nextStep)
    saveProgress(nextStep)
  }

  const handleStoreNext = (registerId: number, storeId: number, storeNameValue: string, cashierNameValue: string, _registrationToken?: string) => {
    setCashRegisterId(registerId)
    setSelectedStoreId(storeId)
    setStoreName(storeNameValue)
    setCashierName(cashierNameValue)
    
    // Note: registrationToken and cashRegisterId are saved in progress via saveProgress, not in final registration
    // Final registration is only saved when registration is complete
    
    const nextStep: RegistrationStep = 'sync'
    setCurrentStep(nextStep)
    saveProgress(nextStep)
  }

  const handleSyncNext = () => {
    setSyncCompleted(true)
    // Keep admin token for user creation step
    const nextStep: RegistrationStep = 'createUser'
    setCurrentStep(nextStep)
    saveProgress(nextStep)
  }

  const handleCreateUserNext = (newUserId: number, newUsername: string) => {
    // Get progress data to preserve token and cashRegisterId
    const progressData = getRegistrationProgress()
    
    // Save final registration data
    saveRegistration({
      registrationCode,
      storeId: selectedStoreId!,
      storeName: storeName,
      userId: newUserId,
      username: newUsername,
      registeredAt: new Date().toISOString(),
      registrationToken: progressData?.adminToken || undefined,
      cashRegisterId: cashRegisterId || progressData?.cashRegisterId || undefined,
    })
    
    // Clear admin token after user creation (security)
    setAdminToken(null)
    
    const nextStep: RegistrationStep = 'success'
    setCurrentStep(nextStep)
    saveProgress(nextStep)
  }

  const handleSkipUser = () => {
    // Get progress data to preserve token and cashRegisterId
    const progressData = getRegistrationProgress()
    
    // Save registration without user
    saveRegistration({
      registrationCode,
      storeId: selectedStoreId!,
      storeName: storeName,
      userId: 0,
      username: '',
      registeredAt: new Date().toISOString(),
      registrationToken: progressData?.adminToken || undefined,
      cashRegisterId: cashRegisterId || progressData?.cashRegisterId || undefined,
    })
    
    // Clear admin token after skipping user creation (security)
    setAdminToken(null)
    
    const nextStep: RegistrationStep = 'success'
    setCurrentStep(nextStep)
    saveProgress(nextStep)
  }

  const handleStart = () => {
    // Clear admin token and progress
    setAdminToken(null)
    clearRegistrationProgress()
    localStorage.removeItem('pos_auth_token')
    
    // Registration is complete - navigate to login
    // The RootRoute will handle routing based on registration status
    navigate({ to: '/login', replace: true })
  }

  const handleBack = () => {
    if (currentStep === 'credentials') {
      setCurrentStep('welcome')
      saveProgress('welcome')
    } else if (currentStep === 'store') {
      setCurrentStep('credentials')
      saveProgress('credentials')
    } else if (currentStep === 'sync') {
      setCurrentStep('store')
      saveProgress('store')
    } else if (currentStep === 'createUser') {
      setCurrentStep('sync')
      saveProgress('sync')
    }
  }

  // Check if already registered before rendering any step
  if (isRegistered()) {
    // Registration is complete, show success step or redirect
    const registrationData = getRegistration()
    if (registrationData) {
      return (
        <SuccessStep
          registrationCode={registrationData.registrationCode}
          cashierName={cashierName || 'Cashier'}
          onStart={handleStart}
        />
      )
    }
  }

  // Check if already registered before rendering any step
  // This prevents re-registration when navigating back
  if (isRegistered()) {
    const registrationData = getRegistration()
    if (registrationData) {
      // Registration is complete - show success step
      return (
        <SuccessStep
          registrationCode={registrationData.registrationCode}
          cashierName={cashierName || registrationData.storeName || 'Cashier'}
          onStart={handleStart}
        />
      )
    }
  }

  // Render appropriate step component
  if (currentStep === 'welcome') {
    return (
      <WelcomeStep
        onNext={handleWelcomeNext}
        initialLanguage={selectedLanguage}
        onLanguageChange={(lang) => {
          setSelectedLanguage(lang)
          saveProgress('welcome')
        }}
      />
    )
  }

  if (currentStep === 'credentials') {
    return (
      <CredentialsStep
        onNext={handleCredentialsNext}
        onBack={handleBack}
        initialUsername={adminUsername}
      />
    )
  }

  if (currentStep === 'store') {
    if (!adminToken || stores.length === 0) {
      // Need to go back to credentials if no token
      return (
        <CredentialsStep
          onNext={(token, storesList) => {
            setAdminToken(token)
            setStores(storesList)
            handleCredentialsNext(token, storesList)
          }}
          onBack={handleBack}
          initialUsername={adminUsername}
        />
      )
    }

    return (
      <StoreStep
        onNext={handleStoreNext}
        onBack={handleBack}
        adminToken={adminToken}
        stores={stores}
        initialStoreId={selectedStoreId}
        initialCashierName={cashierName}
      />
    )
  }

  if (currentStep === 'sync') {
    if (!adminToken) {
      // Need admin token for sync - go back to credentials
      return (
        <CredentialsStep
          onNext={(token, storesList) => {
            setAdminToken(token)
            setStores(storesList)
            // After getting token, go to sync
            setCurrentStep('sync')
            saveProgress('sync')
          }}
          onBack={handleBack}
          initialUsername={adminUsername}
        />
      )
    }

    return (
      <SyncStep
        onNext={handleSyncNext}
        onBack={handleBack}
        adminToken={adminToken}
      />
    )
  }

  if (currentStep === 'createUser') {
    if (!cashRegisterId || !adminToken) {
      // Need cash register and admin token - this shouldn't happen, but handle it
      return (
        <StoreStep
          onNext={handleStoreNext}
          onBack={handleBack}
          adminToken={adminToken || ''}
          stores={stores}
          initialStoreId={selectedStoreId}
          initialCashierName={cashierName}
        />
      )
    }

    return (
      <CreateUserStep
        onNext={handleCreateUserNext}
        onBack={handleBack}
        onSkip={handleSkipUser}
        cashRegisterId={cashRegisterId}
        cashierName={cashierName}
        adminToken={adminToken}
      />
    )
  }

  // Success step
  return (
    <SuccessStep
      registrationCode={registrationCode}
      cashierName={cashierName}
      onStart={handleStart}
    />
  )
}
