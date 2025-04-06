import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

// Import screens
import AuthScreen from './screens/AuthScreen';
import AboutMeScreen from './screens/AboutMeScreen';
import TimelineScreen from './screens/TimelineScreen';
import ProgressScreen from './screens/ProgressScreen';
import CommunityScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';

// Define types
type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
  route: { name: string };
};

// Define navigation types
export type RootStackParamList = {
  Auth: undefined;
  AboutMe: undefined;
  Main: undefined;
};

export type RootTabParamList = {
  Timeline: undefined;
  Progress: undefined;
  Community: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const icons = {
  Timeline: '📊',
  Progress: '📈',
  Community: '👥',
  Profile: '👤',
} as const;

interface TabIconProps {
  name: keyof typeof icons;
  focused: boolean;
}

// Simple icon component to replace actual icons for now
const TabIcon: React.FC<TabIconProps> = ({ name, focused }) => (
  <View className="items-center justify-center">
    <Text className="text-xl">{icons[name]}</Text>
    <Text className={`text-xs ${focused ? 'text-teal-600' : 'text-gray-500'}`}>
      {name}
    </Text>
  </View>
);



// Main tab navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name as keyof typeof icons} focused={focused} />
        ),
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#6b7280',
      })}
    >
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
    paddingBottom: 5,
    height: 60,
    backgroundColor: '#ffffff',
  },
});

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="AboutMe" component={AboutMeScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;