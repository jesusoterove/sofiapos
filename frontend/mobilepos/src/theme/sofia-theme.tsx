import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { themeTokens } from '@sofiapos/shared/theme';

export type SofiaThemeContextValue = {
  mode: 'light' | 'dark';
  tokens: typeof themeTokens.sofia;
};

const SofiaThemeContext = createContext<SofiaThemeContextValue>({
  mode: 'light',
  tokens: themeTokens.sofia,
});

export function SofiaThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();

  const value = useMemo(() => {
    return {
      mode: systemScheme === 'dark' ? 'dark' : 'light',
      tokens: themeTokens.sofia,
    } satisfies SofiaThemeContextValue;
  }, [systemScheme]);

  return <SofiaThemeContext.Provider value={value}>{children}</SofiaThemeContext.Provider>;
}

export function useSofiaTheme() {
  return useContext(SofiaThemeContext);
}
