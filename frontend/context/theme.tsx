import { createContext, useContext } from 'react';

const ThemeContext = createContext({
  isDark: false,
});

export function ThemeProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: boolean;
}) {
  return (
    <ThemeContext.Provider value={{ isDark: value }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  return theme;
}
