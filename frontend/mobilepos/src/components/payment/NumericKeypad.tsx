import { View, Pressable, Text, StyleSheet } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface NumericKeypadProps {
  onNumberPress: (num: string) => void
  onDecimalPress: () => void
  onBackspace: () => void
  onClear: () => void
}

const KEYS: Array<Array<{ label: string; value: string; type?: 'number' | 'action' }>> = [
  [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }],
  [{ label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }],
  [{ label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }],
  [{ label: '.', value: '.', type: 'action' }, { label: '0', value: '0' }, { label: '00', value: '00' }],
]

export function NumericKeypad({ onNumberPress, onDecimalPress, onBackspace, onClear }: NumericKeypadProps) {
  const { tokens } = useSofiaTheme()

  const handlePress = (key: { label: string; value: string; type?: string }) => {
    if (key.value === '.') {
      onDecimalPress()
    } else {
      onNumberPress(key.value)
    }
  }

  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key.value + key.label}
              style={[styles.key, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}
              onPress={() => handlePress(key)}
              android_ripple={{ color: tokens.colors.primary[100] ?? '#e0e0e0' }}
              accessibilityRole="button"
              accessibilityLabel={key.value === '.' ? 'Decimal point' : key.label}
            >
              <Text style={[styles.keyText, { color: tokens.colors.text.primary }]}>{key.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        <Pressable
          style={[styles.key, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}
          onPress={onClear}
          android_ripple={{ color: '#fecaca' }}
          accessibilityRole="button"
          accessibilityLabel="Clear"
        >
          <Text style={[styles.keyText, { color: '#ef4444' }]}>C</Text>
        </Pressable>
        <Pressable
          style={[styles.key, { flex: 2, borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}
          onPress={onBackspace}
          android_ripple={{ color: tokens.colors.primary[100] ?? '#e0e0e0' }}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
        >
          <FontAwesome name="arrow-left" size={20} color={tokens.colors.text.primary} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 56, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 22, fontWeight: '500' },
})
