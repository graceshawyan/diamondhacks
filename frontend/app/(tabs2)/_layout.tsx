import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the appropriate base URL depending on the platform
const getBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Use actual IP address for Expo Go
      return 'http://172.20.10.6:5000';
    } else if (Platform.OS === 'ios') {
      // Use actual IP address for iOS 
      return 'http://172.20.10.6:5000';
    } else {
      return 'http://localhost:5000'; // Web
    }
  }
  // Return production URL if not in development
  return 'https://your-production-server.com';
};

export default function TabLayout() {
  // Prevent going back to login, welcome, or loading pages
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0d9488',
        headerStyle: {
          backgroundColor: '#0d9488',
        },
        headerTitleStyle: {
          color: 'white',
        },
        headerTintColor: 'white',
        // Prevent swiping on all screens
        gestureEnabled: false,
        // Disable animations for swipe gestures
        animation: 'none',
        // Disable hardware back button
        headerBackVisible: false,
        tabBarStyle: {
          height: 60,
          borderTopWidth: 0,
          elevation: 0, // for Android
          shadowOpacity: 0, // for iOS
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          gestureEnabled: false,
          animation: 'none',
        }}
      />
       {/* Search tab */}
       <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="people" size={24} color={color} />
          ),
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      
      {/* Meds tab is always shown in tabs2 layout */}
      <Tabs.Screen
        name="meds"
        options={{
          title: 'Medications',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="medkit" size={24} color={color} />
          ),
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      
      {/* Profile tab always appears last */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
          gestureEnabled: false,
          animation: 'none',
        }}
      />
    </Tabs>
  );
}


