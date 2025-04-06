import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Format medication data from API to display format
const formatMedicationData = (medSchedule) => {
  if (!medSchedule) return [];
  
  const formatted = [];
  let id = 1;
  
  Object.entries(medSchedule).forEach(([name, schedule]) => {
    // Create human-readable frequency and time strings
    const days = Object.keys(schedule);
    const times = new Set();
    
    days.forEach(day => {
      schedule[day].forEach(time => {
        times.add(time);
      });
    });
    
    let frequency;
    if (days.length === 7) {
      frequency = 'Daily';
    } else if (days.length === 1) {
      frequency = `Every ${days[0]}`;
    } else {
      frequency = `${days.join(', ')}`;
    }
    
    formatted.push({
      id: String(id++),
      name,
      dosage: '', // API doesn't provide dosage yet
      frequency,
      time: Array.from(times).join(', '),
      active: true,
      rawSchedule: schedule // Keep original schedule for edits
    });
  });
  
  return formatted;
};

export default function MedicationsScreen() {
  const [medications, setMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch medications from API
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Get base URL
        const baseUrl = getBaseUrl();
        
        // Fetch medication schedule
        const response = await fetch(`${baseUrl}/medications`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Med API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Medication data:', JSON.stringify(data, null, 2));
          
          if (data.data && data.data.med_schedule) {
            const formattedMeds = formatMedicationData(data.data.med_schedule);
            setMedications(formattedMeds);
          } else {
            // Empty medication list
            setMedications([]);
          }
        } else {
          setError('Failed to fetch medications');
        }
      } catch (error) {
        console.error('Error fetching medications:', error);
        setError('An error occurred while fetching medications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedications();
  }, []);

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMedicationStatus = (id) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, active: !med.active } : med
    ));
    // In a real app, we would sync this change with the backend
  };

  const addMedication = () => {
    // Navigate to add medication screen or show modal
    Alert.alert('Add Medication', 'This feature will be implemented soon!');
  };

  const editMedication = (medication) => {
    // Navigate to edit medication screen or show modal
    Alert.alert('Edit Medication', 'This feature will be implemented soon!');
  };

  const deleteMedication = async (medication) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                Alert.alert('Error', 'Authentication token not found');
                return;
              }
              
              const baseUrl = getBaseUrl();
              const response = await fetch(`${baseUrl}/medications/${encodeURIComponent(medication.name)}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                // Remove from local state
                setMedications(medications.filter(med => med.id !== medication.id));
                Alert.alert('Success', `${medication.name} has been deleted`);
              } else {
                Alert.alert('Error', 'Failed to delete medication');
              }
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'An error occurred while deleting the medication');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              // Force re-fetch by remounting component
              setTimeout(() => {
                setError(null);
                setLoading(false);
              }, 1000);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medications</Text>
          <TouchableOpacity style={styles.addButton} onPress={addMedication}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <View style={styles.medicationsContainer}>
          {filteredMedications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={60} color="#9ca3af" />
              <Text style={styles.noMedsText}>No medications found</Text>
              <TouchableOpacity style={styles.addMedButton} onPress={addMedication}>
                <Text style={styles.addMedButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredMedications.map(medication => (
              <View key={medication.id} style={[styles.medicationCard, !medication.active && styles.inactiveMedication]}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationTitleContainer}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    {medication.dosage && <Text style={styles.medicationDosage}>{medication.dosage}</Text>}
                  </View>
                  <Switch
                    value={medication.active}
                    onValueChange={() => toggleMedicationStatus(medication.id)}
                    trackColor={{ false: '#d1d5db', true: '#0d948880' }}
                    thumbColor={medication.active ? '#0d9488' : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.medicationDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={18} color="#6b7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{medication.frequency}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="alarm-outline" size={18} color="#6b7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{medication.time}</Text>
                  </View>
                </View>
                
                <View style={styles.medicationActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => editMedication(medication)}>
                    <Ionicons name="create-outline" size={18} color="#0d9488" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="notifications-outline" size={18} color="#0d9488" />
                    <Text style={styles.actionText}>Reminders</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => deleteMedication(medication)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#0d9488',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  medicationsContainer: {
    marginBottom: 20,
    flex: 1,
  },
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveMedication: {
    opacity: 0.7,
    backgroundColor: '#f3f4f6',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationTitleContainer: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6b7280',
  },
  medicationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  medicationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#0d9488',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  noMedsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 20,
  },
  addMedButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addMedButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
