import { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';

import { useSofiaTheme } from '@/theme/sofia-theme';

export function TabletShell({ children }: PropsWithChildren) {
  const { tokens } = useSofiaTheme();

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        {/* Tablet nav content is injected via TabLayout */}
      </View>
      <View style={[styles.content, { backgroundColor: tokens.colors.background.default }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
  },
  content: {
    flex: 1,
  },
});
