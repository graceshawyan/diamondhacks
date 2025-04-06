import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type ConditionOption = {
  id: string;
  name: string;
};

const conditions: ConditionOption[] = [
  { id: 'ra', name: 'Rheumatoid Arthritis' },
  { id: 'fibro', name: 'Fibromyalgia' },
  { id: 'lupus', name: 'Lupus' },
  { id: 'ms', name: 'Multiple Sclerosis' },
  { id: 'crohns', name: 'Crohn\'s Disease' },
  { id: 'uc', name: 'Ulcerative Colitis' },
  { id: 'psoriasis', name: 'Psoriasis' },
  { id: 'other', name: 'Other' },
];

const pronounOptions = [
  'He/Him',
  'She/Her',
  'They/Them',
  'She/They',
  'He/They',
  'Other',
  'Prefer not to say'
];

type DropdownProps = {
  options: string[] | ConditionOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label: string;
  placeholder?: string;
};

const Dropdown = ({ options, selectedValue, onSelect, label, placeholder }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getDisplayValue = () => {
    if (!selectedValue) return placeholder || `Select ${label}`;
    
    if (typeof options[0] === 'string') {
      return selectedValue;
    } else {
      const option = (options as ConditionOption[]).find(opt => opt.id === selectedValue);
      return option ? option.name : placeholder || `Select ${label}`;
    }
  };
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownText}>
          {getDisplayValue()}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6b7280" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option, index) => {
            const value = typeof option === 'string' ? option : option.id;
            const label = typeof option === 'string' ? option : option.name;
            
            return (
              <TouchableOpacity 
                key={index}
                style={styles.dropdownOption}
                onPress={() => {
                  onSelect(value);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  selectedValue === value && styles.dropdownOptionTextSelected
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default function AboutMeScreen() {
  const [pronouns, setPronouns] = useState('');
  const [condition, setCondition] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!condition) {
      alert('Please select your condition');
      return;
    }

    setIsLoading(true);
    
    // This would be replaced with actual API call to update profile
    setTimeout(() => {
      router.replace('/(tabs)/home');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This information helps us personalize your experience and connect you with the right community
          </Text>
        </View>
        
        <View style={styles.form}>
          <Dropdown
            label="Pronouns"
            options={pronounOptions}
            selectedValue={pronouns}
            onSelect={setPronouns}
            placeholder="Select your pronouns (optional)"
          />
          
          <Dropdown
            label="Condition"
            options={conditions}
            selectedValue={condition}
            onSelect={setCondition}
            placeholder="Select your condition"
          />
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Share a little about your journey (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
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
              <Text style={styles.continueButtonText}>Continue to App</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
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
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
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
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    maxHeight: 200,
    overflow: 'scroll',
    zIndex: 10,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownOptionTextSelected: {
    color: '#0d9488',
    fontWeight: '500',
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
    minHeight: 120,
  },
  privacyNote: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 20,
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
