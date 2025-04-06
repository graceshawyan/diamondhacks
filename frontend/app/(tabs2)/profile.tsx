import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://172.20.10.6:5000';
    } else if (Platform.OS === 'ios') {
      return 'http://172.20.10.6:5000';
    } else {
      return 'http://localhost:5000';
    }
  }
  return 'https://your-production-server.com';
};

// Default avatar to use when user doesn't have a profile image
const DEFAULT_AVATAR = 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg';

export default function ProfileScreen() {
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    password: '',
    confirmPassword: '',
    pronouns: '',
    condition: '',
    bio: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          router.replace('/welcome');
          return;
        }

        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/patient/user-info`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.data.patient);

          setFormData({
            username: data.data.patient.name || '',
            age: data.data.patient.age ? data.data.patient.age.toString() : '',
            password: '',
            confirmPassword: '',
            pronouns: data.data.patient.pronouns || '',
            condition: data.data.patient.condition || '',
            bio: data.data.patient.bio || '',
          });
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const baseUrl = getBaseUrl();
      
      // Prepare data for update
      const updateData = {
        name: formData.username,
        age: formData.age ? parseInt(formData.age) : null,
        pronouns: formData.pronouns,
        condition: formData.condition,
        bio: formData.bio
      };
      
      // Handle password update if provided
      if (formData.password && formData.password === formData.confirmPassword && formData.password.length > 0) {
        updateData.password = formData.password;
      }
      
      const response = await fetch(`${baseUrl}/patient/update-profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        // Refresh user data after update
        const dataResponse = await fetch(`${baseUrl}/patient/user-info`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setUserData(data.data.patient);
          
          // Update form data with new values
          setFormData(prev => ({
            ...prev,
            username: data.data.patient.name || '',
            age: data.data.patient.age ? data.data.patient.age.toString() : '',
            pronouns: data.data.patient.pronouns || '',
            condition: data.data.patient.condition || '',
            bio: data.data.patient.bio || '',
            password: '',
            confirmPassword: ''
          }));
        }
        
        setShowSettings(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.topSection}>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#0d9488" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileBox}>
          <Image 
            source={{ 
              uri: userData?.pfp ? `${getBaseUrl()}/${userData.pfp}` : DEFAULT_AVATAR 
            }} 
            style={styles.avatar} 
          />
          <Text style={styles.username}>@{userData?.name || 'username'}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.stats?.postsCount || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.stats?.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.stats?.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bioBox}>
          {userData?.pronouns && (
            <View style={styles.bioRow}>
              <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.bioIcon} />
              <Text style={styles.bioText}>{userData.pronouns}</Text>
            </View>
          )}

          {userData?.condition && (
            <View style={styles.bioRow}>
              <Ionicons name="medical-outline" size={20} color="#6b7280" style={styles.bioIcon} />
              <Text style={styles.bioText}>{userData.condition}</Text>
            </View>
          )}

          {userData?.bio && (
            <View style={styles.bioRow}>
              <Ionicons name="document-text-outline" size={20} color="#6b7280" style={styles.bioIcon} />
              <Text style={styles.bioText}>{userData.bio}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showSettings}
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.profilePicSection}>
                <Image 
                  source={{ 
                    uri: userData?.pfp ? `${getBaseUrl()}/${userData.pfp}` : DEFAULT_AVATAR 
                  }} 
                  style={styles.settingsAvatar} 
                />
              <TouchableOpacity 
                style={[styles.uploadButton, uploadingImage && styles.disabledButton]} 
                disabled={uploadingImage}
                onPress={async () => {
                  try {
                    // Open image picker
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 0.7,
                    });

                    if (!result.cancelled && result.assets && result.assets[0]) {
                      // Upload the image
                      setUploadingImage(true);
                      const token = await AsyncStorage.getItem('authToken');
                      
                      if (!token) {
                        console.error('No auth token');
                        return;
                      }

                      // Create FormData for upload
                      const formData = new FormData();
                      formData.append('profilePicture', {
                        uri: result.assets[0].uri,
                        type: 'image/jpeg',
                        name: 'profile-picture.jpg',
                      });

                      // Upload to server
                      const baseUrl = getBaseUrl();
                      const response = await fetch(`${baseUrl}/patient/upload-pfp`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'multipart/form-data',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: formData,
                      });

                      if (response.ok) {
                        // Refresh user data to get updated profile picture
                        const updatedUserResponse = await fetch(`${baseUrl}/patient/user-info`, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        if (updatedUserResponse.ok) {
                          const data = await updatedUserResponse.json();
                          setUserData(data.data.patient);
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Error uploading image:', error);
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={20} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => updateFormData('username', text)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(text) => updateFormData('age', text)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pronouns</Text>
              <TextInput
                style={styles.input}
                value={formData.pronouns}
                onChangeText={(text) => updateFormData('pronouns', text)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={userData?.email || ''}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                placeholder="Enter new password"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                secureTextEntry
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                placeholder="Confirm new password"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pronouns</Text>
              <TextInput
                style={styles.input}
                value={formData.pronouns}
                onChangeText={(text) => updateFormData('pronouns', text)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Recovering From</Text>
              <TextInput
                style={styles.input}
                value={formData.condition}
                onChangeText={(text) => updateFormData('condition', text)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => updateFormData('bio', text)}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#0d9488',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  settingsButton: {
    padding: 10,
  },
  profileBox: {
    backgroundColor: '#F8F5F0',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
  },
  statsContainer: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    width: '33%',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  bioBox: {
    backgroundColor: '#F8F5F0',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  bioRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bioIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bioText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    padding: 16,
  },
  profilePicSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0d9488',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
