import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Toast from 'react-native-toast-message'

import { useSofiaTheme } from '@/theme/sofia-theme'
import { useShift } from '@/contexts/ShiftContext'
import { useAuth } from '@/contexts/AuthContext'
import { openDatabase, addToSyncQueue } from '@/db'
import { saveInventoryEntry, saveInventoryEntryDetail, getInventoryEntriesByShift, getInventoryEntryDetails } from '@/db/queries/inventory'
import { getRegistration } from '@/utils/registration'

interface InventoryItem {
  id: string
  item_name: string
  item_type: 'Product' | 'Material'
  product_id?: number
  material_id?: number
  uofm_id: number
  uofm_abbreviation: string
}

interface ExistingEntry {
  entry_number: string
  item_name: string
  quantity: number
  uofm: string
  date: string
}

export default function InventoryScreen() {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const { currentShift, hasOpenShift } = useShift()
  const { user } = useAuth()
  const qc = useQueryClient()
  const primary = tokens.colors.primary

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['inventory-config-items'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const db = await openDatabase()
      const configs = await db.getAllAsync<{
        id: number; item_type: string;
        product_id: number | null; material_id: number | null;
        product_name: string | null; material_name: string | null;
        uofm1_id: number | null; uofm1_abbreviation: string | null;
        uofm2_id: number | null; uofm2_abbreviation: string | null;
        uofm3_id: number | null; uofm3_abbreviation: string | null;
      }>('SELECT * FROM inventory_control_config WHERE show_in_inventory = 1 ORDER BY priority')

      const result: InventoryItem[] = []
      for (const c of configs) {
        const name = c.item_type === 'Product' ? c.product_name : c.material_name
        if (!name) continue
        if (c.uofm1_id && c.uofm1_abbreviation) {
          result.push({ id: `${c.id}-1`, item_name: name, item_type: c.item_type as any, product_id: c.product_id ?? undefined, material_id: c.material_id ?? undefined, uofm_id: c.uofm1_id, uofm_abbreviation: c.uofm1_abbreviation })
        }
        if (c.uofm2_id && c.uofm2_abbreviation) {
          result.push({ id: `${c.id}-2`, item_name: name, item_type: c.item_type as any, product_id: c.product_id ?? undefined, material_id: c.material_id ?? undefined, uofm_id: c.uofm2_id, uofm_abbreviation: c.uofm2_abbreviation })
        }
        if (c.uofm3_id && c.uofm3_abbreviation) {
          result.push({ id: `${c.id}-3`, item_name: name, item_type: c.item_type as any, product_id: c.product_id ?? undefined, material_id: c.material_id ?? undefined, uofm_id: c.uofm3_id, uofm_abbreviation: c.uofm3_abbreviation })
        }
      }
      return result
    },
    staleTime: 5 * 60_000,
  })

  const { data: existingEntries = [], refetch: refetchEntries } = useQuery({
    queryKey: ['inventory-entries', currentShift?.shift_number],
    queryFn: async (): Promise<ExistingEntry[]> => {
      if (!currentShift) return []
      const db = await openDatabase()
      const entries = await getInventoryEntriesByShift(db, currentShift.shift_number)

      const allUofm = await db.getAllAsync<{ id: number; abbreviation: string }>('SELECT id, abbreviation FROM unit_of_measures')
      const uofmMap = new Map(allUofm.map((u) => [u.id, u.abbreviation]))

      const allProducts = await db.getAllAsync<{ id: number; name: string }>('SELECT id, name FROM products')
      const prodMap = new Map(allProducts.map((p) => [p.id, p.name]))
      const allMats = await db.getAllAsync<{ id: number; name: string }>('SELECT id, name FROM materials')
      const matMap = new Map(allMats.map((m) => [m.id, m.name]))

      const result: ExistingEntry[] = []
      for (const e of entries) {
        const details = await getInventoryEntryDetails(db, e.entry_number)
        for (const d of details) {
          const name = d.product_id ? (prodMap.get(d.product_id) ?? '?') : (d.material_id ? (matMap.get(d.material_id) ?? '?') : '?')
          result.push({
            entry_number: e.entry_number,
            item_name: name,
            quantity: d.quantity,
            uofm: d.unit_of_measure_id ? (uofmMap.get(d.unit_of_measure_id) ?? '') : '',
            date: new Date(e.entry_date).toLocaleString(),
          })
        }
      }
      return result
    },
    enabled: !!currentShift,
    staleTime: 5_000,
  })

  const handleSave = useCallback(async () => {
    if (!selectedItem || !quantity || parseFloat(quantity) <= 0) {
      Toast.show({ type: 'error', text1: t('inventory.enterValidQuantity') || 'Enter a valid quantity' })
      return
    }
    if (!currentShift) {
      Toast.show({ type: 'error', text1: t('shift.noOpenShift') || 'No open shift' })
      return
    }

    setSaving(true)
    try {
      const reg = await getRegistration()
      const storeId = user?.store_id ?? reg?.storeId ?? 1
      const db = await openDatabase()

      const entryNumber = await saveInventoryEntry(db, {
        store_id: storeId,
        entry_type: 'purchase',
        entry_date: new Date().toISOString(),
        notes: notes || undefined,
        shift_number: currentShift.shift_number,
        created_by_user_id: user?.id,
      })

      await saveInventoryEntryDetail(db, {
        entry_number: entryNumber,
        product_id: selectedItem.product_id ?? null,
        material_id: selectedItem.material_id ?? null,
        quantity: parseFloat(quantity),
        unit_of_measure_id: selectedItem.uofm_id,
      })

      await addToSyncQueue(db, {
        type: 'inventory_entry',
        action: 'create',
        data_id: entryNumber,
        data: JSON.stringify({ entry_number: entryNumber }),
        retry_count: 0,
        created_at: new Date().toISOString(),
      })

      Toast.show({ type: 'success', text1: t('inventory.entrySaved') || 'Entry saved' })
      setSelectedItem(null)
      setQuantity('')
      setNotes('')
      refetchEntries()
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }, [selectedItem, quantity, notes, currentShift, user, t, refetchEntries])

  if (!hasOpenShift) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]} edges={['top']}>
        <View style={styles.center}>
          <FontAwesome name="archive" size={48} color={tokens.colors.text.muted} />
          <Text style={[styles.emptyText, { color: tokens.colors.text.muted }]}>
            {t('inventory.openShiftRequired') || 'Open a shift to manage inventory'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            {t('inventory.inventoryEntry') || 'Inventory Entry'}
          </Text>

          {/* Item picker */}
          <Pressable
            style={[styles.picker, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}
            onPress={() => setPickerOpen(!pickerOpen)}
          >
            <Text style={[styles.pickerText, { color: selectedItem ? tokens.colors.text.primary : tokens.colors.text.muted }]}>
              {selectedItem ? `${selectedItem.item_name} (${selectedItem.uofm_abbreviation})` : (t('inventory.selectItem') || 'Select an item...')}
            </Text>
            <FontAwesome name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={14} color={tokens.colors.text.muted} />
          </Pressable>

          {pickerOpen && (
            <View style={[styles.pickerList, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
              {loadingItems ? (
                <ActivityIndicator color={primary[500]} style={{ padding: 16 }} />
              ) : (
                items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.pickerItem, { borderColor: tokens.colors.border.light }]}
                    onPress={() => { setSelectedItem(item); setPickerOpen(false) }}
                  >
                    <Text style={[styles.pickerItemText, { color: tokens.colors.text.primary }]}>
                      {item.item_name}
                    </Text>
                    <Text style={[styles.pickerItemUofm, { color: tokens.colors.text.muted }]}>
                      {item.uofm_abbreviation}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Quantity */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
              {t('inventory.quantity') || 'Quantity'}
            </Text>
            <TextInput
              style={[styles.input, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={tokens.colors.text.muted}
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
              {t('inventory.notes') || 'Notes (optional)'}
            </Text>
            <TextInput
              style={[styles.textarea, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor={tokens.colors.text.muted}
            />
          </View>

          {/* Save button */}
          <Pressable
            style={[styles.btn, { backgroundColor: primary[600], opacity: saving || !selectedItem || !quantity ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving || !selectedItem || !quantity}
          >
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{t('inventory.saveEntry') || 'Save Entry'}</Text>
            )}
          </Pressable>

          {/* Existing entries */}
          {existingEntries.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
                {t('inventory.existingEntries') || 'Shift Entries'}
              </Text>
              {existingEntries.map((e, i) => (
                <View key={`${e.entry_number}-${i}`} style={[styles.entryRow, { borderColor: tokens.colors.border.light }]}>
                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryName, { color: tokens.colors.text.primary }]}>{e.item_name}</Text>
                    <Text style={[styles.entryDate, { color: tokens.colors.text.muted }]}>{e.date}</Text>
                  </View>
                  <Text style={[styles.entryQty, { color: tokens.colors.text.primary }]}>
                    {e.quantity} {e.uofm}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48 },
  pickerText: { fontSize: 15 },
  pickerList: { borderWidth: 1, borderRadius: 10, maxHeight: 200, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerItemText: { fontSize: 14, fontWeight: '500' },
  pickerItemUofm: { fontSize: 13 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 16 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 60 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { marginTop: 8, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  entryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '500' },
  entryDate: { fontSize: 12, marginTop: 1 },
  entryQty: { fontSize: 14, fontWeight: '600' },
})
