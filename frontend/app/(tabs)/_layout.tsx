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
      return 'http://100.64.217.136:5001';
    } else if (Platform.OS === 'ios') {
      // Use actual IP address for iOS 
      return 'http://100.64.217.136:5001';
    } else {
      return 'http://localhost:5001'; // Web
    }
  }
  // Return production URL if not in development
  return 'https://your-production-server.com';
};

export default function TabLayout() {
  const [showMedsTab, setShowMedsTab] = useState(false);
  
  // Prevent going back to login, welcome, or loading pages
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);
  
  // Check if user is using product to show Meds tab
  useEffect(() => {
    const checkUserProduct = async () => {
      try {
        console.log('Checking user product status...');
        
        // Get the token from AsyncStorage
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found');
          return;
        }
        console.log('Auth token found');
        
        // Get base URL
        const baseUrl = getBaseUrl();
        console.log('Using base URL:', baseUrl);
        
        // Fetch user info
        console.log('Fetching user info...');
        const response = await fetch(`${baseUrl}/patient/user-info`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('User info response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('User info data:', JSON.stringify(data, null, 2));
          
          if (data.data && data.data.patient) {
            // Check if product is true
            const productStatus = data.data.patient.product === true;
            console.log('Product status:', productStatus);
            setShowMedsTab(productStatus);
          } else {
            console.log('Patient data not found in response');
          }
        } else {
          console.log('Failed to fetch user info');
        }
      } catch (error) {
        console.error('Error checking user product status:', error);
      }
    };
    
    checkUserProduct();
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
        name="chatbot"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
          gestureEnabled: false,
          animation: 'none',
        }}
      />
      
      {/* Always show Meds tab if showMedsTab is true - positioned before Profile */}
      {showMedsTab && (
        <Tabs.Screen
          name="meds"
          options={{
            title: 'Medications',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="medical" size={24} color={color} />
            ),
            gestureEnabled: false,
            animation: 'none',
          }}
        />
      )}
      
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