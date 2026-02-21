import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import {
  getRegistrationProgress, saveRegistrationProgress, clearRegistrationProgress,
  saveRegistration, isRegistered, getRegistration,
  type RegistrationStep, type RegistrationProgress,
} from '@/utils/registration'
import { getHardwareId } from '@/utils/hardwareId'
import { loginWithCredentials, fetchStores, registerCashRegister, type Store } from '@/api/auth'
import { setSecure, SECURE_KEYS } from '@/utils/secureStorage'

import WelcomeStep from './WelcomeStep'
import CredentialsStep from './CredentialsStep'
import StoreStep from './StoreStep'
import SyncStep from './SyncStep'
import SuccessStep from './SuccessStep'

export default function RegistrationWizard() {
  const router = useRouter()
  const [step, setStep] = useState<RegistrationStep>('welcome')
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [storeName, setStoreName] = useState('')
  const [cashRegisterId, setCashRegisterId] = useState<number | null>(null)
  const [cashRegisterCode, setCashRegisterCode] = useState<string | null>(null)
  const [cashierName, setCashierName] = useState('')
  const [hwId, setHwId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const registered = await isRegistered()
      if (registered) {
        setStep('success')
        setLoading(false)
        return
      }
      const progress = await getRegistrationProgress()
      if (progress) {
        setStep(progress.currentStep)
        setAdminToken(progress.adminToken)
        setSelectedStoreId(progress.selectedStoreId)
        setStoreName(progress.storeName)
        setCashRegisterId(progress.cashRegisterId)
        setCashRegisterCode(progress.cashRegisterCode)
        setCashierName(progress.cashierName)
      }
      const id = await getHardwareId()
      setHwId(id)
      setLoading(false)
    })()
  }, [])

  const persistProgress = async (nextStep: RegistrationStep) => {
    setStep(nextStep)
    await saveRegistrationProgress({
      currentStep: nextStep,
      adminToken,
      adminUsername: '',
      selectedStoreId,
      cashRegisterId,
      cashRegisterCode,
      cashierName,
      storeName,
      syncCompleted: nextStep === 'success' || nextStep === 'createUser',
    })
  }

  const handleCredentialsNext = async (username: string, password: string) => {
    const resp = await loginWithCredentials(username, password)
    const token = resp.access_token
    setAdminToken(token)
    await setSecure(SECURE_KEYS.AUTH_TOKEN, token)
    if (resp.refresh_token) await setSecure(SECURE_KEYS.REFRESH_TOKEN, resp.refresh_token)
    const storesList = await fetchStores(token)
    setStores(storesList)
    await persistProgress('store')
  }

  const handleStoreNext = async (storeId: number, name: string, cashier: string) => {
    setSelectedStoreId(storeId)
    setStoreName(name)
    setCashierName(cashier)
    if (adminToken) {
      const cr = await registerCashRegister(storeId, hwId, adminToken)
      setCashRegisterId(cr.id)
      setCashRegisterCode(cr.code)
    }
    await persistProgress('sync')
  }

  const handleSyncComplete = async () => {
    await persistProgress('success')
    const code = `REG-${hwId}`
    await saveRegistration({
      registrationCode: code,
      storeId: selectedStoreId!,
      storeName,
      userId: 0,
      username: '',
      registeredAt: new Date().toISOString(),
      registrationToken: adminToken ?? undefined,
      cashRegisterId: cashRegisterId ?? undefined,
      cashRegisterCode: cashRegisterCode ?? undefined,
    })
  }

  const handleStart = async () => {
    await clearRegistrationProgress()
    router.replace('/(auth)/login')
  }

  if (loading) return null

  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={() => persistProgress('credentials')} />
    case 'credentials':
      return (
        <CredentialsStep
          onNext={handleCredentialsNext}
          onBack={() => persistProgress('welcome')}
        />
      )
    case 'store':
      return (
        <StoreStep
          stores={stores}
          onNext={handleStoreNext}
          onBack={() => persistProgress('credentials')}
        />
      )
    case 'sync':
      return (
        <SyncStep
          storeId={selectedStoreId}
          adminToken={adminToken}
          onNext={handleSyncComplete}
          onBack={() => persistProgress('store')}
        />
      )
    case 'createUser':
    case 'success':
      return (
        <SuccessStep
          storeName={storeName}
          cashierName={cashierName}
          onStart={handleStart}
        />
      )
    default:
      return <WelcomeStep onNext={() => persistProgress('credentials')} />
  }
}
