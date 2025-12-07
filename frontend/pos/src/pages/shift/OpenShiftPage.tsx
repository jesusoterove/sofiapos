/**
 * Open shift page for starting a new shift.
 */
import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Card } from '@sofiapos/ui'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useShift } from '@/hooks/useShift'
import { FaDollarSign, FaBox } from 'react-icons/fa'

export function OpenShiftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openShift, isLoading } = useShift()
  
  const [initialCash, setInitialCash] = useState('')
  const [inventoryBalance, setInventoryBalance] = useState('')
  const [requiresInventory, setRequiresInventory] = useState(false)

  // Check if inventory is required
  useEffect(() => {
    // TODO: Fetch store configuration to check if requires_start_inventory
    // For now, default to false
    setRequiresInventory(false)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!initialCash || parseFloat(initialCash) < 0) {
      toast.error('Please enter a valid initial cash amount')
      return
    }

    if (requiresInventory && (!inventoryBalance || parseFloat(inventoryBalance) < 0)) {
      toast.error('Please enter a valid inventory beginning balance')
      return
    }

    try {
      await openShift({
        initialCash: parseFloat(initialCash),
        inventoryBalance: requiresInventory ? parseFloat(inventoryBalance) : undefined,
      })

      toast.success(t('shift.openShift') || 'Shift opened successfully!')
      navigate({ to: '/', replace: true })
    } catch (error: any) {
      toast.error(error.message || 'Failed to open shift')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('shift.openShift') || 'Open Shift'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              {user?.store_id ? `Store: ${user.store_id}` : ''}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Initial Cash */}
            <Input
              type="number"
              label={t('cashRegister.openingBalance') || 'Initial Cash'}
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              disabled={isLoading}
              leftIcon={<FaDollarSign />}
              step="0.01"
              min="0"
              required
              fullWidth
            />

            {/* Inventory Balance (if required) */}
            {requiresInventory && (
              <Input
                type="number"
                label={t('inventory.quantity') || 'Inventory Beginning Balance'}
                value={inventoryBalance}
                onChange={(e) => setInventoryBalance(e.target.value)}
                disabled={isLoading}
                leftIcon={<FaBox />}
                step="0.01"
                min="0"
                required
                fullWidth
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !initialCash}
              className="w-full"
            >
              {isLoading ? (t('common.loading') || 'Loading...') : (t('shift.openShift') || 'Open Shift')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

