import { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSofiaTheme } from '@/theme/sofia-theme';

export type ScreenPlaceholderAction = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

type ScreenPlaceholderProps = {
  title: string;
  description: string;
  hint?: string;
  actions?: ScreenPlaceholderAction[];
  accessory?: ReactNode;
};

export function ScreenPlaceholder({
  title,
  description,
  hint,
  actions = [],
  accessory,
}: ScreenPlaceholderProps) {
  const { tokens } = useSofiaTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}> 
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: tokens.colors.text.primary }]}>{title}</Text>
        <Text style={[styles.description, { color: tokens.colors.text.secondary }]}>{description}</Text>
        {hint ? <Text style={[styles.hint, { color: tokens.colors.text.muted }]}>{hint}</Text> : null}
      </View>

      {accessory}

      {actions.length > 0 ? (
        <View style={styles.actionList}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              disabled={action.disabled}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                backgroundColor: action.disabled
                  ? tokens.colors.border.default
                  : tokens.colors.primary[600],
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 999,
              })}
              android_ripple={{ color: tokens.colors.primary[200] }}
              onPress={action.onPress}
            >
              <Text style={styles.actionLabel}>
                {action.label ?? t('placeholder.cta', 'Coming soon')}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 24,
  },
  headerBlock: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
  },
  actionList: {
    gap: 12,
  },
  actionLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
