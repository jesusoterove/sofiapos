import React, { useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import {
  BottomTabBar,
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSofiaTheme } from '@/theme/sofia-theme';

const TABLET_BREAKPOINT = 768;
const TABLET_NAV_WIDTH = 240;

type TabDefinition = {
  name: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  labelKey: string;
  fallback: string;
};

const TAB_DEFINITIONS: TabDefinition[] = [
  { name: 'index', icon: 'shopping-basket', labelKey: 'tabs.sell', fallback: 'Sell' },
  { name: 'tables', icon: 'th-large', labelKey: 'tabs.tables', fallback: 'Tables' },
  { name: 'orders', icon: 'list-alt', labelKey: 'tabs.orders', fallback: 'Orders' },
  { name: 'inventory', icon: 'archive', labelKey: 'tabs.inventory', fallback: 'Inventory' },
  { name: 'settings', icon: 'sliders', labelKey: 'tabs.settings', fallback: 'Settings' },
];

export default function TabLayout() {
  const { tokens } = useSofiaTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const tabLabels = useMemo(() => {
    return TAB_DEFINITIONS.reduce<Record<string, string>>((acc, tab) => {
      acc[tab.name] = t(tab.labelKey, tab.fallback);
      return acc;
    }, {});
  }, [t]);

  const tabScreens = useMemo(() => {
    return TAB_DEFINITIONS.map((tab) => (
      <Tabs.Screen
        key={tab.name}
        name={tab.name}
        options={{
          title: tabLabels[tab.name],
          tabBarIcon: ({ color }) => <FontAwesome size={24} name={tab.icon} color={color} />,
          headerShown: false,
        }}
      />
    ));
  }, [tabLabels]);

  const screenOptions = useMemo<BottomTabNavigationOptions>(() => {
    const activeTint = tokens.colors.primary[600] ?? tokens.colors.primary[500];
    const inactiveTint = tokens.colors.text.muted;
    const borderColor = tokens.colors.border.default;

    return {
      tabBarActiveTintColor: activeTint,
      tabBarInactiveTintColor: inactiveTint,
      tabBarStyle: isTablet
        ? {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: TABLET_NAV_WIDTH,
            backgroundColor: tokens.colors.background.paper,
            borderRightColor: borderColor,
            borderRightWidth: StyleSheet.hairlineWidth,
            paddingVertical: 24,
          }
        : {
            backgroundColor: tokens.colors.background.paper,
            borderTopColor: borderColor,
            height: 70,
            paddingBottom: 10,
          },
      tabBarLabelStyle: {
        fontSize: isTablet ? 14 : 12,
        textAlign: isTablet ? 'left' : 'center',
      },
      tabBarItemStyle: isTablet
        ? { width: '100%', alignItems: 'flex-start', paddingHorizontal: 16 }
        : undefined,
      tabBarIconStyle: isTablet ? { marginRight: 12 } : undefined,
    };
  }, [isTablet, tokens.colors]);

  return (
    <View style={styles.container}>
      <View style={[styles.content, isTablet && { marginLeft: TABLET_NAV_WIDTH }]}> 
        <Tabs
          screenOptions={screenOptions}
          tabBar={(props) =>
            isTablet ? (
              <TabletTabBar {...props} tokens={tokens} labels={tabLabels} />
            ) : (
              <BottomTabBar {...props} />
            )
          }
        >
          {tabScreens}
        </Tabs>
      </View>
    </View>
  );
}

type TabletTabBarProps = BottomTabBarProps & {
  tokens: ReturnType<typeof useSofiaTheme>['tokens'];
  labels: Record<string, string>;
};

function TabletTabBar({ state, navigation, tokens, labels }: TabletTabBarProps) {
  return (
    <View style={[styles.tabletBar, { backgroundColor: tokens.colors.background.paper }]}> 
      <View style={styles.brandBlock}>
        <Text style={[styles.brandTitle, { color: tokens.colors.text.primary }]}>SofiaPOS</Text>
        <Text style={[styles.brandCaption, { color: tokens.colors.text.muted }]}>Mobile beta shell</Text>
      </View>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabletItem}
          >
            <FontAwesome
              name={TAB_DEFINITIONS.find((tab) => tab.name === route.name)?.icon ?? 'circle'}
              size={20}
              color={isFocused ? tokens.colors.primary[600] : tokens.colors.text.muted}
            />
            <Text
              style={{
                color: isFocused ? tokens.colors.text.primary : tokens.colors.text.secondary,
                fontWeight: isFocused ? '600' : '500',
              }}
            >
              {labels[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  tabletBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: TABLET_NAV_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  brandBlock: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 4,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  brandCaption: {
    fontSize: 12,
  },
  tabletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
