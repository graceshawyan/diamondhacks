import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock medication data
const mockMedications = [
  {
    id: '1',
    name: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'Every 6 hours as needed',
    time: '8:00 AM, 2:00 PM, 8:00 PM',
    active: true,
  },
  {
    id: '2',
    name: 'Methotrexate',
    dosage: '15mg',
    frequency: 'Once weekly',
    time: 'Monday 9:00 AM',
    active: true,
  },
  {
    id: '3',
    name: 'Vitamin D',
    dosage: '2000 IU',
    frequency: 'Daily',
    time: '8:00 AM',
    active: true,
  },
  {
    id: '4',
    name: 'Prednisone',
    dosage: '5mg',
    frequency: 'Daily',
    time: '8:00 AM',
    active: false,
  },
];

export default function MedicationsScreen() {
  const [medications, setMedications] = useState(mockMedications);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMedicationStatus = (id) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, active: !med.active } : med
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Medications</Text>
          <TouchableOpacity style={styles.addButton}>
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
            <Text style={styles.noMedsText}>No medications found</Text>
          ) : (
            filteredMedications.map(medication => (
              <View key={medication.id} style={[styles.medicationCard, !medication.active && styles.inactiveMedication]}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationTitleContainer}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
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
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="create-outline" size={18} color="#0d9488" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="notifications-outline" size={18} color="#0d9488" />
                    <Text style={styles.actionText}>Reminders</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="calendar-outline" size={18} color="#0d9488" />
                    <Text style={styles.actionText}>History</Text>
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
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#0d9488',
    marginLeft: 4,
  },
  noMedsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 20,
  },
});
