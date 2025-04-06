import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Alert, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

export default function ProfilePictureScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        gestureEnabled: false,
        headerShown: false,
        headerBackVisible: false,
        animation: 'none'
      }} />
      <ProfilePictureContent />
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

function ProfilePictureContent() {
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pickImage = async () => {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch the image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      if (profileImage) {
        // Create form data for file upload
        const formData = new FormData();
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        // @ts-ignore - TypeScript doesn't handle FormData well in React Native
        formData.append('profilePicture', {
          uri: profileImage,
          name: filename || 'profile.jpg',
          type,
        });
        
        console.log('FormData created with:', {
          uri: profileImage,
          name: filename || 'profile.jpg',
          type
        });
        
        // Get the token from AsyncStorage
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Upload the profile picture
        console.log('Uploading to:', `${getBaseUrl()}/patient/update-profile`);
        console.log('Using token:', token);
        
        // Don't set Content-Type header when using FormData with fetch
        // The browser will automatically set the correct boundary
        const response = await fetch(`${getBaseUrl()}/patient/update-profile`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload profile picture');
        }
        
        console.log('Profile picture uploaded successfully');
      }
      
      // Show success message
      Alert.alert(
        'Success',
        'Profile picture uploaded successfully',
        [{ text: 'OK', onPress: () => router.replace('/about-me') }]
      );
    } catch (error) {
      console.error('Profile picture upload error:', error);
      Alert.alert(
        'Upload Error',
        `Error: ${error.message}. You can continue without a profile picture.`,
        [
          { text: 'Try Again', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => router.replace('/about-me') }
        ]
      );
      setErrorMessage(`Failed to upload: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add a Profile Picture</Text>
          <Text style={styles.subtitle}>
            Help others recognize you in the community
          </Text>
        </View>
        
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        
        <View style={styles.imageContainer}>
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={80} color="#d1d5db" />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickImage}
          >
            <Ionicons name="camera-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.uploadButtonText}>
              {profileImage ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.continueButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.replace('/about-me')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 24,
  },
  placeholderImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
