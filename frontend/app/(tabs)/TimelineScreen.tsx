import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Modal,
  FlatList,
  StatusBar,
  ScrollView
} from 'react-native';
import useColorScheme from '../hooks/useColorScheme';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from './AppNavigator';

// Define types
type EntryType = 'milestone' | 'activity' | 'medication' | 'symptom';

interface TimelineEntry {
  id: string;
  date: Date;
  type: EntryType;
  content: string;
  reactions: number;
  comments: number;
  medications?: string[];
  severity?: 'mild' | 'moderate' | 'severe';
}

// Mock data for timeline entries
const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    date: new Date(2024, 3, 4),
    type: 'milestone' as EntryType,
    content: 'First day without chest pain',
    reactions: 5,
    comments: 2,
  },
  {
    id: '2',
    date: new Date(2024, 3, 3),
    type: 'activity' as EntryType,
    content: 'Walked for 10 minutes today after surgery',
    reactions: 12,
    comments: 3,
  },
  {
    id: '3',
    date: new Date(2024, 3, 3),
    type: 'medication' as EntryType,
    content: 'Took all prescribed medications on time',
    medications: ['Lisinopril', 'Aspirin'],
    reactions: 3,
    comments: 0,
  },
  {
    id: '4',
    date: new Date(2024, 3, 2),
    type: 'symptom' as EntryType,
    content: 'Experienced mild dizziness in the afternoon',
    severity: 'mild',
    reactions: 2,
    comments: 4,
  },
  {
    id: '5',
    date: new Date(2024, 3, 1),
    type: 'milestone' as EntryType,
    content: 'Asked my doctor questions I was afraid to ask before',
    reactions: 15,
    comments: 7,
  },
];

// Function to format dates
const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Entry type icons
const entryTypeIcons: Record<EntryType, string> = {
  milestone: '🏆',
  activity: '🚶',
  medication: '💊',
  symptom: '🩺',
};

// Entry card component
interface EntryCardProps {
  entry: TimelineEntry;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View className={`mb-4 rounded-xl p-4 shadow ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">{entryTypeIcons[entry.type]}</Text>
          <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
          </Text>
        </View>
        <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {formatDate(entry.date)}
        </Text>
      </View>
      
      <Text className={`text-base mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {entry.content}
      </Text>
      
      {entry.medications && (
        <View className="flex-row flex-wrap mb-3">
          {entry.medications.map((med, idx) => (
            <View key={idx} className="bg-teal-100 rounded-full px-3 py-1 mr-2 mb-1">
              <Text className="text-teal-800 text-sm">{med}</Text>
            </View>
          ))}
        </View>
      )}
      
      {entry.severity && (
        <View className={`rounded-full px-3 py-1 self-start mb-3 ${
          entry.severity === 'mild' ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          <Text className={entry.severity === 'mild' ? 'text-amber-800' : 'text-red-800'}>
            {entry.severity.charAt(0).toUpperCase() + entry.severity.slice(1)}
          </Text>
        </View>
      )}
      
      <View className="flex-row mt-2 pt-2 border-t border-gray-200">
        <TouchableOpacity className="flex-row items-center mr-6">
          <Text className="mr-1">👍</Text>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {entry.reactions}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center">
          <Text className="mr-1">💬</Text>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {entry.comments}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface NewEntryModalProps {
  visible: boolean;
  onClose: () => void;
}

// New entry modal component
const NewEntryModal: React.FC<NewEntryModalProps> = ({ visible, onClose }) => {
  const [entryType, setEntryType] = useState('milestone');
  const [content, setContent] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const entryTypes = [
    { id: 'milestone', name: 'Milestone', icon: '🏆' },
    { id: 'activity', name: 'Activity', icon: '🚶' },
    { id: 'medication', name: 'Medication', icon: '💊' },
    { id: 'symptom', name: 'Symptom', icon: '🩺' },
  ];
  
  const handleSubmit = () => {
    if (!content.trim()) {
      alert('Please enter some content for your entry');
      return;
    }
    
    console.log('New entry:', { type: entryType, content });
    setContent('');
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black bg-opacity-50">
        <View className={`rounded-t-xl p-5 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Add New Entry
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="mb-4"
          >
            {entryTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                className={`mr-3 p-3 rounded-lg flex-row items-center ${
                  entryType === type.id 
                    ? isDark ? 'bg-teal-700' : 'bg-teal-100' 
                    : isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}
                onPress={() => setEntryType(type.id)}
              >
                <Text className="text-xl mr-2">{type.icon}</Text>
                <Text className={`font-medium ${
                  entryType === type.id
                    ? isDark ? 'text-white' : 'text-teal-800'
                    : isDark ? 'text-gray-300' : 'text-gray-800'
                }`}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TextInput
            className={`border rounded-lg p-4 mb-4 h-32 ${
              isDark 
                ? 'border-gray-700 bg-gray-800 text-white' 
                : 'border-gray-300 bg-gray-50 text-gray-900'
            }`}
            placeholder={`Describe your ${entryType}...`}
            placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-gray-200'
              }`}
              onPress={onClose}
            >
              <Text className={isDark ? 'text-white' : 'text-gray-800'}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-teal-600 px-4 py-2 rounded-lg"
              onPress={handleSubmit}
            >
              <Text className="text-white font-medium">Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

type TimelineScreenProps = {
  navigation: BottomTabNavigationProp<RootTabParamList, 'Timeline'>;
};

const TimelineScreen: React.FC<TimelineScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Recovery Journey
        </Text>
        
        <View className="flex-row justify-between mt-2">
          <View className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-teal-50'} flex-1 mr-2 items-center`}>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-teal-700'}`}>12</Text>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-teal-600'}`}>Days</Text>
          </View>
          
          <View className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-blue-50'} flex-1 mx-1 items-center`}>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-blue-700'}`}>8</Text>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-blue-600'}`}>Milestones</Text>
          </View>
          
          <View className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-green-50'} flex-1 ml-2 items-center`}>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-green-700'}`}>95%</Text>
            <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-green-600'}`}>Med Adherence</Text>
          </View>
        </View>
      </View>
      
      <FlatList
        data={MOCK_ENTRIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryCard entry={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-teal-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>
      
      <NewEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default TimelineScreen;