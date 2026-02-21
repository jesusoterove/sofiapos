import { ScrollView, Pressable, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface Category {
  id: number
  name: string
}

interface CategoryChipsProps {
  categories: Category[]
  selectedId?: number
  onSelect: (id: number | undefined) => void
}

export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const primary = tokens.colors.primary

  const isAll = selectedId === undefined

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <Pressable
        style={[
          styles.chip,
          { borderColor: isAll ? primary[500] : tokens.colors.border.default },
          isAll && { backgroundColor: primary[500] },
        ]}
        onPress={() => onSelect(undefined)}
        accessibilityRole="button"
        accessibilityLabel={t('sell.allCategories') || 'All'}
        accessibilityState={{ selected: isAll }}
      >
        <Text style={[styles.chipText, { color: isAll ? '#fff' : tokens.colors.text.secondary }]} allowFontScaling>
          {t('sell.allCategories') || 'All'}
        </Text>
      </Pressable>

      {categories.map((cat) => {
        const active = selectedId === cat.id
        return (
          <Pressable
            key={cat.id}
            style={[
              styles.chip,
              { borderColor: active ? primary[500] : tokens.colors.border.default },
              active && { backgroundColor: primary[500] },
            ]}
            onPress={() => onSelect(active ? undefined : cat.id)}
            accessibilityRole="button"
            accessibilityLabel={cat.name}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : tokens.colors.text.secondary }]} allowFontScaling>
              {cat.name}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
})
