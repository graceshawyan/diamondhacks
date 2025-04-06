import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Switch, Platform, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';



export default function AboutMeScreen() {
  // Add Stack options to disable gestures
  return (
    <>
      <Stack.Screen options={{ 
        gestureEnabled: false,
        headerShown: false,
        // Prevent going back with the hardware back button
        headerBackVisible: false,
        // Prevent going back with swipe gesture
        animation: 'none'
      }} />
      <AboutMeContent />
    </>
  );
}

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

function AboutMeContent() {
  const [age, setAge] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [condition, setCondition] = useState('');
  const [bio, setBio] = useState('');
  const [isUsingProduct, setIsUsingProduct] = useState(false);
  
  console.log('isUsingProduct state:', isUsingProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Prevent going back with hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const handleContinue = async () => {
    // Reset error message
    setErrorMessage('');
    
    if (!condition) {
      setErrorMessage('Please enter what you\'re recovering from');
      return;
    }
    if (!pronouns) {
      setErrorMessage('Please enter your pronouns');
      return;
    }
    if (!age) {
      setErrorMessage('Please enter your age');
      return;
    }
    
    // Validate age is a number and 18+
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setErrorMessage('You must be 18 or older to use this app');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Call the backend API to update the profile
      const response = await fetch(`${getBaseUrl()}/patient/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          age: parseInt(age, 10),
          pronouns,
          condition,
          bio,
          product: isUsingProduct === true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
        return;
      }
      
      // Get the user token from storage
      const token2 = await AsyncStorage.getItem('authToken');
      if (!token2) {
        router.replace('/welcome');
        return;
      }
      
      // Fetch user info to check product status
      const userInfoResponse = await fetch(`${getBaseUrl()}/patient/user-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token2}`
        }
      });
      
      if (userInfoResponse.ok) {
        const userData = await userInfoResponse.json();
        console.log('User info data:', JSON.stringify(userData, null, 2));
        
        // Check if this user should see the meds tab
        console.log('Product field raw value:', userData.data?.patient?.product);
        console.log('Product field type:', typeof userData.data?.patient?.product);
        
        // Explicitly convert to boolean using triple equals to ensure proper type checking
        const hasMedsAccess = userData.data?.patient?.product === true;
        console.log('Final meds access decision:', hasMedsAccess);
        
        if (hasMedsAccess) {
          // Product is true, route to tabs2 layout
          router.replace('/(tabs2)/home');
        } else {
          // Product is false, route to original tabs layout
          router.replace('/(tabs)/home');
        }
      } else {
        // If we can't check product status, default to original tabs
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>        
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself!</Text>
        </View>
        
        <View style={styles.form}>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your age (must be 18+)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pronouns*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your pronouns"
                placeholderTextColor="#9ca3af"
                value={pronouns}
                onChangeText={setPronouns}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Recovering From*</Text>
              <TouchableOpacity 
                onPress={() => alert('You may list multiple conditions separated by commas')}
                style={styles.helpIcon}
              >
                <Ionicons name="help-circle-outline" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter what you are recovering from"
                placeholderTextColor="#9ca3af"
                value={condition}
                onChangeText={setCondition}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.textArea}
              placeholder="About You"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
            />
          </View>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Are you using ClamShell?</Text>
            <Switch
              trackColor={{ false: '#d1d5db', true: '#0d9488' }}
              thumbColor={isUsingProduct ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#d1d5db"
              onValueChange={(value) => {
                console.log('Toggle switched to:', value);
                setIsUsingProduct(value);
              }}
              value={isUsingProduct}
            />
          </View>
          
          <Text style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" /> 
            {' '}Your information is private and only shared according to your privacy settings
          </Text>
          
          <TouchableOpacity 
            style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.continueButtonText}>Setting up your profile...</Text>
            ) : (
              <Text style={styles.continueButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 30,
  },
  header: {
    marginBottom: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  helpIcon: {
    marginLeft: 5,
    padding: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#f9fafb',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 14,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    minHeight: 80,
  },
  privacyNote: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 18,
    marginTop: 8,
    lineHeight: 19,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  continueButton: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 18,
  },
  continueButtonDisabled: {
    backgroundColor: '#0d948880',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
