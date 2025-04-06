import { useColorScheme as _useColorScheme } from 'react-native';

/**
 * Custom hook to get the current color scheme ('light' or 'dark').
 * This wraps React Native's useColorScheme for potential future extensions.
 */
export default function useColorScheme(): 'light' | 'dark' {
  return _useColorScheme() || 'light';
}