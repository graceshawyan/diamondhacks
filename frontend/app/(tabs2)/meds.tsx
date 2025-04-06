import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  ActivityIndicator, 
  Alert,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      frequency,
      time: Array.from(times).join(', '),
      active: true,
      rawSchedule: schedule // Keep original schedule for edits
    });
  });
  
  return formatted;
};

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);  // Initialize with default time slots
  const [newMedication, setNewMedication] = useState({
    name: '',
    active: true, // Default to active medication
    selectedDays: [], // Default to no days selected
    timeSlots: {
      Sunday: ['08:00 AM'],
      Monday: ['08:00 AM'],
      Tuesday: ['08:00 AM'],
      Wednesday: ['08:00 AM'],
      Thursday: ['08:00 AM'],
      Friday: ['08:00 AM'],
      Saturday: ['08:00 AM']
    }
  });
  
  // Time picker state
  const [currentDay, setCurrentDay] = useState('');
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeSelectModal, setShowTimeSelectModal] = useState(false);
  
  // Time selection options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];
  
  // Animation for the modal
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Type definition for medication
  type Medication = {
    id: string;
    name: string;
    frequency: string;
    time: string;
    active: boolean;
    rawSchedule?: Record<string, string[]>;
  };

  // Format raw medication data from API
  const processMedicationData = (medSchedule: Record<string, any>): Medication[] => {
    if (!medSchedule) return [];
    
    const formatted: Medication[] = [];
    let id = 1;
    
    Object.entries(medSchedule).forEach(([name, medData]) => {
      // Extract active status and schedule from medication data
      const active = medData.active !== undefined ? medData.active : true;
      const schedule = medData.schedule || {};
      
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
        frequency,
        time: Array.from(times).join(', '),
        active: active,
        rawSchedule: schedule // Keep original schedule for edits
      });
    });
    
    return formatted;
  };
  
  // Function to fetch medications from API
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
      const response = await fetch(`${baseUrl}/patient/medications`, {
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
        
        if (data.data && data.data.med_schedule && Object.keys(data.data.med_schedule).length > 0) {
          const formattedMeds = processMedicationData(data.data.med_schedule);
          setMedications(formattedMeds);
        } else {
          // Empty medication list
          setMedications([]);
          setError('No medications found');
        }
      } 
      } catch (error) {
        console.error('Error fetching medications:', error);
        setError('An error occurred while fetching medications');
      } finally {
        setLoading(false);
      }
  };

  // Call fetchMedications when component mounts
  useEffect(() => {
    fetchMedications();
  }, []);

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle medication status (active/inactive)
  const toggleMedicationStatus = async (id: string) => {
    // Find the medication to toggle
    const medication = medications.find(med => med.id === id);
    if (!medication) return;
    
    // Update local state first for immediate feedback
    const updatedMedications = medications.map(med => {
      if (med.id === id) {
        return { ...med, active: !med.active };
      }
      return med;
    });
    setMedications(updatedMedications);
    
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Get base URL
      const baseUrl = getBaseUrl();
      
      // Prepare updated medication data
      const updatedMedData = {
        name: medication.name,
        active: !medication.active,
        timeSlots: medication.rawSchedule
      };
      
      // Send update to backend
      await fetch(`${baseUrl}/patient/medications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedMedData)
      });
      
      // No need to update state again as we already did it above
    } catch (error) {
      console.error('Error toggling medication status:', error);
      // Revert the local change if the API call failed
      setMedications(medications);
      Alert.alert('Error', 'Failed to update medication status');
    }
  };

  const addMedication = () => {
    // Show the add medication modal
    setNewMedication({
      name: '',
      selectedDays: [], // Default to no days selected
      timeSlots: {
        Sunday: ['8:00 AM'],
        Monday: ['8:00 AM'],
        Tuesday: ['8:00 AM'],
        Wednesday: ['8:00 AM'],
        Thursday: ['8:00 AM'],
        Friday: ['8:00 AM'],
        Saturday: ['8:00 AM']
      }
    });
    setModalVisible(true);
    
    // Animate the modal sliding up
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const closeModal = () => {
    // Animate the modal sliding down
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };
  
  const handleSubmitMedication = async () => {
    // Validate inputs
    if (!newMedication.name.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      // Get base URL
      const baseUrl = getBaseUrl();
      
      // Format medication data for API in the improved format
      const medData = {
        name: newMedication.name,
        active: newMedication.active
      };
      
      // Create a map with days as keys and time arrays as values
      const timeMap = {};
      
      // Add times for each selected day
      newMedication.selectedDays.forEach(day => {
        // Use the time slots as they are - they're already in the correct format
        timeMap[day] = newMedication.timeSlots[day];
      });
      
      // Add the time map to the medication data
      medData.timeSlots = timeMap;
      
      console.log('Sending medication data:', JSON.stringify(medData, null, 2));
      
      // Send to API
      const response = await fetch(`${baseUrl}/patient/medications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(medData)
      });
      
      if (response.ok) {
        // Refresh medications list by refetching data
        setLoading(true);
        await fetchMedications();
        setLoading(false);
        
        // Close modal and reset form
        closeModal();
        
        // Show success message
        Alert.alert('Success', 'Medication added successfully');
      } else {
        // Get response text first to diagnose issues
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(responseText);
          Alert.alert('Error', errorData.message || 'Failed to add medication');
        } catch (parseError) {
          // If not valid JSON, show the response status
          Alert.alert('Error', `Server error (${response.status}): Unable to add medication`);
        }
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      // More descriptive error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to add medication: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const deleteMedication = async (medication: Medication) => {
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
              const response = await fetch(`${baseUrl}/patient/medications/${encodeURIComponent(medication.name)}`, {
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
    // If it's just an empty medication list, don't show error with retry button
    if (error === 'No medications found') {
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
              <View style={styles.emptyContainer}>
                <Ionicons name="medkit-outline" size={60} color="#9ca3af" />
                <Text style={styles.noMedsText}>No medications found</Text>
                <TouchableOpacity style={styles.addMedButton} onPress={addMedication}>
                  <Text style={styles.addMedButtonText}>Add Medication</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }
    
    // For other errors, show the error with retry button
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
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMedication(medication)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Add Medication Modal */}
      {/* Time Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeSelectModal}
        onRequestClose={() => setShowTimeSelectModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimeSelectModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.timeSelectModalContainer}>
                <View style={styles.timeSelectModalHeader}>
                  <Text style={styles.timeSelectModalTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowTimeSelectModal(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.timeSelectModalList}>
                  {hours.map((hour) => (
                    <View key={hour} style={styles.timeGroupContainer}>
                      <Text style={styles.timeGroupHeader}>{hour}</Text>
                      {minutes.map((minute) => (
                        <View key={`${hour}-${minute}`} style={styles.hourPeriodContainer}>
                          {periods.map((period) => (
                            <TouchableOpacity
                              key={`${hour}-${minute}-${period}`}
                              style={styles.timeSelectOption}
                              onPress={() => {
                                // Update the time slot
                                const timeOption = `${hour}:${minute} ${period}`;
                                const updatedTimeSlots = {...newMedication.timeSlots};
                                updatedTimeSlots[currentDay][currentTimeIndex] = timeOption;
                                setNewMedication({
                                  ...newMedication,
                                  timeSlots: updatedTimeSlots
                                });
                                setShowTimeSelectModal(false);
                              }}
                            >
                              <Text style={styles.timeSelectOptionText}>{`${hour}:${minute} ${period}`}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Add Medication Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: 'flex-end' }}
              >
                <Animated.View 
                  style={[styles.modalContent, {
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [600, 0]
                      })
                    }]
                  }]}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Medication</Text>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <Ionicons name="close" size={24} color="#111827" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView contentContainerStyle={styles.modalScrollContent}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Medication Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter medication name"
                        value={newMedication.name}
                        onChangeText={(text) => setNewMedication({...newMedication, name: text})}
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <View style={styles.activeToggleContainer}>
                        <Text style={styles.formLabel}>Active</Text>
                        <Switch
                          value={newMedication.active}
                          onValueChange={(value) => {
                            setNewMedication({
                              ...newMedication,
                              active: value
                            });
                          }}
                          trackColor={{ false: '#d1d5db', true: '#10b981' }}
                          thumbColor={newMedication.active ? '#ffffff' : '#f3f4f6'}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Select Days</Text>
                      <View style={styles.dayCirclesContainer}>
                        {[
                          { day: 'Sunday', short: 'S' },
                          { day: 'Monday', short: 'M' },
                          { day: 'Tuesday', short: 'T' },
                          { day: 'Wednesday', short: 'W' },
                          { day: 'Thursday', short: 'T' },
                          { day: 'Friday', short: 'F' },
                          { day: 'Saturday', short: 'S' }
                        ].map((item, index) => (
                          <TouchableOpacity 
                            key={item.day}
                            style={[
                              styles.dayCircle, 
                              newMedication.selectedDays.includes(item.day) && styles.selectedDayCircle
                            ]}
                            onPress={() => {
                              // Toggle day selection
                              const updatedDays = [...newMedication.selectedDays];
                              const dayIndex = updatedDays.indexOf(item.day);
                              
                              if (dayIndex > -1) {
                                // Remove day if already selected
                                updatedDays.splice(dayIndex, 1);
                              } else {
                                // Add day if not selected
                                updatedDays.push(item.day);
                              }
                              
                              setNewMedication({
                                ...newMedication,
                                selectedDays: updatedDays
                              });
                            }}
                          >
                            <Text 
                              style={[
                                styles.dayCircleText, 
                                newMedication.selectedDays.includes(item.day) && styles.selectedDayCircleText
                              ]}
                            >
                              {item.short}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    {/* Time slots for each selected day */}
                    {newMedication.selectedDays.sort((a, b) => {
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return days.indexOf(a) - days.indexOf(b);
                    }).map(day => (
                      <View key={day} style={styles.dayTimeSlotContainer}>
                        <Text style={styles.dayLabel}>{day}</Text>
                        
                        {newMedication.timeSlots[day].map((time, index) => (
                          <View key={`${day}-${index}`} style={styles.timeSlotRow}>
                            <View style={styles.timeInputContainer}>
                              <View style={styles.timeSelectors}>
                                <View style={styles.hourSelector}>
                                  <TouchableOpacity 
                                    style={styles.timeSelectButton}
                                    onPress={() => {
                                      const currentHour = parseInt(time?.split(':')[0] || '12');
                                      const newHour = currentHour === 12 ? 1 : currentHour + 1;
                                      const currentMinute = time?.split(':')[1]?.split(' ')[0] || '00';
                                      const period = time?.includes('PM') ? 'PM' : 'AM';
                                      const updatedTimeSlots = {...newMedication.timeSlots};
                                      updatedTimeSlots[day][index] = `${newHour.toString().padStart(2, '0')}:${currentMinute} ${period}`;
                                      setNewMedication({
                                        ...newMedication,
                                        timeSlots: updatedTimeSlots
                                      });
                                    }}
                                  >
                                    <Ionicons name="chevron-up" size={16} color="#6b7280" />
                                  </TouchableOpacity>
                                  
                                  <Text style={styles.timeText}>{time?.split(':')[0] || '12'}</Text>
                                  
                                  <TouchableOpacity 
                                    style={styles.timeSelectButton}
                                    onPress={() => {
                                      const currentHour = parseInt(time?.split(':')[0] || '12');
                                      const newHour = currentHour === 1 ? 12 : currentHour - 1;
                                      const currentMinute = time?.split(':')[1]?.split(' ')[0] || '00';
                                      const period = time?.includes('PM') ? 'PM' : 'AM';
                                      const updatedTimeSlots = {...newMedication.timeSlots};
                                      updatedTimeSlots[day][index] = `${newHour.toString().padStart(2, '0')}:${currentMinute} ${period}`;
                                      setNewMedication({
                                        ...newMedication,
                                        timeSlots: updatedTimeSlots
                                      });
                                    }}
                                  >
                                    <Ionicons name="chevron-down" size={16} color="#6b7280" />
                                  </TouchableOpacity>
                                </View>
                                
                                <Text style={styles.timeSeparator}>:</Text>
                                
                                <View style={styles.minuteSelector}>
                                  <TouchableOpacity 
                                    style={styles.timeSelectButton}
                                    onPress={() => {
                                      const hour = time?.split(':')[0] || '12';
                                      const currentMinute = time?.split(':')[1]?.split(' ')[0] || '00';
                                      const period = time?.includes('PM') ? 'PM' : 'AM';
                                      
                                      // Get next minute in 15-minute increments
                                      let minuteIndex = minutes.indexOf(currentMinute);
                                      minuteIndex = (minuteIndex + 1) % minutes.length;
                                      const newMinute = minutes[minuteIndex];
                                      
                                      const updatedTimeSlots = {...newMedication.timeSlots};
                                      updatedTimeSlots[day][index] = `${hour}:${newMinute} ${period}`;
                                      setNewMedication({
                                        ...newMedication,
                                        timeSlots: updatedTimeSlots
                                      });
                                    }}
                                  >
                                    <Ionicons name="chevron-up" size={16} color="#6b7280" />
                                  </TouchableOpacity>
                                  
                                  <Text style={styles.timeText}>{time?.split(':')[1]?.split(' ')[0] || '00'}</Text>
                                  
                                  <TouchableOpacity 
                                    style={styles.timeSelectButton}
                                    onPress={() => {
                                      const hour = time?.split(':')[0] || '12';
                                      const currentMinute = time?.split(':')[1]?.split(' ')[0] || '00';
                                      const period = time?.includes('PM') ? 'PM' : 'AM';
                                      
                                      // Get previous minute in 15-minute increments
                                      let minuteIndex = minutes.indexOf(currentMinute);
                                      minuteIndex = (minuteIndex - 1 + minutes.length) % minutes.length;
                                      const newMinute = minutes[minuteIndex];
                                      
                                      const updatedTimeSlots = {...newMedication.timeSlots};
                                      updatedTimeSlots[day][index] = `${hour}:${newMinute} ${period}`;
                                      setNewMedication({
                                        ...newMedication,
                                        timeSlots: updatedTimeSlots
                                      });
                                    }}
                                  >
                                    <Ionicons name="chevron-down" size={16} color="#6b7280" />
                                  </TouchableOpacity>
                                </View>
                                
                                <TouchableOpacity 
                                  style={styles.periodSelector}
                                  onPress={() => {
                                    const hour = time?.split(':')[0] || '12';
                                    const currentPeriod = time?.includes('PM') ? 'PM' : 'AM';
                                    const newPeriod = currentPeriod === 'AM' ? 'PM' : 'AM';
                                    const updatedTimeSlots = {...newMedication.timeSlots};
                                    updatedTimeSlots[day][index] = `${hour}:00 ${newPeriod}`;
                                    setNewMedication({
                                      ...newMedication,
                                      timeSlots: updatedTimeSlots
                                    });
                                  }}
                                >
                                  <Text style={styles.periodText}>{time?.includes('PM') ? 'PM' : 'AM'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                            
                            {/* Remove time slot button */}
                            {newMedication.timeSlots[day].length > 1 && (
                              <TouchableOpacity 
                                style={styles.removeTimeButton}
                                onPress={() => {
                                  const updatedTimeSlots = {...newMedication.timeSlots};
                                  updatedTimeSlots[day].splice(index, 1);
                                  setNewMedication({
                                    ...newMedication,
                                    timeSlots: updatedTimeSlots
                                  });
                                }}
                              >
                                <Ionicons name="remove-circle" size={24} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        
                        {/* Add time slot button */}
                        <TouchableOpacity 
                          style={styles.addTimeButton}
                          onPress={() => {
                            const updatedTimeSlots = {...newMedication.timeSlots};
                            updatedTimeSlots[day].push('12:00 PM');
                            setNewMedication({
                              ...newMedication,
                              timeSlots: updatedTimeSlots
                            });
                          }}
                        >
                          <Ionicons name="add-circle" size={20} color="#0d9488" />
                          <Text style={styles.addTimeText}>Add Time</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    
                    
                    <TouchableOpacity 
                      style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                      onPress={handleSubmitMedication}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.submitButtonText}>Add Medication</Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                </Animated.View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  activeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  dayCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCircle: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  dayCircleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  selectedDayCircleText: {
    color: 'white',
  },
  dayTimeSlotContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  timeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hourSelector: {
    alignItems: 'center',
  },
  minuteSelector: {
    alignItems: 'center',
  },
  timeSelectButton: {
    padding: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginVertical: 2,
  },
  timeSeparator: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  periodSelector: {
    marginLeft: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  periodText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  timeInputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  removeTimeButton: {
    marginLeft: 8,
    padding: 4,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addTimeText: {
    marginLeft: 4,
    color: '#0d9488',
    fontSize: 14,
    fontWeight: '500',
  },
  
  /* Time Picker Styles */
  timeSelectModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    width: '100%',
    maxHeight: '80%',
  },
  timeSelectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timeSelectModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  timeSelectModalList: {
    maxHeight: 400,
  },
  timeGroupContainer: {
    marginBottom: 16,
  },
  timeGroupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  hourPeriodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSelectOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flex: 1,
    marginHorizontal: 2,
  },
  timeSelectOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    marginHorizontal: 4,
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
