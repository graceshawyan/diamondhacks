import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import useColorScheme from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <ScrollView className="flex-1 p-6">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Profile
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
