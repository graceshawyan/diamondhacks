import React, { useState } from 'react';
import type {
  ViewProps,
  TextProps,
  TextInputProps,
  TouchableOpacityProps,
  KeyboardAvoidingViewProps,
  ScrollViewProps,
  StatusBarProps
} from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import useColorScheme from '@/hooks/useColorScheme';

// Simple dropdown component for pronoun selection
interface DropdownProps {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, selectedValue, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View className="mb-5 z-10">
      <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</Text>
      <TouchableOpacity 
        className={`border rounded-lg p-3 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text className={isDark ? 'text-white' : 'text-gray-900'}>
          {selectedValue || `Select ${label}`}
        </Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View className={`absolute top-20 left-0 right-0 border rounded-lg shadow-md z-20 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
        }`}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              className={`p-3 border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              onPress={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              <Text className={isDark ? 'text-white' : 'text-gray-900'}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Main: undefined;
};

type AboutMeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface AboutMeScreenProps {
  navigation: AboutMeScreenNavigationProp;
}

export default function AboutMeScreen({ navigation }: AboutMeScreenProps) {
  const [age, setAge] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [condition, setCondition] = useState('');
  const [bio, setBio] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const pronounOptions = ['He/Him', 'She/Her', 'They/Them', 'She/They', 'He/They', 'Other', 'Prefer not to say'];

  const handleContinue = () => {
    // Validate required fields
    if (!age || !pronouns || !condition) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields (Age, Pronouns, and Recovery Condition).",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Save user profile data
    const profileData = {
      age,
      pronouns,
      condition,
      bio,
    };
    
    console.log('Profile data:', profileData);
    
    // Navigate to the main app
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-6">
            <View className="mt-10 mb-8">
              <Text className={`text-3xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Tell Us About You
              </Text>
              <Text className={`text-base text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                This helps us personalize your recovery journey
              </Text>
            </View>

            <View className="w-full">
              <View className="mb-5">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Age</Text>
                <TextInput
                  className={`border rounded-lg p-3 text-base ${
                    isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                  }`}
                  placeholder="Enter your age"
                  placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <Dropdown
                label="Pronouns"
                options={pronounOptions}
                selectedValue={pronouns}
                onSelect={setPronouns}
              />

              <View className="mb-5">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Recovering from
                </Text>
                <TextInput
                  className={`border rounded-lg p-3 text-base ${
                    isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                  }`}
                  placeholder="E.g., Surgery, Cancer treatment, Injury..."
                  placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                  value={condition}
                  onChangeText={setCondition}
                />
              </View>

              <View className="mb-5">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Bio (Optional)
                </Text>
                <TextInput
                  className={`border rounded-lg p-3 text-base h-32 ${
                    isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                  }`}
                  placeholder="Share a bit about yourself and your recovery goals..."
                  placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                className="bg-teal-600 rounded-lg py-4 mt-6"
                onPress={handleContinue}
              >
                <Text className="text-white text-center text-lg font-bold">
                  Continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 items-center"
                onPress={() => navigation.navigate('Main')}
              >
                <Text className={`${isDark ? 'text-teal-400' : 'text-teal-600'} text-base underline`}>
                  Skip for now (You can complete this later)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}