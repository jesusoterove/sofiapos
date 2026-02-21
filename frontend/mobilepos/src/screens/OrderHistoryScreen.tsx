import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { useSofiaTheme } from '@/theme/sofia-theme'
import { openDatabase } from '@/db'
import { formatCurrency } from '@sofiapos/shared/utils'

interface OrderRow {
  order_number: string
  status: string
  total: number
  payment_method: string | null
  sync_status: string
  created_at: string
  table_id: number | null
  itemCount: number
}

export default function OrderHistoryScreen() {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const primary = tokens.colors.primary

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['order-history'],
    queryFn: async (): Promise<OrderRow[]> => {
      const db = await openDatabase()
      const rows = await db.getAllAsync<{
        order_number: string; status: string; total: number;
        payment_method: string | null; sync_status: string;
        created_at: string; table_id: number | null
      }>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100')

      const result: OrderRow[] = []
      for (const r of rows) {
        const countRow = await db.getFirstAsync<{ c: number }>(
          'SELECT COUNT(*) as c FROM order_items WHERE order_number = ?', [r.order_number]
        )
        result.push({ ...r, itemCount: countRow?.c ?? 0 })
      }
      return result
    },
    staleTime: 5_000,
  })

  const { data: detailItems = [] } = useQuery({
    queryKey: ['order-detail', selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return []
      const db = await openDatabase()
      return db.getAllAsync<{
        product_name: string; quantity: number; unit_price: number;
        total: number; tax_amount: number
      }>('SELECT * FROM order_items WHERE order_number = ?', [selectedOrder])
    },
    enabled: !!selectedOrder,
  })

  const selectedOrderData = orders.find((o) => o.order_number === selectedOrder)

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#22c55e'
      case 'draft': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return tokens.colors.text.muted
    }
  }

  const syncIcon = (sync: string) => {
    if (sync === 'synced') return { name: 'cloud' as const, color: '#22c55e' }
    return { name: 'cloud-upload' as const, color: '#f59e0b' }
  }

  const renderOrder = useCallback(({ item }: { item: OrderRow }) => {
    const active = selectedOrder === item.order_number
    const si = syncIcon(item.sync_status)
    return (
      <Pressable
        style={[styles.orderRow, { borderColor: active ? primary[500] : tokens.colors.border.light }, active && { backgroundColor: primary[50] ?? '#eff6ff' }]}
        onPress={() => setSelectedOrder(active ? null : item.order_number)}
      >
        <View style={styles.orderMain}>
          <View style={styles.orderTopRow}>
            <Text style={[styles.orderNumber, { color: tokens.colors.text.primary }]} numberOfLines={1}>
              {item.order_number}
            </Text>
            <FontAwesome name={si.name} size={13} color={si.color} />
          </View>
          <Text style={[styles.orderMeta, { color: tokens.colors.text.muted }]}>
            {new Date(item.created_at).toLocaleString()} · {item.itemCount} {t('orders.items') || 'items'}
            {item.table_id ? ` · ${t('sell.table') || 'Table'} ${item.table_id}` : ''}
          </Text>
        </View>
        <View style={styles.orderRight}>
          <Text style={[styles.orderTotal, { color: tokens.colors.text.primary }]}>{formatCurrency(item.total)}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </Pressable>
    )
  }, [selectedOrder, tokens, primary, t])

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
          {t('orders.title') || 'Orders'}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_number}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={primary[500]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="file-text-o" size={40} color={tokens.colors.text.muted} />
              <Text style={[styles.emptyText, { color: tokens.colors.text.muted }]}>
                {t('orders.noOrders') || 'No orders yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Inline detail panel */}
      {selectedOrder && selectedOrderData && (
        <View style={[styles.detailPanel, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
          <View style={[styles.detailHeader, { borderColor: tokens.colors.border.light }]}>
            <Text style={[styles.detailTitle, { color: tokens.colors.text.primary }]}>
              {selectedOrderData.order_number}
            </Text>
            <Pressable onPress={() => setSelectedOrder(null)} hitSlop={8}>
              <FontAwesome name="times" size={18} color={tokens.colors.text.secondary} />
            </Pressable>
          </View>

          <FlatList
            data={detailItems}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: 14 }}
            renderItem={({ item }) => (
              <View style={[styles.detailRow, { borderColor: tokens.colors.border.light }]}>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailProduct, { color: tokens.colors.text.primary }]}>{item.product_name}</Text>
                  <Text style={[styles.detailQty, { color: tokens.colors.text.muted }]}>
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </Text>
                </View>
                <Text style={[styles.detailLineTotal, { color: tokens.colors.text.primary }]}>{formatCurrency(item.total)}</Text>
              </View>
            )}
          />

          <View style={[styles.detailFooter, { borderColor: tokens.colors.border.default }]}>
            <Text style={[styles.detailTotalLabel, { color: tokens.colors.text.primary }]}>{t('sell.total') || 'Total'}</Text>
            <Text style={[styles.detailTotalValue, { color: primary[600] }]}>{formatCurrency(selectedOrderData.total)}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBar: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  listContent: { paddingHorizontal: 12, paddingBottom: 200 },
  orderRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  orderMain: { flex: 1, marginRight: 10 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderNumber: { fontSize: 14, fontWeight: '600', flex: 1 },
  orderMeta: { fontSize: 12, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  detailPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '50%', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  detailTitle: { fontSize: 15, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  detailInfo: { flex: 1 },
  detailProduct: { fontSize: 14, fontWeight: '500' },
  detailQty: { fontSize: 12, marginTop: 1 },
  detailLineTotal: { fontSize: 14, fontWeight: '600' },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1 },
  detailTotalLabel: { fontSize: 16, fontWeight: '700' },
  detailTotalValue: { fontSize: 16, fontWeight: '700' },
})
