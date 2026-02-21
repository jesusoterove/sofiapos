import { View, TextInput, Pressable, StyleSheet } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const { tokens } = useSofiaTheme()

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.paper, borderColor: tokens.colors.border.default }]}>
      <FontAwesome name="search" size={16} color={tokens.colors.text.muted} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: tokens.colors.text.primary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        allowFontScaling
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <FontAwesome name="times-circle" size={16} color={tokens.colors.text.muted} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 42 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, height: '100%' },
})
