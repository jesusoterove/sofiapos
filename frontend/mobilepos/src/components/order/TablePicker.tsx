import { View, Text, FlatList, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { openDatabase, getAllTables } from '@/db'

interface TablePickerProps {
  visible: boolean
  storeId: number
  selectedTableId?: number | null
  onSelect: (tableId: number | null) => void
  onClose: () => void
}

export function TablePicker({ visible, storeId, selectedTableId, onSelect, onClose }: TablePickerProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const primary = tokens.colors.primary

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', storeId],
    queryFn: async () => {
      const db = await openDatabase()
      return getAllTables(db, storeId)
    },
    staleTime: 5 * 60 * 1000,
    enabled: visible,
  })

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
        <View style={[styles.header, { borderColor: tokens.colors.border.light }]}>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            {t('sell.selectTable') || 'Select Table'}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <FontAwesome name="times" size={20} color={tokens.colors.text.secondary} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.tableItem, { borderColor: !selectedTableId ? primary[500] : tokens.colors.border.default }, !selectedTableId && { backgroundColor: primary[50] ?? '#eff6ff' }]}
          onPress={() => { onSelect(null); onClose() }}
        >
          <FontAwesome name="desktop" size={18} color={!selectedTableId ? primary[600] : tokens.colors.text.muted} />
          <Text style={[styles.tableName, { color: tokens.colors.text.primary }]}>
            {t('sell.cashRegister') || 'Cash Register'}
          </Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator size="large" color={primary[500]} style={styles.loader} />
        ) : (
          <FlatList
            data={tables}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const active = selectedTableId === item.id
              return (
                <Pressable
                  style={[styles.tableItem, { borderColor: active ? primary[500] : tokens.colors.border.default }, active && { backgroundColor: primary[50] ?? '#eff6ff' }]}
                  onPress={() => { onSelect(item.id); onClose() }}
                >
                  <FontAwesome name="cutlery" size={16} color={active ? primary[600] : tokens.colors.text.muted} />
                  <View style={styles.tableInfo}>
                    <Text style={[styles.tableName, { color: tokens.colors.text.primary }]}>
                      {item.name || `${t('sell.table') || 'Table'} ${item.table_number}`}
                    </Text>
                    {item.location && (
                      <Text style={[styles.tableMeta, { color: tokens.colors.text.muted }]}>{item.location}</Text>
                    )}
                  </View>
                  <Text style={[styles.tableCapacity, { color: tokens.colors.text.muted }]}>
                    {item.capacity} {t('sell.seats') || 'seats'}
                  </Text>
                </Pressable>
              )
            }}
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 18, fontWeight: '600' },
  loader: { marginTop: 40 },
  tableItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 12, marginTop: 8, padding: 14, borderWidth: 1.5, borderRadius: 12 },
  tableInfo: { flex: 1 },
  tableName: { fontSize: 15, fontWeight: '500' },
  tableMeta: { fontSize: 12, marginTop: 2 },
  tableCapacity: { fontSize: 12 },
})
