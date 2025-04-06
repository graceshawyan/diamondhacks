import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Animated,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, type Message } from '../../components/ChatMessage';
import LettaAIService from '../../services/lettaservice';
import { Stack } from 'expo-router';

// Initial welcome message from the assistant
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hi! I\'m your Recovrly AI assistant. I can help you with your health journey, answer questions about your treatment, or provide emotional support. How can I assist you today?',
    isUser: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
];

// Component for suggested responses
type SuggestionChipsProps = {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
};

const SuggestionChips = ({ suggestions, onSelect }: SuggestionChipsProps) => {
  if (!suggestions || suggestions.length === 0) return null;
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.suggestionsContainer}
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.suggestionChip}
          onPress={() => onSelect(suggestion)}
        >
          <Text style={styles.suggestionText}>{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Component for action items
type ActionItemsProps = {
  items: string[];
  onComplete: (item: string) => void;
};

const ActionItems = ({ items, onComplete }: ActionItemsProps) => {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  
  if (!items || items.length === 0) return null;
  
  const toggleItem = (item: string) => {
    setCompletedItems(prevItems => {
      const newItems = prevItems.includes(item)
        ? prevItems.filter(i => i !== item)
        : [...prevItems, item];
      
      if (!prevItems.includes(item)) {
        onComplete(item);
      }
      
      return newItems;
    });
  };
  
  return (
    <View style={styles.actionItemsContainer}>
      <Text style={styles.actionItemsTitle}>Suggested Actions:</Text>
      {items.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.actionItem}
          onPress={() => toggleItem(item)}
        >
          <View style={styles.checkboxContainer}>
            {completedItems.includes(item) && (
              <Ionicons name="checkmark" size={16} color="#0d9488" />
            )}
          </View>
          <Text style={[
            styles.actionItemText, 
            completedItems.includes(item) && styles.completedActionItemText
          ]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Function to add a new message
  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  // Function to handle message sending
  const handleSend = async (text: string = inputText) => {
    if (text.trim() === '') return;
    
    // Add user message
    addMessage(text, true);
    setInputText('');
    setSuggestions([]);
    setActionItems([]);
    
    // Simulate AI thinking
    setIsTyping(true);
    
    try {
      // Get AI response using the Letta AI service
      const response = await LettaAIService.getResponse(text, {
        userId: 'user123',
        recoveryType: 'surgery', // This would come from user profile
        history: messages.map(m => ({ text: m.text, isUser: m.isUser }))
      });
      
      // Add AI response
      addMessage(response.message, false);
      
      // If there are suggestions, show them
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        
        // Animate the suggestions in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
      
      // If there are action items, show them
      if (response.actionItems && response.actionItems.length > 0) {
        setActionItems(response.actionItems);
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      // Handle error
      addMessage("I'm having trouble connecting right now. Please try again later.", false);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle action item completion
  const handleActionComplete = (item: string) => {
    console.log(`Action completed: ${item}`);
    // In a real app, you might want to send this to your backend
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);
  
  // Reset the fade animation when suggestions change
  useEffect(() => {
    fadeAnim.setValue(0);
    if (suggestions.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [suggestions]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'AI Assistant',
          headerStyle: { backgroundColor: '#ffffff' },
          headerShadowVisible: false,
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {actionItems.length > 0 && (
            <ActionItems items={actionItems} onComplete={handleActionComplete} />
          )}
          
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.typingAvatar}>
                <Ionicons name="medical-outline" size={20} color="#0d9488" />
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>
                  Typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        {suggestions.length > 0 && (
          <Animated.View style={[styles.suggestionsWrapper, { opacity: fadeAnim }]}>
            <SuggestionChips 
              suggestions={suggestions} 
              onSelect={(suggestion) => {
                handleSend(suggestion);
                setSuggestions([]);
              }}
            />
          </Animated.View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              inputText.trim() === '' && styles.sendButtonDisabled
            ]}
            onPress={() => handleSend()}
            disabled={inputText.trim() === ''}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  typingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6fffa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typingBubble: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    color: '#6b7280',
  },
  suggestionsWrapper: {
    marginBottom: 8,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionChip: {
    backgroundColor: '#e6fffa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0d9488',
  },
  suggestionText: {
    color: '#0d9488',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0d9488',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  actionItemsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0d9488',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionItemText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  completedActionItemText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
});