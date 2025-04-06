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
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  const [medications, setMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMedication, setNewMedication] = useState({
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
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation for the modal
  const slideAnim = useRef(new Animated.Value(0)).current;

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
          
          if (data.data && data.data.med_schedule && Object.keys(data.data.med_schedule).length > 0) {
            const formattedMeds = formatMedicationData(data.data.med_schedule);
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
      
      // Format medication data for API
      const medData = {
        name: newMedication.name,
        days: newMedication.selectedDays,
        times: {}
      };
      
      // Add times for each selected day
      newMedication.selectedDays.forEach(day => {
        // Format times to ensure they're in the correct format
        const formattedTimes = newMedication.timeSlots[day].map(time => {
          // Make sure time is properly formatted
          const [timePart, period] = time.split(' ');
          const [hours, minutes] = timePart.split(':');
          return `${hours}:${minutes} ${period}`;
        });
        
        medData.times[day] = formattedTimes;
      });
      
      console.log('Sending medication data:', JSON.stringify(medData, null, 2));
      
      // Send to API
      const response = await fetch(`${baseUrl}/medications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(medData)
      });
      
      if (response.ok) {
        // Refresh medications list
        await fetchMedications();
        
        // Close modal and reset form
        closeModal();
        
        // Show success message
        Alert.alert('Success', 'Medication added successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add medication');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'An error occurred while adding the medication');
    } finally {
      setIsSubmitting(false);
    }
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
      
      {/* Add Medication Modal */}
      {/* Time Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerHeader}>
                  <Text style={styles.timePickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timePickerContent}>
                  {/* Hours Picker */}
                  <View style={styles.pickerColumn}>
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.pickerScrollContent}
                    >
                      {Array.from({length: 12}, (_, i) => (i === 0 ? 12 : i)).map(hour => (
                        <TouchableOpacity 
                          key={`hour-${hour}`}
                          style={[styles.pickerItem, selectedHour === hour && styles.selectedPickerItem]}
                          onPress={() => setSelectedHour(hour)}
                        >
                          <Text style={[styles.pickerItemText, selectedHour === hour && styles.selectedPickerItemText]}>
                            {hour}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <Text style={styles.pickerSeparator}>:</Text>
                  
                  {/* Minutes Picker */}
                  <View style={styles.pickerColumn}>
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.pickerScrollContent}
                    >
                      {[0, 30].map(minute => (
                        <TouchableOpacity 
                          key={`minute-${minute}`}
                          style={[styles.pickerItem, selectedMinute === minute && styles.selectedPickerItem]}
                          onPress={() => setSelectedMinute(minute)}
                        >
                          <Text style={[styles.pickerItemText, selectedMinute === minute && styles.selectedPickerItemText]}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  {/* AM/PM Picker */}
                  <View style={styles.amPmContainer}>
                    <TouchableOpacity 
                      style={[styles.amPmButton, selectedAmPm === 'AM' && styles.selectedAmPm]}
                      onPress={() => setSelectedAmPm('AM')}
                    >
                      <Text style={[styles.amPmText, selectedAmPm === 'AM' && styles.selectedAmPmText]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.amPmButton, selectedAmPm === 'PM' && styles.selectedAmPm]}
                      onPress={() => setSelectedAmPm('PM')}
                    >
                      <Text style={[styles.amPmText, selectedAmPm === 'PM' && styles.selectedAmPmText]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.timePickerConfirmButton}
                  onPress={() => {
                    // Format the time string
                    const formattedHour = selectedHour; // No need to pad since we're using 12-hour format
                    const formattedMinute = selectedMinute.toString().padStart(2, '0');
                    const timeString = `${formattedHour}:${formattedMinute} ${selectedAmPm}`;
                    
                    // Update the time slot
                    const updatedTimeSlots = {...newMedication.timeSlots};
                    updatedTimeSlots[currentDay][currentTimeIndex] = timeString;
                    setNewMedication({
                      ...newMedication,
                      timeSlots: updatedTimeSlots
                    });
                    
                    // Close the time picker
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.timePickerConfirmText}>Confirm</Text>
                </TouchableOpacity>
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
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Select Days</Text>
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
                                  <TouchableOpacity 
                              style={styles.timeInput}
                              onPress={() => {
                                // Parse current time to set initial values for picker
                                const [timePart, period] = time.split(' ');
                                let [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));
                                
                                // Ensure hours is in 12-hour format for the picker
                                if (hours > 12) {
                                  hours = hours - 12;
                                } else if (hours === 0) {
                                  hours = 12;
                                }
                                
                                setSelectedHour(hours);
                                setSelectedMinute(minutes || 0);
                                setSelectedAmPm(period || 'AM');
                                setCurrentDay(day);
                                setCurrentTimeIndex(index);
                                setShowTimePicker(true);
                              }}
                            >
                              <Text style={styles.timeInputText}>{time}</Text>
                              <Ionicons name="time-outline" size={20} color="#6b7280" />
                            </TouchableOpacity>
                            
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
  inputGroup: {
    marginBottom: 16,
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
  timeInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  timePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  pickerColumn: {
    height: 200,
    width: 60,
    overflow: 'hidden',
  },
  pickerScrollContent: {
    paddingVertical: 80, // Add padding to center the selected item
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  selectedPickerItem: {
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 22,
    color: '#4b5563',
  },
  selectedPickerItemText: {
    color: '#0d9488',
    fontWeight: '600',
  },
  pickerSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 8,
  },
  amPmContainer: {
    marginLeft: 16,
    height: 100,
    justifyContent: 'center',
  },
  amPmButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  selectedAmPm: {
    backgroundColor: '#0d9488',
  },
  amPmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  selectedAmPmText: {
    color: 'white',
  },
  timePickerConfirmButton: {
    backgroundColor: '#0d9488',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  timePickerConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
