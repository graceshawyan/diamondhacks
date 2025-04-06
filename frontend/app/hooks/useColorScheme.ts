import { useColorScheme as _useColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

export default function useColorScheme(): ColorScheme {
  const colorScheme = _useColorScheme();
  return colorScheme ?? 'light';
}
